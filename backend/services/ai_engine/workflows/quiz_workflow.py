import logging
from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
from services.ai_engine.prompts.quiz_generation import build_quiz_prompt
from common.exceptions import AIServiceError

logger = logging.getLogger(__name__)


class QuizWorkflow:
    def __init__(self):
        self.adapter = GeminiAdapter()

    def generate(self, request_data: dict) -> dict:
        subject = request_data["subject"]
        topic = request_data.get("topic", "")
        difficulty = request_data.get("difficulty", "medium")
        count = request_data.get("question_count", 10)
        context = request_data.get("context", "")
        note_id = request_data.get("note_id")

        if note_id and not context:
            context = self._get_note_context(note_id)

        logger.info("Generating quiz: subject=%s, difficulty=%s, count=%d", subject, difficulty, count)
        prompt = build_quiz_prompt(subject, topic, difficulty, count, context)
        result = self.adapter.generate_json(prompt)

        if "questions" not in result or not isinstance(result["questions"], list):
            raise AIServiceError("AI returned an invalid quiz structure.")

        logger.info("Quiz generated with %d questions", len(result["questions"]))
        return result

    def _get_note_context(self, note_id: str) -> str:
        try:
            from apps.notes.models import Note
            note = Note.objects.get(id=note_id)
            return note.content[:3000]
        except Exception:
            return ""
