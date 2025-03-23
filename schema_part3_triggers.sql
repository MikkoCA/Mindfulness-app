-- PART 3: TRIGGERS AND FUNCTIONS
-- ===========================================
-- UPDATED_AT TRIGGER FUNCTION
-- ===========================================
-- Function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = CURRENT_TIMESTAMP;
   RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ===========================================
-- AUTO-CREATE USER SETTINGS TRIGGER FUNCTION
-- ===========================================
-- Function to automatically create user settings when a new user is created
CREATE OR REPLACE FUNCTION create_user_settings_for_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_settings(user_id)
  VALUES(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE 'plpgsql';

-- ===========================================
-- LOG ACTIVITY FUNCTION
-- ===========================================
-- Function to log user activity
CREATE OR REPLACE FUNCTION log_user_activity(
  user_uuid UUID,
  activity_type_val VARCHAR,
  exercise_uuid UUID DEFAULT NULL,
  duration_min INTEGER DEFAULT NULL,
  notes_val TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO activity_logs(
    user_id, 
    exercise_id, 
    activity_type, 
    duration_minutes, 
    notes
  )
  VALUES(
    user_uuid, 
    exercise_uuid, 
    activity_type_val, 
    duration_min, 
    notes_val
  )
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$ LANGUAGE 'plpgsql';

-- ===========================================
-- APPLY TRIGGERS
-- ===========================================
-- Add updated_at trigger to tables
CREATE TRIGGER update_exercises_updated_at
BEFORE UPDATE ON exercises
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_goals_updated_at
BEFORE UPDATE ON user_goals
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_settings_updated_at
BEFORE UPDATE ON user_settings
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Auto-create user settings for new users
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION create_user_settings_for_new_user();

-- ===========================================
-- MOOD TRACKING FUNCTIONS
-- ===========================================
-- Function to add a new mood entry and log the activity
CREATE OR REPLACE FUNCTION record_mood(
  user_uuid UUID,
  mood_score_val INTEGER, 
  mood_label_val VARCHAR,
  notes_val TEXT DEFAULT NULL,
  factors_val TEXT[] DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  mood_id UUID;
BEGIN
  -- Insert the mood entry
  INSERT INTO mood_entries(
    user_id, 
    mood_score, 
    mood_label, 
    notes, 
    factors
  )
  VALUES(
    user_uuid, 
    mood_score_val, 
    mood_label_val, 
    notes_val, 
    factors_val
  )
  RETURNING id INTO mood_id;
  
  -- Log the activity
  PERFORM log_user_activity(
    user_uuid, 
    'mood_tracked',
    NULL,
    NULL,
    'Mood score: ' || mood_score_val::TEXT || ', Label: ' || mood_label_val
  );
  
  RETURN mood_id;
END;
$$ LANGUAGE 'plpgsql';

-- ===========================================
-- EXERCISE COMPLETION FUNCTION
-- ===========================================
-- Function to record exercise completion and log the activity
CREATE OR REPLACE FUNCTION complete_exercise(
  user_uuid UUID,
  exercise_uuid UUID,
  duration_min INTEGER,
  notes_val TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
BEGIN
  -- Log the activity
  activity_id := log_user_activity(
    user_uuid, 
    'exercise_completed',
    exercise_uuid,
    duration_min,
    notes_val
  );
  
  RETURN activity_id;
END;
$$ LANGUAGE 'plpgsql'; 