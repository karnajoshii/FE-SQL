"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import Recharts components to avoid SSR issues
const ChartComponents = dynamic(() => import("./ChartComponents"), {
  ssr: false,
});

export default function InsuranceChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = input.trim();
    const timestamp = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    setMessages((prev) => [
      ...prev,
      { text: userMessage, sender: "user", timestamp },
    ]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://192.168.1.55:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          text: data.response,
          senderwoord: "bot",
          visualization: data.visualization,
          timestamp,
        },
      ]);
    } catch (error) {
      console.error("Error:", error);
      setMessages((prev) => [
        ...prev,
        {
          text: "Oops, something went wrong. Try again!",
          sender: "bot",
          timestamp,
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetConversation = async () => {
    try {
      await fetch("http://192.168.1.55:5000/api/reset", { method: "POST" });
      setMessages([]);
    } catch (error) {
      console.error("Error resetting conversation:", error);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
      {/* Header */}

      <header className="bg-gray-900 text-white p-4 shadow-lg">
        <div className="relative flex items-center justify-center max-w-screen-xl mx-auto">
          {/* Center: Title */}
          <h1 className="text-2xl font-semibold text-center">
            Auto Insurance Assistant
          </h1>

          {/* Right: New Chat Button */}
          <div className="absolute right-4">
            <button
              onClick={resetConversation}
              className="bg-white text-gray-700 font-medium py-2 px-4 rounded-full hover:bg-gray-100 transition duration-200"
            >
              New Chat
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-grow flex flex-col container mx-auto p-3">
        <div className="flex-grow overflow-y-auto bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
          {messages.length === 0 ? (
            <div className="text-center text-gray-600 my-12 animate-fade-in">
              <h2 className="text-xl font-semibold mb-2">
                Welcome to Your Insurance Assistant!
              </h2>
              <p className="mb-4">
                Ask anything about auto insurance to get started.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 flex flex-col ${
                  msg.sender === "user" ? "items-end" : "items-start"
                } animate-slide-in w-full`}
              >
                {/* Message Container */}
                <div
                  className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
                    msg.sender === "user"
                      ? "bg-gray-900 text-white"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  <p className="text-sm">{msg.text}</p>
                </div>
                {/* Chart Container (Full Width) */}
                {msg.visualization && (
                  <div className="w-full mt-2">
                    <div className="text-center text-xs font-medium text-gray-600 mb-2">
                      Data Visualization
                    </div>
                    <div className="w-full h-[300px] bg-white rounded-xl shadow-inner border border-gray-100 p-4">
                      <ChartComponents visualization={msg.visualization} />
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="mb-4 flex justify-start">
              <div className="bg-gray-100 rounded-2xl p-4 max-w-[75%] shadow-sm">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                  <div
                    className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
                    style={{ animationDelay: "0.4s" }}
                  ></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="sticky bottom-0 mt-4 bg-gradient-to-br from-blue-50 to-gray-100 p-3 z-10 flex gap-3"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-grow p-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm placeholder-gray-400 text-sm"
            placeholder="Ask about auto insurance..."
            disabled={isLoading}
          />
          <button
            type="submit"
            className="bg-gray-900 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-full disabled:bg-gray-400 transition duration-200"
            disabled={isLoading}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </form>
      </main>
    </div>
  );
}
