def build_summary_prompt(content: str) -> str:
    return f"""You are BrainPilot AI, an expert academic summarizer.

Summarize the following study notes into a concise, well-structured summary.

REQUIREMENTS:
1. Capture all key concepts and definitions
2. Use clear, student-friendly language
3. Preserve important technical terms
4. Structure with clear sections if content is long
5. Highlight the most important points
6. Maximum 300 words unless content demands more

NOTES TO SUMMARIZE:
{content[:4000]}

Provide a clean, readable summary:"""


def build_flashcards_prompt(content: str, count: int) -> str:
    return f"""You are BrainPilot AI, an expert flashcard creator for spaced repetition learning.

Create {count} high-quality flashcards from these study notes.

REQUIREMENTS:
1. Each flashcard tests ONE specific concept
2. Questions should be clear and specific
3. Answers should be concise but complete
4. Cover the most important concepts first
5. Mix definition, application, and recall questions

NOTES:
{content[:4000]}

Return JSON:
{{
  "flashcards": [
    {{
      "question": "Clear, specific question",
      "answer": "Concise, accurate answer",
      "difficulty": "easy|medium|hard"
    }}
  ]
}}"""


def build_recommendation_prompt(user_data: dict) -> str:
    return f"""You are BrainPilot AI, a personal academic coach.

Based on the student's performance data, provide personalized recommendations.

STUDENT DATA:
- Weak topics: {user_data.get('weak_topics', [])}
- Average quiz score: {user_data.get('avg_quiz_score', 0):.1f}%
- Study streak: {user_data.get('streak', 0)} days
- Focus minutes this week: {user_data.get('weekly_focus', 0)}
- Pending revisions: {user_data.get('due_revisions', 0)}

Provide 3-5 specific, actionable study recommendations.
Return as JSON:
{{
  "recommendations": [
    {{
      "type": "revision|quiz|study|break",
      "title": "Short recommendation title",
      "description": "Detailed actionable advice",
      "priority": "high|medium|low"
    }}
  ]
}}"""
