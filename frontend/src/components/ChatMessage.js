import React from 'react';
import './ChatMessage.css';

const ChatMessage = ({ message }) => {
  // Destructure sender, text, and type from message
  const { text, sender, type } = message;

  let messageClass = sender === 'user' ? 'user-message' : 'ai-message';

  // Add type-specific classes for AI messages (e.g., loading, error)
  if (sender === 'ai') {
    if (type === 'loading') {
      messageClass += ' loading-message';
    } else if (type === 'error') {
      messageClass += ' error-message';
    }
  }

  return (
    <div className={`chat-message ${messageClass}`}>
      <p>{text}</p>
    </div>
  );
};

export default ChatMessage;
