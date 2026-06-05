import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.pdfs.models import PDFHighlight
from apps.pdfs.services import PDFService
from common.exceptions import NotFoundError

pytestmark = pytest.mark.django_db

MINIMAL_PDF = b"%PDF-1.4\n1 0 obj<<>>endobj\ntrailer<<>>\n%%EOF"


class TestPDFHighlightScoping:
    def test_delete_highlight_requires_matching_pdf(self, user):
        file_a = SimpleUploadedFile("a.pdf", MINIMAL_PDF, content_type="application/pdf")
        file_b = SimpleUploadedFile("b.pdf", MINIMAL_PDF, content_type="application/pdf")
        doc_a = PDFService.upload_pdf(user, file_a, title="A")
        doc_b = PDFService.upload_pdf(user, file_b, title="B")
        highlight = PDFService.create_highlight(user, doc_a.id, text="Important", page_number=1)

        with pytest.raises(NotFoundError):
            PDFService.delete_highlight(user, doc_b.id, highlight.id)

        PDFService.delete_highlight(user, doc_a.id, highlight.id)
        assert not PDFHighlight.objects.filter(id=highlight.id).exists()
