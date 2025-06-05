import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom'; // For extended matchers like .toBeInTheDocument()
import ChatMessage from './ChatMessage';

describe('ChatMessage Component', () => {
  it('renders user message correctly', () => {
    const message = { text: 'Hello User', sender: 'user' };
    render(<ChatMessage message={message} />);

    const messageText = screen.getByText('Hello User');
    expect(messageText).toBeInTheDocument();

    // Check for class directly on the element that has it
    // screen.getByText returns the <p> element, its parent has the class.
    expect(messageText.parentElement).toHaveClass('chat-message user-message');
  });

  it('renders AI message correctly', () => {
    const message = { text: 'Hello AI', sender: 'ai' };
    render(<ChatMessage message={message} />);

    const messageText = screen.getByText('Hello AI');
    expect(messageText).toBeInTheDocument();
    expect(messageText.parentElement).toHaveClass('chat-message ai-message');
  });

  it('renders AI loading message with specific class', () => {
    const message = { text: 'Loading...', sender: 'ai', type: 'loading' };
    render(<ChatMessage message={message} />);

    const messageText = screen.getByText('Loading...');
    expect(messageText).toBeInTheDocument();
    expect(messageText.parentElement).toHaveClass('ai-message loading-message');
  });

  it('renders AI error message with specific class', () => {
    const message = { text: 'Error!', sender: 'ai', type: 'error' };
    render(<ChatMessage message={message} />);

    const messageText = screen.getByText('Error!');
    expect(messageText).toBeInTheDocument();
    expect(messageText.parentElement).toHaveClass('ai-message error-message');
  });
});
