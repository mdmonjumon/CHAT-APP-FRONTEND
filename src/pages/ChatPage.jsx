import React, { useState } from 'react';
import { Send, Image, Smile, MoreVertical, Search, Phone, Video, Menu, X } from 'lucide-react';

const ChatPage = () => {
  const [message, setMessage] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-base-200 flex overflow-hidden relative">
      
      {/* --- SIDEBAR / DRAWER --- */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-base-100 border-r border-base-300 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <h1 className="text-xl font-bold">Messages</h1>
          <button 
            className="lg:hidden btn btn-ghost btn-sm btn-circle" 
            onClick={() => setIsSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Search */}
        <div className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-3 text-base-content/40" size={18} />
            <input type="text" placeholder="Search chats..." className="input input-bordered w-full pl-10 input-sm focus:outline-primary" />
          </div>
        </div>

        {/* Contacts List */}
        <div className="overflow-y-auto flex-1 h-[calc(100vh-140px)]">
          {[1, 2, 3, 4, 5].map((i) => (
            <div 
              key={i} 
              onClick={() => setIsSidebarOpen(false)} // Close on mobile when user is selected
              className="flex items-center gap-3 p-4 hover:bg-base-200 cursor-pointer transition-colors border-b border-base-200/50"
            >
              <div className="avatar online">
                <div className="w-12 rounded-full">
                  <img src={`https://i.pravatar.cc/150?u=${i + 10}`} alt="user" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold truncate">User {i}</span>
                  <span className="text-xs opacity-50">12:45 PM</span>
                </div>
                <p className="text-sm opacity-60 truncate">Click to open this chat...</p>
              </div>
            </div>
          ))}
        </div>
      </aside>

      {/* --- OVERLAY (Mobile only) --- */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* --- MAIN CHAT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-base-100">
        
        {/* Chat Header */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center bg-base-100/50 backdrop-blur-md">
          <div className="flex items-center gap-3">
            {/* Toggle Button for Mobile */}
            <button 
              className="btn btn-ghost btn-circle lg:hidden" 
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            <div className="avatar online">
              <div className="w-10 rounded-full">
                <img src="https://i.pravatar.cc/150?u=11" alt="current-chat" />
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm sm:text-base">User 1</h3>
              <p className="text-[10px] sm:text-xs text-success">Online</p>
            </div>
          </div>

          <div className="flex gap-2 sm:gap-4 text-base-content/60">
            <button className="btn btn-ghost btn-circle btn-sm sm:btn-md"><Phone size={20} /></button>
            <button className="btn btn-ghost btn-circle btn-sm sm:btn-md"><Video size={20} /></button>
            <button className="btn btn-ghost btn-circle btn-sm sm:btn-md"><MoreVertical size={20} /></button>
          </div>
        </div>

        {/* Message Display Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-base-200/30">
          <div className="chat chat-start">
            <div className="chat-image avatar">
              <div className="w-10 rounded-full">
                <img src="https://i.pravatar.cc/150?u=11" alt="avatar" />
              </div>
            </div>
            <div className="chat-bubble chat-bubble-ghost bg-base-100 shadow-sm">
              Hello! Try resizing your window or opening this on your phone.
            </div>
          </div>

          <div className="chat chat-end">
            <div className="chat-bubble chat-bubble-primary shadow-md text-primary-content">
              Wow, it works perfectly on mobile now!
            </div>
            <div className="chat-footer opacity-50 text-xs mt-1">Seen</div>
          </div>
        </div>

        {/* Message Input Area */}
        <div className="p-4 bg-base-100 border-t border-base-300">
          <div className="flex items-center gap-2 max-w-6xl mx-auto">
            <button className="btn btn-ghost btn-circle btn-sm text-base-content/60">
              <Image size={20} />
            </button>
            
            <div className="flex-1 relative">
              <input 
                type="text" 
                placeholder="Type a message..." 
                className="input input-bordered w-full focus:outline-primary"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>

            <button className={`btn btn-circle btn-primary ${!message.trim() && 'btn-disabled'}`}>
              <Send size={20} />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;