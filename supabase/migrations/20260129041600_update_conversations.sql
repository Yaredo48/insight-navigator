-- Add user context to conversations
ALTER TABLE public.conversations
  ADD COLUMN user_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  ADD COLUMN role user_role,
  ADD COLUMN grade_id INTEGER REFERENCES grades(id),
  ADD COLUMN subject_id INTEGER REFERENCES subjects(id);

-- Create indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_grade_subject ON conversations(grade_id, subject_id);
CREATE INDEX idx_conversations_role ON conversations(role);
