import { useEffect, useRef, useState } from "react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosSecure from "../hooks/useAxiosSecure";
import LoadingSpinner from "../components/LoadingSpinner";
import ChatMessages from "../components/ChatMessages";
import useMessages from "../hooks/useMessage";

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);

  const { signOutUser } = useAuth();
  const navigate = useNavigate();
  const axiosSecure = useAxiosSecure();
  const { user, socket, loading, onlineUsers } = useAuth();
  const messageRef = useRef();
  const sidebarRef = useRef();
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // retrieve message
  const { data: messages = [], isLoading: isMessagesLoading } = useMessages(
    selectedConversationId,
  );

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // socket.io start

  useEffect(() => {
    if (socket && selectedConversationId) {
      socket.emit("join_room", selectedConversationId);
    }
  }, [socket, selectedConversationId]);

  useEffect(() => {
    if (!socket) return;
    const handleMessageReceive = (newMessage) => {
      if (newMessage.conversationId === selectedConversationId) {
        queryClient.setQueryData(
          ["messages", newMessage.conversationId],
          (oldData) => (oldData ? [...oldData, newMessage] : [newMessage]),
        );
      }

      // ইউজার লিস্ট রি-অর্ডার
      queryClient.setQueryData(["users"], (oldUsers) => {
        if (!oldUsers) return [];
        const updatedUsers = [...oldUsers];
        const senderId = newMessage?.senderId?._id;
        const targetIndex = updatedUsers.findIndex((u) => u?._id === senderId);
        if (targetIndex !== -1) {
          const [targetUser] = updatedUsers.splice(targetIndex, 1);
          return [targetUser, ...updatedUsers];
        }

        return updatedUsers;
      });
    };

    socket.on("receive_message", handleMessageReceive);

    return () => {
      socket.off("receive_message", handleMessageReceive);
    };
  }, [socket, queryClient, selectedConversationId]);

  // socket.io end

  const handleLogout = async () => {
    try {
      await signOutUser();
      navigate("/login");
    } catch (error) {
      console.error(error);
    }
  };

  // retrieve all users
  const { data: allUsers = [], isLoading: isUserLoading } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/allUsers/users");
      const withOutMe = data.data.filter((u) => u.firebaseUid !== user.uid);
      return withOutMe;
    },
  });

  // select contact and get conversation id
  const handleSelectContact = async (user) => {
    setIsSidebarOpen(false);
    setSelectedUser(user);

    const { data } = await axiosSecure.post(
      "/message/getOrCreateConversation",
      { receiverId: user?._id },
    );
    setSelectedConversationId(data?.data?._id);
  };
  // send message
  const sendMessage = async (message) => {
    if (!message.trim()) return;
    try {
      await axiosSecure.post("/message/send", {
        conversationId: selectedConversationId,
        message: message,
      });

      queryClient.setQueryData(["users"], (oldUsers) => {
        console.log("old Users ====>", oldUsers);
        if (!oldUsers) return [];

        const updatedUsers = [...oldUsers];
        console.log(updatedUsers);
        const targetIndex = updatedUsers.findIndex(
          (u) => u?.firebaseUid === selectedUser?.firebaseUid,
        );
        if (targetIndex !== -1) {
          const [targetUser] = updatedUsers.splice(targetIndex, 1);
          return [targetUser, ...updatedUsers];
        }

        return updatedUsers;
      });

      // message input field reset
      messageRef.current.value = "";
      messageRef.current.style.height = "auto";
    } catch (error) {
      console.error(error);
    }
  };

  // allUsers order change hole
  useEffect(() => {
    if (sidebarRef.current) {
      sidebarRef.current.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [allUsers]);

  // press Enter to send message
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(messageRef.current.value);
    }
  };

  if (loading) {
    return <LoadingSpinner></LoadingSpinner>;
  }

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
        {isUserLoading ? (
          <LoadingSpinner></LoadingSpinner>
        ) : (
          <div ref={sidebarRef} className="overflow-y-auto flex-1">
            {allUsers.map((user) => (
              <div
                key={user?._id}
                onClick={() => handleSelectContact(user)}
                className="flex items-center gap-3 p-4 hover:bg-base-200 cursor-pointer transition-colors"
              >
                <div
                  className={`${onlineUsers.includes(user?.firebaseUid) ? "avatar-online" : ""} avatar`}
                >
                  <div className="w-14 rounded-full">
                    <img src={user?.profilePic} />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline">
                    <span className="font-bold truncate">{user?.fullName}</span>
                    <span className="text-xs opacity-50">12:45 PM</span>
                  </div>
                  <p className="text-sm opacity-60 truncate">
                    Message preview text...
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* --- USER PROFILE & LOGOUT SECTION (Fixed at bottom) --- */}
        <div className="p-4 border-t border-base-300 bg-base-100">
          <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3">
              <div className="avatar">
                <div className="w-10 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                  <img src={user?.photoURL} alt="me" />
                </div>
              </div>
              <div className="text-left overflow-hidden">
                <p className="font-bold text-sm truncate w-32">
                  {user?.displayName}
                </p>
                <p className="text-xs opacity-50 truncate w-32">
                  {user?.email}
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
        {/* --- CHAT HEADER --- */}
        <div className="p-3 md:p-4 border-b border-base-300 flex items-center justify-between bg-base-100 shadow-sm z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              className="btn btn-ghost btn-circle lg:hidden"
              onClick={() => setIsSidebarOpen(true)}
            >
              <Menu size={24} />
            </button>

            {/* User Info (Show only if selectedUser exists) */}
            {selectedUser && (
              <div className="flex items-center gap-3 animate-in fade-in duration-300">
                <div className="avatar online">
                  <div className="w-10 md:w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    <img
                      src={selectedUser?.profilePic}
                      alt={selectedUser?.fullName}
                    />
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base leading-tight">
                    {selectedUser?.fullName}
                  </h3>

                  <div className="flex items-center gap-2">
                    <div className="relative flex h-2 w-2">
                      {onlineUsers.includes(selectedUser?.firebaseUid) && (
                        <span className="animate-status-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75"></span>
                      )}
                      <span
                        className={`relative inline-flex rounded-full h-2 w-2 ${
                          onlineUsers.includes(selectedUser?.firebaseUid)
                            ? "bg-success"
                            : "bg-slate-400"
                        }`}
                      ></span>
                    </div>

                    <p className="text-xs font-semibold tracking-wide">
                      {onlineUsers.includes(selectedUser?.firebaseUid) ? (
                        <span className="text-success">Online</span>
                      ) : (
                        <span className="text-base-content/40">Offline</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Header Actions (Right Side) */}
          {selectedUser && (
            <div className="flex items-center gap-1 md:gap-2">
              <button className="btn btn-ghost btn-sm btn-circle text-primary hidden sm:flex">
                <Phone size={20} />
              </button>
              <button className="btn btn-ghost btn-sm btn-circle text-primary hidden sm:flex">
                <Video size={20} />
              </button>
              <button className="btn btn-ghost btn-sm btn-circle opacity-60">
                <MoreVertical size={20} />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-base-200/30">
          {/* Messages go here */}

          {selectedConversationId ? (
            isMessagesLoading ? (
              <LoadingSpinner></LoadingSpinner>
            ) : (
              <>
                <ChatMessages messages={messages} currentUserUid={user?.uid} />
                <div ref={messagesEndRef} />
              </>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-30 italic">
              <Smile size={48} className="mb-2" />
              <p>Select a contact to start chatting</p>
            </div>
          )}
        </div>

        {/* --- MESSAGE INPUT SECTION --- */}
        <div className="p-2 md:p-4 bg-base-100 border-t border-base-300 w-full">
          <div className="flex items-end gap-2 max-w-6xl mx-auto">
            {/* Actions Group (Emoji & Attachment) */}
            <div className="flex items-center pb-1">
              {/* Emoji Button - Hidden on very small screens to save space, or kept as icons */}
              <button
                type="button"
                className="btn btn-ghost btn-circle btn-sm md:btn-md text-base-content/60 hover:text-primary"
                title="Add emoji"
              >
                <Smile size={20} className="md:w-6 md:h-6" />
              </button>

              {/* Attachment Button */}
              <label className="btn btn-ghost btn-circle btn-sm md:btn-md text-base-content/60 hover:text-primary cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  onChange={(e) => console.log(e.target.files[0])}
                />
                <Image size={20} className="md:w-6 md:h-6" />
              </label>
            </div>

            {/* Message Input Field */}
            <div className="flex-1">
              <textarea
                ref={messageRef}
                onKeyDown={handleKeyDown}
                rows="1"
                placeholder="Type a message..."
                className="textarea textarea-bordered w-full resize-none min-h-10 max-h-32 py-2 md:py-3 focus:outline-primary bg-base-200/50 leading-tight outline-0"
                onInput={(e) => {
                  e.target.style.height = "auto";
                  e.target.style.height = e.target.scrollHeight + "px";
                }}
              />
            </div>

            {/* Send Button */}
            <div className="pb-1">
              <button
                className="btn btn-primary btn-circle h-10 w-10 md:h-12 md:w-12 min-h-0 shadow-md hover:scale-105 active:scale-95 transition-all"
                onClick={() => sendMessage(messageRef.current.value)}
              >
                <Send size={18} className="md:w-5 md:h-5 ml-0.5" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ChatPage;
