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
  SquarePen,
} from "lucide-react";
import useAuth from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import useAxiosSecure from "../hooks/useAxiosSecure";
import LoadingSpinner from "../components/LoadingSpinner";
import ChatMessages from "../components/ChatMessages";
import useMessages from "../hooks/useMessage";
import CreateGroupModal from "../components/CreateGroupModal";
import SettingsModal from "../components/SettingsModal";
import GroupSettingsModal from "../components/GroupSettingsModal";
import uploadImage from "../api/utils";
import toast from "react-hot-toast";
import { formatDistanceToNow } from "date-fns";

const ChatPage = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedConversationId, setSelectedConversationId] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isGroupSettingsOpen, setIsGroupSettingsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [typingUsers, setTypingUsers] = useState({});

  const { signOutUser } = useAuth();
  const navigate = useNavigate();
  const axiosSecure = useAxiosSecure();
  const { user, socket, loading, onlineUsers } = useAuth();
  const messageRef = useRef();
  const sidebarRef = useRef();
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const queryClient = useQueryClient();

  // retrieve paginated messages
  const {
    data: messagesData,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading: isMessagesLoading,
  } = useMessages(selectedConversationId);

  // Flatten infinite query pages
  const messages = messagesData?.pages ? messagesData.pages.flatMap((page) => page) : [];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    // scroll to bottom on initial message load
    if (messages.length > 0 && !isFetchingNextPage) {
      scrollToBottom();
    }
  }, [selectedConversationId]);

  // socket.io start

  useEffect(() => {
    if (socket && selectedConversationId) {
      socket.emit("join_room", selectedConversationId);
    }
  }, [socket, selectedConversationId]);

  // Mark incoming messages as read
  const markChatAsRead = async () => {
    if (!selectedConversationId) return;
    try {
      await axiosSecure.patch(`/message/${selectedConversationId}/read`);
      // Update local query state for ticks
      queryClient.setQueryData(["messages", selectedConversationId], (oldData) => {
        if (!oldData) return oldData;
        const myMongoDoc = selectedGroup?.participants?.find(p => p.firebaseUid === user?.uid) ||
                           allUsers.find(u => u.firebaseUid === user?.uid);
        const myId = myMongoDoc?._id;
        if (!myId) return oldData;

        return {
          ...oldData,
          pages: oldData.pages.map(page =>
            page.map(msg => {
              if (msg.senderId?.firebaseUid !== user.uid && !msg.readBy.includes(myId)) {
                return { ...msg, readBy: [...msg.readBy, myId] };
              }
              return msg;
            })
          ),
        };
      });
    } catch (err) {
      console.error("Failed to mark messages as read:", err);
    }
  };

  useEffect(() => {
    if (selectedConversationId) {
      markChatAsRead();
    }
  }, [selectedConversationId, messages.length]);

  useEffect(() => {
    if (!socket) return;
    
    const handleMessageReceive = (newMessage) => {
      if (newMessage.conversationId === selectedConversationId) {
        queryClient.setQueryData(
          ["messages", newMessage.conversationId],
          (oldData) => {
            if (!oldData) return { pages: [[newMessage]], pageParams: [null] };
            
            const updatedPages = [...oldData.pages];
            const lastPageIndex = updatedPages.length - 1;
            updatedPages[lastPageIndex] = [...updatedPages[lastPageIndex], newMessage];
            
            return {
              ...oldData,
              pages: updatedPages,
            };
          }
        );
        
        if (newMessage.senderId?.firebaseUid !== user.uid) {
          markChatAsRead();
        }
      }

      queryClient.invalidateQueries({ queryKey: ["groups"] });
    };

    const handleGroupUpdated = (updatedGroup) => {
      const isParticipant = updatedGroup.participants?.some((p) => {
        if (!p) return false;
        if (typeof p === "object") {
          return p.firebaseUid === user?.uid || p._id === user?.uid;
        }
        return p === user?.uid;
      });

      if (!isParticipant) {
        if (selectedConversationId === updatedGroup._id) {
          setSelectedConversationId(null);
          setSelectedGroup(null);
          toast.error("You are no longer a member of this group.");
        }
      } else {
        if (selectedConversationId === updatedGroup._id) {
          setSelectedGroup(updatedGroup);
        }
      }
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    };

    const handleUserTyping = ({ conversationId, userId, fullName }) => {
      if (conversationId === selectedConversationId) {
        setTypingUsers((prev) => ({ ...prev, [userId]: fullName }));
      }
    };

    const handleUserStopTyping = ({ conversationId, userId }) => {
      if (conversationId === selectedConversationId) {
        setTypingUsers((prev) => {
          const copy = { ...prev };
          delete copy[userId];
          return copy;
        });
      }
    };

    const handleMessagesRead = ({ conversationId, userId }) => {
      if (conversationId === selectedConversationId) {
        queryClient.setQueryData(["messages", conversationId], (oldData) => {
          if (!oldData) return oldData;
          return {
            ...oldData,
            pages: oldData.pages.map(page =>
              page.map(msg => {
                if (msg.senderId?.firebaseUid === user.uid && !msg.readBy.includes(userId)) {
                  return { ...msg, readBy: [...msg.readBy, userId] };
                }
                return msg;
              })
            ),
          };
        });
      }
    };

    socket.on("receive_message", handleMessageReceive);
    socket.on("group_updated", handleGroupUpdated);
    socket.on("user_typing", handleUserTyping);
    socket.on("user_stop_typing", handleUserStopTyping);
    socket.on("messages_read", handleMessagesRead);

    return () => {
      socket.off("receive_message", handleMessageReceive);
      socket.off("group_updated", handleGroupUpdated);
      socket.off("user_typing", handleUserTyping);
      socket.off("user_stop_typing", handleUserStopTyping);
      socket.off("messages_read", handleMessagesRead);
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

  // retrieve all groups
  const { data: groups = [], isLoading: isGroupsLoading } = useQuery({
    queryKey: ["groups"],
    queryFn: async () => {
      const { data } = await axiosSecure.get("/message/groups");
      return data.data || [];
    },
  });

  // select contact and get conversation id
  const handleSelectContact = async (contact) => {
    setIsSidebarOpen(false);
    setSelectedUser(contact);
    setSelectedGroup(null);

    const { data } = await axiosSecure.post(
      "/message/getOrCreateConversation",
      { receiverId: contact?._id },
    );
    setSelectedConversationId(data?.data?._id);
  };

  // select group conversation
  const handleSelectGroup = (group) => {
    setIsSidebarOpen(false);
    setSelectedUser(null);
    setSelectedGroup(group);
    setSelectedConversationId(group?._id);
  };

  // attachment change handler
  const handleAttachmentChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setImageFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Typing event handler
  const handleTyping = () => {
    if (!socket || !selectedConversationId) return;

    socket.emit("typing", {
      conversationId: selectedConversationId,
      userId: user.uid,
      fullName: user.displayName,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socket.emit("stop_typing", {
        conversationId: selectedConversationId,
        userId: user.uid,
      });
    }, 1500);
  };

  // send message with Optimistic Updates
  const sendMessage = async (messageText) => {
    if (!messageText.trim() && !imageFile) return;

    const tempId = `optimistic-${Date.now()}`;
    const myMongoDoc = selectedGroup?.participants?.find(p => p.firebaseUid === user?.uid) || 
                       allUsers.find(u => u.firebaseUid === user?.uid);
    const myMongoId = myMongoDoc?._id || "my-temp-id";

    const optimisticMsg = {
      _id: tempId,
      conversationId: selectedConversationId,
      senderId: {
        _id: myMongoId,
        fullName: user.displayName,
        profilePic: user.photoURL,
        firebaseUid: user.uid,
      },
      text: messageText,
      messageType: imageFile ? "image" : "text",
      image: imagePreview,
      readBy: [myMongoId],
      createdAt: new Date().toISOString(),
      isSending: true,
    };

    // Optimistically update cash
    queryClient.setQueryData(["messages", selectedConversationId], (oldData) => {
      if (!oldData) return { pages: [[optimisticMsg]], pageParams: [null] };
      const updatedPages = [...oldData.pages];
      const lastPageIndex = updatedPages.length - 1;
      updatedPages[lastPageIndex] = [...updatedPages[lastPageIndex], optimisticMsg];
      return {
        ...oldData,
        pages: updatedPages,
      };
    });

    // Reset input fields
    messageRef.current.value = "";
    messageRef.current.style.height = "auto";
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";

    // Stop typing
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    socket.emit("stop_typing", {
      conversationId: selectedConversationId,
      userId: user.uid,
    });

    try {
      let imageUrl = "";
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      const { data } = await axiosSecure.post("/message/send", {
        conversationId: selectedConversationId,
        message: messageText,
        messageType: imageUrl ? "image" : "text",
        image: imageUrl,
      });

      // Replace optimistic message with actual Mongoose document
      queryClient.setQueryData(["messages", selectedConversationId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page =>
            page.map(msg => (msg._id === tempId ? data.data : msg))
          ),
        };
      });

      queryClient.invalidateQueries({ queryKey: ["groups"] });
    } catch (error) {
      console.error(error);
      // Remove optimistic message on fail
      queryClient.setQueryData(["messages", selectedConversationId], (oldData) => {
        if (!oldData) return oldData;
        return {
          ...oldData,
          pages: oldData.pages.map(page =>
            page.filter(msg => msg._id !== tempId)
          ),
        };
      });
      toast.error("Failed to send message");
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

  const getGroupTypingText = () => {
    const typingList = Object.entries(typingUsers)
      .filter(([userId, name]) => {
        const isParticipant = selectedGroup?.participants?.some(p => p.firebaseUid === userId);
        return isParticipant && userId !== user?.uid;
      })
      .map(([userId, name]) => name);

    if (typingList.length === 0) return null;
    if (typingList.length === 1) return `${typingList[0]} is typing...`;
    if (typingList.length === 2) return `${typingList[0]} and ${typingList[1]} are typing...`;
    return "Multiple people are typing...";
  };

  const filteredUsers = allUsers.filter((u) =>
    u.fullName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGroups = groups.filter((g) =>
    g.chatName.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
        <div className="p-4 flex gap-1 items-center">
          <div className="relative flex-1">
            <Search
              className="absolute left-3 top-3 text-base-content/40"
              size={18}
            />
            <input
              type="text"
              placeholder="Search chats..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full pl-10 input-sm focus:outline-primary"
            />
          </div>
          {/* create group */}
          <div
            onClick={() => setIsModalOpen(true)}
            className="btn tooltip"
            data-tip="Create group"
          >
            <SquarePen />
          </div>
        </div>

        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto">
          {/* Direct Messages Section */}
          <div className="flex-1 flex flex-col min-h-0">
            <div className="p-3 bg-base-200/50 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/50">Direct Messages</span>
            </div>
            <div ref={sidebarRef} className="flex-1 overflow-y-auto">
              {isUserLoading ? (
                <div className="p-4 text-center"><LoadingSpinner /></div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-sm text-base-content/40 italic">No users found</div>
              ) : (
                filteredUsers.map((userItem) => (
                  <div
                    key={userItem?._id}
                    onClick={() => handleSelectContact(userItem)}
                    className={`flex items-center gap-3 p-4 hover:bg-base-200 cursor-pointer transition-colors ${
                      selectedUser?._id === userItem?._id ? "bg-base-200" : ""
                    }`}
                  >
                    <div
                      className={`${onlineUsers.includes(userItem?.firebaseUid) ? "avatar-online" : ""} avatar`}
                    >
                      <div className="w-14 rounded-full">
                        <img src={userItem?.profilePic} alt={userItem?.fullName} />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold truncate">
                          {userItem?.fullName}
                        </span>
                        <span className="text-xs opacity-50">Active</span>
                      </div>
                      <p className="text-sm opacity-60 truncate">
                        Click to message
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Groups Section */}
          <div className="flex-1 flex flex-col min-h-0 border-t border-base-300">
            <div className="p-3 bg-base-200/50 flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-base-content/50">Groups</span>
            </div>
            <div className="flex-1 overflow-y-auto">
              {isGroupsLoading ? (
                <div className="p-4 text-center"><LoadingSpinner /></div>
              ) : filteredGroups.length === 0 ? (
                <div className="p-4 text-center text-sm text-base-content/40 italic">No groups found</div>
              ) : (
                filteredGroups.map((group) => (
                  <div
                    key={group?._id}
                    onClick={() => handleSelectGroup(group)}
                    className={`flex items-center gap-3 p-4 hover:bg-base-200 cursor-pointer transition-colors ${
                      selectedConversationId === group?._id ? "bg-base-200" : ""
                    }`}
                  >
                    <div className="avatar">
                      <div className="w-12 rounded-full ring-1 ring-base-300">
                        {group?.groupProfilePic ? (
                          <img src={group.groupProfilePic} alt={group.chatName} className="rounded-full object-cover" />
                        ) : (
                          <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center font-bold rounded-full">
                            {group?.chatName?.substring(0, 2).toUpperCase()}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-baseline">
                        <span className="font-bold truncate">{group?.chatName}</span>
                        {group?.lastMessage && (
                          <span className="text-xs opacity-50">
                            {formatDistanceToNow(new Date(group.lastMessage.createdAt), { addSuffix: true })}
                          </span>
                        )}
                      </div>
                      <p className="text-sm opacity-60 truncate">
                        {group?.lastMessage
                          ? `${group.lastMessage.senderId?.fullName || "System"}: ${group.lastMessage.messageType === "image" ? "📷 Image" : group.lastMessage.text}`
                          : "No messages yet"}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

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
              <button 
                onClick={() => setIsSettingsOpen(true)}
                className="btn btn-ghost btn-sm btn-circle text-base-content/60 hover:text-primary"
                title="Settings"
              >
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

      {/* --- OVERLAY & MAIN CONTENT --- */}
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

                  {typingUsers[selectedUser?.firebaseUid] ? (
                    <p className="text-xs text-primary font-bold animate-pulse">
                      typing...
                    </p>
                  ) : (
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
                  )}
                </div>
              </div>
            )}

            {/* Group Info (Show only if selectedGroup exists) */}
            {selectedGroup && (
              <div 
                className="flex items-center gap-3 animate-in fade-in duration-300 cursor-pointer hover:opacity-85 transition-opacity"
                onClick={() => setIsGroupSettingsOpen(true)}
              >
                <div className="avatar">
                  <div className="w-10 md:w-12 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2 flex items-center justify-center font-bold text-sm md:text-base">
                    {selectedGroup?.groupProfilePic ? (
                      <img src={selectedGroup.groupProfilePic} alt={selectedGroup.chatName} className="rounded-full object-cover" />
                    ) : (
                      <div className="bg-primary text-primary-content w-full h-full flex items-center justify-center rounded-full">
                        {selectedGroup?.chatName?.substring(0, 2).toUpperCase()}
                      </div>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-bold text-sm md:text-base leading-tight">
                    {selectedGroup?.chatName}
                  </h3>
                  {getGroupTypingText() ? (
                    <p className="text-xs text-primary font-bold animate-pulse">
                      {getGroupTypingText()}
                    </p>
                  ) : (
                    <p className="text-xs opacity-50">
                      {selectedGroup?.participants?.length || 0} members
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Header Actions (Right Side) */}
          {(selectedUser || selectedGroup) && (
            <div className="flex items-center gap-1 md:gap-2">
              {selectedUser && (
                <>
                  <button className="btn btn-ghost btn-sm btn-circle text-primary hidden sm:flex">
                    <Phone size={20} />
                  </button>
                  <button className="btn btn-ghost btn-sm btn-circle text-primary hidden sm:flex">
                    <Video size={20} />
                  </button>
                </>
              )}
              {selectedGroup && (
                <button 
                  className="btn btn-ghost btn-sm btn-circle opacity-60"
                  onClick={() => setIsGroupSettingsOpen(true)}
                  title="Group Settings"
                >
                  <MoreVertical size={20} />
                </button>
              )}
              {selectedUser && (
                <button className="btn btn-ghost btn-sm btn-circle opacity-60">
                  <MoreVertical size={20} />
                </button>
              )}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto p-4 bg-base-200/30 flex flex-col">
          {/* Messages go here */}

          {selectedConversationId ? (
            isMessagesLoading ? (
              <LoadingSpinner></LoadingSpinner>
            ) : (
              <>
                <ChatMessages
                  messages={messages}
                  currentUserUid={user?.uid}
                  fetchNextPage={fetchNextPage}
                  hasNextPage={hasNextPage}
                  isFetchingNextPage={isFetchingNextPage}
                />
                <div ref={messagesEndRef} />
              </>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full opacity-30 italic flex-1">
              <Smile size={48} className="mb-2" />
              <p>Select a contact or group to start chatting</p>
            </div>
          )}
        </div>

        {/* --- MESSAGE INPUT SECTION --- */}
        <div className="p-2 md:p-4 bg-base-100 border-t border-base-300 w-full flex flex-col gap-2">
          {imagePreview && (
            <div className="relative self-start group ml-14">
              <img
                src={imagePreview}
                alt="Upload preview"
                className="w-20 h-20 object-cover rounded-lg border border-base-300 shadow-md"
              />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                  if (fileInputRef.current) fileInputRef.current.value = "";
                }}
                className="absolute -top-2 -right-2 bg-error text-error-content rounded-full p-1 shadow-md hover:scale-110 transition-transform"
                title="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 max-w-6xl mx-auto w-full">
            {/* Actions Group (Emoji & Attachment) */}
            <div className="flex items-center pb-1">
              {/* Emoji Button */}
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
                  accept="image/*"
                  className="hidden"
                  ref={fileInputRef}
                  onChange={handleAttachmentChange}
                />
                <Image size={20} className="md:w-6 md:h-6" />
              </label>
            </div>

            {/* Message Input Field */}
            <div className="flex-1">
              <textarea
                ref={messageRef}
                onKeyDown={handleKeyDown}
                onInput={handleTyping}
                rows="1"
                placeholder="Type a message..."
                className="textarea textarea-bordered w-full resize-none min-h-10 max-h-32 py-2 md:py-3 focus:outline-primary bg-base-200/50 leading-tight outline-0"
                onChange={(e) => {
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

      {/* --- CREATE GROUP MODAL --- */}
      {isModalOpen && (
        <CreateGroupModal
          allUsers={allUsers}
          axiosSecure={axiosSecure}
          onClose={() => setIsModalOpen(false)}
        />
      )}

      {/* --- SETTINGS MODAL --- */}
      {isSettingsOpen && (
        <SettingsModal
          axiosSecure={axiosSecure}
          onClose={() => setIsSettingsOpen(false)}
        />
      )}

      {/* --- GROUP SETTINGS MODAL --- */}
      {isGroupSettingsOpen && selectedGroup && (
        <GroupSettingsModal
          group={selectedGroup}
          allUsers={allUsers}
          axiosSecure={axiosSecure}
          onGroupUpdated={(updatedGroup) => {
            setSelectedGroup(updatedGroup);
            queryClient.invalidateQueries({ queryKey: ["groups"] });
          }}
          onClose={() => setIsGroupSettingsOpen(false)}
        />
      )}
    </div>
  );
};

export default ChatPage;
