import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';
import { AssemblyAI } from 'assemblyai';

interface Message {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: any;
  timestamp?: Date;
}

interface TranscriptionResult {
  text: string;
  language_code?: string;
  words?: any[];
  metadata?: any;
}

class AudioTranscriptionService {
  private client: AssemblyAI;

  constructor() {
    const apiKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      throw new Error('AssemblyAI API key missing');
    }
    this.client = new AssemblyAI({
      apiKey: apiKey
    });
  }

  async transcribe(audioFile: File): Promise<TranscriptionResult> {
    const tempFilePath = await this.saveTempFile(audioFile);
    
    try {
      // First upload the file
      const uploadResponse = await this.client.files.upload(tempFilePath);
      if (!uploadResponse) {
        throw new Error('Failed to upload file to AssemblyAI');
      }

      // Configure transcription options
      const config = {
        audio_url: uploadResponse,
        speaker_labels: true,
        language_detection: false,  // Disable auto language detection
        language_code: "en",  // Force English transcription
        speech_model: "nano" as const  // Use the faster Nano model with correct type
      };

      // Start transcription
      console.log('Starting transcription with Nano model:', config);
      const transcript = await this.client.transcripts.transcribe(config);
      console.log('Transcription response:', transcript);
      
      if (!transcript) {
        throw new Error('Failed to get transcription from AssemblyAI');
      }

      return {
        text: transcript.text || '',
        language_code: transcript.language_code || 'en',
        words: transcript.words || [],
        metadata: {
          confidence: transcript.confidence,
          speaker_labels: transcript.speaker_labels || [],
          utterances: transcript.utterances || [],
          language_code: transcript.language_code
        }
      };
    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.warn('Failed to delete temporary file:', err);
      }
    }
  }

  private async saveTempFile(file: File): Promise<string> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempDir = os.tmpdir();
    const extension = file.type.split('/')[1] || 'mp3';
    const tempFilePath = path.join(tempDir, `${uuidv4()}.${extension}`);
    fs.writeFileSync(tempFilePath, buffer);
    return tempFilePath;
  }
}

// Configure the API route to accept large files
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    let messages;
    const contentType = req.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      const audioFile = formData.get('file') as File;
      
      if (!audioFile) {
        return NextResponse.json(
          { error: 'No audio file provided' },
          { status: 400 }
        );
      }
      
      // Validate file size (1GB limit)
      if (audioFile.size > 1024 * 1024 * 1024) {
        return NextResponse.json(
          { error: 'Audio file too large. Maximum size is 1GB.' },
          { status: 400 }
        );
      }

      try {
        const transcriptionService = new AudioTranscriptionService();
        const transcription = await transcriptionService.transcribe(audioFile);
        
        // Get previous messages from form data
        const previousMessages = formData.get('messages');
        let allMessages = [];
        
        if (previousMessages) {
          try {
            allMessages = JSON.parse(previousMessages as string);
          } catch (e) {
            console.warn('Failed to parse previous messages:', e);
          }
        }
        
        // First, return the transcription result directly
        if (transcription.text) {
          return NextResponse.json({
            text: transcription.text,
            language_code: transcription.language_code,
            metadata: transcription.metadata
          });
        }
        
        // If no transcription text, return error
        return NextResponse.json(
          { error: 'No transcription text received' },
          { status: 400 }
        );
      } catch (error) {
        console.error('Audio processing error:', error);
        return NextResponse.json(
          { error: 'Failed to process audio. Please try again.' },
          { status: 500 }
        );
      }
    } else {
      // Handle regular text message
      try {
        const jsonData = await req.json();
        messages = jsonData.messages || [];
        
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
          return NextResponse.json(
            { error: 'Invalid messages format' },
            { status: 400 }
          );
        }
      } catch (error) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
    }
    
    // Get OpenRouter API key from environment variables
    const openRouterApiKey = process.env.NEXT_PUBLIC_OPENROUTER_API_KEY;
    if (!openRouterApiKey) {
      return NextResponse.json(
        { error: 'Server configuration error: OpenRouter API key missing' },
        { status: 500 }
      );
    }
    
    // Format the conversation for the API
    const conversationMessages = messages.map((msg: Message) => ({
      role: msg.role,
      content: msg.content
    }));
    
    // Add system message for context
    conversationMessages.unshift({
      role: 'system',
      content: `You are a mindfulness and meditation assistant focused on helping users with stress management, 
      anxiety reduction, and mindfulness practices. Provide friendly, supportive responses that are concise 
      and actionable. If you're responding to an audio message, be extra supportive and encouraging 
      since the user chose to speak rather than type.`
    });
    
    // Send to OpenRouter API
    const chatResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openRouterApiKey}`,
        'HTTP-Referer': 'https://mindfulness-chatbot.vercel.app',
        'X-Title': 'Mindfulness Chatbot'
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-pro-exp-02-05:free",
        messages: conversationMessages,
        temperature: 0.7,
        max_tokens: 800
      })
    });
    
    if (!chatResponse.ok) {
      const errorText = await chatResponse.text();
      console.error('OpenRouter API error:', errorText);
      return NextResponse.json(
        { error: 'Failed to get response from AI' },
        { status: chatResponse.status }
      );
    }
    
    const data = await chatResponse.json();
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
} 