"""
Unit and integration tests for AI Model Routing (GPT-OSS 120B & Qwen Vision).
Covers TESTS A through I from the task specification:
- Test A: General chat routing (GPT-OSS 120B without dumping farm context)
- Test B: Farm chat context & tools
- Test C: Language detection & directives (English, Hindi, Hinglish)
- Test D: Image routing (Qwen Vision used, no images to GPT-OSS 120B)
- Test E: Crop context + Vision
- Test F: Crop Doctor structured schemas
- Test G: Live weather & advisory tools
- Test H: Expense, Harvest, and Sale tools
- Test I: Error & rate-limit classification
- Test J: Health endpoint model identification
"""
import pytest
from unittest.mock import AsyncMock, MagicMock, patch
from uuid import uuid4

from fastapi.testclient import TestClient

from app.ai.service import (
    ai_service,
    classify_ai_error,
    message_has_image,
    AIConfigError,
    AIResponseError,
)
from app.ai.context_builder import is_general_knowledge_query, build_farm_crop_context
from app.ai.prompts import (
    detect_message_style,
    get_language_directive,
    get_style_directive,
    build_context_block,
    SYSTEM_PROMPT,
)
from app.ai import tools as ai_tools
from app.routers.health import (
    VisualObservationsOutput,
    CropDoctorAnalysisOutput,
    DiagnosisSummaryOutput,
)
from app.main import app
from app.models.user import User


# =====================================================================
# TEST A: GENERAL CHAT (GPT-OSS 120B without dumping farm DB)
# =====================================================================
def test_a_general_chat_routing_and_context_filtering():
    # Model router selects GPT-OSS 120B for text
    model = ai_service.select_model(has_image=False)
    assert model == "openai/gpt-oss-120b"

    # General knowledge queries identified correctly
    assert is_general_knowledge_query("What is photosynthesis?") is True
    assert is_general_knowledge_query("Explain NPK ratio in fertilizer") is True
    assert is_general_knowledge_query("What is crop rotation?") is True
    assert is_general_knowledge_query("Hello there") is True

    # General query does NOT dump farm data into context
    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.preferred_language = "en"
    context = build_farm_crop_context(
        mock_db, mock_user, uuid4(), uuid4(), query_text="What is photosynthesis?"
    )
    assert context == {}  # Empty context -> general mode


# =====================================================================
# TEST B: FARM CHAT (GPT-OSS 120B + Context/Tools)
# =====================================================================
def test_b_farm_chat_requires_context():
    # Farm operational questions are NOT classified as general knowledge
    assert is_general_knowledge_query("Should I irrigate tomorrow?") is False
    assert is_general_knowledge_query("Kal wheat ko paani dena chahiye?") is False
    assert is_general_knowledge_query("How much did I spend on fertilizer?") is False
    assert is_general_knowledge_query("Meri fasal me keeda lag gaya hai") is False

    # Model router still selects GPT-OSS 120B for reasoning
    assert ai_service.select_model(has_image=False) == "openai/gpt-oss-120b"


# =====================================================================
# TEST C: LANGUAGE BEHAVIOR (Auto, English, Hindi, Hinglish)
# =====================================================================
def test_c_multilingual_detection_and_directives():
    # English
    en_style = detect_message_style("What should I do today?")
    assert en_style == "English"
    en_dir = get_language_directive("auto", "What should I do today?")
    assert "English" in en_dir

    # Hindi (Devanagari)
    hi_style = detect_message_style("आज मुझे क्या करना चाहिए?")
    assert hi_style == "Hindi (Devanagari script)"
    hi_dir = get_language_directive("auto", "आज मुझे क्या करना चाहिए?")
    assert "Devanagari" in hi_dir or "Hindi" in hi_dir

    # Hinglish (Latin script)
    hinglish_style = detect_message_style("Aaj mujhe kya karna chahiye?")
    assert hinglish_style == "Hinglish (Latin script)"
    hinglish_dir = get_language_directive("auto", "Aaj mujhe kya karna chahiye?")
    assert "Hinglish" in hinglish_dir

    # Explicit preferences override auto
    assert "English" in get_language_directive("en", "आज मुझे क्या करना चाहिए?")
    assert "Hindi" in get_language_directive("hi", "What should I do today?")
    assert "Hinglish" in get_language_directive("hinglish", "What should I do today?")


# =====================================================================
# TEST D & E: IMAGE ROUTING (Qwen Vision, never send raw images to GPT-OSS 120B)
# =====================================================================
def test_d_and_e_vision_routing():
    # Text-only message
    text_msgs = [{"role": "user", "content": "Hello"}]
    assert message_has_image(text_msgs) is False
    assert ai_service.select_model(has_image=False) == "openai/gpt-oss-120b"

    # Multimodal message
    img_msgs = [
        {
            "role": "user",
            "content": [
                {"type": "text", "text": "Why is this leaf yellow?"},
                {"type": "image_url", "image_url": {"url": "data:image/jpeg;base64,abc"}},
            ],
        }
    ]
    assert message_has_image(img_msgs) is True
    # Multimodal routes strictly to Qwen Vision
    assert ai_service.select_model(has_image=True) == "qwen/qwen3.8-27b"

    # Fallback model routing
    assert ai_service.select_model(has_image=False, is_fallback=True) == "openai/gpt-oss-20b"


