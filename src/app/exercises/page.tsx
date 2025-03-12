'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { generateMindfulnessExercise } from '@/lib/openrouter';
import Link from 'next/link';

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
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(false);
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
    try {
      setLoading(true);
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
        
        // Clean the response of any markdown formatting - fallback cleaning if library cleaning fails
        let cleanedContent = exerciseContent;
        
        try {
          // First try to parse directly - maybe it's already valid JSON
          JSON.parse(cleanedContent);
          console.log('Content is valid JSON without cleaning');
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch {
          console.log('Initial parse failed, applying cleaning');
          
          // Remove markdown code block syntax
          cleanedContent = cleanedContent.replace(/```(?:json|javascript|js|plaintext)?\s*([\s\S]*?)\s*```/g, '$1');
          
          // Remove any backticks
          cleanedContent = cleanedContent.replace(/`/g, '');
          
          // Extract JSON object if embedded in text
          const firstBrace = cleanedContent.indexOf('{');
          const lastBrace = cleanedContent.lastIndexOf('}');
          
          if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
            cleanedContent = cleanedContent.substring(firstBrace, lastBrace + 1);
          }
          
          // Trim any whitespace
          cleanedContent = cleanedContent.trim();
          
          console.log('Cleaned content:', cleanedContent);
        }
        
        // Try to parse the JSON response
        let parsedExercise;
        try {
          parsedExercise = JSON.parse(cleanedContent);
        } catch (jsonError: unknown) {
          console.error('JSON parse error:', jsonError);
          setDetailedError(`Raw response: ${exerciseContent}\n\nCleaned: ${cleanedContent}\n\nError: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
          throw new Error(`Could not parse exercise as JSON: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`);
        }
        
        // Validate the required fields
        if (!parsedExercise.title || !parsedExercise.description || !parsedExercise.difficulty) {
          const missingFields = [];
          if (!parsedExercise.title) missingFields.push('title');
          if (!parsedExercise.description) missingFields.push('description');
          if (!parsedExercise.difficulty) missingFields.push('difficulty');
          
          setDetailedError(`Parsed JSON is missing required fields: ${missingFields.join(', ')}\n\nParsed content: ${JSON.stringify(parsedExercise, null, 2)}`);
          throw new Error(`Generated exercise is missing required fields: ${missingFields.join(', ')}`);
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
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 max-w-4xl">
      <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">Mindfulness Exercises</h1>
      
      <Card className="mb-6 sm:mb-8">
        <CardHeader>
          <CardTitle>Generate a New Exercise</CardTitle>
          <CardDescription>Customize and create a new mindfulness exercise</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 sm:p-4 bg-red-50 text-red-700 rounded-md">
              <p className="font-medium text-sm sm:text-base">Error: {error}</p>
              {detailedError && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs sm:text-sm">Show technical details</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded-md text-xs overflow-auto max-h-40 sm:max-h-60">
                    {detailedError}
                  </pre>
                </details>
              )}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Exercise Type</label>
              <select 
                value={exerciseType} 
                onChange={(e) => setExerciseType(e.target.value)}
                className="w-full py-2 px-3 border border-gray-300 rounded-md bg-white"
              >
                {EXERCISE_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Duration: {duration} minutes
              </label>
              <input
                type="range"
                min={3}
                max={30}
                step={1}
                value={duration}
                onChange={(e) => setDuration(parseInt(e.target.value))}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row sm:justify-between gap-3">
          <Button 
            onClick={generateExercise}
            disabled={loading}
            className="w-full sm:w-auto flex items-center justify-center"
          >
            {loading ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Generating...
              </>
            ) : (
              <>Generate Exercise</>
            )}
          </Button>
          
          <div className="text-sm text-gray-500 w-full sm:w-auto text-center sm:text-right">
            Exercises are saved locally on your device
          </div>
        </CardFooter>
      </Card>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Your Exercises</h2>
        
        {exercises.length === 0 ? (
          <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-gray-600">You haven't created any exercises yet.</p>
            <p className="text-gray-500 text-sm mt-2">Generate one above to get started!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((exercise) => (
              <Card key={exercise.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{exercise.title}</CardTitle>
                      <CardDescription className="mt-1">
                        {exercise.duration} min · {exercise.difficulty} · {
                          EXERCISE_TYPES.find(t => t.value === exercise.category)?.label || exercise.category
                        }
                      </CardDescription>
                    </div>
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-teal-100 text-teal-800">
                      {new Date(exercise.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </CardHeader>
                <CardContent className="pb-2 text-sm">
                  <p className="line-clamp-2">{exercise.description}</p>
                </CardContent>
                <CardFooter className="pt-2">
                  <Link href={`/exercises/${exercise.id}`} className="w-full">
                    <Button variant="outline" className="w-full">Start Exercise</Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
} 