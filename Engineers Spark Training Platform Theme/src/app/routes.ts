import { createBrowserRouter } from "react-router";
import { Challenges } from "./pages/Challenges";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Profile } from "./pages/Profile";
import { PublicProfile } from "./pages/PublicProfile";
import { Register } from "./pages/Register";
import { Scoreboard } from "./pages/Scoreboard";
import { Users } from "./pages/Users";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Landing,
  },
  {
    path: "/challenges",
    Component: Challenges,
  },
  {
    path: "/scoreboard",
    Component: Scoreboard,
  },
  {
    path: "/users",
    Component: Users,
  },
  {
    path: "/users/:userId",
    Component: PublicProfile,
  },
  {
    path: "/profile",
    Component: Profile,
  },
  {
    path: "/login",
    Component: Login,
  },
  {
    path: "/register",
    Component: Register,
  },
]);