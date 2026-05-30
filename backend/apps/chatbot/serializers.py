from rest_framework import serializers
from .models import Conversation, Message


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "role", "content", "token_count", "metadata", "created_at"]
        read_only_fields = ["id", "token_count", "created_at"]


class ConversationSerializer(serializers.ModelSerializer):
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Conversation
        fields = ["id", "title", "subject_context", "is_active", "message_count", "last_message_at", "last_message", "created_at"]
        read_only_fields = ["id", "message_count", "last_message_at", "created_at"]

    def get_last_message(self, obj):
        msg = obj.messages.filter(role="assistant").last()
        return msg.content[:200] if msg else None


class ConversationDetailSerializer(ConversationSerializer):
    messages = MessageSerializer(many=True, read_only=True)

    class Meta(ConversationSerializer.Meta):
        fields = ConversationSerializer.Meta.fields + ["messages"]


class SendMessageSerializer(serializers.Serializer):
    content = serializers.CharField(max_length=4000)
    conversation_id = serializers.UUIDField(required=False, allow_null=True)
