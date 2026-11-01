import { RouterProvider, createBrowserRouter, Navigate } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { ConfigProvider } from "./context/ConfigContext";
import { NotificationProvider } from "./context/NotificationContext";
import { NotificationToasts } from "./components/NotificationToasts";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Landing } from "./pages/Landing";
import { Login } from "./pages/Login";
import { Register } from "./pages/Register";
import { Challenges } from "./pages/Challenges";
import { CategoryChallenges } from "./pages/CategoryChallenges";
import { Scoreboard } from "./pages/Scoreboard";
import { Profile } from "./pages/Profile";
import { PublicProfile } from "./pages/PublicProfile";
import { Users } from "./pages/Users";
import AdminRedirect from "./components/AdminRedirect";

const router = createBrowserRouter([
  { path: "/",          Component: Landing  },
  { path: "/login",     Component: Login    },
  { path: "/register",  Component: Register },
  // Let Flask handle file downloads directly - don't let React Router intercept
  { path: "/files/*",   element: null },
  {
    Component: ProtectedRoute,
    children: [
      { path: "/challenges",           Component: Challenges         },
      { path: "/challenges/:category", Component: CategoryChallenges },
      { path: "/profile",              Component: Profile            },
      { path: "/scoreboard",           Component: Scoreboard },
      { path: "/users",                Component: Users },
      { path: "/users/:userId",        Component: PublicProfile },
    ],
  },
  { path: "/login",     Component: Login    },
  { path: "/register",  Component: Register },
  { path: "/admin/*", Component: AdminRedirect },
  { path: "*", element: <Navigate to="/" replace /> },
]);

export default function App() {
  return (
    <AuthProvider>
      <ConfigProvider>
        <NotificationProvider>
          <RouterProvider router={router} />
          <NotificationToasts />
        </NotificationProvider>
      </ConfigProvider>
    </AuthProvider>
  );
}
