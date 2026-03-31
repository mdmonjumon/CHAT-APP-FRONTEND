import { formatDistanceToNow } from "date-fns";

const MessageItem = ({ message, isOwnMessage }) => {
  
  return (
    <div className={`chat ${isOwnMessage ? "chat-end" : "chat-start"} mb-4`}>
      {/* User Avatar */}
      <div className="chat-image avatar">
        <div className="w-8 md:w-10 rounded-full border border-base-300">
          <img
            alt="User Avatar"
            src={message?.senderId?.profilePic || "https://i.pravatar.cc/150"}
          />
        </div>
      </div>

      {/* Message Header (Name & Time) */}
      <div className="chat-header mb-1 opacity-50 text-xs flex gap-2 items-center">
        {!isOwnMessage && (
          <span className="font-bold">{message?.senderId?.fullName}</span>
        )}
        <span>
          {formatDistanceToNow(new Date(message.createdAt), {
            addSuffix: true,
          })}
        </span>
      </div>

      {/* Message Bubble */}
      <div
        className={`chat-bubble max-w-[85%] md:max-w-[70%] text-sm text--50 md:text-base shadow-sm ${
          isOwnMessage
            ? "bg-primary text-primary-content"
            : "bg-base-200 text-base-content"
        }`}
      >
        {message?.text}
      </div>

      {/* Delivery Status (Only for own messages) */}
      {isOwnMessage && (
        <div className="chat-footer opacity-50 text-[10px] mt-1">Delivered</div>
      )}
    </div>
  );
};

export default MessageItem;
