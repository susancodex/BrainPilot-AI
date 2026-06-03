export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  role?: string;
  is_email_verified: boolean;
  is_staff?: boolean;
  is_superuser?: boolean;
  created_at?: string;
  profile?: UserProfile;
}

export interface UserProfile {
  bio?: string;
  phone?: string;
  timezone?: string;
  institution?: string;
  field_of_study?: string;
  academic_level?: 'high_school' | 'undergraduate' | 'postgraduate' | 'doctorate' | 'professional' | 'other';
  study_goal_hours_per_week?: number;
  preferred_study_time?: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface LoginPayload { email: string; password: string; }
export interface RegisterPayload { email: string; first_name: string; last_name: string; password: string; password_confirm: string; }

export interface Note {
  id: string;
  title: string;
  content: string;
  subject?: string;
  tags?: string[];
  is_pinned: boolean;
  ai_summary?: string;
  flashcard_count: number;
  word_count?: number;
  created_at: string;
  updated_at: string;
}

export interface Flashcard {
  id: string;
  note: string;
  front: string;
  back: string;
  difficulty?: string;
  next_review_date: string;
  review_count: number;
}

export interface Conversation {
  id: string;
  title: string;
  subject_context?: string;
  message_count?: number;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface Message {
  id?: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
}

export interface Quiz {
  id: string;
  title: string;
  topic?: string;
  subject: string;
  difficulty?: string;
  question_count: number;
  questions: QuizQuestion[];
  ai_generated?: boolean;
  created_at: string;
}

export interface QuizQuestion {
  index?: number;
  text?: string;
  question?: string;
  question_type?: 'mcq' | 'true_false' | 'short_answer';
  type?: string;
  options?: string[];
  correct_answer: string;
  explanation?: string;
}

export interface QuizAttempt {
  id: string;
  quiz: string;
  score: number;
  max_score: number;
  percentage: number;
  time_taken_seconds?: number;
  ai_feedback?: string;
  completed: boolean;
  created_at: string;
  answers: QuizAnswerResult[];
}

export interface QuizAnswerResult {
  question_index: number;
  user_answer: string;
  is_correct: boolean;
  correct_answer: string;
}

export interface StudyPlan {
  id: string;
  title: string;
  plan_type: 'daily' | 'weekly' | 'monthly' | 'emergency';
  daily_hours: number;
  duration_days: number;
  session_count: number;
  completed_sessions: number;
  subjects: string[];
  created_at: string;
}

export interface StudySession {
  id: string;
  plan?: string;
  subject: string;
  topic: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'skipped';
  notes?: string;
  duration_minutes?: number;
}

export interface Goal {
  id: string;
  title: string;
  description: string;
  subject?: string;
  category: 'academic' | 'skill' | 'certification' | 'exam' | 'personal';
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  progress: number;
  target_date: string;
  milestone_items?: Milestone[];
  created_at: string;
}

export interface Milestone {
  id: string;
  title: string;
  is_completed: boolean;
  completed_at?: string;
}

export interface RevisionTopic {
  id: string;
  subject: string;
  topic: string;
  confidence_level: 1 | 2 | 3 | 4 | 5;
  revision_count: number;
  next_review_date: string;
  last_reviewed?: string;
  is_due: boolean;
  is_weak: boolean;
}

export interface PomodoroSession {
  id: string;
  subject: string;
  task_description?: string;
  work_duration_minutes: number;
  break_duration_minutes: number;
  pomodoros_planned: number;
  pomodoros_completed: number;
  total_focus_minutes: number;
  status: 'active' | 'completed' | 'cancelled';
  started_at: string;
  completed_at?: string;
}

export interface StudyStreak {
  current_streak: number;
  longest_streak: number;
  total_study_days: number;
  last_study_date?: string;
}

export interface FocusLog {
  id: string;
  date: string;
  total_minutes: number;
  session_count: number;
}

export interface DashboardSummary {
  streak: number;
  today_sessions: number;
  notes_count: number;
  goals_summary: { active: number; completed: number; total: number };
  due_revisions: number;
  today_focus_minutes: number;
  recent_activity: ActivityItem[];
  upcoming_sessions?: StudySession[];
  ai_suggestion?: string;
}

export interface ActivityItem {
  description: string;
  time: string;
  type?: string;
}

export interface StudyTrend {
  name: string;
  hours: number;
  date?: string;
}

export interface SubjectBreakdown {
  name: string;
  value: number;
  hours?: number;
}

export interface QuizPerformanceData {
  avg_percentage: number;
  quiz_count: number;
  pass_rate: number;
  trend: Array<{ date: string; score: number }>;
}

export interface QuizPerformanceSummary {
  avg_percentage: number;
  total_attempts: number;
}

export interface QuizPerformanceBySubject {
  subject: string;
  accuracy: number;
}

export interface QuizPerformanceResponse {
  summary: QuizPerformanceSummary;
  by_subject: QuizPerformanceBySubject[];
}

export interface RevisionStats {
  weak_topic_count: number;
  due_count: number;
  mastered_count: number;
}

export interface RevisionStatsResponse {
  due_count: number;
  weak_topics: number;
  mastered: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'revision_due' | 'goal_reminder' | 'ai_recommendation' | 'exam_alert' | 'system';
  is_read: boolean;
  action_url?: string;
  created_at: string;
}

export interface PDFDocument {
  id: string;
  title: string;
  file_url?: string;
  file_size: number;
  page_count: number;
  is_processed: boolean;
  subject?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
}

export interface PDFHighlight {
  id: string;
  text: string;
  page_number: number;
  color: string;
  note?: string;
  created_at: string;
}

export interface PDFChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Subscription {
  id: string;
  plan: "free" | "premium" | "enterprise";
  plan_display: string;
  status: "active" | "cancelled" | "expired" | "trial";
  status_display: string;
  started_at: string;
  expires_at?: string;
  is_premium: boolean;
  ai_requests_used: number;
  ai_requests_limit: number;
  ai_requests_remaining: number;
  pdfs_uploaded: number;
  pdfs_limit: number;
}

export interface PlanInfo {
  plan_key: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
  ai_requests: number;
  pdf_uploads: number;
  features: string[];
}

export interface NotificationsResponse {
  unread_count: number;
  notifications: Notification[];
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
}

export interface PaginatedResponse<T> {
  count: number;
  next?: string;
  previous?: string;
  results: T[];
}
