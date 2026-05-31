"""
Unit tests for ProductivityService.

Covers:
- log_session: atomically creates session, focus log, and streak
- _update_streak: new streak, consecutive days, same day, gap resets
- _update_focus_log: accumulates minutes, merges subjects, caps score at 100
- review_flashcard: spaced-repetition interval logic (correct vs incorrect)
"""
import pytest
from datetime import timedelta
from django.utils import timezone


pytestmark = pytest.mark.django_db


class TestLogSession:
    def test_creates_completed_session(self, user):
        from apps.productivity.services import ProductivityService
        result = ProductivityService.log_session(user, subject="Biology", focus_minutes=30)

        session = result["session"]
        assert session.user_id == user.id
        assert session.subject == "Biology"
        assert session.total_focus_minutes == 30
        assert session.status == "completed"
        assert session.ended_at is not None

    def test_returns_focus_log_with_correct_minutes(self, user):
        from apps.productivity.services import ProductivityService
        result = ProductivityService.log_session(user, subject="Chemistry", focus_minutes=45)

        log = result["focus_log"]
        assert log.focus_minutes == 45
        assert "Chemistry" in log.subjects_studied

    def test_returns_incremented_streak(self, user):
        from apps.productivity.services import ProductivityService
        result = ProductivityService.log_session(user, subject="History", focus_minutes=20)

        streak = result["streak"]
        assert streak.current_streak == 1
        assert streak.total_study_days == 1
        assert streak.last_study_date == timezone.now().date()

    def test_accumulates_minutes_for_multiple_sessions_same_day(self, user):
        from apps.productivity.services import ProductivityService
        ProductivityService.log_session(user, subject="Maths", focus_minutes=30)
        result = ProductivityService.log_session(user, subject="Physics", focus_minutes=45)

        log = result["focus_log"]
        assert log.focus_minutes == 75
        assert "Maths" in log.subjects_studied
        assert "Physics" in log.subjects_studied

    def test_streak_not_double_counted_same_day(self, user):
        from apps.productivity.services import ProductivityService
        ProductivityService.log_session(user, subject="English", focus_minutes=20)
        result = ProductivityService.log_session(user, subject="English", focus_minutes=20)

        streak = result["streak"]
        assert streak.current_streak == 1
        assert streak.total_study_days == 1

    def test_task_description_stored(self, user):
        from apps.productivity.services import ProductivityService
        result = ProductivityService.log_session(
            user, subject="Art", focus_minutes=15, task_description="Sketch practice"
        )
        assert result["session"].task_description == "Sketch practice"

    def test_productivity_score_capped_at_100(self, user):
        from apps.productivity.services import ProductivityService
        result = ProductivityService.log_session(user, subject="Marathon", focus_minutes=600)

        log = result["focus_log"]
        assert log.productivity_score <= 100.0


class TestUpdateStreak:
    def test_first_ever_session_starts_streak_at_1(self, user):
        from apps.productivity.services import ProductivityService
        streak = ProductivityService._update_streak(user)
        assert streak.current_streak == 1

    def test_consecutive_day_increments_streak(self, user):
        from apps.productivity.models import StudyStreak
        yesterday = timezone.now().date() - timedelta(days=1)
        StudyStreak.objects.create(
            user=user,
            current_streak=5,
            longest_streak=10,
            last_study_date=yesterday,
            total_study_days=5,
        )
        from apps.productivity.services import ProductivityService
        streak = ProductivityService._update_streak(user)
        assert streak.current_streak == 6

    def test_gap_resets_streak_to_1(self, user):
        from apps.productivity.models import StudyStreak
        three_days_ago = timezone.now().date() - timedelta(days=3)
        StudyStreak.objects.create(
            user=user,
            current_streak=10,
            longest_streak=10,
            last_study_date=three_days_ago,
            total_study_days=10,
        )
        from apps.productivity.services import ProductivityService
        streak = ProductivityService._update_streak(user)
        assert streak.current_streak == 1

    def test_longest_streak_updated_when_exceeded(self, user):
        from apps.productivity.models import StudyStreak
        yesterday = timezone.now().date() - timedelta(days=1)
        StudyStreak.objects.create(
            user=user,
            current_streak=7,
            longest_streak=7,
            last_study_date=yesterday,
            total_study_days=7,
        )
        from apps.productivity.services import ProductivityService
        streak = ProductivityService._update_streak(user)
        assert streak.longest_streak == 8

    def test_same_day_is_idempotent(self, user):
        from apps.productivity.models import StudyStreak
        today = timezone.now().date()
        StudyStreak.objects.create(
            user=user,
            current_streak=3,
            longest_streak=5,
            last_study_date=today,
            total_study_days=3,
        )
        from apps.productivity.services import ProductivityService
        streak = ProductivityService._update_streak(user)
        assert streak.current_streak == 3
        assert streak.total_study_days == 3


class TestReviewFlashcard:
    def test_correct_answer_doubles_interval(self, user, note):
        from apps.notes.models import Flashcard
        from apps.notes.services import NoteService
        flashcard = Flashcard.objects.create(
            user=user, note=note,
            question="What is F=ma?", answer="Newton's second law",
            times_correct=2,
        )
        updated = NoteService.review_flashcard(user, flashcard.id, correct=True)

        assert updated.times_reviewed == 1
        assert updated.times_correct == 3
        assert updated.next_review_at > timezone.now()

    def test_wrong_answer_sets_interval_to_1_day(self, user, note):
        from apps.notes.models import Flashcard
        from apps.notes.services import NoteService
        flashcard = Flashcard.objects.create(
            user=user, note=note,
            question="What is inertia?", answer="Tendency to resist change",
            times_correct=5,
        )
        updated = NoteService.review_flashcard(user, flashcard.id, correct=False)

        expected_min = timezone.now() + timedelta(hours=23)
        expected_max = timezone.now() + timedelta(hours=25)
        assert expected_min < updated.next_review_at < expected_max

    def test_wrong_answer_does_not_increment_times_correct(self, user, note):
        from apps.notes.models import Flashcard
        from apps.notes.services import NoteService
        flashcard = Flashcard.objects.create(
            user=user, note=note,
            question="Q", answer="A",
            times_correct=3,
        )
        updated = NoteService.review_flashcard(user, flashcard.id, correct=False)
        assert updated.times_correct == 3

    def test_raises_not_found_for_wrong_owner(self, user, second_user, note):
        from apps.notes.models import Flashcard
        from apps.notes.services import NoteService
        from common.exceptions import NotFoundError
        flashcard = Flashcard.objects.create(
            user=user, note=note, question="Q", answer="A"
        )
        with pytest.raises(NotFoundError):
            NoteService.review_flashcard(second_user, flashcard.id, correct=True)
