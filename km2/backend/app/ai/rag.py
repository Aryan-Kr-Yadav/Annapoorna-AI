"""
Retrieval-Augmented Generation over `knowledge_documents` /
`knowledge_chunks` using PostgreSQL + pgvector.

Pipeline: question -> embed -> nearest-neighbour search over chunk
embeddings -> return chunks + their document's source metadata, so the
assistant can cite real, stored sources and never invent a URL.

NOTE: Groq API embeddings endpoint support — `groq_client.create_embedding` is written
against an OpenAI-compatible schema. If Groq doesn't
support embeddings when you build this, swap in any embedding model
(e.g. a small open-source sentence-transformer run locally, or another
provider) inside that one function; nothing else here needs to change.
"""
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.ai.groq_client import create_embedding
from app.models.knowledge import KnowledgeChunk, KnowledgeDocument


async def retrieve_relevant_chunks(db: Session, query: str, top_k: int = 4) -> list[dict]:
    try:
        has_chunks = db.query(KnowledgeChunk.id).first() is not None
        if not has_chunks:
            return []
    except Exception:
        return []

    embedding = await create_embedding(query)
    if embedding is None:
        return []

    try:
        rows = (
            db.execute(
                select(KnowledgeChunk, KnowledgeDocument)
                .join(KnowledgeDocument, KnowledgeChunk.document_id == KnowledgeDocument.id)
                .order_by(KnowledgeChunk.embedding.cosine_distance(embedding))
                .limit(top_k)
            )
            .all()
        )
    except Exception:
        # pgvector extension not installed / no embeddings indexed yet.
        return []

    return [
        {
            "content": chunk.content,
            "source_title": doc.title,
            "source_url": doc.source_url,
            "category": doc.category,
        }
        for chunk, doc in rows
    ]


async def embed_and_store_document(db: Session, document: KnowledgeDocument, chunks: list[str]) -> None:
    """Splits pre-chunked text, embeds each chunk, and stores it. Call this from an ingestion script."""
    for i, chunk_text in enumerate(chunks):
        embedding = await create_embedding(chunk_text)
        db.add(
            KnowledgeChunk(document_id=document.id, chunk_index=i, content=chunk_text, embedding=embedding)
        )
    db.commit()
