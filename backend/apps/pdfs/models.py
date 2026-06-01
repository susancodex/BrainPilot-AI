import uuid
from django.db import models
from django.conf import settings
from common.base_models import BaseModel


class PDFDocument(BaseModel):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pdf_documents",
    )
    title = models.CharField(max_length=500)
    file = models.FileField(upload_to="pdfs/%Y/%m/")
    file_size = models.PositiveIntegerField(default=0)
    page_count = models.PositiveSmallIntegerField(default=0)
    is_processed = models.BooleanField(default=False)
    extracted_text = models.TextField(blank=True)
    subject = models.CharField(max_length=255, blank=True)
    tags = models.JSONField(default=list)

    class Meta:
        db_table = "pdfs_documents"
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["user", "subject"]),
            models.Index(fields=["user", "is_processed"]),
        ]

    def __str__(self):
        return self.title


class PDFHighlight(BaseModel):
    document = models.ForeignKey(
        PDFDocument,
        on_delete=models.CASCADE,
        related_name="highlights",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pdf_highlights",
    )
    text = models.TextField()
    page_number = models.PositiveSmallIntegerField(default=1)
    color = models.CharField(max_length=20, default="yellow")
    note = models.TextField(blank=True)

    class Meta:
        db_table = "pdfs_highlights"
        ordering = ["page_number", "created_at"]


class PDFChatMessage(BaseModel):
    document = models.ForeignKey(
        PDFDocument,
        on_delete=models.CASCADE,
        related_name="chat_messages",
    )
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="pdf_chat_messages",
    )
    role = models.CharField(
        max_length=20,
        choices=[("user", "User"), ("assistant", "Assistant")],
    )
    content = models.TextField()

    class Meta:
        db_table = "pdfs_chat_messages"
        ordering = ["created_at"]
