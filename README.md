# Chatly Client — Real-Time Chat Application Frontend

Chatly is a high-performance, real-time messaging application client built with React, Tailwind CSS, and DaisyUI. It utilizes Socket.io for immediate delivery of messages, typing indicators, read statuses, and group chats, alongside Firebase Auth for secure login and profile updates.

## 🚀 Key Features

*   **💬 Real-Time Messaging**: Instant one-to-one messaging powered by Socket.io.
*   **👥 Collaborative Group Chats**: Easily create groups, modify group profile pictures, search/add members, remove members, and transfer admin rights.
*   **⚡ Optimistic UI Updates**: Instant message rendering with local temporary states before server resolution, offering zero-latency feel.
*   **📝 Live Typing Indicators**: Real-time feedback when other participants are typing, both in private rooms and group chats.
*   **✓✓ Read Ticks (Sent/Seen)**: Double checkmarks showing message delivery (gray double-check) and message seen (blue double-check) dynamically.
*   **📂 Attachments**: Support for uploading and previewing image attachments (integrated with ImgBB upload).
*   **🔄 Infinite Scroll Pagination**: Smooth loading of chat history as the user scrolls up, with scroll-stabilization to prevent jumps.
*   **🔒 Secure Account Settings**: Change display names, profiles, and passwords. For critical changes, Firebase Reauthentication is enforced using the current password.

---

## 🛠️ Tech Stack

*   **Framework**: [Vite](https://vitejs.dev/) + [React](https://react.dev/)
*   **State Management & Querying**: [TanStack React Query](https://tanstack.com/query/latest)
*   **Real-time Communication**: [Socket.io Client](https://socket.io/docs/v4/client-api/)
*   **Authentication**: [Firebase Auth](https://firebase.google.com/docs/auth)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) + [DaisyUI](https://daisyui.com/)
*   **Icons**: [Lucide React](https://lucide.dev/)

---

## 📁 Folder Structure

```text
src/
├── api/          # Network utils & upload helpers
├── components/   # Modular UI elements (Modals, Message items, Chat list)
├── hooks/        # Custom react hooks (useAuth, useMessage, useAxiosSecure)
├── layouts/      # App layout structures
├── pages/        # High-level route pages (ChatPage, Login, SignUp)
├── providers/    # Context providers (Auth Context, Query Client)
└── routes/       # Application routing setup
```

---

## ⚙️ Installation & Setup

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/mdmonjumon/CHAT-APP-FRONTEND.git
    cd CHAT-APP-FRONTEND
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**:
    Create a `.env.local` file in the root directory and define the following variables:
    ```env
    VITE_apiKey=YOUR_FIREBASE_API_KEY
    VITE_authDomain=YOUR_FIREBASE_AUTH_DOMAIN
    VITE_projectId=YOUR_FIREBASE_PROJECT_ID
    VITE_storageBucket=YOUR_FIREBASE_STORAGE_BUCKET
    VITE_messagingSenderId=YOUR_FIREBASE_MESSAGING_SENDER_ID
    VITE_appId=YOUR_FIREBASE_APP_ID
    VITE_IMAGE_UPLOAD_TOKEN=YOUR_IMGBB_API_KEY
    VITE_API_URL=http://localhost:3001
    ```

4.  **Run Development Server**:
    ```bash
    npm run dev
    ```
    The client will start running locally at `http://localhost:5173/`.
