-- Insert grades
INSERT INTO grades (grade_number, name) VALUES
  (9, 'Grade 9'),
  (10, 'Grade 10'),
  (11, 'Grade 11'),
  (12, 'Grade 12');

-- Insert subjects
INSERT INTO subjects (name, code) VALUES
  ('English', 'ENG'),
  ('Mathematics', 'MATH'),
  ('Chemistry', 'CHEM'),
  ('Biology', 'BIO'),
  ('Physics', 'PHY'),
  ('Geography', 'GEO'),
  ('History', 'HIST');

-- Insert sample badges
INSERT INTO badges (name, description, icon, criteria) VALUES
  ('First Steps', 'Complete your first learning session', '🎯', '{"interactions": 1}'),
  ('Curious Learner', 'Ask 10 questions', '🤔', '{"interactions": 10}'),
  ('Week Warrior', 'Maintain a 7-day streak', '🔥', '{"streak": 7}'),
  ('Subject Master', 'Complete 50 exercises in one subject', '🏆', '{"exercises": 50}'),
  ('Knowledge Seeker', 'Explore all subjects', '📚', '{"subjects": 7}'),
  ('Rising Star', 'Earn your first 5 badges', '⭐', '{"badges": 5}'),
  ('Dedicated Student', 'Complete 100 interactions', '💪', '{"interactions": 100}'),
  ('Chapter Champion', 'Complete all topics in a chapter', '📖', '{"chapter_complete": true}');
