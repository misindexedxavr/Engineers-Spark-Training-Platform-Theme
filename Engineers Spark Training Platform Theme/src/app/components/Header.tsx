import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { ctfdApi } from "../../services/ctfdApi";
import { Menu, X, LogOut } from "lucide-react";
import logo from "../../assets/engineers-spark-logo.png";
import { NotificationBell } from "./NotificationBell";
const NAV = [
  { label: "Challenges", to: "/challenges" },
  { label: "Scoreboard", to: "/scoreboard" },
  { label: "Users", to: "/users" },
  { label: "Profile", to: "/profile" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [points, setPoints] = useState(0);
  const [solved, setSolved] = useState(0);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const navItems = user?.isAdmin ? [...NAV, { label: "Admin", to: "/admin" }] : NAV;

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 4);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || !user) { setPoints(0); setSolved(0); return; }
    setPoints(user.score ?? 0);
    ctfdApi.getChallenges()
      .then(r => setSolved((r.data || []).filter((c: any) => c.solved_by_me).length))
      .catch(() => {});
  }, [isAuthenticated, user?.score]);

  return (
    <header
      className="fixed top-0 inset-x-0 z-50 px-3 pt-3 transition-all duration-300"
      style={{
        background: "transparent",
      }}
    >
      <div className="max-w-6xl mx-auto px-3 sm:px-5 h-14 flex items-center justify-between rounded-full border border-white/10 bg-[#07080a]/75 shadow-[0_10px_35px_rgba(0,0,0,.22)] backdrop-blur-2xl">
        <Link to="/" className="flex items-center gap-2.5 group">
          <img
            src={logo}
            alt=""
            className="w-7 h-7 group-hover:scale-105 transition-transform"
          />
          <span className="text-base font-bold tracking-tight text-white font-display">
            Engineers{" "}
            <span className="text-cyan-300">
              Spark
            </span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {navItems.map(({ label, to }) => {
            const active = location.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className="relative rounded-full px-3 py-1.5 text-[13px] font-bold transition-colors"
                style={{ color: active ? "#fff" : "rgba(255,255,255,0.78)" }}
              >
                {label}
                {active && (
                  <motion.div
                    layoutId="nav-active"
                  className="absolute inset-0 -z-10 rounded-full bg-white/[0.08] border border-white/10"
                  />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          {isAuthenticated && user ? (
            <>
              <div className="flex items-center gap-3 text-sm text-white/60">
                <span className="text-white font-medium">{user.name}</span>
                <span className="text-white/20">·</span>
                <span className="text-cyan-300 font-semibold">
                  {points.toLocaleString()} pts
                </span>
                <span className="text-white/20">·</span>
                <span className="text-indigo-300 font-semibold">
                  {solved} solved
                </span>
              </div>
              <NotificationBell />
              <button
                onClick={logout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-white/50 border border-white/10 hover:text-red-300 hover:border-red-400/30 transition-colors"
              >
                <LogOut size={13} /> Logout
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-white/60 hover:text-white transition-colors"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 rounded-full text-sm font-semibold bg-white text-black hover:bg-white/90 transition-all"
              >
                Register
              </Link>
            </>
          )}
        </div>

        <div className="md:hidden flex items-center gap-2">
          {isAuthenticated && user && <NotificationBell />}
          <button
            className="text-white/70"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            {open ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden overflow-hidden border-t border-white/8"
            style={{ background: "rgba(5,5,9,0.97)" }}
          >
            <div className="px-4 py-3 space-y-1">
              {navItems.map(({ label, to }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={() => setOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-sm font-bold"
                  style={{
                    color:
                      location.pathname === to
                        ? "#fff"
                        : "rgba(255,255,255,0.78)",
                  }}
                >
                  {label}
                </Link>
              ))}
              <div className="pt-2 mt-2 border-t border-white/8">
                {isAuthenticated ? (
                  <button
                    onClick={() => {
                      logout();
                      setOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2.5 rounded-md text-sm font-medium text-red-300"
                  >
                    Logout
                  </button>
                ) : (
                  <div className="flex gap-2 px-3">
                    <Link
                      to="/login"
                      onClick={() => setOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-md text-sm border border-white/10 text-white/70"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setOpen(false)}
                      className="flex-1 text-center py-2.5 rounded-md text-sm bg-white text-black font-semibold"
                    >
                      Register
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
