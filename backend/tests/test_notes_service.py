"""
Unit tests for NoteService.

Covers:
- get_user_notes: filtering by subject and search term
- get_note: ownership enforcement
- create_note: persists fields correctly
- save_flashcards: strips unknown keys, skips incomplete cards
- generate_flashcards: key-stripping guard on AI output
"""
import pytest
from unittest.mock import patch, MagicMock


pytestmark = pytest.mark.django_db


class TestGetUserNotes:
    def test_returns_only_own_notes(self, user, second_user):
        from apps.notes.models import Note
        from apps.notes.services import NoteService
        Note.objects.create(user=user, title="My Note", content="content", subject="Maths")
        Note.objects.create(user=second_user, title="Their Note", content="content", subject="Maths")

        notes = NoteService.get_user_notes(user)
        assert notes.count() == 1
        assert notes.first().title == "My Note"

    def test_filters_by_subject(self, user):
        from apps.notes.models import Note
        from apps.notes.services import NoteService
        Note.objects.create(user=user, title="Physics Note", content="x", subject="Physics")
        Note.objects.create(user=user, title="Maths Note", content="x", subject="Maths")

        results = NoteService.get_user_notes(user, subject="physics")
        assert results.count() == 1
        assert results.first().subject == "Physics"

    def test_searches_title_and_content(self, user):
        from apps.notes.models import Note
        from apps.notes.services import NoteService
        Note.objects.create(user=user, title="Calculus", content="Derivatives and integrals", subject="Maths")
        Note.objects.create(user=user, title="Grammar", content="Nouns and verbs", subject="English")

        results = NoteService.get_user_notes(user, search="Derivatives")
        assert results.count() == 1
        assert results.first().title == "Calculus"


class TestGetNote:
    def test_returns_note_for_owner(self, user, note):
        from apps.notes.services import NoteService
        result = NoteService.get_note(user, note.id)
        assert result.id == note.id

    def test_raises_not_found_for_wrong_user(self, second_user, note):
        from apps.notes.services import NoteService
        from common.exceptions import NotFoundError
        with pytest.raises(NotFoundError):
            NoteService.get_note(second_user, note.id)

    def test_raises_not_found_for_nonexistent_id(self, user):
        import uuid
        from apps.notes.services import NoteService
        from common.exceptions import NotFoundError
        with pytest.raises(NotFoundError):
            NoteService.get_note(user, uuid.uuid4())


class TestCreateNote:
    def test_creates_note_with_all_fields(self, user):
        from apps.notes.services import NoteService
        note = NoteService.create_note(
            user,
            title="Photosynthesis",
            content="Plants convert light to sugar",
            subject="Biology",
            tags=["biology", "plants"],
        )
        assert note.id is not None
        assert note.user_id == user.id
        assert note.title == "Photosynthesis"
        assert note.tags == ["biology", "plants"]


class TestSaveFlashcards:
    def test_saves_valid_flashcards(self, user, note):
        from apps.notes.services import NoteService
        flashcards_data = [
            {"question": "What is F=ma?", "answer": "Newton's second law", "difficulty": "medium"},
            {"question": "What is inertia?", "answer": "Resistance to change in motion", "difficulty": "easy"},
        ]
        cards = NoteService.save_flashcards(user, note, flashcards_data)
        assert len(cards) == 2
        assert cards[0].question == "What is F=ma?"

    def test_strips_unknown_keys_from_ai_output(self, user, note):
        from apps.notes.services import NoteService
        flashcards_data = [
            {
                "question": "Valid Q",
                "answer": "Valid A",
                "difficulty": "hard",
                "hint": "should be stripped",
                "source": "AI hallucination",
                "confidence": 0.95,
            }
        ]
        cards = NoteService.save_flashcards(user, note, flashcards_data)
        assert len(cards) == 1
        assert not hasattr(cards[0], "hint")

    def test_skips_cards_missing_question_or_answer(self, user, note):
        from apps.notes.services import NoteService
        flashcards_data = [
            {"question": "Good Q", "answer": "Good A"},
            {"question": "Missing answer"},
            {"answer": "Missing question"},
            {},
        ]
        cards = NoteService.save_flashcards(user, note, flashcards_data)
        assert len(cards) == 1

    def test_defaults_difficulty_to_medium(self, user, note):
        from apps.notes.services import NoteService
        cards = NoteService.save_flashcards(user, note, [{"question": "Q", "answer": "A"}])
        assert cards[0].difficulty == "medium"

    def test_inherits_subject_from_note(self, user, note):
        from apps.notes.services import NoteService
        cards = NoteService.save_flashcards(user, note, [{"question": "Q", "answer": "A"}])
        assert cards[0].subject == note.subject


class TestGenerateFlashcardsKeyGuard:
    """Ensure generate_flashcards strips AI-injected keys before DB insert.

    GeminiAdapter is imported lazily inside generate_flashcards, so we patch
    it at its source module, not at apps.notes.services.
    """

    def test_strips_unexpected_keys_from_gemini_response(self, user, note):
        from apps.notes.services import NoteService

        mock_response = {
            "flashcards": [
                {
                    "question": "What is gravity?",
                    "answer": "A fundamental force",
                    "difficulty": "easy",
                    "topic": "should_be_stripped",
                    "score": 99,
                }
            ]
        }

        with patch(
            "services.ai_engine.adapters.gemini_adapter.GeminiAdapter.generate_json",
            return_value=mock_response,
        ):
            cards = NoteService.generate_flashcards(user, note, count=1)

        assert len(cards) == 1
        assert cards[0].question == "What is gravity?"
        # Verify the unexpected fields did not sneak through to the DB record
        from apps.notes.models import Flashcard
        db_card = Flashcard.objects.get(id=cards[0].id)
        assert db_card.question == "What is gravity?"
        assert db_card.difficulty == "easy"
