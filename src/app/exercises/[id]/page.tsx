'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { motion } from 'framer-motion';

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
  const { user } = useAuth();
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
      <AuthGuard>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-[rgb(203,251,241)] via-white to-[rgb(203,251,241)]">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-teal-500 border-t-transparent"></div>
                <p className="text-gray-600 font-medium">Loading exercise...</p>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (error || !exercise) {
    return (
      <AuthGuard>
        <div className="flex flex-col min-h-screen bg-gradient-to-br from-[rgb(203,251,241)] via-white to-[rgb(203,251,241)]">
          <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
              <div className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-8 max-w-md">
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Exercise Not Found</h2>
                <p className="text-gray-600 mb-6">{error}</p>
                <Link 
                  href="/exercises"
                  className="inline-flex items-center justify-center px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                >
                  Back to Exercises
                </Link>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Check if this exercise has been completed before
  const checkIfCompleted = () => {
    const completedExercises = JSON.parse(localStorage.getItem('completed_exercises') || '[]');
    return completedExercises.includes(id);
  };

  const wasCompletedBefore = checkIfCompleted();

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[rgb(203,251,241)] via-white to-[rgb(203,251,241)]">
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Header */}
            <div className="mb-8">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
                <div>
                  <Link 
                    href="/exercises"
                    className="inline-flex items-center text-teal-600 hover:text-teal-700 font-medium mb-2"
                  >
                    <svg className="w-5 h-5 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Back to Exercises
                  </Link>
                  <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
                    {exercise.title}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-2">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[rgb(203,251,241)] text-teal-700">
                    {exercise.duration} minutes
                  </span>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[rgb(203,251,241)] text-teal-700">
                    {EXERCISE_TYPES.find(t => t.value === exercise.category)?.label || exercise.category}
                  </span>
                  <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-sm font-medium bg-[rgb(203,251,241)] text-teal-700 capitalize">
                    {exercise.difficulty}
                  </span>
                </div>
              </div>
              <p className="text-gray-600 text-lg">{exercise.description}</p>
            </div>

            {/* Main Content */}
            <div className="grid gap-8 grid-cols-1 lg:grid-cols-3">
              {/* Exercise Content */}
              <div className="lg:col-span-2 space-y-6">
                {/* Timer Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-8"
                >
                  <div className="text-center mb-8">
                    <div className="text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-4">
                      {formatTime(time)}
                    </div>
                    <div className="text-gray-600">
                      {isActive ? (
                        isPaused ? 'Paused' : 'In Progress'
                      ) : completed ? 'Completed' : 'Ready to Begin'}
                    </div>
                  </div>

                  <div className="flex justify-center gap-4">
                    {!isActive && !completed ? (
                      <button
                        onClick={handleStart}
                        className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                      >
                        Start Exercise
                      </button>
                    ) : (
                      <>
                        {isPaused ? (
                          <button
                            onClick={handleResume}
                            className="px-6 py-3 rounded-xl font-medium bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Resume
                          </button>
                        ) : (
                          <button
                            onClick={handlePause}
                            className="px-6 py-3 rounded-xl font-medium bg-white border border-[rgb(203,251,241)] text-teal-600 shadow-lg shadow-teal-500/10 hover:shadow-xl hover:shadow-teal-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                          >
                            Pause
                          </button>
                        )}
                        <button
                          onClick={handleReset}
                          className="px-6 py-3 rounded-xl font-medium bg-rose-50 border border-rose-200 text-rose-600 shadow-lg shadow-rose-500/10 hover:shadow-xl hover:shadow-rose-500/20 transition-all transform hover:scale-[1.02] active:scale-[0.98]"
                        >
                          Reset
                        </button>
                      </>
                    )}
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-8">
                    <div className="relative h-2 bg-[rgb(203,251,241)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(time / totalTime) * 100}%` }}
                        transition={{ duration: 0.3 }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full"
                      />
                    </div>
                    <div className="flex justify-between mt-2 text-sm text-gray-500">
                      <span>0:00</span>
                      <span>{formatTime(totalTime)}</span>
                    </div>
                  </div>
                </motion.div>

                {/* Current Step */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-8"
                >
                  <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-6">
                    Current Step
                  </h2>
                  <div className="text-lg text-gray-700 mb-6">
                    {processedSteps[currentStep] || 'Ready to begin'}
                  </div>
                  {exercise.steps && (
                    <div className="relative h-2 bg-[rgb(203,251,241)] rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${((currentStep + 1) / exercise.steps.length) * 100}%` }}
                        transition={{ duration: 0.3 }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-teal-600 to-emerald-600 rounded-full"
                      />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Sidebar Content */}
              <div className="space-y-6">
                {/* Benefits */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-8"
                >
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-4">
                    Benefits
                  </h2>
                  <ul className="space-y-3">
                    {exercise.benefits?.map((benefit, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-teal-500 mt-1">•</span>
                        <span className="text-gray-600">{benefit}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>

                {/* Preparation */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-8"
                >
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-4">
                    Preparation
                  </h2>
                  <p className="text-gray-600">{exercise.preparation}</p>
                </motion.div>

                {/* Tips */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] p-8"
                >
                  <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600 mb-4">
                    Tips
                  </h2>
                  <ul className="space-y-3">
                    {exercise.tips?.map((tip, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <span className="text-teal-500 mt-1">•</span>
                        <span className="text-gray-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Audio elements */}
      <audio ref={bellSound} preload="auto">
        <source src="/sounds/bell.mp3" type="audio/mpeg" />
      </audio>
      <audio ref={tickSound} preload="auto">
        <source src="/sounds/tick.mp3" type="audio/mpeg" />
      </audio>
    </AuthGuard>
  );
} 