import { NextRequest, NextResponse } from 'next/server';
import { AssemblyAI } from 'assemblyai';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { v4 as uuidv4 } from 'uuid';

// Configure the API route to accept large files
export const config = {
  api: {
    bodyParser: false,
    responseLimit: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('file') as File;
    
    if (!audioFile) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      );
    }

    // Initialize AssemblyAI client
    const apiKey = process.env.NEXT_PUBLIC_ASSEMBLYAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'AssemblyAI API key missing' },
        { status: 500 }
      );
    }

    const client = new AssemblyAI({
      apiKey: apiKey
    });

    // Save the file temporarily
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const tempDir = os.tmpdir();
    const extension = audioFile.type.split('/')[1] || 'mp3';
    const tempFilePath = path.join(tempDir, `${uuidv4()}.${extension}`);
    fs.writeFileSync(tempFilePath, buffer);

    try {
      // Upload the file
      const uploadResponse = await client.files.upload(tempFilePath);
      if (!uploadResponse) {
        throw new Error('Failed to upload file to AssemblyAI');
      }

      // Request transcription with all features enabled
      const transcript = await client.transcripts.transcribe({
        audio_url: uploadResponse,
        speaker_labels: true,
        language_detection: true,
        punctuate: true,
        format_text: true,
        dual_channel: true,
        word_boost: ["meditation", "mindfulness", "breathing", "relaxation"],
      });

      // Return the complete transcription data
      return NextResponse.json({
        success: true,
        transcription: {
          text: transcript.text,
          confidence: transcript.confidence,
          language: transcript.language_code,
          words: transcript.words,
          speakers: transcript.speaker_labels,
          utterances: transcript.utterances,
          raw: transcript // Include complete raw response
        }
      });

    } finally {
      // Clean up temp file
      try {
        fs.unlinkSync(tempFilePath);
      } catch (err) {
        console.warn('Failed to delete temporary file:', err);
      }
    }

  } catch (error: any) {
    console.error('Transcription error:', error);
    return NextResponse.json(
      { error: 'Failed to transcribe audio', details: error.message },
      { status: 500 }
    );
  }
} 