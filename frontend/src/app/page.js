'use client';
import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5001');

export default function Home() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Start empty to prevent Hydration Errors, then generate on client mount
  const [userId, setUserId] = useState('');

  useEffect(() => {
    // Generate a unique session ID for this browser tab
    setUserId(Math.random().toString(36).substr(2, 9));

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
    if (!input.trim() || !userId) return;

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

  const deleteForEveryone = async (id) => {
    await fetch(`http://localhost:5001/api/messages/${id}/deleteForEveryone`, { method: 'PATCH' });
  };

  const deleteForMe = async (id) => {
    await fetch(`http://localhost:5001/api/messages/${id}/deleteForMe`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });
    setMessages((prev) => prev.map(m => m._id === id ? { ...m, hiddenBy: [...(m.hiddenBy || []), userId] } : m));
  };

  // Filter hidden and searched messages
  const visibleMessages = messages
    .filter((msg) => !(msg.hiddenBy || []).includes(userId))
    .filter((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="flex flex-col h-screen bg-gray-50 font-sans">
      
      {/* Header */}
      <header className="bg-white shadow-sm p-4 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex flex-col">
            <h1 className="text-2xl font-extrabold text-blue-600 tracking-tight">ChatApp</h1>
            <span className="text-xs text-gray-400">Your Session ID: {userId || 'loading...'}</span>
          </div>
          <input
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full md:w-64 p-2 border border-gray-200 rounded-full px-4 focus:ring-2 focus:ring-blue-400 outline-none text-sm bg-gray-50"
          />
        </div>
      </header>

      {/* Pinned Indicator */}
      <div className="bg-yellow-50 border-b border-yellow-200 p-2 text-center text-xs font-semibold text-yellow-800">
        📌 {visibleMessages.filter(m => m.isPinned && !m.deletedForEveryone).length} Pinned Messages
      </div>

      {/* Message Area */}
      <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-4 max-w-5xl mx-auto w-full">
        {visibleMessages.length > 0 ? (
          visibleMessages.map((msg) => {
            const isMine = msg.sender === userId;
            const isDeleted = msg.deletedForEveryone;
            const isPinned = msg.isPinned;

            return (
              <div key={msg._id} className={`flex w-full ${isMine ? 'justify-end' : 'justify-start'}`}>
                
                {/* Chat Bubble */}
                <div 
                  className={`group relative p-4 max-w-[85%] md:max-w-[70%] transition-all duration-200 
                    ${isMine ? 'rounded-2xl rounded-tr-sm' : 'rounded-2xl rounded-tl-sm'} 
                    ${isDeleted ? 'bg-gray-200 border border-gray-300 opacity-70 text-gray-500 italic' : 
                      isPinned ? 'bg-yellow-100 border-2 border-yellow-400 text-gray-800 shadow-sm' : 
                      isMine ? 'bg-blue-600 text-white shadow-md' : 'bg-white border border-gray-100 shadow-sm text-gray-800'
                    }`}
                >
                  
                  {/* Pinned Badge */}
                  {isPinned && !isDeleted && (
                    <div className="absolute -top-2 -right-2 text-xl drop-shadow-md">📌</div>
                  )}

                  {/* Message Content */}
                  <p className="leading-relaxed whitespace-pre-wrap break-words">{msg.content}</p>
                  
                  {/* Meta Data & Action Buttons */}
                  <div className={`flex flex-wrap justify-between items-center mt-2 pt-2 border-t text-[10px] sm:text-xs italic 
                    ${isMine && !isPinned && !isDeleted ? 'border-blue-500/50 text-blue-200' : 'border-gray-200 text-gray-400'}`}>
                    
                    <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    
                    {!isDeleted && (
                      <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity ml-4">
                        <button 
                          onClick={() => togglePin(msg._id)} 
                          className={`font-medium hover:underline ${isMine && !isPinned ? 'hover:text-white' : 'text-blue-500 hover:text-blue-700'}`}
                        >
                          {isPinned ? 'Unpin' : 'Pin'}
                        </button>
                        <button 
                          onClick={() => deleteForMe(msg._id)} 
                          className={`font-medium hover:underline ${isMine && !isPinned ? 'hover:text-orange-200' : 'text-orange-400 hover:text-orange-600'}`}
                        >
                          Delete for Me
                        </button>
                        <button 
                          onClick={() => deleteForEveryone(msg._id)} 
                          className={`font-medium hover:underline ${isMine && !isPinned ? 'hover:text-red-200' : 'text-red-500 hover:text-red-700'}`}
                        >
                          Delete for Everyone
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-gray-400">No messages yet. Say hello!</div>
        )}
      </main>

      {/* Input Area */}
      <footer className="bg-white border-t p-4 shrink-0">
        <form onSubmit={sendMessage} className="max-w-5xl mx-auto flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button type="submit" disabled={!input.trim()} className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-200 active:scale-95">
            Send
          </button>
        </form>
      </footer>
    </div>
  );
}