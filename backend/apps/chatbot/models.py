from django.db import models
from django.conf import settings
from common.base_models import BaseModel


class Conversation(BaseModel):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="conversations")
    title = models.CharField(max_length=500, blank=True)
    subject_context = models.CharField(max_length=255, blank=True)
    is_active = models.BooleanField(default=True)
    message_count = models.PositiveIntegerField(default=0)
    last_message_at = models.DateTimeField(blank=True, null=True)

    class Meta:
        db_table = "chatbot_conversations"
        ordering = ["-last_message_at", "-created_at"]
        indexes = [models.Index(fields=["user", "is_active"])]

    def __str__(self):
        return f"{self.user.email} - {self.title or self.id}"


class Message(BaseModel):
    class Role(models.TextChoices):
        USER = "user", "User"
        ASSISTANT = "assistant", "Assistant"
        SYSTEM = "system", "System"

    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20, choices=Role.choices)
    content = models.TextField()
    token_count = models.PositiveIntegerField(default=0)
    metadata = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "chatbot_messages"
        ordering = ["created_at"]
        indexes = [models.Index(fields=["conversation", "role"])]

    def __str__(self):
        return f"{self.role}: {self.content[:50]}"
