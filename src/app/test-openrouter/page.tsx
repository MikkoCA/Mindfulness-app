'use client';

import { useState } from 'react';
import { generateAIResponse } from '@/lib/openrouter';

export default function TestOpenRouterPage() {
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Test API directly through the server API route
  const testApiRoute = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await fetch('/api/openrouter/test');
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to test API');
      }

      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  // Test using the generateAIResponse function from the openrouter.ts file
  const testGenerateResponse = async () => {
    try {
      setLoading(true);
      setError(null);
      setResult(null);

      const response = await generateAIResponse([
        { role: 'system', content: 'You are a helpful assistant.' },
        { role: 'user', content: 'Say hello and tell me today\'s date.' }
      ]);

      setResult(response);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Unknown error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-4">OpenRouter Integration Test</h1>
      
      <div className="space-y-4">
        <button 
          onClick={testApiRoute}
          disabled={loading}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
        >
          Test API Connection
        </button>
        
        <button 
          onClick={testGenerateResponse}
          disabled={loading}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-300 ml-2"
        >
          Test Generate Response
        </button>
        
        {loading && (
          <div className="flex items-center justify-center">
            <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div>
            <span className="ml-2">Loading...</span>
          </div>
        )}
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded text-red-700">
            <h3 className="font-semibold mb-2">Error</h3>
            <p className="whitespace-pre-wrap">{error}</p>
          </div>
        )}
        
        {result && (
          <div className="p-4 bg-green-50 border border-green-200 rounded">
            <h3 className="font-semibold mb-2">Result</h3>
            <pre className="whitespace-pre-wrap text-sm bg-white p-3 rounded border border-gray-200 overflow-auto max-h-96">
              {result}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
} 