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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Mindfulness Exercises</h1>
      
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Generate a New Exercise</CardTitle>
          <CardDescription>Customize and create a new mindfulness exercise</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-red-50 text-red-700 rounded-md">
              <p className="font-medium">Error: {error}</p>
              {detailedError && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm">Show technical details</summary>
                  <pre className="mt-2 p-2 bg-gray-100 rounded-md text-xs overflow-auto max-h-60">
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
        <CardFooter>
          <Button 
            onClick={generateExercise} 
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Generating...' : 'Generate Exercise'}
          </Button>
        </CardFooter>
      </Card>
      
      <h2 className="text-2xl font-semibold mb-4">Your Exercises</h2>
      {exercises.length === 0 ? (
        <div className="text-center py-10 border border-dashed rounded-lg">
          <p className="text-gray-500">No exercises yet. Generate your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exercises.map((exercise) => {
            // Check if exercise is completed
            const completedExercises = JSON.parse(localStorage.getItem('completed_exercises') || '[]');
            const isCompleted = completedExercises.includes(exercise.id);

            return (
              <Link href={`/exercises/${exercise.id}`} key={exercise.id}>
                <Card className="h-full cursor-pointer hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <CardTitle className="line-clamp-2">{exercise.title}</CardTitle>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                        {exercise.category}
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                        {exercise.duration} min
                      </span>
                      <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full capitalize">
                        {exercise.difficulty}
                      </span>
                      {isCompleted && (
                        <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                          Completed
                        </span>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600 line-clamp-3">{exercise.description}</p>
                  </CardContent>
                  <CardFooter className="border-t pt-4">
                    <Button variant="outline" className="w-full">View Details</Button>
                  </CardFooter>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
} 