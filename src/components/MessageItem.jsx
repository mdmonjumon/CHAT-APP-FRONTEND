import { formatDistanceToNow } from "date-fns";

const MessageItem = ({ message, isOwnMessage }) => {
  if (message?.messageType === "system") {
    return (
      <div className="flex justify-center my-4 animate-in fade-in duration-200 w-full">
        <div className="bg-base-300/60 text-base-content/60 text-xs font-semibold px-4 py-1.5 rounded-full border border-base-300/10 shadow-sm max-w-[85%] text-center leading-normal">
          {message?.text}
        </div>
      </div>
    );
  }

  const isRead = message?.readBy && message?.readBy?.length > 1;

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
        className={`chat-bubble max-w-[85%] md:max-w-[70%] text-sm md:text-base shadow-sm ${
          isOwnMessage
            ? "bg-primary text-primary-content"
            : "bg-base-200 text-base-content"
        }`}
      >
        {message?.messageType === "image" && message?.image ? (
          <div className="flex flex-col gap-2">
            <img
              src={message.image}
              alt="Sent attachment"
              className="rounded-lg max-w-full h-auto max-h-60 object-cover cursor-pointer hover:opacity-90 transition-opacity"
              onClick={() => window.open(message.image, "_blank")}
            />
            {message.text && <p>{message.text}</p>}
          </div>
        ) : (
          message?.text
        )}
      </div>

      {/* Delivery/Read Status (Only for own messages) */}
      {isOwnMessage && (
        <div className="chat-footer opacity-60 text-[10px] mt-1 flex items-center justify-end gap-1">
          <span>{isRead ? "Seen" : "Delivered"}</span>
          {isRead ? (
            <span className="text-info font-bold text-xs" title="Seen">✓✓</span>
          ) : (
            <span className="text-base-content/40 text-xs" title="Delivered">✓✓</span>
          )}
        </div>
      )}
    </div>
  );
};

export default MessageItem;
