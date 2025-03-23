'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { generateMindfulnessExercise } from '@/lib/openrouter';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { motion } from 'framer-motion';

// Define the Exercise type
interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  difficulty: string;
  content?: string;
  rawContent?: string;
  createdAt: number;
}

// Exercise categories
const EXERCISE_TYPES = [
  { value: 'breathing', label: 'Breathing' },
  { value: 'meditation', label: 'Meditation' },
  { value: 'body-scan', label: 'Body Scan' },
  { value: 'mindful-walking', label: 'Mindful Walking' },
  { value: 'gratitude', label: 'Gratitude' },
];

export default function ExercisesPage() {
  const { user } = useAuth();
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detailedError, setDetailedError] = useState<string | null>(null);
  const [exerciseType, setExerciseType] = useState<string>(EXERCISE_TYPES[0].value);
  const [duration, setDuration] = useState<number>(5);

  // Load exercises from localStorage on component mount
  useEffect(() => {
    const savedExercises = localStorage.getItem('mindfulness_exercises');
    if (savedExercises) {
      try {
        setExercises(JSON.parse(savedExercises));
      } catch (error) {
        console.error('Error parsing saved exercises:', error);
      }
    }
  }, []);

  // Function to generate a new exercise
  const generateExercise = async () => {
    if (!user) {
      setError('You need to be logged in to generate exercises');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setDetailedError(null);
      
      // Call the API to generate the exercise
      const exerciseContent = await generateMindfulnessExercise(exerciseType, duration)
        .catch(err => {
          console.error('Exercise generation error:', err);
          setDetailedError(JSON.stringify({
            message: err.message,
            stack: err.stack
          }, null, 2));
          throw new Error(`Failed to generate exercise: ${err.message}`);
        });
      
      try {
        // Show raw content for debugging
        console.log('Raw exercise content:', exerciseContent);
        
        // Clean the response of any markdown formatting
        let cleanedContent = exerciseContent;
        
        // Remove markdown code block syntax
        cleanedContent = cleanedContent.replace(/```(?:json|javascript|js|plaintext)?\s*([\s\S]*?)\s*```/g, '$1');
        
        // Remove any backticks
        cleanedContent = cleanedContent.replace(/`/g, '');
        
        // Extract JSON object if embedded in text
        const jsonRegex = /{[\s\S]*}/;
        const jsonMatch = cleanedContent.match(jsonRegex);
        
        if (jsonMatch) {
          cleanedContent = jsonMatch[0];
        }
        
        // Trim any whitespace
        cleanedContent = cleanedContent.trim();
        
        console.log('Cleaned content:', cleanedContent);
        
        // Try to parse the JSON response
        let parsedExercise;
        try {
          parsedExercise = JSON.parse(cleanedContent);
        } catch (jsonError: unknown) {
          console.error('JSON parse error:', jsonError);
          
          // If we can't parse it as JSON, try to create a structured exercise from the text
          if (typeof cleanedContent === 'string' && cleanedContent.includes('minute') && cleanedContent.length > 100) {
            // Extract a title from the first line or use a default
            const lines = cleanedContent.split('\n').filter(line => line.trim().length > 0);
            const title = lines[0]?.trim() || `${duration}-Minute ${exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} Exercise`;
            
            // Use the second line as description or generate one
            const description = lines[1]?.trim() || `A ${duration}-minute guided ${exerciseType} exercise to help you relax and center yourself.`;
            
            // Extract steps from the remaining content
            const steps = lines.slice(2).map(line => line.trim()).filter(line => line.length > 0);
            
            parsedExercise = {
              title,
              description,
              duration,
              category: exerciseType,
              difficulty: 'beginner',
              steps: steps.length > 0 ? steps : [cleanedContent]
            };
          } else {
            setDetailedError(`Raw response: ${exerciseContent}\n\nCleaned: ${cleanedContent}\n\nError: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
            throw new Error(`Could not parse exercise as JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
          }
        }
        
        // Validate and fill in missing fields
        if (!parsedExercise.title) {
          parsedExercise.title = `${duration}-Minute ${exerciseType.charAt(0).toUpperCase() + exerciseType.slice(1)} Exercise`;
        }
        
        if (!parsedExercise.description) {
          parsedExercise.description = `A ${duration}-minute guided ${exerciseType} exercise to help you relax and center yourself.`;
        }
        
        if (!parsedExercise.difficulty) {
          parsedExercise.difficulty = 'beginner';
        }
        
        if (!parsedExercise.category) {
          parsedExercise.category = exerciseType;
        }
        
        if (!parsedExercise.duration) {
          parsedExercise.duration = duration;
        }
        
        // Ensure we have steps
        if (!parsedExercise.steps && !parsedExercise.instructions) {
          // If we have content but no steps, try to split it into steps
          if (typeof cleanedContent === 'string' && cleanedContent.length > 0) {
            parsedExercise.steps = cleanedContent.split('\n')
              .filter(line => line.trim().length > 0)
              .map(line => line.trim());
          } else {
            parsedExercise.steps = [`Follow along with this ${duration}-minute ${exerciseType} exercise.`];
          }
        }
        
        // Add the metadata we need
        const newExercise: Exercise = {
          ...parsedExercise,
          id: Date.now().toString(),
          rawContent: cleanedContent,
          content: JSON.stringify({
            steps: parsedExercise.steps || 
                  (parsedExercise.instructions ? 
                    (Array.isArray(parsedExercise.instructions) ? 
                      parsedExercise.instructions : 
                      parsedExercise.instructions.split('\n').filter((s: string) => s.trim() !== '')
                    ) : 
                    []
                  )
          }),
          createdAt: Date.now()
        };
        
        // Add to exercises array
        const updatedExercises = [newExercise, ...exercises];
        setExercises(updatedExercises);
        
        // Save to localStorage
        localStorage.setItem('mindfulness_exercises', JSON.stringify(updatedExercises));
      } catch (error) {
        console.error('Error processing exercise:', error);
        setError(error instanceof Error ? error.message : 'Failed to process exercise response');
      }
    } catch (error) {
      console.error('Error in exercise generation flow:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate exercise');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[rgb(203,251,241)] via-white to-[rgb(203,251,241)]">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
              Mindfulness Exercises
            </h1>
            <Link
              href="/dashboard"
              className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium"
            >
              <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Dashboard
            </Link>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid gap-8 grid-cols-1 lg:grid-cols-3"
          >
            {/* Exercise Generator Card */}
            <div className="lg:col-span-1">
              <Card className="bg-white/90 backdrop-blur-xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)]">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                    Create New Exercise
                  </CardTitle>
                  <CardDescription className="text-gray-600">
                    Customize and generate a new mindfulness exercise
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {error && (
                    <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl">
                      <p className="font-medium text-sm">{error}</p>
                      {detailedError && (
                        <details className="mt-2">
                          <summary className="cursor-pointer text-xs font-medium text-rose-600">Show technical details</summary>
                          <pre className="mt-2 p-3 bg-rose-100/50 rounded-lg text-xs overflow-auto max-h-60">
                            {detailedError}
                          </pre>
                        </details>
                      )}
                    </div>
                  )}
                  <div className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Exercise Type</label>
                      <select 
                        value={exerciseType} 
                        onChange={(e) => setExerciseType(e.target.value)}
                        className="w-full py-2.5 px-3 rounded-xl border border-[rgb(203,251,241)] bg-white/90 shadow-lg shadow-teal-500/5 focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all hover:shadow-xl hover:shadow-teal-500/10"
                      >
                        {EXERCISE_TYPES.map((type) => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Duration: {duration} minutes
                      </label>
                      <div className="relative">
                        <input
                          type="range"
                          min="1"
                          max="30"
                          value={duration}
                          onChange={(e) => setDuration(parseInt(e.target.value))}
                          className="w-full h-2 bg-[rgb(203,251,241)] rounded-lg appearance-none cursor-pointer accent-teal-600"
                        />
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>1 min</span>
                          <span>15 min</span>
                          <span>30 min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button
                    onClick={generateExercise}
                    disabled={isLoading}
                    className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white font-semibold py-2.5 rounded-xl transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-xl shadow-teal-500/20 hover:shadow-2xl hover:shadow-teal-500/30"
                  >
                    {isLoading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent mr-3"></div>
                        Generating...
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-2">
                        <span className="text-lg">✨</span>
                        <span>Generate Exercise</span>
                      </div>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </div>

            {/* Exercise List */}
            <div className="lg:col-span-2">
              <div className="space-y-6">
                {exercises.length > 0 ? (
                  exercises.map((exercise) => (
                    <motion.div
                      key={exercise.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] overflow-hidden transform transition-all"
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="text-xl font-semibold text-gray-800 mb-2">
                              {exercise.title}
                            </h3>
                            <p className="text-gray-600 mb-4">
                              {exercise.description}
                            </p>
                            <div className="flex flex-wrap gap-2 mb-4">
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-[rgb(203,251,241)] text-teal-700">
                                {exercise.duration} minutes
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-[rgb(203,251,241)] text-teal-700">
                                {EXERCISE_TYPES.find(t => t.value === exercise.category)?.label || exercise.category}
                              </span>
                              <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-[rgb(203,251,241)] text-teal-700 capitalize">
                                {exercise.difficulty}
                              </span>
                            </div>
                          </div>
                          <Link
                            href={`/exercises/${exercise.id}`}
                            className="inline-flex items-center justify-center px-4 py-2 rounded-xl font-medium bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Start Exercise
                          </Link>
                        </div>
                        <div className="text-sm text-gray-500">
                          Created {new Date(exercise.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="text-center py-16 border-2 border-dashed border-[rgb(203,251,241)] rounded-2xl bg-white/50 backdrop-blur-sm"
                  >
                    <motion.div 
                      className="text-6xl mb-4"
                      animate={{ 
                        y: [0, -10, 0],
                        scale: [1, 1.1, 1]
                      }}
                      transition={{ 
                        duration: 2,
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                    >
                      🧘‍♂️
                    </motion.div>
                    <p className="text-gray-600 mb-6 text-lg">No exercises yet</p>
                    <p className="text-gray-500 mb-8">Generate your first mindfulness exercise to get started</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
} 