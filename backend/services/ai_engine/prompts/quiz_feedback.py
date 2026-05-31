def build_quiz_feedback_prompt(quiz_title: str, subject: str, percentage: float, evaluated_answers: list) -> str:
    wrong = [a for a in evaluated_answers if not a["is_correct"]]
    correct = [a for a in evaluated_answers if a["is_correct"]]

    wrong_summary = "\n".join(
        f"- Q{a['question_index'] + 1}: answered \"{a['user_answer']}\", correct was \"{a['correct_answer']}\""
        for a in wrong[:10]
    ) or "None — perfect score!"

    return f"""You are BrainPilot AI, a supportive academic coach reviewing a student's quiz performance.

QUIZ: {quiz_title}
SUBJECT: {subject}
SCORE: {percentage:.1f}% ({len(correct)}/{len(correct) + len(wrong)} correct)

INCORRECT ANSWERS:
{wrong_summary}

Write a short, encouraging performance review (3–5 sentences max) that:
1. Acknowledges the score honestly but positively
2. Identifies the specific weak areas based on the wrong answers
3. Gives 1–2 concrete revision tips for those weak areas
4. Ends with a motivating sentence

Tone: supportive, direct, like a tutor who cares. No bullet points — write in plain paragraphs."""
