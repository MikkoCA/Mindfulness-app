// Custom error handler for Supabase client to suppress cookie parsing errors

// List of error messages to suppress
const suppressedErrors = [
  'Failed to parse cookie',
  'base64-eyJ',
  'Unexpected token'
];

// Original console.error function
const originalConsoleError = console.error;

// Override console.error to filter out suppressed errors
console.error = function(...args: any[]) {
  // Check if this is an error we want to suppress
  if (args.length > 0 && typeof args[0] === 'string') {
    for (const suppressPattern of suppressedErrors) {
      if (args[0].includes(suppressPattern)) {
        // Skip logging this error
        return;
      }
    }
  }
  
  // If error contains any of our suppressed patterns, don't log it
  if (args.length > 0 && args[0] instanceof Error) {
    for (const suppressPattern of suppressedErrors) {
      if (args[0].message.includes(suppressPattern)) {
        // Skip logging this error
        return;
      }
    }
  }

  // Call the original console.error for other errors
  originalConsoleError.apply(console, args);
};

export default function setupErrorHandlers() {
  // This function is just a hook to ensure the file gets loaded
  // The error handler is set up when the file is imported
  return true;
} 