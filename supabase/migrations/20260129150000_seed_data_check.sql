-- Check if grades have data, if not seed it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.grades) THEN
        INSERT INTO public.grades (grade_number, name) VALUES
            (9, 'Grade 9'),
            (10, 'Grade 10'),
            (11, 'Grade 11'),
            (12, 'Grade 12');
        RAISE NOTICE 'Seeded grades table';
    ELSE
        RAISE NOTICE 'Grades table already has data';
    END IF;
END $$;

-- Check if subjects have data, if not seed it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.subjects) THEN
        INSERT INTO public.subjects (name, code) VALUES
            ('English', 'ENG'),
            ('Mathematics', 'MATH'),
            ('Chemistry', 'CHEM'),
            ('Biology', 'BIO'),
            ('Physics', 'PHY'),
            ('Geography', 'GEO'),
            ('History', 'HIST');
        RAISE NOTICE 'Seeded subjects table';
    ELSE
        RAISE NOTICE 'Subjects table already has data';
    END IF;
END $$;

-- Check if badges have data, if not seed it
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.badges) THEN
        INSERT INTO public.badges (name, description, icon, criteria) VALUES
            ('First Steps', 'Complete your first learning session', '🎯', '{"interactions": 1}'),
            ('Curious Learner', 'Ask 10 questions', '🤔', '{"interactions": 10}'),
            ('Week Warrior', 'Maintain a 7-day streak', '🔥', '{"streak": 7}'),
            ('Subject Master', 'Complete 50 exercises in one subject', '🏆', '{"exercises": 50}'),
            ('Knowledge Seeker', 'Explore all subjects', '📚', '{"subjects": 7}'),
            ('Rising Star', 'Earn your first 5 badges', '⭐', '{"badges": 5}'),
            ('Dedicated Student', 'Complete 100 interactions', '💪', '{"interactions": 100}'),
            ('Chapter Champion', 'Complete all topics in a chapter', '📖', '{"chapter_complete": true}');
        RAISE NOTICE 'Seeded badges table';
    ELSE
        RAISE NOTICE 'Badges table already has data';
    END IF;
END $$;
