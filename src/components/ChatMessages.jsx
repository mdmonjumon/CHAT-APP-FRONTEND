import { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

const ChatMessages = ({ messages, currentUserUid }) => {
  const scrollRef = useRef(null);

  // নতুন মেসেজ আসলে অটোমেটিক নিচে স্ক্রল হওয়ার জন্য
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center opacity-30 italic">
        <p>No messages yet. Say hi! 👋</p>
      </div>
    );
  }

  return (
    <div 
      ref={scrollRef}
      className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-base-300/10"
    >
      {messages.map((message) => (
        <MessageItem 
          key={message?._id} 
          message={message} 
          isOwnMessage={message?.senderId?.firebaseUid === currentUserUid}
        />
      ))}
    </div>
  );
};

export default ChatMessages;