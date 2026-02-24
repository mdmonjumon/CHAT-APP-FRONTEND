import React, { useState } from "react";
import {
  Send,
  Image,
  Smile,
  MoreVertical,
  Search,
  Phone,
  Video,
  Menu,
  X,
  LogOut,
  Settings,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { signOutUser } = useAuth();
  const navigate = useNavigate()

  // Mock user data (This would eventually come from your Auth Context)
  const currentUser = {
    name: "John Doe",
    email: "john@example.com",
    profilePic: "https://i.pravatar.cc/150?u=myaccount",
  };

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/login")

    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="h-screen bg-base-200 flex overflow-hidden relative">
      {/* --- SIDEBAR --- */}
      <aside
        className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-base-100 border-r border-base-300 transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"}
        flex flex-col
      `}
      >
        {/* Sidebar Header */}
        <div className="p-4 border-b border-base-300 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-content font-bold">
              C
            </div>
            <h1 className="text-xl font-bold">Chatly</h1>
          </div>
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
            <Search
              className="absolute left-3 top-3 text-base-content/40"
              size={18}
            />
            <input
              type="text"
              placeholder="Search chats..."
              className="input input-bordered w-full pl-10 input-sm focus:outline-primary"
            />
          </div>
        </div>

        {/* Contacts List (Scrollable area) */}
        <div className="overflow-y-auto flex-1">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              onClick={() => setIsSidebarOpen(false)}
              className="flex items-center gap-3 p-4 hover:bg-base-200 cursor-pointer transition-colors"
            >
              <div className="avatar online">
                <div className="w-12 rounded-full">
                  <img src={`https://i.pravatar.cc/150?u=${i + 20}`} />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <span className="font-bold truncate">User {i}</span>
                  <span className="text-xs opacity-50">12:45 PM</span>
                </div>
                <p className="text-sm opacity-60 truncate">
                  Message preview text...
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* --- USER PROFILE & LOGOUT SECTION (Fixed at bottom) --- */}
        <div className="p-4 border-t border-base-300 bg-base-100">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={currentUser.profilePic} alt="me" />
                </div>
              </div>
              <div className="text-left overflow-hidden">
                <p className="font-bold text-sm truncate w-32">
                  {currentUser.name}
                </p>
                <p className="text-xs opacity-50 truncate w-32">
                  {currentUser.email}
                </p>
              </div>
            </div>

            <div className="flex gap-1">
              <button className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-primary">
                <Settings size={18} />
              </button>
              <button
                onClick={handleLogout}
                className="btn btn-ghost btn-sm btn-circle text-error hover:bg-error/10"
                title="Logout"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* --- OVERLAY & MAIN CONTENT (Same as before) --- */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="flex-1 flex flex-col min-w-0 bg-base-100">
        <div className="p-4 border-b border-base-300 flex items-center gap-3">
          <button
            className="btn btn-ghost btn-circle lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu size={24} />
          </button>
          <div className="avatar online">
            <div className="w-10 rounded-full">
              <img src="https://i.pravatar.cc/150?u=21" />
            </div>
          </div>
          <h3 className="font-bold">{currentUser?.name}</h3>
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-base-200/30">
          {/* Messages go here */}
          <div className="text-center opacity-30 mt-10 italic">
            Select a contact to start chatting
          </div>
        </div>

        <div className="p-4 bg-base-100 border-t border-base-300">
          <input
            type="text"
            placeholder="Type a message..."
            className="input input-bordered w-full"
          />
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
