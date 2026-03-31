import { useEffect, useState } from "react";
import { auth } from "../firebase/firebase.init";
import AuthContext from "./AuthContext";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { io } from "socket.io-client";

const AuthProvider = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  // ২. সকেট এবং অনলাইন ইউজারদের জন্য স্টেট
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // create new user
  const createUser = (email, password) => {
    setLoading(true);
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // signIn exiting user
  const signInUser = (email, password) => {
    setLoading(true);
    return signInWithEmailAndPassword(auth, email, password);
  };

  // signOut User
  const signOutUser = () => {
    setLoading(true);
    return signOut(auth);
  };

  // update user Profile
  const updateUserProfile = (userInfo) => {
    const { fullName, profilePic } = userInfo;
    return updateProfile(auth.currentUser, {
      displayName: fullName,
      photoURL: profilePic,
    });
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log("From authProvider===>", currentUser);

      if (currentUser) {
        const newSocket = io(import.meta.env.VITE_SERVER_LINK);
        setSocket(newSocket);

        newSocket.emit("setup", currentUser.uid);

        newSocket.on("get_online_users", (users) => {
          setOnlineUsers(users);
        });

        setLoading(false);
      } else {
        setSocket((prevSocket) => {
          if (prevSocket) prevSocket.disconnect();
          return null;
        });
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const authInfo = {
    loading,
    user,
    socket,
    onlineUsers,
    setUser,
    createUser,
    signInUser,
    updateUserProfile,
    signOutUser,

  };

  return (
    <AuthContext.Provider value={authInfo}>{children}</AuthContext.Provider>
  );
};

export default AuthProvider;
