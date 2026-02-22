import { createBrowserRouter } from "react-router-dom";
import SignUp from "../pages/SignUp";
import Login from "../pages/Login";
import ChatPage from "../pages/ChatPage";

const router = createBrowserRouter([
  {
    path: "/",
    element: <SignUp></SignUp>,
  },
  {
    path:"/login",
    element:<Login></Login>
  },
  {
    path:"/chat",
    element:<ChatPage></ChatPage>
  }
]);

export default router;
