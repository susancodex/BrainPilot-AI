import logging
from datetime import date

from services.ai_engine.adapters.gemini_adapter import GeminiAdapter
from services.ai_engine.prompts.study_plan import build_study_plan_prompt, build_emergency_plan_prompt
from common.exceptions import AIServiceError

logger = logging.getLogger(__name__)


class StudyPlannerWorkflow:
    def __init__(self):
        self.adapter = GeminiAdapter()

    def generate(self, user, request_data: dict) -> dict:
        plan_type = request_data.get("plan_type", "daily")
        subjects = request_data["subjects"]
        start_date = request_data["start_date"]
        end_date = request_data["end_date"]
        daily_hours = request_data.get("daily_hours", 4)
        exam_date = request_data.get("exam_date")
        weak_topics = request_data.get("weak_topics", [])
        goals = request_data.get("goals", "")

        logger.info("Generating %s study plan for user %s", plan_type, user.email)

        if plan_type == "emergency" and exam_date:
            prompt = build_emergency_plan_prompt(subjects, exam_date, daily_hours)
        else:
            prompt = build_study_plan_prompt(
                subjects=subjects,
                start_date=start_date,
                end_date=end_date,
                plan_type=plan_type,
                daily_hours=daily_hours,
                weak_topics=weak_topics,
                exam_date=exam_date,
                goals=goals,
            )

        result = self.adapter.generate_json(prompt)
        self._validate_plan(result)
        logger.info("Study plan generated with %d sessions", len(result.get("sessions", [])))
        return result

    def _validate_plan(self, plan: dict) -> None:
        if "sessions" not in plan:
            raise AIServiceError("AI returned an invalid plan structure.")
        if not isinstance(plan["sessions"], list):
            raise AIServiceError("AI returned invalid sessions data.")


class RevisionWorkflow:
    def __init__(self):
        self.adapter = GeminiAdapter()

    def generate_revision_schedule(self, user, weak_topics: list) -> dict:
        from services.ai_engine.prompts.summary_generation import build_recommendation_prompt
        from apps.analytics.services import AnalyticsService

        revision_stats = AnalyticsService.get_revision_stats(user)
        quiz_stats = AnalyticsService.get_quiz_performance(user)

        user_data = {
            "weak_topics": [t.topic for t in weak_topics],
            "avg_quiz_score": quiz_stats.get("summary", {}).get("avg_percentage") or 0,
            "due_revisions": revision_stats["weak_topics"],
        }
        prompt = build_recommendation_prompt(user_data)
        return self.adapter.generate_json(prompt)
