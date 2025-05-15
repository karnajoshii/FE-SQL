"use client";

import { useState, useEffect, useRef } from "react";
import dynamic from "next/dynamic";

// Dynamically import Recharts components to avoid SSR issues
const ChartComponents = dynamic(() => import("./ChartComponents"), {
  ssr: false,
});

// Generate a simple client_id (UUID-like) for session continuity
const generateClientId = () => {
  return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export default function InsuranceChatbot() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [chatId, setChatId] = useState(null);
  const messagesEndRef = useRef(null);

  // Initialize client_id and load chat_id from localStorage
  useEffect(() => {
    // Get or generate client_id
    let clientId = localStorage.getItem("client_id");
    if (!clientId) {
      clientId = generateClientId();
      localStorage.setItem("client_id", clientId);
    }

    // Get chat_id from localStorage
    const storedChatId = localStorage.getItem("chat_id");

    if (storedChatId) {
      // If chat_id exists, set it and fetch history
      setChatId(storedChatId);
      fetchHistory(storedChatId);
    } else {
      // Create a new session
      createNewSession(clientId);
    }
  }, []);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Create a new session
  const createNewSession = async (clientId) => {
    try {
      const response = await fetch(
        "http://192.168.1.14:5000/api/chat/session",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ client_id: clientId }),
        }
      );
      const data = await response.json();
      if (data.status === "success" && data.chat_id) {
        setChatId(data.chat_id);
        localStorage.setItem("chat_id", data.chat_id);
      } else {
        console.error("Failed to create session:", data.message);
      }
    } catch (error) {
      console.error("Error creating session:", error);
    }
  };

  // Fetch conversation history
  const fetchHistory = async (chatId) => {
    try {
      const response = await fetch(
        `http://192.168.1.14:5000/api/chat/history/${chatId}`
      );
      const data = await response.json();
      if (data.status === "success" && data.history) {
        const formattedMessages = data.history.map((msg) => ({
          text: msg.content,
          sender: msg.role,
          visualization: msg.visualization,
          timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        }));
        setMessages(formattedMessages);
      } else {
        console.error("Failed to fetch history:", data.message);
      }
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || !chatId) return;

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
      const response = await fetch("http://192.168.1.14:5000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, chat_id: chatId }),
      });

      const data = await response.json();
      setMessages((prev) => [
        ...prev,
        {
          text: data.response,
          sender: "bot",
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
    if (!chatId) return;

    try {
      await fetch("http://192.168.1.14:5000/api/reset", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId }),
      });
      setMessages([]);
      setChatId(null);
      localStorage.removeItem("chat_id");
      // Create a new session
      const clientId = localStorage.getItem("client_id");
      await createNewSession(clientId);
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
              disabled={isLoading}
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
            messages.map((msg,index) => (
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
                {msg?.visualization &&
                  Object?.keys(msg?.visualization)?.length &&
                  msg?.sender === "assistant" && (
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

// Belcode code is working for the multiple chart

// "use client";

// import { useState, useEffect, useRef } from "react";
// import dynamic from "next/dynamic";

// // Dynamically import Recharts components to avoid SSR issues
// const ChartComponents = dynamic(() => import("./ChartComponents"), {
//   ssr: false,
// });

// // API base URL (configurable via environment variable)
// const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";

// // Generate a simple client_id (UUID-like) for session continuity
// const generateClientId = () => {
//   return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
// };

// export default function InsuranceChatbot() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const [chatId, setChatId] = useState(null);
//   const messagesEndRef = useRef(null);

//   // Initialize client_id and load chat_id from localStorage
//   useEffect(() => {
//     // Get or generate client_id
//     let clientId = localStorage.getItem("client_id");
//     if (!clientId) {
//       clientId = generateClientId();
//       localStorage.setItem("client_id", clientId);
//     }

//     // Get chat_id from localStorage
//     const storedChatId = localStorage.getItem("chat_id");

//     if (storedChatId) {
//       // If chat_id exists, set it and fetch history
//       setChatId(storedChatId);
//       fetchHistory(storedChatId);
//     } else {
//       // Create a new session
//       createNewSession(clientId);
//     }
//   }, []);

//   // Auto-scroll to bottom when messages update
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   // Create a new session
//   const createNewSession = async (clientId) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/chat/session`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ client_id: clientId }),
//       });
//       const data = await response.json();
//       if (data.status === "success" && data.chat_id) {
//         setChatId(data.chat_id);
//         localStorage.setItem("chat_id", data.chat_id);
//       } else {
//         console.error("Failed to create session:", data.message);
//       }
//     } catch (error) {
//       console.error("Error creating session:", error);
//     }
//   };

//   // Fetch conversation history
//   const fetchHistory = async (chatId) => {
//     try {
//       const response = await fetch(`${API_BASE_URL}/api/chat/history/${chatId}`);
//       const data = await response.json();
//       if (data.status === "success" && data.history) {
//         const formattedMessages = data.history.map((msg) => ({
//           text: msg.content,
//           sender: msg.role,
//           visualization: msg.visualization,
//           timestamp: new Date(msg.timestamp).toLocaleTimeString([], {
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//         }));
//         setMessages(formattedMessages);
//       } else {
//         console.error("Failed to fetch history:", data.message);
//       }
//     } catch (error) {
//       console.error("Error fetching history:", error);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!input.trim() || !chatId) return;

//     const userMessage = input.trim();
//     const timestamp = new Date().toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//     setMessages((prev) => [
//       ...prev,
//       { text: userMessage, sender: "user", timestamp },
//     ]);
//     setInput("");
//     setIsLoading(true);

//     try {
//       const response = await fetch(`${API_BASE_URL}/api/chat`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: userMessage, chat_id: chatId }),
//       });

//       const data = await response.json();
//       setMessages((prev) => [
//         ...prev,
//         {
//           text: data.response,
//           sender: "bot",
//           visualization: data.visualization,
//           timestamp,
//         },
//       ]);
//     } catch (error) {
//       console.error("Error:", error);
//       setMessages((prev) => [
//         ...prev,
//         {
//           text: "Oops, something went wrong. Try again!",
//           sender: "bot",
//           timestamp,
//         },
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const resetConversation = async () => {
//     if (!chatId) return;

//     try {
//       await fetch(`${API_BASE_URL}/api/reset`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ chat_id: chatId }),
//       });
//       setMessages([]);
//       setChatId(null);
//       localStorage.removeItem("chat_id");
//       // Create a new session
//       const clientId = localStorage.getItem("client_id");
//       await createNewSession(clientId);
//     } catch (error) {
//       console.error("Error resetting conversation:", error);
//     }
//   };

//   return (
//     <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
//       {/* Header */}
//       <header className="bg-gray-900 text-white p-4 shadow-lg">
//         <div className="relative flex items-center justify-center max-w-screen-xl mx-auto">
//           {/* Center: Title */}
//           <h1 className="text-2xl font-semibold text-center">
//             Auto Insurance Assistant
//           </h1>

//           {/* Right: New Chat Button */}
//           <div className="absolute right-4">
//             <button
//               onClick={resetConversation}
//               className="bg-white text-gray-700 font-medium py-2 px-4 rounded-full hover:bg-gray-100 transition duration-200"
//               disabled={isLoading}
//             >
//               New Chat
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Main Chat Area */}
//       <main className="flex-grow flex flex-col container mx-auto p-3">
//         <div className="flex-grow overflow-y-auto bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
//           {messages.length === 0 ? (
//             <div className="text-center text-gray-600 my-12 animate-fade-in">
//               <h2 className="text-xl font-semibold mb-2">
//                 Welcome to Your Insurance Assistant!
//               </h2>
//               <p className="mb-4">
//                 Ask anything about auto insurance to get started.
//               </p>
//             </div>
//           ) : (
//             messages.map((msg, index) => (
//               <div
//                 key={index}
//                 className={`mb-4 flex flex-col ${
//                   msg.sender === "user" ? "items-end" : "items-start"
//                 } animate-slide-in w-full`}
//               >
//                 {/* Message Container */}
//                 <div
//                   className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
//                     msg.sender === "user"
//                       ? "bg-gray-900 text-white"
//                       : "bg-gray-100 text-gray-800"
//                   }`}
//                 >
//                   <p className="text-sm">{msg.text}</p>
//                 </div>
//                 {/* Chart Container (Full Width) */}
//                 {msg.visualization && (
//                   <div className="w-full mt-2">
//                     <div className="text-center text-xs font-medium text-gray-600 mb-2">
//                       Data Visualization
//                     </div>
//                     <div className="w-full h-[300px] bg-white rounded-xl shadow-inner border border-gray-100 p-4">
//                       {msg.visualization.data ? (
//                         <ChartComponents visualization={msg.visualization} />
//                       ) : (
//                         <div className="text-red-500 p-2">
//                           Invalid visualization data
//                         </div>
//                       )}
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))
//           )}
//           {isLoading && (
//             <div className="mb-4 flex justify-start">
//               <div className="bg-gray-100 rounded-2xl p-4 max-w-[75%] shadow-sm">
//                 <div className="flex space-x-2">
//                   <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
//                   <div
//                     className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
//                     style={{ animationDelay: "0.2s" }}
//                   ></div>
//                   <div
//                     className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
//                     style={{ animationDelay: "0.4s" }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input Form */}
//         <form
//           onSubmit={handleSubmit}
//           className="sticky bottom-0 mt-4 bg-gradient-to-br from-blue-50 to-gray-100 p-3 z-10 flex gap-3"
//         >
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             className="flex-grow p-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm placeholder-gray-400 text-sm"
//             placeholder="Ask about auto insurance..."
//             disabled={isLoading}
//           />
//           <button
//             type="submit"
//             className="bg-gray-900 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-full disabled:bg-gray-400 transition duration-200"
//             disabled={isLoading}
//           >
//             <svg
//               className="w-5 h-5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M9 5l7 7-7 7"
//               />
//             </svg>
//           </button>
//         </form>
//       </main>
//     </div>
//   );
// }

// Below code is don't include the session functionality

// "use client";

// import { useState, useEffect, useRef } from "react";
// import dynamic from "next/dynamic";

// // Dynamically import Recharts components to avoid SSR issues
// const ChartComponents = dynamic(() => import("./ChartComponents"), {
//   ssr: false,
// });

// export default function InsuranceChatbot() {
//   const [messages, setMessages] = useState([]);
//   const [input, setInput] = useState("");
//   const [isLoading, setIsLoading] = useState(false);
//   const messagesEndRef = useRef(null);

//   // Auto-scroll to bottom when messages update
//   useEffect(() => {
//     scrollToBottom();
//   }, [messages]);

//   const scrollToBottom = () => {
//     messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!input.trim()) return;

//     const userMessage = input.trim();
//     const timestamp = new Date().toLocaleTimeString([], {
//       hour: "2-digit",
//       minute: "2-digit",
//     });
//     setMessages((prev) => [
//       ...prev,
//       { text: userMessage, sender: "user", timestamp },
//     ]);
//     setInput("");
//     setIsLoading(true);

//     try {
//       const response = await fetch("http://192.168.1.4:5000/api/chat", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ message: userMessage }),
//       });

//       const data = await response.json();
//       setMessages((prev) => [
//         ...prev,
//         {
//           text: data.response,
//           senderwoord: "bot",
//           visualization: data.visualization,
//           timestamp,
//         },
//       ]);
//     } catch (error) {
//       console.error("Error:", error);
//       setMessages((prev) => [
//         ...prev,
//         {
//           text: "Oops, something went wrong. Try again!",
//           sender: "bot",
//           timestamp,
//         },
//       ]);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   const resetConversation = async () => {
//     try {
//       await fetch("http://192.168.1.4:5000/api/reset", { method: "POST" });
//       setMessages([]);
//     } catch (error) {
//       console.error("Error resetting conversation:", error);
//     }
//   };

//   return (
//     <div className="flex flex-col min-h-screen bg-gradient-to-br from-blue-50 to-gray-100">
//       {/* Header */}

//       <header className="bg-gray-900 text-white p-4 shadow-lg">
//         <div className="relative flex items-center justify-center max-w-screen-xl mx-auto">
//           {/* Center: Title */}
//           <h1 className="text-2xl font-semibold text-center">
//             Auto Insurance Assistant
//           </h1>

//           {/* Right: New Chat Button */}
//           <div className="absolute right-4">
//             <button
//               onClick={resetConversation}
//               className="bg-white text-gray-700 font-medium py-2 px-4 rounded-full hover:bg-gray-100 transition duration-200"
//             >
//               New Chat
//             </button>
//           </div>
//         </div>
//       </header>

//       {/* Main Chat Area */}
//       <main className="flex-grow flex flex-col container mx-auto p-3">
//         <div className="flex-grow overflow-y-auto bg-white rounded-2xl shadow-xl p-6 border border-gray-200">
//           {messages.length === 0 ? (
//             <div className="text-center text-gray-600 my-12 animate-fade-in">
//               <h2 className="text-xl font-semibold mb-2">
//                 Welcome to Your Insurance Assistant!
//               </h2>
//               <p className="mb-4">
//                 Ask anything about auto insurance to get started.
//               </p>
//             </div>
//           ) : (
//             messages.map((msg, index) => (
//               <div
//                 key={index}
//                 className={`mb-4 flex flex-col ${
//                   msg.sender === "user" ? "items-end" : "items-start"
//                 } animate-slide-in w-full`}
//               >
//                 {/* Message Container */}
//                 <div
//                   className={`max-w-[75%] p-4 rounded-2xl shadow-sm ${
//                     msg.sender === "user"
//                       ? "bg-gray-900 text-white"
//                       : "bg-gray-100 text-gray-800"
//                   }`}
//                 >
//                   <p className="text-sm">{msg.text}</p>
//                 </div>
//                 {/* Chart Container (Full Width) */}
//                 {msg.visualization && (
//                   <div className="w-full mt-2">
//                     <div className="text-center text-xs font-medium text-gray-600 mb-2">
//                       Data Visualization
//                     </div>
//                     <div className="w-full h-[300px] bg-white rounded-xl shadow-inner border border-gray-100 p-4">
//                       <ChartComponents visualization={msg.visualization} />
//                     </div>
//                   </div>
//                 )}
//               </div>
//             ))
//           )}
//           {isLoading && (
//             <div className="mb-4 flex justify-start">
//               <div className="bg-gray-100 rounded-2xl p-4 max-w-[75%] shadow-sm">
//                 <div className="flex space-x-2">
//                   <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></div>
//                   <div
//                     className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
//                     style={{ animationDelay: "0.2s" }}
//                   ></div>
//                   <div
//                     className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"
//                     style={{ animationDelay: "0.4s" }}
//                   ></div>
//                 </div>
//               </div>
//             </div>
//           )}
//           <div ref={messagesEndRef} />
//         </div>

//         {/* Input Form */}
//         <form
//           onSubmit={handleSubmit}
//           className="sticky bottom-0 mt-4 bg-gradient-to-br from-blue-50 to-gray-100 p-3 z-10 flex gap-3"
//         >
//           <input
//             type="text"
//             value={input}
//             onChange={(e) => setInput(e.target.value)}
//             className="flex-grow p-3 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white shadow-sm placeholder-gray-400 text-sm"
//             placeholder="Ask about auto insurance..."
//             disabled={isLoading}
//           />
//           <button
//             type="submit"
//             className="bg-gray-900 hover:bg-gray-700 text-white font-medium py-3 px-6 rounded-full disabled:bg-gray-400 transition duration-200"
//             disabled={isLoading}
//           >
//             <svg
//               className="w-5 h-5"
//               fill="none"
//               stroke="currentColor"
//               viewBox="0 0 24 24"
//               xmlns="http://www.w3.org/2000/svg"
//             >
//               <path
//                 strokeLinecap="round"
//                 strokeLinejoin="round"
//                 strokeWidth="2"
//                 d="M9 5l7 7-7 7"
//               />
//             </svg>
//           </button>
//         </form>
//       </main>
//     </div>
//   );
// }
