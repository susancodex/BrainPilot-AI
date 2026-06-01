from django.http import StreamingHttpResponse
from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .serializers import (
    ConversationSerializer, ConversationDetailSerializer,
    MessageSerializer, SendMessageSerializer,
)
from .services import ChatService
from common.responses import success_response, created_response


class ConversationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        conversations = ChatService.get_user_conversations(request.user)
        return success_response(data=ConversationSerializer(conversations, many=True).data)

    def post(self, request):
        title = request.data.get("title", "")
        subject_context = request.data.get("subject_context", "")
        conversation = ChatService.get_or_create_conversation(
            request.user,
            subject_context=subject_context,
        )
        if title:
            conversation.title = title
            conversation.save(update_fields=["title"])
        return created_response(data=ConversationSerializer(conversation).data)


class ConversationDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        conversation = ChatService.get_conversation(request.user, pk)
        return success_response(data=ConversationDetailSerializer(conversation).data)

    def delete(self, request, pk):
        conversation = ChatService.get_conversation(request.user, pk)
        conversation.is_active = False
        conversation.save(update_fields=["is_active"])
        return success_response(message="Conversation archived.")


class SendMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        result = ChatService.send_message(
            request.user,
            content=serializer.validated_data["content"],
            conversation_id=serializer.validated_data.get("conversation_id"),
        )
        return success_response(data={
            "conversation_id": result["conversation_id"],
            "message": MessageSerializer(result["message"]).data,
        })


class StreamMessageView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = SendMessageSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        stream = ChatService.stream_message(
            request.user,
            content=serializer.validated_data["content"],
            conversation_id=serializer.validated_data.get("conversation_id"),
        )

        response = StreamingHttpResponse(stream, content_type="text/event-stream")
        response["Cache-Control"] = "no-cache"
        response["X-Accel-Buffering"] = "no"
        return response
