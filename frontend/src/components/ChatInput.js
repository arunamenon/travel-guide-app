import React, { useState } from 'react';
import './ChatInput.css';

// Accept isLoading prop
const ChatInput = ({ onSendMessage, isLoading }) => {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) { // Don't send if loading
      onSendMessage(inputValue);
      setInputValue('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-form">
      <input
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        placeholder={isLoading ? "Waiting for response..." : "Describe your dream destination..."}
        className="chat-input"
        disabled={isLoading} // Disable input when loading
      />
      <button type="submit" className="send-button" disabled={isLoading}> {/* Disable button when loading */}
        {isLoading ? 'Sending...' : 'Send'}
      </button>
    </form>
  );
};

export default ChatInput;
