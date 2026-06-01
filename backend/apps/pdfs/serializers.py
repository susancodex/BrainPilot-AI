from rest_framework import serializers
from .models import PDFDocument, PDFHighlight, PDFChatMessage


class PDFDocumentSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = PDFDocument
        fields = [
            "id", "title", "file_url", "file_size", "page_count",
            "is_processed", "subject", "tags", "created_at", "updated_at",
        ]
        read_only_fields = ["id", "is_processed", "file_size", "page_count", "created_at", "updated_at"]

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class PDFUploadSerializer(serializers.Serializer):
    file = serializers.FileField()
    title = serializers.CharField(max_length=500, required=False)
    subject = serializers.CharField(max_length=255, required=False, allow_blank=True)
    tags = serializers.ListField(child=serializers.CharField(), required=False, default=list)

    def validate_file(self, value):
        if not value.name.lower().endswith(".pdf"):
            raise serializers.ValidationError("Only PDF files are allowed.")
        max_size = 20 * 1024 * 1024
        if value.size > max_size:
            raise serializers.ValidationError("File size must not exceed 20 MB.")
        return value


class PDFHighlightSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDFHighlight
        fields = ["id", "text", "page_number", "color", "note", "created_at"]
        read_only_fields = ["id", "created_at"]


class PDFChatMessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = PDFChatMessage
        fields = ["id", "role", "content", "created_at"]
        read_only_fields = ["id", "role", "created_at"]


class PDFChatInputSerializer(serializers.Serializer):
    message = serializers.CharField(min_length=1, max_length=2000)
