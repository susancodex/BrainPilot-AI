import logging
from django.utils import timezone
from .models import PDFDocument, PDFHighlight, PDFChatMessage
from common.exceptions import NotFoundError

logger = logging.getLogger(__name__)


class PDFService:
    @staticmethod
    def get_user_pdfs(user, subject=None):
        qs = PDFDocument.objects.filter(user=user)
        if subject:
            qs = qs.filter(subject__icontains=subject)
        return qs

    @staticmethod
    def get_pdf(user, pdf_id) -> PDFDocument:
        try:
            return PDFDocument.objects.get(id=pdf_id, user=user)
        except PDFDocument.DoesNotExist:
            raise NotFoundError("PDF document not found.")

    @staticmethod
    def upload_pdf(user, file, title=None, subject="", tags=None) -> PDFDocument:
        from apps.subscriptions.services import SubscriptionService

        SubscriptionService.assert_pdf_upload_allowed(user)
        doc = PDFDocument.objects.create(
            user=user,
            title=title or file.name,
            file=file,
            file_size=file.size,
            subject=subject or "",
            tags=tags or [],
        )
        PDFService._extract_text(doc)
        SubscriptionService.increment_pdf_upload(user)
        return doc

    @staticmethod
    def _extract_text(doc: PDFDocument):
        try:
            import io
            content = doc.file.read()
            doc.file.seek(0)

            try:
                import pypdf
                reader = pypdf.PdfReader(io.BytesIO(content))
                doc.page_count = len(reader.pages)
                text_parts = []
                for page in reader.pages:
                    text_parts.append(page.extract_text() or "")
                doc.extracted_text = "\n\n".join(text_parts)
            except ImportError:
                doc.page_count = 1
                doc.extracted_text = ""

            doc.is_processed = True
            doc.save(update_fields=["page_count", "extracted_text", "is_processed"])
        except Exception as exc:
            logger.warning("PDF text extraction failed for %s: %s", doc.id, exc)
            doc.is_processed = True
            doc.save(update_fields=["is_processed"])

    @staticmethod
    def delete_pdf(user, pdf_id):
        doc = PDFService.get_pdf(user, pdf_id)
        try:
            doc.file.delete(save=False)
        except Exception:
            pass
        doc.delete()

    @staticmethod
    def get_chat_history(user, pdf_id):
        doc = PDFService.get_pdf(user, pdf_id)
        return PDFChatMessage.objects.filter(document=doc, user=user)

    @staticmethod
    def chat_with_pdf(user, pdf_id, message: str) -> PDFChatMessage:
        doc = PDFService.get_pdf(user, pdf_id)

        PDFChatMessage.objects.create(
            document=doc,
            user=user,
            role="user",
            content=message,
        )

        try:
            from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
            adapter = GeminiAdapter(user=user)
            context = doc.extracted_text[:8000] if doc.extracted_text else "(no text extracted)"
            prompt = (
                f"You are a study assistant helping a student understand a PDF document.\n\n"
                f"Document title: {doc.title}\n\n"
                f"Document content (first 8000 chars):\n{context}\n\n"
                f"Student question: {message}\n\n"
                f"Provide a clear, helpful answer based on the document content."
            )
            answer = adapter.generate_text(prompt)
        except Exception as exc:
            logger.error("PDF chat AI error: %s", exc)
            answer = "I'm unable to process your request right now. Please try again later."

        return PDFChatMessage.objects.create(
            document=doc,
            user=user,
            role="assistant",
            content=answer,
        )

    @staticmethod
    def get_highlights(user, pdf_id):
        doc = PDFService.get_pdf(user, pdf_id)
        return PDFHighlight.objects.filter(document=doc, user=user)

    @staticmethod
    def create_highlight(user, pdf_id, text, page_number=1, color="yellow", note="") -> PDFHighlight:
        doc = PDFService.get_pdf(user, pdf_id)
        return PDFHighlight.objects.create(
            document=doc,
            user=user,
            text=text,
            page_number=page_number,
            color=color,
            note=note,
        )

    @staticmethod
    def delete_highlight(user, pdf_id, highlight_id):
        doc = PDFService.get_pdf(user, pdf_id)
        try:
            h = PDFHighlight.objects.get(id=highlight_id, document=doc, user=user)
            h.delete()
        except PDFHighlight.DoesNotExist:
            raise NotFoundError("Highlight not found.")
