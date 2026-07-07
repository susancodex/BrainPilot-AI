import json
import logging
import hashlib
from django.utils import timezone
from django.db import transaction
from django.core.cache import cache

from .models import Conversation, Message
from common.exceptions import NotFoundError

logger = logging.getLogger(__name__)

MAX_CONTEXT_MESSAGES = 20
CACHE_TIMEOUT = 24 * 60 * 60  # 24 hours in seconds


class ChatService:
    @staticmethod
    def _get_cache_key(prompt: str, user_id: str) -> str:
        """Generate a cache key for AI responses based on prompt and user."""
        prompt_hash = hashlib.sha256(prompt.encode()).hexdigest()[:16]
        return f"ai_response:{user_id}:{prompt_hash}"
    
    @staticmethod
    def get_or_create_conversation(user, conversation_id=None, subject_context="") -> Conversation:
        if conversation_id:
            try:
                return Conversation.objects.get(id=conversation_id, user=user)
            except Conversation.DoesNotExist:
                raise NotFoundError("Conversation not found.")
        return Conversation.objects.create(user=user, subject_context=subject_context)

    @staticmethod
    def get_user_conversations(user):
        from django.db.models import Prefetch
        return (
            Conversation.objects.filter(user=user, is_active=True)
            .prefetch_related(
                Prefetch(
                    "messages",
                    queryset=Message.objects.filter(role="assistant").order_by("-created_at"),
                    to_attr="_last_assistant_msgs",
                )
            )
            .order_by("-last_message_at")
        )

    @staticmethod
    def get_conversation(user, conversation_id) -> Conversation:
        try:
            return Conversation.objects.prefetch_related("messages").get(id=conversation_id, user=user)
        except Conversation.DoesNotExist:
            raise NotFoundError("Conversation not found.")

    @staticmethod
    def get_context_messages(conversation: Conversation) -> list[dict]:
        messages = conversation.messages.order_by("-created_at")[:MAX_CONTEXT_MESSAGES]
        return [{"role": m.role, "content": m.content} for m in reversed(list(messages))]

    @staticmethod
    def stream_message(user, content: str, conversation_id=None):
        """
        Saves the user message, then yields SSE-formatted chunks from Gemini.
        Saves the complete assistant message to DB after streaming finishes.
        Yields strings ready to write directly to an SSE response.
        """
        conversation = ChatService.get_or_create_conversation(user, conversation_id)

        Message.objects.create(conversation=conversation, role="user", content=content)

        context = ChatService.get_context_messages(conversation)

        # Check cache for AI response
        cache_key = ChatService._get_cache_key(content, str(user.id))
        cached_response = cache.get(cache_key)
        
        if cached_response:
            logger.info("AI response retrieved from cache for streaming (user %s)", user.id)
            # Stream cached response character by character for consistent UX
            for char in cached_response:
                yield f"data: {json.dumps({'type': 'chunk', 'content': char, 'conversation_id': str(conversation.id)})}\n\n"
            
            assistant_message = Message.objects.create(
                conversation=conversation,
                role="assistant",
                content=cached_response,
                token_count=len(cached_response.split()),
            )
            conversation.message_count += 2
            conversation.last_message_at = timezone.now()
            if not conversation.title and content:
                conversation.title = content[:100]
            conversation.save(update_fields=["message_count", "last_message_at", "title"])
            
            from .serializers import MessageSerializer
            yield f"data: {json.dumps({'type': 'done', 'conversation_id': str(conversation.id), 'message': MessageSerializer(assistant_message).data})}\n\n"
            return

        from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
        from services.ai_engine.memory.conversation_memory import ConversationMemory

        adapter = GeminiAdapter(user=user)
        memory = ConversationMemory()
        system_prompt = memory.build_system_prompt(user)

        full_response = []
        try:
            for text_chunk in adapter.stream_chat(system_prompt=system_prompt, messages=context):
                full_response.append(text_chunk)
                yield f"data: {json.dumps({'type': 'chunk', 'content': text_chunk, 'conversation_id': str(conversation.id)})}\n\n"
        except Exception as exc:
            logger.error("Streaming chat failed: %s", exc)
            yield f"data: {json.dumps({'type': 'error', 'message': 'AI service error, please try again.'})}\n\n"
            return

        ai_response = "".join(full_response)
        
        # Cache the response for 24 hours
        cache.set(cache_key, ai_response, CACHE_TIMEOUT)
        logger.info("AI response cached for streaming (user %s)", user.id)
        
        assistant_message = Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=ai_response,
            token_count=len(ai_response.split()),
        )
        conversation.message_count += 2
        conversation.last_message_at = timezone.now()
        if not conversation.title and content:
            conversation.title = content[:100]
        conversation.save(update_fields=["message_count", "last_message_at", "title"])
        adapter.record_stream_usage()

        from .serializers import MessageSerializer
        yield f"data: {json.dumps({'type': 'done', 'conversation_id': str(conversation.id), 'message': MessageSerializer(assistant_message).data})}\n\n"

    @staticmethod
    @transaction.atomic
    def send_message(user, content: str, conversation_id=None) -> dict:
        conversation = ChatService.get_or_create_conversation(user, conversation_id)

        user_message = Message.objects.create(
            conversation=conversation,
            role="user",
            content=content,
        )

        context = ChatService.get_context_messages(conversation)

        # Check cache for AI response
        cache_key = ChatService._get_cache_key(content, str(user.id))
        cached_response = cache.get(cache_key)
        
        if cached_response:
            logger.info("AI response retrieved from cache for user %s", user.id)
            ai_response = cached_response
        else:
            from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
            from services.ai_engine.memory.conversation_memory import ConversationMemory

            adapter = GeminiAdapter(user=user)
            memory = ConversationMemory()
            system_prompt = memory.build_system_prompt(user)
            ai_response = adapter.chat(system_prompt=system_prompt, messages=context)
            
            # Cache the response for 24 hours
            cache.set(cache_key, ai_response, CACHE_TIMEOUT)
            logger.info("AI response cached for user %s", user.id)

        assistant_message = Message.objects.create(
            conversation=conversation,
            role="assistant",
            content=ai_response,
            token_count=len(ai_response.split()),
        )

        conversation.message_count += 2
        conversation.last_message_at = timezone.now()
        if not conversation.title and len(content) > 0:
            conversation.title = content[:100]
        conversation.save(update_fields=["message_count", "last_message_at", "title"])

        return {
            "conversation_id": str(conversation.id),
            "message": assistant_message,
        }