# =====================================================================
# TEST F: CROP DOCTOR STRUCTURED OUTPUT SCHEMAS
# =====================================================================
def test_f_crop_doctor_structured_schemas():
    # Stage 1 Schema validation
    vis = VisualObservationsOutput(
        visual_symptoms=["Yellowing chlorosis on lower leaves", "Brown necrotic margins"],
        affected_parts=["leaves"],
        apparent_severity="medium",
        visual_hypothesis="Nitrogen deficiency or leaf blight",
        uncertainty_notes="Slight blur on leaf apex",
    )
    assert len(vis.visual_symptoms) == 2
    assert vis.apparent_severity == "medium"

    # Stage 2 Schema validation
    doc = CropDoctorAnalysisOutput(
        summary=DiagnosisSummaryOutput(
            possible_condition="Early Leaf Blight",
            severity="medium",
            confidence_percentage=None,  # Never invent confidence
        ),
        observations=["Brown concentric lesions on older leaves"],
        possible_causes=["Alternaria fungal pathogen", "Warm humid weather"],
        immediate_actions=["Remove and destroy heavily infected lower foliage"],
        treatment_options=["Apply copper-based or mancozeb protective fungicide class as per label"],
        prevention=["Avoid overhead irrigation", "Ensure proper crop spacing"],
        monitoring="Re-inspect leaf progress in 3 days",
        when_to_seek_expert_help="Contact local KVK if lesions spread to upper third of canopy",
        disclaimer="Automated analysis for decision support only.",
    )
    assert doc.summary.possible_condition == "Early Leaf Blight"
    assert doc.summary.confidence_percentage is None
    assert doc.summary.severity == "medium"
    assert len(doc.immediate_actions) == 1
    assert "copper-based" in doc.treatment_options[0]


# =====================================================================
# TEST G & H: TOOLS (Weather, Expenses, Harvest, Sales)
# =====================================================================
def test_g_and_h_tool_definitions_and_execution():
    tool_names = [t["function"]["name"] for t in ai_tools.TOOL_DEFINITIONS]

    # Verify weather advisory tool exists
    assert "get_weather_advisory" in tool_names

    # Verify expense tool exists
    assert "get_expense_summary" in tool_names
    assert "get_profit_summary" in tool_names

    # Verify newly added harvest & sale tools exist
    assert "get_harvest_summary" in tool_names
    assert "get_sale_summary" in tool_names

    # Verify execution handles invalid IDs safely
    mock_db = MagicMock()
    mock_user = MagicMock()
    mock_user.id = uuid4()

    import asyncio
    res_harvest = asyncio.run(ai_tools.execute_tool(mock_db, mock_user, "get_harvest_summary", {}))
    assert "error" in res_harvest

    res_sale = asyncio.run(ai_tools.execute_tool(mock_db, mock_user, "get_sale_summary", {}))
    assert "error" in res_sale


# =====================================================================
# TEST I: MODEL FAILURE & RATE LIMIT CLASSIFICATION
# =====================================================================
def test_i_error_classification():
    # 429 Rate Limit
    msg_429, cat_429 = classify_ai_error(429, "Rate limit reached: 30000 TPM")
    assert cat_429 == "rate_limit"
    assert "temporarily" in msg_429

    # 401 Auth Error
    msg_401, cat_401 = classify_ai_error(401, "Invalid API key")
    assert cat_401 == "auth_error"
    assert "authentication" in msg_401

    # 403 Permission Error
    msg_403, cat_403 = classify_ai_error(403, "Model access not permitted")
    assert cat_403 == "permission_error"

    # 400 Multimodal rejection on text model
    msg_400, cat_400 = classify_ai_error(400, "messages[0].content must be a string")
    assert cat_400 == "invalid_multimodal_request"

    # 500 Provider Server Error
    msg_500, cat_500 = classify_ai_error(503, "Service Unavailable")
    assert cat_500 == "provider_server_error"


# =====================================================================
# TEST J: HEALTH ENDPOINT MODEL IDENTIFICATION
# =====================================================================
def test_j_health_endpoint():
    client = TestClient(app)
    resp = client.get("/api/v1/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert data["ai_provider"] == "groq"
    assert data["primary_text_model"] == "openai/gpt-oss-120b"
    assert data["vision_model"] == "qwen/qwen3.8-27b"
    assert data["fallback_text_model"] == "openai/gpt-oss-20b"
