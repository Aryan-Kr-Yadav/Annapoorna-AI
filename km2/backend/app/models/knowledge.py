from datetime import date
from typing import List, Optional
from uuid import UUID

from sqlalchemy import Date, ForeignKey, Integer, String, Text
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base
from app.models.mixins import TimestampMixin, UUIDPKMixin

try:
    from pgvector.sqlalchemy import Vector

    EMBEDDING_TYPE = Vector(1536)
except ImportError:  # pgvector not installed yet in dev — degrade gracefully
    from sqlalchemy import ARRAY, Float

    EMBEDDING_TYPE = ARRAY(Float)


class KnowledgeDocument(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "knowledge_documents"

    title: Mapped[str] = mapped_column(String(500), nullable=False)
    category: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    # crop_guide | disease_info | soil_guidance | advisory | scheme_info
    source: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    published_date: Mapped[Optional[date]] = mapped_column(Date, nullable=True)
    last_verified: Mapped[Optional[date]] = mapped_column(Date, nullable=True)

    chunks: Mapped[List["KnowledgeChunk"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class KnowledgeChunk(Base, UUIDPKMixin, TimestampMixin):
    __tablename__ = "knowledge_chunks"

    document_id: Mapped[UUID] = mapped_column(
        PG_UUID(as_uuid=True), ForeignKey("knowledge_documents.id", ondelete="CASCADE"), index=True
    )
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding = mapped_column(EMBEDDING_TYPE, nullable=True)

    document: Mapped["KnowledgeDocument"] = relationship(back_populates="chunks")
