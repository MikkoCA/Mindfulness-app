"use client";

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import AuthGuard from '@/components/auth/AuthGuard';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Adding type declarations for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isTyping?: boolean;
  isAudio?: boolean;
}

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([{
    id: 'welcome',
    role: 'assistant',
    content: `Welcome to the Mindfulness Chatbot! I'm here to help with:
• Guided meditation exercises
• Breathing techniques
• Mindfulness practices
• Stress management strategies

What would you like assistance with today?`,
    timestamp: new Date()
  }]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [audioPermission, setAudioPermission] = useState<boolean | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const [recordingInterval, setRecordingInterval] = useState<NodeJS.Timeout | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isReviewingAudio, setIsReviewingAudio] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const initialRenderRef = useRef(true);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView();
  };

  useEffect(() => {
    if (initialRenderRef.current) {
      initialRenderRef.current = false;
    } else {
      scrollToBottom();
    }
  }, [messages]);

  // Check for audio permission on component mount
  useEffect(() => {
    checkAudioPermission();
  }, []);

  // Check if user has granted audio permission
  const checkAudioPermission = async () => {
    // Check if we're in a secure context (HTTPS or localhost)
    if (!window.isSecureContext) {
      console.error('Audio recording requires a secure context (HTTPS)');
      setAudioPermission(false);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Audio recording requires a secure connection (HTTPS). Please ensure you're using HTTPS.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    // Check if the browser supports audio recording
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.error('Audio recording is not supported in this browser');
      setAudioPermission(false);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Your browser doesn't support audio recording. Please try using a modern browser like Chrome, Firefox, or Safari.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Stop the tracks immediately after getting permission
      stream.getTracks().forEach(track => track.stop());
      setAudioPermission(true);
    } catch (err) {
      console.error('Audio permission denied:', err);
      setAudioPermission(false);
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "Please allow microphone access in your browser settings to use voice messages.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Request audio permission
  const requestAudioPermission = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioPermission(true);
    } catch (err) {
      console.error('Failed to get audio permission:', err);
      setAudioPermission(false);
    }
  };

  // Format text to handle markdown-style formatting
  const formatContent = (content: string) => {
    // First, handle numbered items with proper spacing
    content = content.replace(/(\d+\.)\s+/g, '<br/><strong class="text-lg">$1</strong> ');

    // Handle the special case of "How to:*" and "Benefit:*" formatting
    content = content.replace(/(How to|Benefit):\*/g, (match) => {
      const label = match.replace(':*', '');
      return `<br/><strong class="text-teal-700 inline-block mt-2">${label}:</strong>`;
    });

    // Handle bullet points with asterisks
    content = content.replace(/\n\s*\*/g, '<br/>•');

    // Handle any remaining asterisks for emphasis
    content = content.replace(/\*(.*?)\*/g, '<strong>$1</strong>');

    // Add proper spacing after bullet points
    content = content.replace(/•\s*/g, '• ');

    // Add spacing after numbered items (e.g., "1. ")
    content = content.replace(/(\d+\.\s)/g, '<br/>$1 ');

    // Add extra line breaks between sections
    content = content.replace(/(\d+\.\s[^\d]+)(?=\d+\.|$)/g, '$1<br/><br/>');

    // Add proper spacing after colons in labels
    content = content.replace(/(How to|Benefit):<\/strong>/g, '$1:</strong>&nbsp;');

    // Clean up any excessive line breaks
    content = content.replace(/(<br\/>){3,}/g, '<br/><br/>');

    // Add proper paragraph spacing
    content = content.replace(/(How to:|Benefit:)/g, '<br/>$1');

    return content;
  };

  // Function to simulate typing animation for AI responses
  const simulateTyping = (fullResponse: string, messageId: string) => {
    let currentIndex = 0;
    const typingSpeed = 15; // milliseconds per character

    // Clear any existing typing timeout
    if (typingTimeout) {
      clearTimeout(typingTimeout);
    }

    const typeNextCharacter = () => {
      if (currentIndex <= fullResponse.length) {
        setMessages(prev => prev.map(msg => {
          if (msg.id === messageId) {
            return {
              ...msg,
              content: fullResponse.substring(0, currentIndex),
              isTyping: currentIndex < fullResponse.length
            };
          }
          return msg;
        }));
        
        currentIndex++;
        
        const timeout = setTimeout(typeNextCharacter, typingSpeed);
        setTypingTimeout(timeout);
      } else {
        setTypingTimeout(null);
      }
    };

    typeNextCharacter();
  };

  const getAIResponse = async (conversationHistory: { role: string; content: string }[]) => {
    try {
      // Limit conversation history to last 10 messages to prevent token limit issues
      const limitedHistory = conversationHistory.slice(-10);
      
      // Add system message for context
      const fullConversation = [{
        role: 'system',
        content: `You are a mindfulness and meditation assistant, trained to help users with:
- Guided meditation and relaxation
- Breathing exercises and techniques
- Stress management and anxiety relief
- Mindfulness practices and mental wellness
- Sleep improvement and relaxation techniques

Respond in a calm, supportive manner. Keep responses focused and practical.`
      }, ...limitedHistory];

      // Use our server-side API route
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: fullConversation
        })
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extract the response content
      const responseContent = data.choices?.[0]?.message?.content || 
                            data.choices?.[0]?.delta?.content ||
                            data.output;
                            
      if (!responseContent) {
        throw new Error('No response content received');
      }
      
      return responseContent;
    } catch (error) {
      console.error('Error calling Chat API:', error);
      throw error; // Let the calling function handle the error
    }
  };

  // Start recording audio
  const startRecording = async () => {
    console.log('Starting recording...');
    // Clear any previous recorded audio
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
      setAudioUrl(null);
      setIsReviewingAudio(false);
    }

    if (!audioPermission) {
      console.log('Requesting audio permission...');
      await requestAudioPermission();
      if (!audioPermission) {
        console.error('Audio permission denied');
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I need permission to access your microphone for voice messages. Please allow microphone access in your browser.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
        return;
      }
    }

    try {
      console.log('Getting media stream...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Check for supported MIME types in the browser, prioritizing optimal formats
      const mimeTypes = [
        // Primary supported formats in order of preference
        'audio/mp3',
        'audio/mpeg', // Some browsers use this MIME type for MP3
        'audio/webm;codecs=opus', // Good fallback with high compatibility
        'audio/wav',
        'audio/ogg',
        'audio/aac',
        'audio/webm'
      ];
      
      // Find the first supported MIME type
      let mimeType = '';
      for (const type of mimeTypes) {
        if (MediaRecorder.isTypeSupported(type)) {
          mimeType = type;
          console.log(`Using supported audio format: ${type}`);
          break;
        }
      }
      
      // Configure MediaRecorder with optimal settings for AI processing
      const recorderOptions = {
        mimeType: mimeType || 'audio/webm',
        audioBitsPerSecond: 128000 // Set to 128kbps for good quality while keeping size reasonable
      };
      
      console.log('Creating MediaRecorder with options:', recorderOptions);
      const mediaRecorder = new MediaRecorder(stream, recorderOptions);
      
      console.log(`MediaRecorder created with MIME type: ${mediaRecorder.mimeType}`);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        console.log('Data available event:', event.data.size, 'bytes');
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        console.log('MediaRecorder stopped');
        console.log('Audio chunks:', audioChunksRef.current.length);
        
        if (audioChunksRef.current.length === 0) {
          console.error("No audio data recorded");
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: "I couldn't detect any audio. Please try again and speak clearly.",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
        
        // Create initial blob with the recorder's MIME type
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        console.log('Created audio blob:', audioBlob.size, 'bytes');
        
        // Check if the audio file is too small (likely empty)
        if (audioBlob.size < 1000) {
          console.warn("Audio recording too small, likely empty");
          const errorMessage: Message = {
            id: Date.now().toString(),
            role: 'assistant',
            content: "The recording was too short. Please try again and speak for a longer duration.",
            timestamp: new Date(),
          };
          setMessages(prev => [...prev, errorMessage]);
          return;
        }
        
        try {
          console.log('Converting to MP3...');
          // Convert to MP3
          const mp3Blob = await convertToMp3(audioBlob);
          console.log('Converted to MP3, size:', mp3Blob.size, 'bytes');
          
          // Create a URL for the MP3 blob
          const url = URL.createObjectURL(mp3Blob);
          
          // Store the audio metadata
          const audioMeta = {
            url,
            mimeType: 'audio/mpeg',
            extension: 'mp3'
          };
          
          setAudioUrl(JSON.stringify(audioMeta));
          setIsReviewingAudio(true);
        } catch (error) {
          console.error('Error converting audio to MP3:', error);
          // Fallback to original format if conversion fails
          const url = URL.createObjectURL(audioBlob);
          const audioMeta = {
            url,
            mimeType: mediaRecorderRef.current?.mimeType || 'audio/webm',
            extension: getFileExtensionFromMime(mediaRecorderRef.current?.mimeType || 'audio/webm')
          };
          setAudioUrl(JSON.stringify(audioMeta));
          setIsReviewingAudio(true);
        }
        
        // Stop all tracks to release the microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Reset the recording timer
        if (recordingInterval) {
          clearInterval(recordingInterval);
          setRecordingInterval(null);
        }
      };

      // Set a maximum recording time of 60 seconds
      const maxRecordingTime = 60; // seconds
      
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start the recording timer
      const interval = setInterval(() => {
        setRecordingTime(prev => {
          const newTime = prev + 1;
          // Auto-stop recording if it reaches max time
          if (newTime >= maxRecordingTime && mediaRecorderRef.current?.state === 'recording') {
            stopRecording();
          }
          return newTime;
        });
      }, 1000);
      setRecordingInterval(interval);
    } catch (err) {
      console.error('Error starting recording:', err);
      setAudioPermission(false);
      
      // Show an error message to the user
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I couldn't access your microphone. Please check your browser permissions and try again.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    }
  };

  // Stop recording audio
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Clear the recording timer
      if (recordingInterval) {
        clearInterval(recordingInterval);
        setRecordingInterval(null);
      }
    }
  };

  // Cancel the recorded audio
  const cancelAudio = () => {
    if (audioUrl) {
      try {
        const audioMeta = JSON.parse(audioUrl);
        URL.revokeObjectURL(audioMeta.url);
      } catch (e) {
        // Fallback for legacy format
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(null);
      setIsReviewingAudio(false);
      setRecordingTime(0);
    }
  };
  
  // Format recording time as mm:ss
  const formatRecordingTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Process recorded audio for transcription
  const processAudioInput = async (audioBlob: Blob) => {
    try {
      setIsLoading(true);
      
      // Get the MIME type from the recorder
      const mimeType = mediaRecorderRef.current?.mimeType || 'audio/webm';
      console.log(`Processing audio with MIME type: ${mimeType}`);
      console.log(`Audio blob size: ${audioBlob.size} bytes`);
      
      // Check if we're dealing with a very small audio file (likely no speech)
      if (audioBlob.size < 5000) {
        console.warn("Audio file too small, likely no speech detected");
        const errorResponse: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: "I couldn't detect any speech in your recording. Please try again and make sure your microphone is working properly.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorResponse]);
        setIsLoading(false);
        return;
      }
      
      // Convert to MP3 if not already MP3
      let processedBlob = audioBlob;
      if (!mimeType.includes('mp3') && !mimeType.includes('mpeg')) {
        try {
          processedBlob = await convertToMp3(audioBlob);
          console.log('Successfully converted audio to MP3');
        } catch (error) {
          console.warn('Failed to convert to MP3, using original format:', error);
        }
      }
      
      // Create a FormData instance to send the audio file
      const formData = new FormData();
      // Add the audio blob to the form data with MP3 extension
      formData.append('file', processedBlob, `recording.mp3`);
      
      // Add a temporary user message with a loading state
      const tempMessageId = Date.now().toString();
      setMessages(prev => [
        ...prev,
        {
          id: tempMessageId,
          role: 'user',
          content: 'Sending audio message...',
          timestamp: new Date(),
          isTyping: true,
          isAudio: true
        }
      ]);
      
      // Send the audio file to the chat API endpoint
      const response = await fetch('/api/chat', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Chat API error:', errorData);
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('API Response:', data);  // Debug log
      
      // Remove the temporary message
      setMessages(prev => prev.filter(msg => msg.id !== tempMessageId));
      
      // Extract the transcribed text from the response
      const transcribedText = data.text || data.choices?.[0]?.message?.content || '';
      console.log('Transcribed text:', transcribedText);  // Debug log
      
      // Create a user message for the audio input
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `🎤 "${transcribedText}"`,  // Show transcribed text with microphone emoji
        timestamp: new Date(),
        isAudio: true,
      };
      
      setMessages(prev => [...prev, userMessage]);
      
      // Add a placeholder AI message with typing indicator
      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev, 
        {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isTyping: true
        }
      ]);
      
      // Get AI response
      const aiResponseContent = await getAIResponse(messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      })));
      
      // Start typing animation with the full response
      simulateTyping(aiResponseContent, aiMessageId);
      
    } catch (error) {
      console.error('Error processing audio:', error);
      
      // Show error message to user
      const errorResponse: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "I'm sorry, I encountered an error while processing your audio. Please try again or type your message instead.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Get appropriate file extension from MIME type
  const getFileExtensionFromMime = (mimeType: string): string => {
    const mimeToExt: { [key: string]: string } = {
      'audio/mp3': 'mp3',
      'audio/mpeg': 'mp3',
      'audio/wav': 'wav',
      'audio/wave': 'wav',
      'audio/ogg': 'ogg',
      'audio/aac': 'aac',
      'audio/webm': 'webm',
      'audio/x-m4a': 'm4a',
      'audio/mp4': 'm4a'
    };
    
    // Try exact match first
    if (mimeType in mimeToExt) {
      return mimeToExt[mimeType];
    }
    
    // Try partial match
    for (const [mime, ext] of Object.entries(mimeToExt)) {
      if (mimeType.includes(mime.split('/')[1])) {
        return ext;
      }
    }
    
    // Extract extension from MIME type as fallback
    const match = mimeType.match(/audio\/([a-zA-Z0-9]+)/);
    if (match && match[1]) {
      return match[1];
    }
    
    return 'audio'; // Default fallback
  };

  // Function to generate a nice filename for downloads
  const generateAudioFilename = (extension: string): string => {
    const timestamp = new Date().toISOString()
      .replace(/[:.]/g, '-')
      .replace('T', '_')
      .split('.')[0];
    return `mindfulness_chat_${timestamp}.${extension}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // If recording is in progress, stop and send it
    if (isRecording && mediaRecorderRef.current) {
      stopRecording();
      // Wait a brief moment for the recording to finish processing
      await new Promise(resolve => setTimeout(resolve, 100));
      if (audioUrl) {
        await sendAudio();
        return;
      }
    }
    
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Create conversation history for context
      const conversationHistory = messages.concat(userMessage).map(msg => ({
        role: msg.role,
        content: msg.content
      }));
      
      // Add a placeholder AI message with typing indicator
      const aiMessageId = (Date.now() + 1).toString();
      setMessages(prev => [
        ...prev, 
        {
          id: aiMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isTyping: true
        }
      ]);
      
      try {
        // Get AI response
        const aiResponseContent = await getAIResponse(conversationHistory);
        
        // Start typing animation with the full response
        simulateTyping(aiResponseContent, aiMessageId);
      } catch (error) {
        // Remove the typing indicator message
        setMessages(prev => prev.filter(msg => msg.id !== aiMessageId));
        
        // Show error message to user
        const errorMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: "I apologize, but I'm having trouble connecting to my AI service right now. Please try again in a moment.",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Send the recorded audio for processing
  const sendAudio = async () => {
    if (!audioUrl) return;
    
    try {
      setIsLoading(true);
      
      // Parse the audio metadata
      let actualUrl: string;
      let mimeType: string;
      
      try {
        const audioMeta = JSON.parse(audioUrl);
        actualUrl = audioMeta.url;
        mimeType = audioMeta.mimeType;
      } catch (e) {
        // Fallback for legacy format
        actualUrl = audioUrl;
        mimeType = 'audio/webm';
      }
      
      // Convert the audio URL back to a blob
      const response = await fetch(actualUrl);
      const audioBlob = await response.blob();
      
      // Process the audio
      await processAudioInput(audioBlob);
      
    } catch (error) {
      console.error('Error sending audio:', error);
      // Show an error message
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: "I couldn't process your audio message. Please try again or type your message instead.",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      // Clean up
      try {
        const audioMeta = JSON.parse(audioUrl);
        URL.revokeObjectURL(audioMeta.url);
      } catch (e) {
        // Fallback for legacy format
        URL.revokeObjectURL(audioUrl);
      }
      
      setAudioUrl(null);
      setIsReviewingAudio(false);
      setRecordingTime(0);
      setIsLoading(false);
    }
  };

  // Convert audio blob to MP3 using FFmpeg
  const convertToMp3 = async (audioBlob: Blob): Promise<Blob> => {
    try {
      console.log('Starting FFmpeg conversion...');
      
      // Create FFmpeg instance
      const ffmpeg = new FFmpeg();
      
      // Load FFmpeg core from a more reliable CDN
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd';
      console.log('Loading FFmpeg from:', baseURL);
      
      try {
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript', true),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm', true),
        });
        console.log('FFmpeg loaded successfully');
      } catch (loadError) {
        console.error('Failed to load FFmpeg:', loadError);
        // If FFmpeg fails to load, return the original blob
        console.log('Falling back to original audio format');
        return audioBlob;
      }
      
      console.log('FFmpeg loaded, starting conversion...');
      
      // Create file names
      const inputName = 'input.webm';
      const outputName = 'output.mp3';
      
      // Write the blob to FFmpeg's virtual filesystem
      try {
        const arrayBuffer = await audioBlob.arrayBuffer();
        await ffmpeg.writeFile(inputName, new Uint8Array(arrayBuffer));
      } catch (writeError) {
        console.error('Failed to write audio file:', writeError);
        throw new Error('Failed to process audio file');
      }
      
      // Run the conversion with better error handling
      try {
        await ffmpeg.exec([
          '-i', inputName,           // Input file
          '-c:a', 'libmp3lame',     // MP3 codec
          '-b:a', '128k',           // Bitrate
          '-ar', '44100',           // Sample rate
          outputName                 // Output file
        ]);
      } catch (error: any) {
        console.error('FFmpeg conversion failed:', error);
        throw new Error(error?.message || 'Audio conversion failed');
      }
      
      // Read the result
      let outputData;
      try {
        outputData = await ffmpeg.readFile(outputName);
        if (!(outputData instanceof Uint8Array)) {
          throw new Error('Unexpected output format from FFmpeg');
        }
      } catch (readError) {
        console.error('Failed to read converted file:', readError);
        throw new Error('Failed to read converted audio');
      }
      
      const outputBlob = new Blob([outputData], { type: 'audio/mp3' });
      
      // Clean up files from memory
      try {
        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile(outputName);
      } catch (cleanupError) {
        console.warn('Failed to clean up temporary files:', cleanupError);
        // Don't throw here as the conversion was successful
      }
      
      console.log('Successfully converted to MP3, size:', outputBlob.size);
      return outputBlob;
      
    } catch (error) {
      console.error('Error converting to MP3:', error);
      throw error;
    }
  };

  return (
    <AuthGuard>
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-[rgb(203,251,241)] via-white to-[rgb(203,251,241)]">
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4"
          >
            <h1 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-600 to-emerald-600">
              Mindfulness Chat
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

          {/* Chat Container */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col bg-white/90 backdrop-blur-xl rounded-2xl shadow-xl shadow-teal-500/10 border border-[rgb(203,251,241)] overflow-hidden h-[700px]">
              {/* Messages Area */}
              <div className="flex-grow overflow-y-auto p-6 space-y-6">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5 }}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl p-4 ${
                          message.role === 'user'
                            ? 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white ml-12'
                            : 'bg-[rgb(203,251,241)]/30 border border-[rgb(203,251,241)] mr-12'
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm opacity-75">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                            {message.isAudio && message.role === 'user' && ' 🎤'}
                          </span>
                          <span className="text-xs opacity-50">
                            {formatTime(message.timestamp)}
                          </span>
                        </div>

                        {message.isTyping ? (
                          <div className="flex items-center">
                            <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}></p>
                            <span className="ml-1 inline-flex">
                              <span className="animate-pulse">.</span>
                              <span className="animate-pulse animation-delay-200">.</span>
                              <span className="animate-pulse animation-delay-400">.</span>
                            </span>
                          </div>
                        ) : (
                          <p className="whitespace-pre-wrap" dangerouslySetInnerHTML={{ __html: formatContent(message.content) }}></p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-[rgb(203,251,241)] p-4">
                {/* Recording indicator */}
                {isRecording && (
                  <div className="mb-2 px-3 py-1.5 bg-red-100 text-red-600 rounded-lg flex items-center gap-2 animate-pulse max-w-fit">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-sm font-medium">Recording... {formatRecordingTime(recordingTime)}</span>
                  </div>
                )}
                
                {/* Audio review controls */}
                {isReviewingAudio && audioUrl && (
                  <div className="mb-4 p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <div className="flex justify-between items-center text-sm font-medium text-gray-700 mb-2">
                      <span>Review your audio message:</span>
                      {(() => {
                        try {
                          const audioMeta = JSON.parse(audioUrl);
                          const filename = generateAudioFilename(audioMeta.extension);
                          return (
                            <a 
                              href={audioMeta.url} 
                              download={filename}
                              className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download {audioMeta.extension.toUpperCase()}
                            </a>
                          );
                        } catch (e) {
                          // Fallback for legacy format
                          const filename = generateAudioFilename('webm');
                          return (
                            <a 
                              href={audioUrl} 
                              download={filename}
                              className="text-blue-600 hover:text-blue-800 text-xs flex items-center"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                              Download Audio
                            </a>
                          );
                        }
                      })()}
                    </div>
                    <audio 
                      ref={audioRef} 
                      src={(() => {
                        try {
                          return JSON.parse(audioUrl).url;
                        } catch (e) {
                          return audioUrl;
                        }
                      })()} 
                      controls 
                      className="w-full mb-3" 
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={sendAudio}
                        className="flex-1 py-2 px-4 bg-gradient-to-r from-teal-600 to-emerald-600 text-white rounded-lg font-medium hover:shadow-md transition-all"
                      >
                        Send Audio
                      </button>
                      <button
                        type="button"
                        onClick={cancelAudio}
                        className="py-2 px-4 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                
                <form onSubmit={handleSubmit} className="flex gap-4">
                  <div className="flex-grow relative">
                    <textarea
                      ref={inputRef}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={isRecording ? "Recording audio..." : "Type your message..."}
                      className="w-full rounded-xl border border-[rgb(203,251,241)] bg-white/50 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                      rows={1}
                      disabled={isLoading || isRecording || isReviewingAudio}
                    />
                    <div className="absolute right-3 bottom-3 text-xs text-gray-400">
                      {!isRecording && !isReviewingAudio && "Press Enter to send"}
                    </div>
                  </div>
                  
                  {/* Audio Recording Button - Hide when reviewing audio */}
                  {!isReviewingAudio && (
                    <button
                      type="button"
                      disabled={isLoading}
                      onClick={isRecording ? stopRecording : startRecording}
                      className={`w-12 h-12 flex items-center justify-center rounded-full transition-all transform shadow-lg ${
                        isRecording 
                          ? 'bg-red-500 text-white shadow-red-500/20 hover:shadow-red-500/30 animate-pulse' 
                          : 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-blue-500/20 hover:shadow-blue-500/30'
                      } hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]`}
                      aria-label={isRecording ? "Stop recording" : "Start recording"}
                      title={isRecording ? "Stop recording" : "Record audio message"}
                    >
                      {isRecording ? (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="6" y="6" width="12" height="12" rx="2" strokeWidth="2" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                      )}
                    </button>
                  )}
                  
                  {/* Send Button */}
                  <button
                    type="submit"
                    disabled={isLoading || (!input.trim() && !isRecording) || isReviewingAudio}
                    className={`px-6 rounded-xl font-medium transition-all transform ${
                      isLoading || (!input.trim() && !isRecording) || isReviewingAudio
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/20 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02] active:scale-[0.98]'
                    }`}
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2 py-3">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Sending...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 py-3">
                        <span>Send</span>
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                          />
                        </svg>
                      </div>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </AuthGuard>
  );
} 