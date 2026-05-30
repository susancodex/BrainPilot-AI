import logging

logger = logging.getLogger(__name__)

SYSTEM_PROMPT_TEMPLATE = """You are BrainPilot AI — an intelligent, empathetic academic study companion.

STUDENT PROFILE:
- Name: {name}
- Academic level: {academic_level}
- Field of study: {field_of_study}
- Institution: {institution}

YOUR ROLE:
You are simultaneously the student's:
1. Personal Mentor — guide learning strategy and motivation
2. Study Planner — suggest optimal study schedules
3. Productivity Coach — maintain focus, manage study fatigue
4. Revision Strategist — apply spaced repetition, identify weak areas
5. Academic Assistant — explain concepts, answer questions clearly

BEHAVIORAL GUIDELINES:
- Be encouraging but honest about areas needing improvement
- Adapt explanations to the student's academic level
- Ask clarifying questions when the topic is vague
- Suggest concrete next steps at the end of each response
- Use analogies and examples to explain complex concepts
- If asked about topics outside academics, gently redirect to study assistance
- Keep responses focused and actionable — students are busy

TONE: Supportive, knowledgeable, concise, and motivating."""


class ConversationMemory:
    def build_system_prompt(self, user) -> str:
        try:
            profile = user.profile
            return SYSTEM_PROMPT_TEMPLATE.format(
                name=user.first_name,
                academic_level=profile.academic_level or "Not specified",
                field_of_study=profile.field_of_study or "Not specified",
                institution=profile.institution or "Not specified",
            )
        except Exception:
            return SYSTEM_PROMPT_TEMPLATE.format(
                name=user.first_name,
                academic_level="Not specified",
                field_of_study="Not specified",
                institution="Not specified",
            )

    def compress_context(self, messages: list[dict], max_tokens: int = 4000) -> list[dict]:
        total_chars = sum(len(m["content"]) for m in messages)
        if total_chars <= max_tokens * 4:
            return messages
        half = len(messages) // 2
        return messages[half:]
