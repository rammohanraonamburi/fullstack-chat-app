'use client';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Connect to your backend port 5001
const socket = io('http://localhost:5001');

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');

  // 1. Load messages on startup
  useEffect(() => {
    fetchMessages();

    // 2. Listen for real-time updates
    socket.on('messageReceived', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => socket.off('messageReceived');
  }, []);

  const fetchMessages = async () => {
    const res = await fetch('http://localhost:5001/api/messages');
    const data = await res.json();
    setMessages(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const newMessage = { content: input };

    // Send to Backend API
    await fetch('http://localhost:5001/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newMessage),
    });

    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm p-4 text-center border-b">
        <h1 className="text-xl font-bold text-gray-800">Real-Time Chat App</h1>
      </header>

      {/* Pinned Messages Section (Requirement 4.3) */}
      <div className="bg-yellow-50 p-2 border-b text-sm text-yellow-700">
        <strong>Pinned:</strong> {messages.filter(m => m.isPinned).length} messages pinned.
      </div>

      {/* Message List */}
      <main className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg._id} className={`p-3 rounded-lg max-w-md ${msg.isPinned ? 'bg-yellow-100 border-l-4 border-yellow-500' : 'bg-white shadow-sm'}`}>
            <p className="text-gray-800">{msg.content}</p>
            <div className="flex justify-between items-center mt-2 text-xs text-gray-400">
              <span>{new Date(msg.timestamp).toLocaleTimeString()}</span>
              <div className="space-x-2">
                <button className="text-blue-500 hover:underline">Pin</button>
                <button className="text-red-500 hover:underline">Delete</button>
              </div>
            </div>
          </div>
        ))}
      </main>

      {/* Input Field */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-1 p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button type="submit" className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
          Send
        </button>
      </form>
    </div>
  );
}