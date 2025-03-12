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
  steps?: string[];
  benefits?: string[];
  preparation?: string;
  tips?: string[];
}

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
  const processExerciseContent = (exercise: Exercise) => {
    let steps: string[] = [];
    let benefits: string[] = [];
    let preparation: string = '';
    let tips: string[] = [];

    try {
      // Try to parse as JSON if possible
      const parsedContent = JSON.parse(exercise.content || '{}');
      
      if (parsedContent.steps && Array.isArray(parsedContent.steps)) {
        steps = parsedContent.steps;
      } else if (parsedContent.instructions) {
        steps = parsedContent.instructions.split('\n').filter((s: string) => s.trim() !== '');
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
    } catch (_) {
      // If not valid JSON, try to extract steps from the content string
      if (exercise.content) {
        // Split by numbered items or bullet points
        const lines = exercise.content.split('\n');
        
        // Extract steps - look for numbered lines or bullet points
        steps = lines.filter(line => 
          /^\d+[\.\)]/.test(line.trim()) || // Numbered items
          /^[\-\•\*]/.test(line.trim())     // Bullet points
        ).map(line => line.replace(/^\d+[\.\)]|\-|\•|\*/, '').trim());
        
        // If no structured steps found, just split by paragraphs
        if (steps.length === 0) {
          steps = lines.filter(line => line.trim() !== '');
        }
      }
    }

    // Create default steps if none were extracted
    if (steps.length === 0) {
      if (exercise.category === 'breathing') {
        steps = [
          "Find a comfortable seated position with your back straight.",
          "Close your eyes and take a deep breath in through your nose for 4 counts.",
          "Hold your breath for 4 counts.",
          "Exhale slowly through your mouth for 6 counts.",
          "Rest for 2 counts before beginning the next cycle.",
          "Repeat this breathing pattern for the duration of the exercise."
        ];
      } else if (exercise.category === 'meditation') {
        steps = [
          "Find a quiet space where you won't be disturbed.",
          "Sit comfortably with your back straight, either on a chair or cushion.",
          "Close your eyes and bring your attention to your breath.",
          "Notice the sensation of the breath entering and leaving your body.",
          "When your mind wanders, gently bring your attention back to your breath.",
          "Continue this practice, maintaining awareness of the present moment."
        ];
      } else {
        steps = [
          "Find a comfortable position to begin the exercise.",
          "Follow along with the timer, moving through each phase mindfully.",
          "Focus on your breath and bodily sensations throughout the practice.",
          "If your mind wanders, gently bring your attention back to the exercise.",
          "Complete the full duration for maximum benefit."
        ];
      }
    }

    // Generate benefits if none provided
    if (benefits.length === 0) {
      if (exercise.category === 'breathing') {
        benefits = [
          "Reduces stress and anxiety",
          "Improves focus and concentration",
          "Activates the parasympathetic nervous system",
          "Helps regulate emotions",
          "Improves oxygen flow throughout the body"
        ];
      } else if (exercise.category === 'meditation') {
        benefits = [
          "Reduces stress and promotes emotional health",
          "Enhances self-awareness and mindfulness",
          "Lengthens attention span",
          "May reduce age-related memory loss",
          "Can generate kindness and compassion"
        ];
      } else {
        benefits = [
          "Promotes mindfulness and present-moment awareness",
          "Reduces stress and anxiety",
          "Improves mental clarity and focus",
          "Enhances overall well-being",
          "Helps build a consistent mindfulness practice"
        ];
      }
    }

    // Generate preparation instructions if none provided
    if (!preparation) {
      preparation = "Find a quiet space where you won't be disturbed. Wear comfortable clothing and consider removing any distractions such as your phone. If seated, maintain a straight back to promote alertness while remaining comfortable.";
    }

    // Generate tips if none provided
    if (tips.length === 0) {
      tips = [
        "Consistency is key - try to practice at the same time each day",
        "Start with shorter sessions and gradually increase duration",
        "Be patient with yourself - mindfulness is a skill that develops with practice",
        "There&apos;s no &apos;perfect way&apos; to practice - find what works best for you",
        "If you miss a day, simply begin again without judgment"
      ];
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
  };

  // Load exercise data
  useEffect(() => {
    async function fetchExercise() {
      try {
        const savedExercises = localStorage.getItem('mindfulness_exercises');
        if (savedExercises) {
          const exercises = JSON.parse(savedExercises);
          const foundExercise = exercises.find((ex: Exercise) => ex.id === id);
          
          if (foundExercise) {
            // Process and enhance the exercise content
            const enhancedExercise = processExerciseContent(foundExercise);
            setExercise(enhancedExercise);
            setProcessedSteps(enhancedExercise.steps || []);
            setStepTimings(enhancedExercise.stepTimings || []);
            
            // Set initial timer value based on exercise duration
            const totalSeconds = enhancedExercise.duration * 60;
            setTime(totalSeconds);
            setTotalTime(totalSeconds);
            setLoading(false);
            return;
          }
        }
        
        setError('Exercise not found. It may have been removed or expired.');
        setLoading(false);
      } catch (err) {
        console.error('Error fetching exercise:', err);
        setError('Failed to load exercise. Please try again later.');
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
  }, [id]);

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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error || !exercise) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Link href="/exercises">
          <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:bg-gray-50 mb-4">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Back to Exercises
          </button>
        </Link>
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error || 'Exercise not found'}</p>
          <Link href="/exercises">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
              Go to Exercises
            </button>
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
    <div className="container mx-auto px-4 py-8 mb-16">
      <Link href="/exercises">
        <button className="flex items-center px-4 py-2 border border-gray-300 rounded-md bg-white text-gray-800 hover:bg-gray-50 mb-4">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Exercises
        </button>
      </Link>
      
      <div className="max-w-4xl mx-auto">
        {/* Exercise Header */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <div className="flex justify-between items-start">
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{exercise.title}</h1>
              {(wasCompletedBefore || completed) && (
                <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm">
                  Completed
                </span>
              )}
            </div>
            
            <div className="flex items-center mb-4 text-sm">
              <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full">{exercise.category}</span>
              <span className="mx-2">•</span>
              <span className="text-gray-600">{exercise.duration} min</span>
              <span className="mx-2">•</span>
              <span className="capitalize text-gray-600">{exercise.difficulty}</span>
            </div>
            
            <p className="text-gray-700 mb-6">{exercise.description}</p>
            
            {/* Benefits Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Benefits</h3>
              <ul className="list-disc pl-5 space-y-1 text-gray-700">
                {exercise.benefits?.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>
            
            {/* Preparation Section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Preparation</h3>
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4 text-gray-700">
                {exercise.preparation}
              </div>
            </div>
          </div>
        </div>
        
        {/* Exercise Practice Section */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Practice Guide</h2>
            
            {/* Progress bar */}
            <div className="w-full h-2 bg-gray-200 rounded-full mb-4">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            
            {/* Timer and controls */}
            <div className="bg-gray-50 p-6 rounded-lg mb-6 text-center">
              <div className="text-5xl font-mono mb-4 font-bold text-gray-800">{formatTime(time)}</div>
              
              {exercise.category === 'breathing' && isActive && !isPaused && (
                <div className="mb-4">
                  <div className={`text-lg font-medium mb-2 ${
                    breathePhase === 'inhale' ? 'text-blue-600' :
                    breathePhase === 'hold' ? 'text-purple-600' :
                    breathePhase === 'exhale' ? 'text-green-600' : 'text-gray-600'
                  }`}>
                    {breathePhase === 'inhale' ? 'Inhale' :
                     breathePhase === 'hold' ? 'Hold' :
                     breathePhase === 'exhale' ? 'Exhale' : 'Rest'}
                  </div>
                  <div className={`w-full h-6 rounded-full overflow-hidden border ${
                    breathePhase === 'inhale' ? 'border-blue-300' :
                    breathePhase === 'hold' ? 'border-purple-300' :
                    breathePhase === 'exhale' ? 'border-green-300' : 'border-gray-300'
                  }`}>
                    <div 
                      className={`h-full ${
                        breathePhase === 'inhale' ? 'bg-blue-300 animate-grow-width' :
                        breathePhase === 'hold' ? 'bg-purple-300 animate-hold w-full' :
                        breathePhase === 'exhale' ? 'bg-green-300 animate-shrink-width' : 'bg-gray-100 w-0'
                      }`}
                    ></div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">Breath cycle: {breatheCount}</div>
                </div>
              )}
              
              <div className="flex justify-center space-x-4">
                {!isActive && !isPaused ? (
                  <button 
                    onClick={handleStart}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Start
                  </button>
                ) : isPaused ? (
                  <button 
                    onClick={handleResume}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Resume
                  </button>
                ) : (
                  <button 
                    onClick={handlePause}
                    className="px-6 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
                  >
                    Pause
                  </button>
                )}
                
                <button 
                  onClick={handleReset}
                  className="px-6 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Reset
                </button>
              </div>
              
              {completed && (
                <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-md">
                  <h3 className="text-lg font-semibold text-green-800 mb-2">Great job!</h3>
                  <p className="text-green-700">You've completed this exercise. How do you feel?</p>
                </div>
              )}
            </div>
            
            {/* Current step highlight */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Current Focus</h3>
              <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 text-gray-800 mb-4">
                {processedSteps[currentStep] || "Follow along with the timer"}
              </div>
            </div>
            
            {/* Step-by-step instructions */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Step-by-Step Instructions</h3>
              <ol className="space-y-4">
                {processedSteps.map((step, index) => (
                  <li key={index} className={`pl-6 ${currentStep === index ? 'bg-yellow-50 p-3 rounded-md border-l-4 border-yellow-500' : ''}`}>
                    <div className="flex items-start">
                      <span className={`flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full mr-3 mt-0.5 ${
                        currentStep > index ? 'bg-green-500 text-white' :
                        currentStep === index ? 'bg-yellow-500 text-white animate-pulse' :
                        'bg-gray-200 text-gray-700'
                      }`}>
                        {currentStep > index ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                          </svg>
                        ) : (
                          index + 1
                        )}
                      </span>
                      <span className={`text-gray-700 ${currentStep === index ? 'font-medium' : ''}`}>{step}</span>
                    </div>
                    {currentStep === index && index < stepTimings.length && (
                      <div className="text-sm text-gray-500 mt-1 ml-9">
                        Focus on this step for approximately {Math.floor(stepTimings[index] / 60)} minute{stepTimings[index] / 60 !== 1 ? 's' : ''}
                      </div>
                    )}
                  </li>
                ))}
              </ol>
            </div>
            
            {/* Tips Section */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold mb-3">Helpful Tips</h3>
              <div className="bg-gray-50 p-4 rounded-md">
                <ul className="list-disc pl-5 space-y-2 text-gray-700">
                  {exercise.tips?.map((tip, index) => (
                    <li key={index}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        
        {/* Next Steps */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-3">After Completing This Exercise</h2>
            <p className="text-gray-700 mb-4">
              Take a moment to reflect on how you feel after practicing. Notice any changes in your body, mind, or mood.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/mood">
                <button className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700">
                  Track Your Mood
                </button>
              </Link>
              <Link href="/exercises">
                <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">
                  Find Another Exercise
                </button>
              </Link>
              <Link href="/chat">
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700">
                  Chat with AI Assistant
                </button>
              </Link>
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