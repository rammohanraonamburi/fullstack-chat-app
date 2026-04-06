'use client';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001');

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Generate a fake "User ID" for this specific browser session
  const [userId] = useState(() => Math.random().toString(36).substr(2, 9));

  useEffect(() => {
    fetchMessages();

    socket.on('messageReceived', (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    socket.on('messageUpdated', (updatedMsg) => {
      setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    return () => {
      socket.off('messageReceived');
      socket.off('messageUpdated');
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
      body: JSON.stringify({ content: input, sender: userId }),
    });

    setInput('');
  };

  const togglePin = async (id) => {
    await fetch(`http://localhost:5001/api/messages/${id}/pin`, { method: 'PATCH' });
  };

  // NEW: Delete for Everyone
  const deleteForEveryone = async (id) => {
    await fetch(`http://localhost:5001/api/messages/${id}/deleteForEveryone`, { method: 'PATCH' });
  };

  // NEW: Delete for Me
  const deleteForMe = async (id) => {
    await fetch(`http://localhost:5001/api/messages/${id}/deleteForMe`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    // Immediately hide it locally without waiting for a socket event
    setMessages((prev) => prev.map(m => m._id === id ? { ...m, hiddenBy: [...(m.hiddenBy || []), userId] } : m));
  };

  // Filter out messages hidden by THIS specific user, AND apply search
  const visibleMessages = messages
    .filter((msg) => !(msg.hiddenBy || []).includes(userId))
    .filter((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-screen bg-gray-100 font-sans">
      <header className="bg-white shadow-md p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">ChatApp</h1>
            <span className="text-xs text-gray-400">Your Session ID: {userId}</span>
          </div>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 p-2 border border-gray-300 rounded-full px-4 focus:ring-2 focus:ring-blue-400 outline-none text-sm"
          />
        </div>
      </header>

      <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-center text-xs font-semibold text-yellow-800">
        📌 {visibleMessages.filter(m => m.isPinned && !m.deletedForEveryone).length} Pinned Messages
      </div>

      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 max-w-4xl mx-auto w-full">
        {visibleMessages.length > 0 ? (
          visibleMessages.map((msg) => (
            <div 
              key={msg._id} 
              className={`group relative p-4 rounded-2xl transition-all duration-200 ${
                msg.deletedForEveryone ? 'bg-gray-200 border border-gray-300 opacity-70' :
                msg.isPinned ? 'bg-yellow-100 border-2 border-yellow-300 shadow-sm' : 'bg-white shadow-sm hover:shadow-md'
              }`}
            >
              <p className={`text-gray-800 leading-relaxed ${msg.deletedForEveryone ? 'italic text-gray-500' : ''}`}>
                {msg.content}
              </p>
              
              <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100 italic">
                <span className="text-[10px] text-gray-400">
                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                
                {/* Hide action buttons if the message is already deleted for everyone */}
                {!msg.deletedForEveryone && (
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => togglePin(msg._id)} className="text-blue-500 text-xs font-medium hover:text-blue-700">
                      {msg.isPinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button onClick={() => deleteForMe(msg._id)} className="text-orange-400 text-xs font-medium hover:text-orange-600">
                      Delete for Me
                    </button>
                    <button onClick={() => deleteForEveryone(msg._id)} className="text-red-500 text-xs font-medium hover:text-red-700">
                      Delete for Everyone
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-20 text-gray-400">No messages found.</div>
        )}
      </main>

      <footer className="bg-white border-t p-4">
        <form onSubmit={sendMessage} className="max-w-4xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Write a message..."
            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <button type="submit" className="bg-blue-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}