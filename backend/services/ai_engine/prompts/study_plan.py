from datetime import date


def build_study_plan_prompt(
    subjects: list[str],
    start_date: date,
    end_date: date,
    plan_type: str,
    daily_hours: float,
    weak_topics: list[str] = None,
    exam_date: date = None,
    goals: str = "",
    syllabus_text: str = "",
) -> str:
    weak_str = ", ".join(weak_topics) if weak_topics else "None identified"
    exam_str = str(exam_date) if exam_date else "Not specified"
    total_days = (end_date - start_date).days + 1
    syllabus_section = (
        f"\nSYLLABUS / COURSE CONTENT (use this to structure topics):\n{syllabus_text[:6000]}\n"
        if syllabus_text and syllabus_text.strip()
        else ""
    )

    return f"""You are BrainPilot AI, an expert academic study planner. Create a detailed, adaptive study plan.

STUDENT CONTEXT:
- Subjects: {', '.join(subjects)}
- Period: {start_date} to {end_date} ({total_days} days)
- Plan type: {plan_type}
- Daily study hours: {daily_hours}
- Exam date: {exam_str}
- Weak topics: {weak_str}
- Goals: {goals or 'General preparation'}{syllabus_section}

REQUIREMENTS:
1. Distribute topics evenly across available days
2. Allocate more time to weak topics
3. Include spaced repetition — revisit earlier topics
4. Include buffer days before exam (if applicable)
5. Each session must have a clear, specific topic (not just "study Math")
6. Sessions must fit within daily_hours limit

Return a JSON object:
{{
  "title": "Study plan title",
  "total_hours": <number>,
  "sessions": [
    {{
      "subject": "subject name",
      "topic": "specific topic",
      "date": "YYYY-MM-DD",
      "start_time": "HH:MM",
      "end_time": "HH:MM",
      "duration_minutes": <number>
    }}
  ]
}}"""


def build_emergency_plan_prompt(subjects: list[str], exam_date: date, hours_per_day: float) -> str:
    return f"""You are BrainPilot AI in EMERGENCY EXAM MODE. The student has an exam very soon.

CONTEXT:
- Subjects: {', '.join(subjects)}
- Exam date: {exam_date}
- Available hours per day: {hours_per_day}

Create an intensive, high-priority study plan focused on:
1. High-yield topics only
2. Maximum retention techniques
3. Practice and review sessions
4. Adequate rest reminders

Return the same JSON format as the standard study plan."""
