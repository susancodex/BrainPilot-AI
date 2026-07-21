from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser

from .serializers import (
    PDFDocumentSerializer,
    PDFUploadSerializer,
    PDFHighlightSerializer,
    PDFChatMessageSerializer,
    PDFChatInputSerializer,
)
from .services import PDFService
from common.responses import success_response, created_response


class PDFListView(APIView):
    permission_classes = [IsAuthenticated]
    throttle_scope = "file_upload"
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get(self, request):
        docs = PDFService.get_user_pdfs(
            request.user,
            subject=request.query_params.get("subject"),
        )
        return success_response(
            data=PDFDocumentSerializer(docs, many=True, context={"request": request}).data
        )

    def post(self, request):
        import logging
        logger = logging.getLogger(__name__)
        logger.info(f"PDF Upload: request.data keys = {list(request.data.keys())}")
        logger.info(f"PDF Upload: request.FILES keys = {list(request.FILES.keys())}")
        logger.info(f"PDF Upload: request.user = {request.user.email if request.user else 'None'}")
        serializer = PDFUploadSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        logger.info(f"PDF Upload: validated data keys = {list(d.keys())}")
        doc = PDFService.upload_pdf(
            user=request.user,
            file=d["file"],
            title=d.get("title"),
            subject=d.get("subject", ""),
            tags=d.get("tags", []),
        )
        return created_response(
            data=PDFDocumentSerializer(doc, context={"request": request}).data,
            message="PDF uploaded and processed.",
        )


class PDFDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        doc = PDFService.get_pdf(request.user, pk)
        return success_response(
            data=PDFDocumentSerializer(doc, context={"request": request}).data
        )

    def patch(self, request, pk):
        doc = PDFService.get_pdf(request.user, pk)
        serializer = PDFDocumentSerializer(doc, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return success_response(data=serializer.data, message="PDF updated.")

    def delete(self, request, pk):
        PDFService.delete_pdf(request.user, pk)
        return success_response(message="PDF deleted.")


class PDFChatView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        messages = PDFService.get_chat_history(request.user, pk)
        return success_response(data=PDFChatMessageSerializer(messages, many=True).data)

    def post(self, request, pk):
        serializer = PDFChatInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        message = PDFService.chat_with_pdf(
            user=request.user,
            pdf_id=pk,
            message=serializer.validated_data["message"],
        )
        return created_response(
            data=PDFChatMessageSerializer(message).data,
            message="Reply generated.",
        )


class PDFHighlightListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        highlights = PDFService.get_highlights(request.user, pk)
        return success_response(data=PDFHighlightSerializer(highlights, many=True).data)

    def post(self, request, pk):
        serializer = PDFHighlightSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        d = serializer.validated_data
        highlight = PDFService.create_highlight(
            user=request.user,
            pdf_id=pk,
            text=d["text"],
            page_number=d.get("page_number", 1),
            color=d.get("color", "yellow"),
            note=d.get("note", ""),
        )
        return created_response(data=PDFHighlightSerializer(highlight).data)


class PDFHighlightDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk, highlight_id):
        PDFService.delete_highlight(request.user, pk, highlight_id)
        return success_response(message="Highlight deleted.")
