import { useState, useEffect, useRef } from 'react';
import { Message, ChatMessage } from '@/types';
import MessageBubble from './MessageBubble';
import ChatInput from './ChatInput';
import { generateAIResponse } from '@/lib/openrouter';

interface ChatContainerProps {
  initialMessage?: string;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
}

const CHAT_CONTEXT_LENGTH = 10;
const MAX_RETRIES = 3;

const ChatContainer = ({ initialMessage = "" }: ChatContainerProps) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [currentSession, setCurrentSession] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadChatHistory = () => {
    try {
      // Load sessions
      const savedSessions = localStorage.getItem('chat_sessions');
      if (savedSessions) {
        setSessions(JSON.parse(savedSessions));
      }

      // Load current session if exists
      const currentSessionId = localStorage.getItem('current_chat_session');
      if (currentSessionId) {
        const sessionMessages = localStorage.getItem(`chat_session_${currentSessionId}`);
        if (sessionMessages) {
          setMessages(JSON.parse(sessionMessages));
          setCurrentSession(currentSessionId);
        }
      } else {
        // Start new session with initial message
        startNewSession();
      }
    } catch (error) {
      console.error('Error loading chat history:', error);
      setError('Failed to load chat history');
    }
  };

  const startNewSession = () => {
    const sessionId = Date.now().toString();
    const initialSystemMessage: Message = {
      id: '1',
      content: initialMessage,
      sender: 'bot',
      timestamp: new Date(),
      type: 'initial'
    };

    setMessages([initialSystemMessage]);
    setCurrentSession(sessionId);
    
    const newSession: ChatSession = {
      id: sessionId,
      title: 'New Chat',
      lastMessage: initialMessage,
      timestamp: new Date()
    };

    setSessions(prev => [newSession, ...prev]);
    localStorage.setItem('current_chat_session', sessionId);
    localStorage.setItem(`chat_session_${sessionId}`, JSON.stringify([initialSystemMessage]));
    updateSessions([newSession, ...sessions]);
  };

  const updateSessions = (updatedSessions: ChatSession[]) => {
    setSessions(updatedSessions);
    localStorage.setItem('chat_sessions', JSON.stringify(updatedSessions));
  };

  const saveMessages = (sessionId: string, messageList: Message[]) => {
    localStorage.setItem(`chat_session_${sessionId}`, JSON.stringify(messageList));
  };

  const handleSendMessage = async (content: string, retryCount = 0) => {
    if (!content.trim() || !currentSession) return;

    setError(null);
    const userMessage: Message = {
      id: Date.now().toString(),
      content,
      sender: 'user',
      timestamp: new Date(),
      type: 'text'
    };
    
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    
    try {
      // Get recent messages for context
      const recentMessages = messages
        .slice(-CHAT_CONTEXT_LENGTH)
        .map(msg => ({
          role: msg.sender === 'user' ? 'user' : 'assistant',
          content: msg.content
        })) as ChatMessage[];
      
      // Add the new message
      recentMessages.push({
        role: 'user',
        content
      } as ChatMessage);
      
      // Add system context
      recentMessages.unshift({
        role: 'system',
        content: `You are a mindfulness and meditation assistant. Your goal is to help users with:
          - Meditation and mindfulness practices
          - Stress management and relaxation techniques
          - Mood tracking and emotional well-being
          - Breathing exercises and body awareness
          Be empathetic, supportive, and provide practical guidance.`
      } as ChatMessage);
      
      const response = await generateAIResponse(recentMessages);
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: response || "I'm sorry, I couldn't generate a response. Please try again.",
        sender: 'bot',
        timestamp: new Date(),
        type: 'text'
      };
      
      const updatedMessages = [...messages, userMessage, botMessage];
      setMessages(updatedMessages);
      saveMessages(currentSession, updatedMessages);
      
      // Update session info
      const updatedSessions = sessions.map(session => 
        session.id === currentSession 
          ? { ...session, lastMessage: content, timestamp: new Date() }
          : session
      );
      updateSessions(updatedSessions);
      
    } catch (error) {
      console.error('Error:', error);
      setError('Failed to get response. Please try again.');
      
      if (retryCount < MAX_RETRIES) {
        setTimeout(() => {
          handleSendMessage(content, retryCount + 1);
        }, 1000 * (retryCount + 1));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-theme(spacing.32))]">
      <div className="flex-grow overflow-y-auto px-4 py-6 space-y-6">
        {messages.map((message) => (
          <MessageBubble 
            key={message.id} 
            message={message}
            onRetry={message.sender === 'user' ? () => handleSendMessage(message.content) : undefined}
          />
        ))}
        {isLoading && (
          <div className="flex space-x-2 items-center text-gray-500 p-4">
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        )}
        {error && (
          <div className="text-red-500 text-center p-2 bg-red-50 rounded-md">
            {error}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="border-t border-gray-200 p-4 bg-white">
        <ChatInput 
          onSendMessage={handleSendMessage} 
          isLoading={isLoading}
        />
      </div>
    </div>
  );
};

export default ChatContainer; 