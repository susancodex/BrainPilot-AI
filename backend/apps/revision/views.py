from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView

from .serializers import RevisionTopicSerializer, RevisionSessionSerializer, RecordRevisionSerializer
from .services import RevisionService
from common.responses import success_response, created_response


class RevisionTopicListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        topics = RevisionService.get_user_topics(
            request.user,
            subject=request.query_params.get("subject"),
            weak_only=request.query_params.get("weak_only") == "true",
        )
        return success_response(data=RevisionTopicSerializer(topics, many=True).data)

    def post(self, request):
        serializer = RevisionTopicSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        topic = RevisionService.create_topic(request.user, **serializer.validated_data)
        return created_response(data=RevisionTopicSerializer(topic).data)


class RevisionTopicDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        topic = RevisionService.get_topic(request.user, pk)
        return success_response(data=RevisionTopicSerializer(topic).data)

    def patch(self, request, pk):
        topic = RevisionService.get_topic(request.user, pk)
        serializer = RevisionTopicSerializer(topic, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data)

    def delete(self, request, pk):
        RevisionService.get_topic(request.user, pk).delete()
        return success_response(message="Revision topic deleted.")


class DueRevisionTopicsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        topics = RevisionService.get_due_topics(request.user)
        return success_response(data=RevisionTopicSerializer(topics, many=True).data)


class RecordRevisionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = RecordRevisionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        session = RevisionService.record_revision(request.user, **serializer.validated_data)
        return created_response(data=RevisionSessionSerializer(session).data, message="Revision recorded.")


class WeakTopicsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        topics = RevisionService.detect_weak_topics(request.user)
        return success_response(data=RevisionTopicSerializer(topics, many=True).data)
