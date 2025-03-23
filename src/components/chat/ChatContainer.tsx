"use client"

import { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage as DBChatMessage } from '@/types/database';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { generateAIResponse, OpenRouterMessage } from '@/lib/openrouter';
import { 
  getChatMessages, 
  createChatMessage, 
  logUserActivity, 
  createChatSession,
  getRecentChatSession 
} from '@/lib/database';
import { useRouter } from 'next/navigation';
import { ActivityType } from '@/types/database';
import { v4 as uuidv4 } from 'uuid';
import { FormEvent } from 'react';
import { isSessionEndMessage, logCompletedChatSession } from '@/utils/sessionLogger';

interface ChatContainerProps {
  userId?: string;
  initialMessages?: DBChatMessage[];
  initialMessage?: string;
}

// Define the Message type for the MessageBubble component
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'error' | 'initial';
}

const CHAT_CONTEXT_LENGTH = 10;
const MAX_RETRIES = 3;

const ChatContainer = ({ userId = 'guest', initialMessages = [], initialMessage = "" }: ChatContainerProps) => {
  const [messages, setMessages] = useState<DBChatMessage[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [inputValue, setInputValue] = useState('');

  // Load chat history only for authenticated users
  const loadChatHistory = useCallback(async () => {
    if (!userId || userId === 'guest') return;
    
    try {
      if (initialMessages.length > 0) {
        setSessionId(initialMessages[0].session_id);
        return;
      }
      
      // Get recent chat session
      const recentSession = await getRecentChatSession(userId);
      if (recentSession) {
        setSessionId(recentSession);
        const chatHistory = await getChatMessages(userId, recentSession);
        setMessages(chatHistory);
      } else {
        // Create new session
        const newSession = await createChatSession(userId);
        setSessionId(newSession);
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError('Failed to load chat history');
    }
  }, [userId, initialMessages]);

  // Convert database ChatMessage to UI Message format
  const convertToUIMessage = (dbMessage: DBChatMessage): Message => ({
    id: dbMessage.id,
    content: dbMessage.message_text,
    sender: dbMessage.is_user_message ? 'user' : 'bot',
    timestamp: new Date(dbMessage.created_at),
    type: dbMessage.context?.error ? 'error' : 'text'
  });

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle sending a message with a specific content
  const sendMessage = async (content: string) => {
    if (!content.trim() || isLoading) return;
    
    // Create a valid sessionId if not already set
    if (!sessionId) {
      const newSessionId = await createChatSession(userId);
      setSessionId(newSessionId);
    }
    
    setIsLoading(true);
    
    try {
      // Create and save user message
      const userMessage = await createChatMessage(
        userId,
        sessionId,
        content,
        true
      );
      
      // Add user message to chat
      setMessages(prev => [...prev, userMessage]);
      
      // Format messages for OpenRouter API
      const formattedMessages: OpenRouterMessage[] = [
        {
          role: 'system',
          content: 'You are a mindfulness and meditation assistant, helping users with mental wellness, meditation techniques, and stress management. You can use Markdown formatting in your responses: **bold** for emphasis, _italic_ for subtle emphasis, and # headings for structure. Use bullet lists with * or - for steps or options.'
        },
        ...messages.map(msg => ({
          role: msg.is_user_message ? ('user' as const) : ('assistant' as const),
          content: msg.message_text
        })).slice(-CHAT_CONTEXT_LENGTH),
        { role: 'user' as const, content }
      ];
      
      // Get AI response
      const aiResponse = await generateAIResponse(formattedMessages);
      
      // Create and save AI message
      const aiMessage = await createChatMessage(
        userId,
        sessionId,
        aiResponse,
        false
      );
      
      // Add AI message to chat
      setMessages(prev => [...prev, aiMessage]);
      
      // Log user activity if user is authenticated
      if (userId && userId !== 'guest') {
        await logUserActivity(userId, 'chat_message' as ActivityType);
        
        // Check if this is a session completion message
        if (isSessionEndMessage(content) && messages.length > 2) {
          // Log the mindfulness session
          await logCompletedChatSession(userId, messages.length + 2);
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message. Please try again.');
      
      // Create error message
      const errorMessage = await createChatMessage(
        userId,
        sessionId,
        'I apologize, but I encountered an error. Please try again.',
        false,
        { error: true }
      );
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle form submission
  const handleSendMessage = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await sendMessage(inputValue);
    setInputValue('');
  };

  // Handle quick response buttons
  const handleQuickResponse = async (message: string) => {
    await sendMessage(message);
  };

  const handleRetry = async (messageId: string) => {
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex === -1) return;
    
    // Get the user message that came before this failed message
    const userMessageIndex = messageIndex - 1;
    if (userMessageIndex < 0) return;
    
    const userMessage = messages[userMessageIndex];
    if (!userMessage || !userMessage.is_user_message) return;
    
    // Remove the error message
    const updatedMessages = [...messages];
    updatedMessages.splice(messageIndex, 1);
    setMessages(updatedMessages);
    
    // Retry sending the user message
    await sendMessage(userMessage.message_text);
  };

  const startNewChat = async () => {
    try {
      // Create a new session
      const newSessionId = await createChatSession(userId);
      setSessionId(newSessionId);
      
      // Clear messages
      setMessages([]);
      
      // Reset error state
      setError(null);
      
      // Log this activity
      await logUserActivity(userId, 'chat_session' as ActivityType);
    } catch (error) {
      console.error('Error starting new chat:', error);
      setError('Failed to start new chat. Please try again.');
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex justify-between items-center mb-4">
        {messages.length > 0 && (
          <div className="text-xs text-gray-500">
            Continuing your previous conversation
          </div>
        )}
        <button
          onClick={startNewChat}
          disabled={isLoading}
          className="text-sm bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium py-1 px-3 rounded transition-colors ml-auto"
        >
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto pb-4">
        {messages.length === 0 && !initialMessage && (
          <div className="flex flex-col items-center justify-center h-full">
            <p className="text-gray-700 text-center font-medium mb-6">
              How can I help with your mindfulness journey today?
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
              <button 
                onClick={() => handleQuickResponse("I'd like a guided breathing exercise to help me relax.")}
                className="bg-white border border-gray-300 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-800">Breathing exercise</p>
                <p className="text-sm text-gray-600">Help me calm down with a breathing technique</p>
              </button>
              
              <button 
                onClick={() => handleQuickResponse("Can you recommend a 5-minute meditation for focus?")}
                className="bg-white border border-gray-300 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-800">Quick meditation</p>
                <p className="text-sm text-gray-600">5-minute meditation for focus</p>
              </button>
              
              <button 
                onClick={() => handleQuickResponse("What are some mindfulness practices I can do during my work day?")}
                className="bg-white border border-gray-300 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-800">Work mindfulness</p>
                <p className="text-sm text-gray-600">Practices for the workplace</p>
              </button>
              
              <button 
                onClick={() => handleQuickResponse("How can I improve my sleep quality with mindfulness?")}
                className="bg-white border border-gray-300 rounded-lg p-3 text-left hover:bg-gray-50 transition-colors"
              >
                <p className="font-medium text-gray-800">Better sleep</p>
                <p className="text-sm text-gray-600">Mindfulness techniques for sleep</p>
              </button>
            </div>
          </div>
        )}
        
        {messages.map(message => (
          <MessageBubble
            key={message.id}
            message={convertToUIMessage(message)}
            onRetry={message.context?.error ? () => handleRetry(message.id) : undefined}
          />
        ))}
        
        {isLoading && (
          <div className="flex justify-center my-4">
            <div className="animate-pulse flex space-x-2">
              <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
              <div className="h-2 w-2 bg-gray-500 rounded-full"></div>
            </div>
          </div>
        )}
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md my-4">
            {error}
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-gray-200 pt-4">
        <form onSubmit={handleSendMessage} className="flex">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !inputValue.trim()}
            className="bg-teal-600 text-white px-4 py-2 rounded-r-md hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 disabled:opacity-50"
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatContainer; 