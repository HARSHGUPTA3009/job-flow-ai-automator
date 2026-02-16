import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Minimize2, MessageCircle, Trash2, Loader } from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

export const ChatBot: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [userName, setUserName] = useState('Guest');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';


  // Get userId from localStorage or create one
  const getUserId = () => {
    let userId = localStorage.getItem('chatbot_user_id');
    if (!userId) {
      userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('chatbot_user_id', userId);
    }
    return userId;
  };

  // Get user name from localStorage or use default
  const getUserName = () => {
    const name = localStorage.getItem('user_name');
    return name || 'Guest';
  };

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Set user name on mount
  useEffect(() => {
    setUserName(getUserName());
  }, []);

  // Initialize chat when user opens it for first time
  useEffect(() => {
    if (isOpen && !isInitialized) {
      initializeChat();
    }
  }, [isOpen, isInitialized]);

  const initializeChat = async () => {
    try {
      setIsLoading(true);
      const userId = getUserId();

      const response = await fetch(`${API_BASE}/chatbot/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      if (data.success) {
        setIsInitialized(true);
        // Add welcome message
        const welcomeMessage: Message = {
          id: 'welcome',
          text: `👋 Hi ${userName}! I'm JobFlow AI Assistant. I can help you with:\n\n📊 Your application stats\n💼 Company information\n📅 Interview preparation\n🎯 Placement advice\n\nWhat would you like to know?`,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages([welcomeMessage]);
      } else {
        const errorMessage: Message = {
          id: 'error-init',
          text: '⚠️ Could not initialize chatbot. Please make sure your profile data is set up in the system.',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages([errorMessage]);
        setIsInitialized(true); // Allow sending messages anyway
      }
    } catch (error) {
      console.error('Initialization error:', error);
      const errorMessage: Message = {
        id: 'error-init',
        text: '❌ Connection error. Please try again later.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages([errorMessage]);
      setIsInitialized(true);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return;

    const messageText = inputValue;

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: messageText,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const userId = getUserId();

      const response = await fetch(`${API_BASE}/chatbot/message`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          message: messageText,
        }),
      });

      const data = await response.json();

      if (data.success && data.message) {
        const botMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: data.message,
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, botMessage]);
      } else {
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          text: '❌ Failed to get response. Please try again.',
          sender: 'bot',
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 2).toString(),
        text: '❌ Error connecting to chat. Please check your connection and try again.',
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = async () => {
    try {
      const userId = getUserId();

      await fetch(`${API_BASE}/chatbot/clear`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });
      setMessages([]);
      setIsInitialized(false);
    } catch (error) {
      console.error('Clear error:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Floating Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-full p-4 shadow-lg transition transform hover:scale-110 animate-bounce"
          title="Open JobFlow Assistant"
          aria-label="Open chat"
        >
          <MessageCircle size={24} />
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl w-96 h-[32rem] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-300">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-4 flex justify-between items-center">
            <div>
              <h3 className="font-bold text-lg">JobFlow AI Assistant</h3>
              <p className="text-blue-100 text-xs">
                {isInitialized ? '🟢 Ready to help' : 'Initializing...'}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setIsMinimized(!isMinimized)}
                className="hover:bg-blue-700 p-1.5 rounded transition"
                title="Minimize"
                aria-label="Minimize chat"
              >
                <Minimize2 size={18} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="hover:bg-blue-700 p-1.5 rounded transition"
                title="Close"
                aria-label="Close chat"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Messages Area */}
          {!isMinimized && (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-950">
                {messages.length === 0 && isInitialized && (
                  <div className="text-center text-gray-400 text-sm h-full flex items-center justify-center">
                    <div>
                      <p className="text-2xl mb-2">👋</p>
                      <p>Start a conversation!</p>
                    </div>
                  </div>
                )}

                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs px-4 py-3 rounded-lg text-sm whitespace-pre-wrap leading-relaxed break-words ${
                        message.sender === 'user'
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-gray-800 text-gray-100 rounded-bl-none'
                      }`}
                    >
                      {message.text}
                    </div>
                  </div>
                ))}

                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-800 px-4 py-3 rounded-lg rounded-bl-none flex gap-2 items-center">
                      <Loader size={16} className="animate-spin text-blue-400" />
                      <span className="text-gray-300 text-sm">Thinking...</span>
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Input Area */}
              <div className="border-t border-gray-800 p-3 bg-gray-900 space-y-2">
                {/* Quick Actions */}
                {messages.length > 1 && (
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={clearChat}
                      className="text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 px-2 py-1 rounded flex items-center gap-1 transition"
                      title="Clear chat history"
                      aria-label="Clear chat"
                    >
                      <Trash2 size={12} />
                      Clear
                    </button>
                  </div>
                )}

                {/* Message Input */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && sendMessage()}
                    placeholder="Ask me anything..."
                    disabled={isLoading}
                    className="flex-1 bg-gray-800 text-white p-2.5 rounded-lg border border-gray-700 focus:border-blue-500 outline-none text-sm disabled:opacity-50 disabled:cursor-not-allowed placeholder-gray-500 transition"
                    aria-label="Message input"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || !inputValue.trim()}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white p-2.5 rounded-lg transition disabled:cursor-not-allowed flex items-center justify-center"
                    title="Send message"
                    aria-label="Send message"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};