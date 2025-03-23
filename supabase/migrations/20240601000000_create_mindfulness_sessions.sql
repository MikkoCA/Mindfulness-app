-- Create mindfulness_sessions table
CREATE TABLE IF NOT EXISTS mindfulness_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  duration_minutes INTEGER NOT NULL,
  session_type TEXT NOT NULL,
  notes TEXT,
  mood_before INTEGER,
  mood_after INTEGER,
  tags TEXT[]
);

-- Set up RLS (Row Level Security)
ALTER TABLE mindfulness_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to view only their own sessions
CREATE POLICY "Users can view their own sessions"
  ON mindfulness_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

-- Create policy to allow users to insert their own sessions
CREATE POLICY "Users can insert their own sessions"
  ON mindfulness_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create policy to allow users to update their own sessions
CREATE POLICY "Users can update their own sessions"
  ON mindfulness_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create policy to allow users to delete their own sessions
CREATE POLICY "Users can delete their own sessions"
  ON mindfulness_sessions
  FOR DELETE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX mindfulness_sessions_user_id_idx ON mindfulness_sessions (user_id);
CREATE INDEX mindfulness_sessions_created_at_idx ON mindfulness_sessions (created_at);

-- Create function to log session completion
CREATE OR REPLACE FUNCTION log_mindfulness_session(
  p_user_id UUID,
  p_duration_minutes INTEGER,
  p_session_type TEXT,
  p_notes TEXT DEFAULT NULL,
  p_mood_before INTEGER DEFAULT NULL,
  p_mood_after INTEGER DEFAULT NULL,
  p_tags TEXT[] DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_session_id UUID;
BEGIN
  INSERT INTO mindfulness_sessions (
    user_id,
    duration_minutes,
    session_type,
    notes,
    mood_before,
    mood_after,
    tags
  ) VALUES (
    p_user_id,
    p_duration_minutes,
    p_session_type,
    p_notes,
    p_mood_before,
    p_mood_after,
    p_tags
  )
  RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$; 