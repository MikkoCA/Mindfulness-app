-- PART 4: SAMPLE DATA AND IMPLEMENTATION INSTRUCTIONS
-- ===========================================
-- SAMPLE MINDFULNESS EXERCISES
-- ===========================================
INSERT INTO exercises (title, description, duration_minutes, difficulty_level, category, instructions, benefits)
VALUES
  ('Mindful Breathing', 'A simple exercise focusing on your breath to anchor you to the present moment.', 5, 'beginner', 'breathing', 
   'Find a comfortable seated position. Close your eyes or maintain a soft gaze. Focus your attention on your breath, noticing the sensation of air entering and leaving your body. When your mind wanders, gently bring your focus back to your breath.', 
   'Reduces stress, improves focus, and helps calm the mind.'),
   
  ('Body Scan Meditation', 'A practice that involves progressively focusing on different parts of your body to increase body awareness.', 15, 'intermediate', 'body-scan', 
   'Lie down comfortably on your back. Close your eyes and focus on your breath for a few moments. Begin to shift your attention to your toes, gradually moving up through each part of your body, noticing any sensations without judgment.', 
   'Promotes relaxation, reduces physical tension, and improves sleep quality.'),
   
  ('Walking Meditation', 'A form of meditation practiced while walking slowly and mindfully.', 10, 'beginner', 'walking', 
   'Find a quiet place where you can walk undisturbed. Begin walking slowly, focusing on each step. Notice the lifting, moving, and placing of each foot. Feel the sensations in your feet and legs. When your mind wanders, bring it back to the physical sensations of walking.', 
   'Increases physical activity, improves balance, and builds awareness.'),
   
  ('Loving-Kindness Meditation', 'A practice designed to enhance feelings of compassion and love for yourself and others.', 20, 'intermediate', 'meditation', 
   'Sit comfortably with eyes closed. Begin by directing positive wishes toward yourself: "May I be happy, may I be healthy, may I be safe." Then extend these wishes to loved ones, neutral people, difficult people, and eventually to all beings.', 
   'Increases positive emotions, empathy, and compassion, while reducing negative feelings.'),
   
  ('5-Minute Mindful Check-in', 'A brief practice to reconnect with the present moment and assess your current state.', 5, 'beginner', 'meditation', 
   'Find a comfortable position and take a few deep breaths. Notice your physical sensations, emotions, and thoughts without judgment. Ask yourself: "What am I feeling right now? What do I need in this moment?"', 
   'Helps manage emotions, increases self-awareness, and promotes mindful decision-making.');

-- ===========================================
-- IMPLEMENTATION INSTRUCTIONS
-- ===========================================
/*
IMPLEMENTATION STEPS:

1. Run these scripts in the Supabase SQL Editor in the following order:
   a. schema_part1_tables_fixed.sql - Creates the main tables
   b. schema_part2_rls.sql - Enables and sets up Row Level Security
   c. schema_part3_triggers.sql - Creates functions and triggers
   d. schema_part4_seed_data.sql - Adds sample data (optional)

2. Verify your implementation:
   - Check that all tables are created correctly
   - Test RLS policies by trying to access data from different user contexts
   - Verify triggers are working by inserting/updating records
   - Ensure functions return expected results

3. Integration with your application:
   - Update your client code to use the new Supabase tables and functions
   - For best security, use Supabase client libraries to handle auth and data access
   - Implement client-side validation that matches your server-side constraints

4. Front-end features to implement:
   - User profile settings page to update user_settings
   - Mood tracking interface that calls the record_mood function
   - Exercise library that displays exercises from the exercises table
   - Activity history page showing past exercises and mood entries
   - Chat interface to interact with your mindfulness chatbot

TROUBLESHOOTING:
- If you encounter permission issues, ensure RLS policies are configured correctly
- For trigger errors, check that the referenced tables exist and have the expected structure
- When testing functions, ensure you're passing the correct parameters

MAINTENANCE:
- Regularly backup your database using Supabase's backup features
- Consider implementing additional indexes if query performance becomes an issue
- Add new exercise content periodically to keep users engaged
*/ 