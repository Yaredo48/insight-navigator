-- Create indexes for foreign keys to improve query performance

-- Classes
CREATE INDEX IF NOT EXISTS idx_classes_teacher_id ON public.classes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_grade_id ON public.classes(grade_id);
CREATE INDEX IF NOT EXISTS idx_classes_subject_id ON public.classes(subject_id);

-- Class Enrollments
CREATE INDEX IF NOT EXISTS idx_class_enrollments_student_id ON public.class_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_class_enrollments_class_id ON public.class_enrollments(class_id);

-- Assignments
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);

-- Assignment Submissions
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id ON public.assignment_submissions(student_id);

-- Announcements
CREATE INDEX IF NOT EXISTS idx_announcements_class_id ON public.announcements(class_id);
CREATE INDEX IF NOT EXISTS idx_announcements_target_grade_id ON public.announcements(target_grade_id);
CREATE INDEX IF NOT EXISTS idx_announcements_teacher_id ON public.announcements(teacher_id);

-- Lesson Plans
CREATE INDEX IF NOT EXISTS idx_lesson_plans_class_id ON public.lesson_plans(class_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_teacher_id ON public.lesson_plans(teacher_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_subject_id ON public.lesson_plans(subject_id);
CREATE INDEX IF NOT EXISTS idx_lesson_plans_grade_id ON public.lesson_plans(grade_id);

-- Lesson Resources
CREATE INDEX IF NOT EXISTS idx_lesson_resources_lesson_plan_id ON public.lesson_resources(lesson_plan_id);

-- Student Progress
CREATE INDEX IF NOT EXISTS idx_student_progress_user_id ON public.student_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_grade_id ON public.student_progress(grade_id);
CREATE INDEX IF NOT EXISTS idx_student_progress_subject_id ON public.student_progress(subject_id);

-- Quiz Attempts
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user_id ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz_id ON public.quiz_attempts(quiz_id);

-- Learning Sessions
CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_id ON public.learning_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_subject_id ON public.learning_sessions(subject_id);
