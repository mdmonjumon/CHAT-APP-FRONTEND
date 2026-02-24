import { createBrowserRouter } from "react-router-dom";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import ChatPage from "../pages/ChatPage";
import PrivateRoute from "./PrivateRoute";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SignUp></SignUp>,
  },
  {
    path: "/login",
    element: <Login></Login>,
  },
  {
    path: "/chat",
    element: (
      <PrivateRoute>
        <ChatPage></ChatPage>
      </PrivateRoute>
    ),
  },
]);

export default router;
