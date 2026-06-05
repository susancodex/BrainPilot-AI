import pytest
from unittest.mock import MagicMock, patch

from apps.chatbot.services import ChatService
from apps.chatbot.models import Conversation

pytestmark = pytest.mark.django_db


class TestChatService:
    @patch("services.ai_engine.adapters.gemini_adapter.GeminiAdapter")
    def test_send_message_creates_assistant_reply(self, mock_adapter_cls, user):
        mock_adapter = MagicMock()
        mock_adapter.chat.return_value = "Here is your explanation."
        mock_adapter_cls.return_value = mock_adapter

        result = ChatService.send_message(user, "Explain Newton's first law")

        assert result["conversation_id"]
        conv = Conversation.objects.get(id=result["conversation_id"])
        assert conv.messages.filter(role="assistant").count() == 1
        mock_adapter_cls.assert_called_once_with(user=user)
        mock_adapter.chat.assert_called_once()
