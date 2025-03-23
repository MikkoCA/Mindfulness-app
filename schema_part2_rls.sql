-- PART 2: ROW LEVEL SECURITY POLICIES
-- ===========================================
-- ENABLE RLS ON TABLES
-- ===========================================
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- ===========================================
-- MOOD ENTRIES RLS POLICIES
-- ===========================================
-- Users can only select, insert, update, and delete their own mood entries
CREATE POLICY mood_entries_select_policy ON mood_entries FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY mood_entries_insert_policy ON mood_entries FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY mood_entries_update_policy ON mood_entries FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY mood_entries_delete_policy ON mood_entries FOR DELETE 
  USING (auth.uid() = user_id);

-- ===========================================
-- ACTIVITY LOGS RLS POLICIES
-- ===========================================
-- Users can only select, insert, update, and delete their own activity logs
CREATE POLICY activity_logs_select_policy ON activity_logs FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY activity_logs_insert_policy ON activity_logs FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY activity_logs_update_policy ON activity_logs FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY activity_logs_delete_policy ON activity_logs FOR DELETE 
  USING (auth.uid() = user_id);

-- ===========================================
-- CHAT MESSAGES RLS POLICIES
-- ===========================================
-- Users can only select, insert, update, and delete their own chat messages
CREATE POLICY chat_messages_select_policy ON chat_messages FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY chat_messages_insert_policy ON chat_messages FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY chat_messages_update_policy ON chat_messages FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY chat_messages_delete_policy ON chat_messages FOR DELETE 
  USING (auth.uid() = user_id);

-- ===========================================
-- USER GOALS RLS POLICIES
-- ===========================================
-- Users can only select, insert, update, and delete their own goals
CREATE POLICY user_goals_select_policy ON user_goals FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY user_goals_insert_policy ON user_goals FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY user_goals_update_policy ON user_goals FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY user_goals_delete_policy ON user_goals FOR DELETE 
  USING (auth.uid() = user_id);

-- ===========================================
-- USER SETTINGS RLS POLICIES
-- ===========================================
-- Users can only select, insert, update, and delete their own settings
CREATE POLICY user_settings_select_policy ON user_settings FOR SELECT 
  USING (auth.uid() = user_id);
  
CREATE POLICY user_settings_insert_policy ON user_settings FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY user_settings_update_policy ON user_settings FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
  
CREATE POLICY user_settings_delete_policy ON user_settings FOR DELETE 
  USING (auth.uid() = user_id);

-- ===========================================
-- EXERCISES TABLE RLS POLICIES
-- ===========================================
-- Exercises are readable by all authenticated users but only updatable by admin
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;

CREATE POLICY exercises_select_policy ON exercises FOR SELECT 
  USING (true);  -- All users can view exercises

-- Admin-only policies would require custom implementation with a role column or separate admin table 