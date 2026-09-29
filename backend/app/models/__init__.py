# Import every model here so Alembic's autogenerate and Base.metadata
# see the complete schema from a single import of app.models.
from app.models.user import User
from app.models.farm import Farm
from app.models.crop import CropCycle
from app.models.task import CropTask
from app.models.soil import SoilTest
from app.models.irrigation import IrrigationLog
from app.models.diagnosis import Diagnosis
from app.models.expense import Expense
from app.models.harvest import Harvest
from app.models.sale import CropSale
from app.models.crop_plan import CropPlan
from app.models.notification import Notification
from app.models.chat import ChatSession, ChatMessage
from app.models.knowledge import KnowledgeDocument, KnowledgeChunk
from app.models.scheme import Scheme
from app.models.market import CachedMarketPrice

__all__ = [
    "User",
    "Farm",
    "CropCycle",
    "CropTask",
    "SoilTest",
    "IrrigationLog",
    "Diagnosis",
    "Expense",
    "Harvest",
    "CropSale",
    "CropPlan",
    "Notification",
    "ChatSession",
    "ChatMessage",
    "KnowledgeDocument",
    "KnowledgeChunk",
    "Scheme",
    "CachedMarketPrice",
]
