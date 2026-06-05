import logging
from .models import Quiz, QuizAttempt
from common.exceptions import NotFoundError

logger = logging.getLogger(__name__)


def _generate_attempt_feedback(quiz: Quiz, evaluated_answers: list, percentage: float) -> str:
    try:
        from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
        from services.ai_engine.prompts.quiz_feedback import build_quiz_feedback_prompt
        adapter = GeminiAdapter(user=user)
        prompt = build_quiz_feedback_prompt(quiz.title, quiz.subject, percentage, evaluated_answers)
        return adapter.generate_text(prompt)
    except Exception as exc:
        logger.warning("AI feedback generation failed (non-fatal): %s", exc)
        return ""


class QuizService:
    @staticmethod
    def get_user_quizzes(user, subject=None):
        qs = Quiz.objects.filter(user=user)
        if subject:
            qs = qs.filter(subject__icontains=subject)
        return qs

    @staticmethod
    def get_quiz(user, quiz_id) -> Quiz:
        try:
            return Quiz.objects.get(id=quiz_id, user=user)
        except Quiz.DoesNotExist:
            raise NotFoundError("Quiz not found.")

    @staticmethod
    def create_ai_quiz(user, ai_response: dict, request_data: dict) -> Quiz:
        questions = ai_response.get("questions", [])
        quiz = Quiz.objects.create(
            user=user,
            title=ai_response.get("title", f"{request_data['subject']} Quiz"),
            subject=request_data["subject"],
            topic=request_data.get("topic", ""),
            difficulty=request_data["difficulty"],
            questions=questions,
            question_count=len(questions),
            ai_generated=True,
        )
        logger.info("AI quiz created for user %s: %s", user.email, quiz.id)
        return quiz

    @staticmethod
    def evaluate_attempt(quiz: Quiz, answers: list, time_taken: int, user) -> QuizAttempt:
        questions = quiz.questions
        score = 0
        evaluated_answers = []
        for i, question in enumerate(questions):
            user_answer = next((a.get("answer") for a in answers if a.get("question_index") == i), None)
            correct = question.get("correct_answer", "")
            is_correct = str(user_answer).strip().lower() == str(correct).strip().lower()
            if is_correct:
                score += 1
            evaluated_answers.append({
                "question_index": i,
                "user_answer": user_answer,
                "correct_answer": correct,
                "is_correct": is_correct,
            })

        max_score = len(questions)
        percentage = (score / max_score * 100) if max_score > 0 else 0

        ai_feedback = _generate_attempt_feedback(quiz, evaluated_answers, percentage)

        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            user=user,
            answers=evaluated_answers,
            score=score,
            max_score=max_score,
            percentage=round(percentage, 2),
            time_taken_seconds=time_taken,
            ai_feedback=ai_feedback,
            completed=True,
        )
        return attempt

    @staticmethod
    def get_user_attempts(user, quiz_id=None):
        qs = QuizAttempt.objects.filter(user=user, completed=True).select_related("quiz")
        if quiz_id:
            qs = qs.filter(quiz_id=quiz_id)
        return qs
