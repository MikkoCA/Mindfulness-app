import { Message } from '@/types';

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
    
    return lines.map((line, index) => {
      const bulletPoint = line.match(/^[-•*]\s/);
      const numberPoint = line.match(/^\d+\.\s/);
      
      if (bulletPoint) {
        if (!inList) {
          inList = true;
          return `<ul class="list-disc pl-4 my-2">\n<li>${line.replace(/^[-•*]\s/, '')}</li>`;
        }
        return `<li>${line.replace(/^[-•*]\s/, '')}</li>`;
      } else if (numberPoint) {
        if (!inList) {
          inList = true;
          return `<ol class="list-decimal pl-4 my-2">\n<li>${line.replace(/^\d+\.\s/, '')}</li>`;
        }
        return `<li>${line.replace(/^\d+\.\s/, '')}</li>`;
      } else if (inList) {
        inList = false;
        return `</ul>\n${line}`;
      }
      
      return line;
    }).join('\n');
  };

  const formatContent = (content: string) => {
    let formatted = content;
    formatted = formatLinks(formatted);
    formatted = formatLists(formatted);
    
    // Add paragraph breaks
    formatted = formatted.split('\n').map(line => 
      line.trim() ? `<p class="mb-2">${line}</p>` : ''
    ).join('');
    
    return formatted;
  };

  return (
    <div className={`flex ${isBot ? 'justify-start' : 'justify-end'}`}>
      <div className={`max-w-[80%] rounded-lg p-4 ${
        isBot 
          ? 'bg-gray-100 text-gray-800' 
          : 'bg-blue-600 text-white'
      }`}>
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ 
            __html: formatContent(message.content) 
          }}
        />
        
        {message.type === 'error' && onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-sm text-red-500 hover:text-red-600"
          >
            Retry
          </button>
        )}
        
        <div className={`text-xs mt-1 ${
          isBot ? 'text-gray-500' : 'text-blue-200'
        }`}>
          {new Date(message.timestamp).toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
};

export default MessageBubble; 