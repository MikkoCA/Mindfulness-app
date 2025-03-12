'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

// Define the Exercise type with expanded content structure
interface Exercise {
  id: string;
  title: string;
  description: string;
  duration: number;
  category: string;
  difficulty: string;
  content?: string;
  rawContent?: string;
  steps?: string[];
  benefits?: string[];
  preparation?: string;
  tips?: string[];
  stepTimings?: number[];
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

// Define step timing for different exercise types
const DEFAULT_STEP_TIMING: Record<string, number[]> = {
  'breathing': [30, 60, 90, 120, 150],
  'meditation': [60, 120, 180, 240, 300],
  'body-scan': [45, 90, 135, 180, 225],
  'mindful-walking': [60, 120, 180, 240, 300],
  'gratitude': [40, 80, 120, 160, 200]
};

export default function ExercisePage() {
  const { id } = useParams();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Timer state
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [time, setTime] = useState(0);
  const [totalTime, setTotalTime] = useState(0);
  const [completed, setCompleted] = useState(false);
  
  // Step guidance state
  const [currentStep, setCurrentStep] = useState(0);
  const [processedSteps, setProcessedSteps] = useState<string[]>([]);
  const [stepTimings, setStepTimings] = useState<number[]>([]);
  const [progress, setProgress] = useState(0);
  const [breathePhase, setBreathePhase] = useState<'inhale' | 'hold' | 'exhale' | 'rest'>('rest');
  const [breatheCount, setBreatheCount] = useState(0);
  
  // Timer interval ref
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const breatheIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Audio refs
  const bellSound = useRef<HTMLAudioElement | null>(null);
  const tickSound = useRef<HTMLAudioElement | null>(null);

  // Process and enhance exercise content
  const processExerciseContent = useCallback((exercise: Exercise) => {
    let steps: string[] = [];
    let benefits: string[] = [];
    let preparation: string = '';
    let tips: string[] = [];

    try {
      console.log('Processing exercise:', exercise);
      
      // First check if we already have parsed steps
      if (exercise.steps && Array.isArray(exercise.steps) && exercise.steps.length > 0) {
        console.log('Using existing steps from exercise');
        steps = exercise.steps;
      } 
      // Then try to parse from content (newer format - already JSON stringified)
      else if (exercise.content) {
        console.log('Trying to parse content field');
        
        try {
          const parsedContent = JSON.parse(exercise.content);
          
          if (parsedContent.steps && Array.isArray(parsedContent.steps)) {
            console.log('Found steps in parsed content');
            steps = parsedContent.steps;
          }
          
          if (parsedContent.benefits && Array.isArray(parsedContent.benefits)) {
            benefits = parsedContent.benefits;
          }
          
          if (parsedContent.preparation) {
            preparation = parsedContent.preparation;
          }
          
          if (parsedContent.tips && Array.isArray(parsedContent.tips)) {
            tips = parsedContent.tips;
          }
        } catch (parseError) {
          console.error('Error parsing content as JSON:', parseError);
          
          // Treat as plain text if it's not JSON
          if (typeof exercise.content === 'string') {
            steps = exercise.content.split('\n').filter(line => line.trim() !== '');
          }
        }
      } 
      // Finally try the rawContent (stored original JSON)
      else if (exercise.rawContent) {
        console.log('Trying to parse rawContent field');
        
        try {
          const parsedRaw = JSON.parse(exercise.rawContent);
          
          if (parsedRaw.steps && Array.isArray(parsedRaw.steps)) {
            steps = parsedRaw.steps;
          } else if (parsedRaw.instructions) {
            steps = Array.isArray(parsedRaw.instructions) 
              ? parsedRaw.instructions 
              : parsedRaw.instructions.split('\n').filter((s: string) => s.trim() !== '');
          }
        } catch (error) {
          console.error('Error parsing rawContent:', error);
          steps = (exercise.rawContent as string).split('\n').filter(line => line.trim() !== '');
        }
      }
      // If we still have no steps, use default ones based on category
      if (steps.length === 0) {
        console.log('No steps found, using defaults for category:', exercise.category);
        steps = getDefaultSteps(exercise.category);
      }
    } catch (error) {
      console.error('Error processing exercise:', error);
      steps = getDefaultSteps(exercise.category);
    }

    // Generate benefits if none provided
    if (benefits.length === 0) {
      benefits = getDefaultBenefits(exercise.category);
    }

    // Generate preparation instructions if none provided
    if (!preparation) {
      preparation = "Find a quiet space where you won't be disturbed. Wear comfortable clothing and consider removing any distractions such as your phone. If seated, maintain a straight back to promote alertness while remaining comfortable.";
    }

    // Generate tips if none provided
    if (tips.length === 0) {
      tips = getDefaultTips();
    }

    // Calculate step timings
    let timings: number[];
    if (steps.length <= 5) {
      // Use default timings for common exercise types
      timings = DEFAULT_STEP_TIMING[exercise.category] || 
        Array(steps.length).fill(Math.floor((exercise.duration * 60) / steps.length));
    } else {
      // Distribute time evenly across steps
      const stepTime = Math.floor((exercise.duration * 60) / steps.length);
      timings = Array(steps.length).fill(stepTime);
    }

    return {
      ...exercise,
      steps,
      benefits,
      preparation,
      tips,
      stepTimings: timings
    };
  }, []);
  
  // Helper function to get default steps based on category
  const getDefaultSteps = (category: string): string[] => {
    if (category === 'breathing') {
      return [
        "Find a comfortable seated position with your back straight.",
        "Close your eyes and take a deep breath in through your nose for 4 counts.",
        "Hold your breath for 4 counts.",
        "Exhale slowly through your mouth for 6 counts.",
        "Rest for 2 counts before beginning the next cycle.",
        "Repeat this breathing pattern for the duration of the exercise."
      ];
    } else if (category === 'meditation') {
      return [
        "Find a quiet space where you won't be disturbed.",
        "Sit comfortably with your back straight, either on a chair or cushion.",
        "Close your eyes and bring your attention to your breath.",
        "Notice the sensation of the breath entering and leaving your body.",
        "When your mind wanders, gently bring your attention back to your breath.",
        "Continue this practice, maintaining awareness of the present moment."
      ];
    } else {
      return [
        "Find a comfortable position to begin the exercise.",
        "Follow along with the timer, moving through each phase mindfully.",
        "Focus on your breath and bodily sensations throughout the practice.",
        "If your mind wanders, gently bring your attention back to the exercise.",
        "Complete the full duration for maximum benefit."
      ];
    }
  };
  
  // Helper function to get default benefits
  const getDefaultBenefits = (category: string): string[] => {
    if (category === 'breathing') {
      return [
        "Reduces stress and anxiety",
        "Improves focus and concentration",
        "Activates the parasympathetic nervous system",
        "Helps regulate emotions",
        "Improves oxygen flow throughout the body"
      ];
    } else if (category === 'meditation') {
      return [
        "Reduces stress and promotes emotional health",
        "Enhances self-awareness and mindfulness",
        "Lengthens attention span",
        "May reduce age-related memory loss",
        "Can generate kindness and compassion"
      ];
    } else {
      return [
        "Promotes mindfulness and present-moment awareness",
        "Reduces stress and anxiety",
        "Improves mental clarity and focus",
        "Enhances overall well-being",
        "Helps build a consistent mindfulness practice"
      ];
    }
  };
  
  // Helper function to get default tips
  const getDefaultTips = (): string[] => {
    return [
      "Consistency is key - try to practice at the same time each day",
      "Start with shorter sessions and gradually increase duration",
      "Be patient with yourself - mindfulness is a skill that develops with practice",
      "There's no 'perfect way' to practice - find what works best for you",
      "If you miss a day, simply begin again without judgment"
    ];
  };

  // Load exercise data
  useEffect(() => {
    async function fetchExercise() {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Attempting to load exercise with ID:', id);
        
        if (!id) {
          setError('Invalid exercise ID');
          setLoading(false);
          return;
        }
        
        const savedExercises = localStorage.getItem('mindfulness_exercises');
        if (!savedExercises) {
          console.error('No exercises found in localStorage');
          setError('No exercises found. Please create some exercises first.');
          setLoading(false);
          return;
        }
        
        let exercises;
        try {
          exercises = JSON.parse(savedExercises);
        } catch (parseError) {
          console.error('Error parsing saved exercises:', parseError);
          setError('Error loading exercises. The data might be corrupted.');
          setLoading(false);
          return;
        }
        
        const foundExercise = exercises.find((ex: Exercise) => ex.id === id);
        
        if (!foundExercise) {
          console.error('Exercise not found with ID:', id);
          setError('Exercise not found. It may have been removed or expired.');
          setLoading(false);
          return;
        }
        
        console.log('Found exercise:', foundExercise);
        
        // Process and enhance the exercise content
        try {
          const enhancedExercise = processExerciseContent(foundExercise);
          setExercise(enhancedExercise);
          setProcessedSteps(enhancedExercise.steps || []);
          setStepTimings(enhancedExercise.stepTimings || []);
          
          // Set initial timer value based on exercise duration
          const totalSeconds = enhancedExercise.duration * 60;
          setTime(totalSeconds);
          setTotalTime(totalSeconds);
        } catch (processError) {
          console.error('Error processing exercise content:', processError);
          setError('Error preparing exercise content. Please try a different exercise.');
        }
      } catch (error) {
        console.error('Error fetching exercise:', error);
        setError('Failed to load exercise. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchExercise();
    
    // Initialize audio elements
    if (typeof window !== 'undefined') {
      bellSound.current = new Audio('/sounds/bell.mp3');
      tickSound.current = new Audio('/sounds/tick.mp3');
    }
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (breatheIntervalRef.current) {
        clearInterval(breatheIntervalRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, processExerciseContent]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleComplete = useCallback(() => {
    setIsActive(false);
    setIsPaused(false);
    setCompleted(true);
    
    // Play completion sound
    if (bellSound.current) {
      bellSound.current.play().catch(e => console.error('Error playing sound:', e));
      setTimeout(() => {
        if (bellSound.current) {
          bellSound.current.play().catch(e => console.error('Error playing sound:', e));
        }
      }, 1500);
    }
    
    // Save completed exercise to localStorage
    const completedExercises = JSON.parse(localStorage.getItem('completed_exercises') || '[]');
    if (!completedExercises.includes(id)) {
      completedExercises.push(id);
      localStorage.setItem('completed_exercises', JSON.stringify(completedExercises));
    }
  }, [id]);

  // Timer functionality
  useEffect(() => {
    if (isActive && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTime((prevTime) => {
          const newTime = prevTime - 1;
          
          // Calculate progress percentage
          const elapsed = totalTime - newTime;
          const progressPercent = Math.min(100, Math.floor((elapsed / totalTime) * 100));
          setProgress(progressPercent);
          
          // Determine current step based on elapsed time
          let timeSum = 0;
          let newStep = 0;
          
          for (let i = 0; i < stepTimings.length; i++) {
            timeSum += stepTimings[i];
            if (elapsed <= timeSum) {
              newStep = i;
              break;
            }
            
            if (i === stepTimings.length - 1) {
              newStep = i;
            }
          }
          
          // Play sound when moving to next step
          if (newStep !== currentStep) {
            setCurrentStep(newStep);
            if (bellSound.current) {
              bellSound.current.play().catch(e => console.error('Error playing sound:', e));
            }
          }
          
          // Handle completion
          if (newTime <= 0) {
            handleComplete();
            return 0;
          }
          
          return newTime;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isActive, isPaused, stepTimings, currentStep, totalTime, handleComplete]);

  // Fix for the breathing cycle implementation
  useEffect(() => {
    // Only set up breathing cycle for breathing exercises when active
    if (isActive && !isPaused && exercise?.category === 'breathing') {
      // Use a fixed interval with state management for phase timing
      const INTERVAL_MS = 100; // 100ms interval for smooth animation
      
      // Duration in ms for each phase
      const INHALE_DURATION = 4000;  // 4 seconds
      const HOLD_DURATION = 7000;    // 7 seconds  
      const EXHALE_DURATION = 8000;  // 8 seconds
      const REST_DURATION = 2000;    // 2 seconds
      
      let elapsedMs = 0;
      let currentPhase: 'inhale' | 'hold' | 'exhale' | 'rest' = 'inhale';
      let currentPhaseDuration = INHALE_DURATION;
      
      setBreathePhase('inhale'); // Start with inhale
      
      breatheIntervalRef.current = setInterval(() => {
        elapsedMs += INTERVAL_MS;
        
        // Check if it's time to move to the next phase
        if (elapsedMs >= currentPhaseDuration) {
          // Reset counter
          elapsedMs = 0;
          
          // Move to next phase
          switch(currentPhase) {
            case 'inhale':
              currentPhase = 'hold';
              currentPhaseDuration = HOLD_DURATION;
              setBreathePhase('hold');
              break;
            case 'hold':
              currentPhase = 'exhale';
              currentPhaseDuration = EXHALE_DURATION;
              setBreathePhase('exhale');
              break; 
            case 'exhale':
              currentPhase = 'rest';
              currentPhaseDuration = REST_DURATION;
              setBreathePhase('rest');
              break;
            case 'rest':
              currentPhase = 'inhale';
              currentPhaseDuration = INHALE_DURATION;
              setBreathePhase('inhale');
              setBreatheCount(count => count + 1); // Increment breath count
              break;
          }
        }
      }, INTERVAL_MS);
      
      return () => {
        if (breatheIntervalRef.current) {
          clearInterval(breatheIntervalRef.current);
        }
      };
    }
  }, [isActive, isPaused, exercise?.category]);

  const handleStart = () => {
    setIsActive(true);
    setIsPaused(false);
    if (bellSound.current) {
      bellSound.current.play().catch(e => console.error('Error playing sound:', e));
    }
  };

  const handlePause = () => {
    setIsPaused(true);
  };

  const handleResume = () => {
    setIsPaused(false);
  };

  const handleReset = () => {
    setIsActive(false);
    setIsPaused(false);
    setTime(totalTime);
    setCurrentStep(0);
    setProgress(0);
    setCompleted(false);
    setBreathePhase('rest');
    setBreatheCount(0);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 mb-20">
        <div className="flex justify-center items-center min-h-[50vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-teal-500"></div>
        </div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="container mx-auto px-4 py-6 sm:py-8 mb-20">
        <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md">
          <p className="text-red-700">{error || 'Exercise not found'}</p>
          <Link href="/exercises" className="text-blue-600 hover:underline mt-2 inline-block">
            ← Back to exercises
          </Link>
        </div>
      </div>
    );
  }

  // Check if this exercise has been completed before
  const checkIfCompleted = () => {
    const completedExercises = JSON.parse(localStorage.getItem('completed_exercises') || '[]');
    return completedExercises.includes(id);
  };

  const wasCompletedBefore = checkIfCompleted();

  return (
    <div className="container mx-auto px-4 py-6 sm:py-8 mb-20">
      <div className="space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link href="/exercises" className="text-blue-600 hover:underline inline-flex items-center text-sm">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to exercises
            </Link>
            <h1 className="text-2xl sm:text-3xl font-bold mt-2">{exercise.title}</h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="bg-teal-100 text-teal-800 text-xs px-2 py-1 rounded-full">
                {EXERCISE_TYPES.find(t => t.value === exercise.category)?.label || exercise.category}
              </span>
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full">
                {exercise.duration} min
              </span>
              <span className="bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full capitalize">
                {exercise.difficulty}
              </span>
            </div>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-3">Description</h2>
                <p className="text-gray-700">{exercise.description}</p>
              </div>
            </div>
            
            {/* Preparation */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-3">Preparation</h2>
                <p className="text-gray-700">{exercise.preparation}</p>
              </div>
            </div>
            
            {/* Benefits */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-3">Benefits</h2>
                <ul className="list-disc pl-5 space-y-1 text-gray-700">
                  {exercise.benefits?.map((benefit, index) => (
                    <li key={index}>{benefit}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          
          {/* Timer Section */}
          <div className="lg:col-span-1 space-y-6">
            {/* Timer Card */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden sticky top-20">
              <div className="p-4 sm:p-6">
                <h2 className="text-xl font-semibold mb-4">Exercise Timer</h2>
                
                {/* Timer Display */}
                <div className="mb-4">
                  <div className="bg-gray-100 rounded-lg p-4 text-center">
                    <div className="text-gray-700 mb-1 text-sm">Time Elapsed</div>
                    <div className="text-3xl sm:text-4xl font-mono font-bold">{formatTime(time)}</div>
                    <div className="mt-2 h-2 bg-gray-300 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500" 
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-2">
                      {Math.floor(progress)}% complete
                    </div>
                  </div>
                </div>
                
                {/* Breathing Animation */}
                {exercise.category === 'breathing' && isActive && !isPaused && (
                  <div className="relative mb-6 w-32 h-32 mx-auto">
                    <div className={`breathe-circle ${breathePhase}`}></div>
                    <div className="absolute inset-0 flex items-center justify-center text-lg font-semibold">
                      {breathePhase === 'inhale' ? 'Inhale' : 
                       breathePhase === 'hold' ? 'Hold' : 
                       breathePhase === 'exhale' ? 'Exhale' : 'Ready'}
                    </div>
                    <div className="text-center text-sm text-gray-600 mt-2">
                      Breath: {breatheCount}
                    </div>
                  </div>
                )}
                
                {/* Control Buttons */}
                <div className="flex justify-center space-x-4">
                  {!isActive && !isPaused ? (
                    <button 
                      onClick={handleStart}
                      className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Start
                    </button>
                  ) : isPaused ? (
                    <button 
                      onClick={handleResume}
                      className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Resume
                    </button>
                  ) : (
                    <button 
                      onClick={handlePause}
                      className="px-4 sm:px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                    >
                      Pause
                    </button>
                  )}
                  
                  <button 
                    onClick={handleReset}
                    className="px-4 sm:px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                  >
                    Reset
                  </button>
                </div>
                
                {completed && (
                  <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                    <h3 className="text-lg font-semibold text-green-800 mb-2">Great job!</h3>
                    <p className="text-green-700">You&apos;ve completed this exercise. How do you feel?</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Breathing animation helpers */}
      <style jsx>{`
        @keyframes grow-width {
          0% { width: 0%; }
          100% { width: 100%; }
        }
        
        @keyframes shrink-width {
          0% { width: 100%; }
          100% { width: 0%; }
        }
        
        .animate-grow-width {
          animation: grow-width 4s linear forwards;
        }
        
        .animate-shrink-width {
          animation: shrink-width 8s linear forwards;
        }
        
        .animate-hold {
          animation: pulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0% { opacity: 0.8; }
          50% { opacity: 1; }
          100% { opacity: 0.8; }
        }
      `}</style>
    </div>
  );
} 