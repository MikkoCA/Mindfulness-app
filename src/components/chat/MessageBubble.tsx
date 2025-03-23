"use client"

// Define the Message type locally to avoid conflicts
interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'error' | 'initial' | string;
}

interface MessageBubbleProps {
  message: Message;
  onRetry?: () => void;
}

const MessageBubble = ({ message, onRetry }: MessageBubbleProps) => {
  const isBot = message.sender === 'bot';
  
  // Function to convert markdown-style links to HTML
  const formatLinks = (content: string) => {
    // Replace markdown links with HTML links
    const formattedContent = content.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );
    
    // Replace plain URLs with clickable links
    return formattedContent.replace(
      /(https?:\/\/[^\s]+)/g,
      '<a href="$1" class="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">$1</a>'
    );
  };

  // Function to format lists
  const formatLists = (content: string) => {
    const lines = content.split('\n');
    let inList = false;
    let listType = '';
    let formattedContent = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const bulletPoint = line.match(/^[-•*]\s/);
      const numberPoint = line.match(/^\d+\.\s/);
      
      if (bulletPoint) {
        if (!inList || listType !== 'ul') {
          if (inList) formattedContent += `</${listType}>\n`;
          formattedContent += `<ul class="list-disc pl-5 my-2">\n`;
          inList = true;
          listType = 'ul';
        }
        formattedContent += `<li>${line.replace(/^[-•*]\s/, '')}</li>\n`;
      } else if (numberPoint) {
        if (!inList || listType !== 'ol') {
          if (inList) formattedContent += `</${listType}>\n`;
          formattedContent += `<ol class="list-decimal pl-5 my-2">\n`;
          inList = true;
          listType = 'ol';
        }
        formattedContent += `<li>${line.replace(/^\d+\.\s/, '')}</li>\n`;
      } else {
        if (inList) {
          formattedContent += `</${listType}>\n`;
          inList = false;
          listType = '';
        }
        formattedContent += line + '\n';
      }
    }
    
    if (inList) {
      formattedContent += `</${listType}>\n`;
    }
    
    return formattedContent;
  };

  // Function to format content with various markdown elements
  const formatContent = (content: string) => {
    // Format headings (# Heading)
    let formattedContent = content
      .replace(/^### (.*?)$/gm, '<h3 class="text-lg font-bold mt-3 mb-1">$1</h3>')
      .replace(/^## (.*?)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>')
      .replace(/^# (.*?)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');
    
    // Format bold text with ** or __
    formattedContent = formattedContent
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>');
    
    // Format italic text with * or _
    formattedContent = formattedContent
      .replace(/\*([^\*]+)\*/g, '<em>$1</em>')
      .replace(/_([^_]+)_/g, '<em>$1</em>');
    
    // Format links
    formattedContent = formatLinks(formattedContent);
    
    // Format lists
    formattedContent = formatLists(formattedContent);
    
    // Add paragraph breaks
    formattedContent = formattedContent
      .split('\n\n')
      .map(paragraph => paragraph.trim())
      .filter(paragraph => paragraph)
      .map(paragraph => {
        // Skip adding <p> tags if the paragraph already starts with an HTML tag
        if (paragraph.startsWith('<h1') || 
            paragraph.startsWith('<h2') || 
            paragraph.startsWith('<h3') || 
            paragraph.startsWith('<ul') || 
            paragraph.startsWith('<ol')) {
          return paragraph;
        }
        return `<p>${paragraph}</p>`;
      })
      .join('');
    
    return formattedContent;
  };

  // Format the timestamp
  const formatTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      hour: 'numeric',
      minute: 'numeric',
      hour12: true
    }).format(date);
  };

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'} mb-4`}>
      <div 
        className={`max-w-[85%] md:max-w-[70%] rounded-lg px-4 py-3 ${
          isBot 
            ? 'bg-gray-100 text-gray-800' 
            : 'bg-blue-600 text-white'
        }`}
      >
        <div 
          className="prose prose-sm max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: formatContent(message.content) 
          }} 
        />
        
        {message.type === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs bg-red-100 text-red-700 px-2 py-1 rounded hover:bg-red-200 transition-colors"
          >
            Retry
          </button>
        )}
        
        <div className={`text-xs mt-1 ${isBot ? 'text-gray-500' : 'text-blue-200'}`}>
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble; 