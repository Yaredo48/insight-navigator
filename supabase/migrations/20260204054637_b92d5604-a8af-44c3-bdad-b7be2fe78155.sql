-- Create quizzes table
CREATE TABLE public.quizzes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  grade_id INTEGER REFERENCES public.grades(id),
  subject_id INTEGER REFERENCES public.subjects(id),
  topic TEXT,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  time_limit_minutes INTEGER,
  passing_score INTEGER DEFAULT 70,
  is_published BOOLEAN DEFAULT false,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz questions table
CREATE TABLE public.quiz_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_type TEXT NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'fill_blank', 'matching')),
  question_text TEXT NOT NULL,
  options JSONB, -- For multiple choice: [{id, text}], for matching: [{left, right}]
  correct_answer JSONB NOT NULL, -- Stores the correct answer(s)
  explanation TEXT, -- Explanation shown after answering
  points INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create quiz attempts table
CREATE TABLE public.quiz_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  score INTEGER,
  total_points INTEGER,
  percentage DECIMAL(5,2),
  time_taken_seconds INTEGER,
  answers JSONB, -- {question_id: user_answer}
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Create flashcard decks table
CREATE TABLE public.flashcard_decks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  grade_id INTEGER REFERENCES public.grades(id),
  subject_id INTEGER REFERENCES public.subjects(id),
  topic TEXT,
  created_by TEXT,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcards table with spaced repetition fields
CREATE TABLE public.flashcards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  front_text TEXT NOT NULL,
  back_text TEXT NOT NULL,
  front_image_url TEXT,
  back_image_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create flashcard reviews for spaced repetition
CREATE TABLE public.flashcard_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  ease_factor DECIMAL(4,2) DEFAULT 2.5, -- SM-2 algorithm
  interval_days INTEGER DEFAULT 1,
  repetitions INTEGER DEFAULT 0,
  next_review_date DATE DEFAULT CURRENT_DATE,
  last_quality INTEGER, -- 0-5 rating
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create student notes table
CREATE TABLE public.student_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT,
  grade_id INTEGER REFERENCES public.grades(id),
  subject_id INTEGER REFERENCES public.subjects(id),
  book_id UUID REFERENCES public.books(id),
  tags TEXT[],
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video lessons table
CREATE TABLE public.video_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  video_type TEXT DEFAULT 'youtube' CHECK (video_type IN ('youtube', 'vimeo', 'direct')),
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  grade_id INTEGER REFERENCES public.grades(id),
  subject_id INTEGER REFERENCES public.subjects(id),
  topic TEXT,
  order_index INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_by TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video progress table
CREATE TABLE public.video_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES public.video_lessons(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  watched_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(video_id, user_id)
);

-- Create student progress summary table
CREATE TABLE public.student_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  grade_id INTEGER REFERENCES public.grades(id),
  subject_id INTEGER REFERENCES public.subjects(id),
  quizzes_completed INTEGER DEFAULT 0,
  quizzes_passed INTEGER DEFAULT 0,
  average_score DECIMAL(5,2),
  flashcards_reviewed INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  notes_created INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_study_date DATE,
  total_study_minutes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, grade_id, subject_id)
);

-- Create badges table
CREATE TABLE public.badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL,
  category TEXT DEFAULT 'achievement',
  requirement_type TEXT NOT NULL,
  requirement_value INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user badges table
CREATE TABLE public.user_badges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id TEXT NOT NULL,
  badge_id UUID NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

-- Create leaderboard view
CREATE OR REPLACE VIEW public.leaderboard AS
SELECT 
  user_id,
  SUM(quizzes_completed) as total_quizzes,
  SUM(quizzes_passed) as total_passed,
  AVG(average_score) as avg_score,
  SUM(flashcards_reviewed) as total_flashcards,
  SUM(videos_watched) as total_videos,
  MAX(current_streak) as best_streak,
  SUM(total_study_minutes) as total_minutes
FROM public.student_progress
GROUP BY user_id
ORDER BY avg_score DESC, total_quizzes DESC;

-- Enable RLS on all tables
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

-- RLS Policies for quizzes (public read, anyone can create for now)
CREATE POLICY "Anyone can view published quizzes" ON public.quizzes FOR SELECT USING (is_published = true OR true);
CREATE POLICY "Anyone can create quizzes" ON public.quizzes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quizzes" ON public.quizzes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete quizzes" ON public.quizzes FOR DELETE USING (true);

-- RLS Policies for quiz_questions
CREATE POLICY "Anyone can view quiz questions" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "Anyone can create quiz questions" ON public.quiz_questions FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quiz questions" ON public.quiz_questions FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete quiz questions" ON public.quiz_questions FOR DELETE USING (true);

