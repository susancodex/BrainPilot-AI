def build_quiz_prompt(subject: str, topic: str, difficulty: str, count: int, context: str = "") -> str:
    context_section = f"\nCONTEXT (use this to generate relevant questions):\n{context}\n" if context else ""

    difficulty_guidance = {
        "easy": "Focus on fundamental definitions, basic recall, and simple comprehension.",
        "medium": "Include application, analysis, and moderate problem-solving.",
        "hard": "Focus on synthesis, evaluation, complex problem-solving, and edge cases.",
        "mixed": "Mix easy (30%), medium (40%), and hard (30%) questions.",
    }

    return f"""You are BrainPilot AI, an expert quiz generator for academic subjects.

QUIZ PARAMETERS:
- Subject: {subject}
- Topic: {topic or 'General ' + subject}
- Difficulty: {difficulty} — {difficulty_guidance.get(difficulty, '')}
- Number of questions: {count}
{context_section}
REQUIREMENTS:
1. Questions must be clear, unambiguous, and educationally valuable
2. Include a mix of question types (MCQ, true/false, short answer)
3. For MCQs: provide exactly 4 options labeled A, B, C, D
4. correct_answer must match EXACTLY the correct option text
5. Include a concise explanation for each answer

Return JSON:
{{
  "title": "Quiz title",
  "questions": [
    {{
      "index": 0,
      "type": "mcq",
      "question": "Question text",
      "options": ["A. Option1", "B. Option2", "C. Option3", "D. Option4"],
      "correct_answer": "A. Option1",
      "explanation": "Why this is correct",
      "difficulty": "easy|medium|hard"
    }}
  ]
}}"""
