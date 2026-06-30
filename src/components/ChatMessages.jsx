import React, { useEffect, useRef, useState } from "react";
import MessageItem from "./MessageItem";

const ChatMessages = ({
  messages,
  currentUserUid,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}) => {
  const scrollRef = useRef(null);
  const [prevScrollHeight, setPrevScrollHeight] = useState(0);
  const [shouldScrollToBottom, setShouldScrollToBottom] = useState(true);

  // Auto-scroll to bottom on initial load and when new messages are added at the end
  useEffect(() => {
    if (scrollRef.current && shouldScrollToBottom) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, shouldScrollToBottom]);

  // Adjust scroll position after loading older messages to prevent jumping
  useEffect(() => {
    if (scrollRef.current && !shouldScrollToBottom && prevScrollHeight > 0) {
      const container = scrollRef.current;
      const heightDifference = container.scrollHeight - prevScrollHeight;
      container.scrollTop = heightDifference;
      setPrevScrollHeight(0);
    }
  }, [messages, prevScrollHeight, shouldScrollToBottom]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    // Detect if user scrolled near bottom
    const isAtBottom = scrollHeight - scrollTop - clientHeight < 100;
    
    // Set shouldScrollToBottom only if they are near bottom or just loaded new pages
    if (scrollTop > 0) {
      setShouldScrollToBottom(isAtBottom);
    }

    // If scroll reaches top, fetch older messages
    if (scrollTop === 0 && hasNextPage && !isFetchingNextPage) {
      setPrevScrollHeight(scrollHeight);
      setShouldScrollToBottom(false);
      fetchNextPage();
    }
  };

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
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar bg-base-300/10"
    >
      {isFetchingNextPage && (
        <div className="flex justify-center p-2">
          <span className="loading loading-dots loading-sm text-primary"></span>
        </div>
      )}
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