import React, { useState, useEffect, useRef } from 'react';
import ChatMessage from './ChatMessage';
import ChatInput from './ChatInput';
import ItineraryDisplay from './ItineraryDisplay';
import './ChatWindow.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api/travel-recommendation';

const ChatWindow = () => {
  const [messages, setMessages] = useState([
    { text: "Hello! Where would you like to travel today? Or what kind of trip are you looking for?", sender: "ai" }
  ]);
  const [currentItinerary, setCurrentItinerary] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const handleSendMessage = async (text) => {
    const userMessage = { text, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setCurrentItinerary(null);
    setIsLoading(true);

    // Add a thinking message
    const thinkingMessage = { text: "Thinking...", sender: "ai", type: "loading" };
    setMessages(prevMessages => [...prevMessages, thinkingMessage]);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text }),
      });

      // Remove thinking message
      setMessages(prevMessages => prevMessages.filter(msg => msg.type !== "loading"));

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ reply: "Error fetching data from server."}));
        // Use error type for styling
        throw new Error(errorData.reply || `HTTP error! status: ${response.statusMsg || response.status}`);
      }

      const data = await response.json();

      const aiMessage = { text: data.reply || "I received your request.", sender: "ai" };
      setMessages(prevMessages => [...prevMessages, aiMessage]);

      if (data.itinerary) {
        setCurrentItinerary(data.itinerary);
      }

    } catch (error) {
       // Remove thinking message if still present on error
      setMessages(prevMessages => prevMessages.filter(msg => msg.type !== "loading"));

      console.error("Failed to send message or fetch response:", error);
      // Add type: "error" to the message object for specific styling
      const errorMessage = { text: error.message || "Sorry, I couldn't process your request.", sender: "ai", type: "error" };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-window-container">
      <div className="chat-window">
        <div className="messages-list">
          {messages.map((msg, index) => (
            // Pass the whole message object to ChatMessage for type checking
            <ChatMessage key={index} message={msg} />
          ))}
          <div ref={messagesEndRef} />
        </div>
        {/* Pass isLoading to ChatInput to disable it */}
        <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
      </div>
      {currentItinerary && <ItineraryDisplay itinerary={currentItinerary} />}
    </div>
  );
};

export default ChatWindow;