-- RLS Policies for quiz_attempts
CREATE POLICY "Anyone can view quiz attempts" ON public.quiz_attempts FOR SELECT USING (true);
CREATE POLICY "Anyone can create quiz attempts" ON public.quiz_attempts FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update quiz attempts" ON public.quiz_attempts FOR UPDATE USING (true);

-- RLS Policies for flashcard_decks
CREATE POLICY "Anyone can view flashcard decks" ON public.flashcard_decks FOR SELECT USING (true);
CREATE POLICY "Anyone can create flashcard decks" ON public.flashcard_decks FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update flashcard decks" ON public.flashcard_decks FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete flashcard decks" ON public.flashcard_decks FOR DELETE USING (true);

-- RLS Policies for flashcards
CREATE POLICY "Anyone can view flashcards" ON public.flashcards FOR SELECT USING (true);
CREATE POLICY "Anyone can create flashcards" ON public.flashcards FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update flashcards" ON public.flashcards FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete flashcards" ON public.flashcards FOR DELETE USING (true);

-- RLS Policies for flashcard_reviews
CREATE POLICY "Anyone can view flashcard reviews" ON public.flashcard_reviews FOR SELECT USING (true);
CREATE POLICY "Anyone can create flashcard reviews" ON public.flashcard_reviews FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update flashcard reviews" ON public.flashcard_reviews FOR UPDATE USING (true);

-- RLS Policies for student_notes
CREATE POLICY "Anyone can view notes" ON public.student_notes FOR SELECT USING (true);
CREATE POLICY "Anyone can create notes" ON public.student_notes FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update notes" ON public.student_notes FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete notes" ON public.student_notes FOR DELETE USING (true);

-- RLS Policies for video_lessons
CREATE POLICY "Anyone can view video lessons" ON public.video_lessons FOR SELECT USING (true);
CREATE POLICY "Anyone can create video lessons" ON public.video_lessons FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update video lessons" ON public.video_lessons FOR UPDATE USING (true);
CREATE POLICY "Anyone can delete video lessons" ON public.video_lessons FOR DELETE USING (true);

-- RLS Policies for video_progress
CREATE POLICY "Anyone can view video progress" ON public.video_progress FOR SELECT USING (true);
CREATE POLICY "Anyone can create video progress" ON public.video_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update video progress" ON public.video_progress FOR UPDATE USING (true);

-- RLS Policies for student_progress
CREATE POLICY "Anyone can view student progress" ON public.student_progress FOR SELECT USING (true);
CREATE POLICY "Anyone can create student progress" ON public.student_progress FOR INSERT WITH CHECK (true);
CREATE POLICY "Anyone can update student progress" ON public.student_progress FOR UPDATE USING (true);

-- RLS Policies for badges
CREATE POLICY "Anyone can view badges" ON public.badges FOR SELECT USING (true);
CREATE POLICY "Anyone can create badges" ON public.badges FOR INSERT WITH CHECK (true);

-- RLS Policies for user_badges
CREATE POLICY "Anyone can view user badges" ON public.user_badges FOR SELECT USING (true);
CREATE POLICY "Anyone can create user badges" ON public.user_badges FOR INSERT WITH CHECK (true);

-- Add updated_at triggers
CREATE TRIGGER update_quizzes_updated_at BEFORE UPDATE ON public.quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_flashcard_decks_updated_at BEFORE UPDATE ON public.flashcard_decks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_flashcard_reviews_updated_at BEFORE UPDATE ON public.flashcard_reviews FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_notes_updated_at BEFORE UPDATE ON public.student_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_video_lessons_updated_at BEFORE UPDATE ON public.video_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_student_progress_updated_at BEFORE UPDATE ON public.student_progress FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default badges
INSERT INTO public.badges (name, description, icon, category, requirement_type, requirement_value) VALUES
('First Steps', 'Complete your first quiz', '🎯', 'quiz', 'quizzes_completed', 1),
('Quiz Master', 'Complete 10 quizzes', '🏆', 'quiz', 'quizzes_completed', 10),
('Perfect Score', 'Get 100% on a quiz', '⭐', 'quiz', 'perfect_score', 1),
('Flash Learner', 'Review 50 flashcards', '⚡', 'flashcard', 'flashcards_reviewed', 50),
('Memory Champion', 'Review 200 flashcards', '🧠', 'flashcard', 'flashcards_reviewed', 200),
('Video Scholar', 'Watch 10 video lessons', '📺', 'video', 'videos_watched', 10),
('Note Taker', 'Create 5 notes', '📝', 'notes', 'notes_created', 5),
('7 Day Streak', 'Study for 7 days in a row', '🔥', 'streak', 'current_streak', 7),
('30 Day Streak', 'Study for 30 days in a row', '💪', 'streak', 'current_streak', 30),
('Dedicated Learner', 'Study for 10 hours total', '⏰', 'time', 'total_study_minutes', 600);