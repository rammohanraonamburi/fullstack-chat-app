'use client';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

// Connect to your backend port 5001
const socket = io('http://localhost:5001');

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  // 1. Load messages and setup socket listeners
  useEffect(() => {
    fetchMessages();

    socket.on('messageReceived', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on('messageUpdated', (updatedMsg) => {
      setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    socket.on('messageDeleted', (id) => {
      setMessages((prev) => prev.filter(m => m._id !== id));
    });

    return () => {
      socket.off('messageReceived');
      socket.off('messageUpdated');
      socket.off('messageDeleted');
    };
  }, []);

  const fetchMessages = async () => {
    const res = await fetch('http://localhost:5001/api/messages');
    const data = await res.json();
    setMessages(data);
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    await fetch('http://localhost:5001/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: input }),
    });

    setInput('');
  };

  const togglePin = async (id) => {
    await fetch(`http://localhost:5001/api/messages/${id}/pin`, { method: 'PATCH' });
  };

  const deleteMessage = async (id) => {
    await fetch(`http://localhost:5001/api/messages/${id}`, { method: 'DELETE' });
  };

  // Requirement 4.1: Filter messages based on search query
  const filteredMessages = messages.filter((msg) =>
    msg.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      {/* Header & Search Bar */}
      <header className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">ChatApp</h1>
          
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 p-2 border border-gray-300 rounded-full px-4 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
          />
        </div>
      </header>

      {/* Pinned Messages Summary */}
      <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-center text-xs font-semibold text-yellow-800">
        📌 {messages.filter(m => m.isPinned).length} Pinned Messages
      </div>

      {/* Message List */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 max-w-4xl mx-auto w-full">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg) => (
            <div 
              key={msg._id} 
              className={`group relative p-4 rounded-2xl transition-all duration-200 ${
                msg.isPinned 
                ? 'bg-yellow-100 border-2 border-yellow-300 shadow-sm' 
                : 'bg-white shadow-sm hover:shadow-md'
              }`}
            >
              <p className="text-gray-800 leading-relaxed">{msg.content}</p>
              
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 italic">
                <span className="text-[10px] text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => togglePin(msg._id)}
                    className="text-blue-500 text-xs font-medium hover:text-blue-700"
                  >
                    {msg.isPinned ? 'Unpin' : 'Pin'}
                  </button>
                  <button 
                    onClick={() => deleteMessage(msg._id)}
                    className="text-red-400 text-xs font-medium hover:text-red-600"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400">No messages found.</div>
        )}
      </main>

      {/* Message Input Area */}
      <footer className="bg-white border-t p-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 active:scale-95 transition-all shadow-lg shadow-blue-200"
          >
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}