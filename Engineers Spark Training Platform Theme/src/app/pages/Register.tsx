import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useAuth } from "../context/AuthContext";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";
import logo from "../../assets/engineers-spark-logo.png";

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Z]/.test(pw)) s++;
  if (/[0-9]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw)) s++;
  return [
    { label: "", color: "" },
    { label: "Weak", color: "#f87171" },
    { label: "Fair", color: "#fbbf24" },
    { label: "Good", color: "#38bdf8" },
    { label: "Strong", color: "#34d399" },
  ][s];
}

export function Register() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [registrationCode, setRegistrationCode] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  const match = confirm.length > 0 && password === confirm;
  const noMatch = confirm.length > 0 && password !== confirm;
  const str = strength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setError(""); setLoading(true);
    try {
      await register(username, email, password, registrationCode);
      navigate("/challenges");
    } catch (err: any) {
      setError(err.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-[#07080a] flex items-center justify-center px-4 py-16 relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.05] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
          maskImage: "radial-gradient(ellipse 70% 60% at 50% 40%, black 30%, transparent 100%)",
        }}
      />
      <div
        className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[700px] h-[700px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(14,165,233,0.10) 0%, transparent 70%)", filter: "blur(60px)" }}
      />

      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
        className="relative z-10 w-full max-w-sm"
      >
        <div className="flex flex-col items-center mb-8">
          <img src={logo} alt="" className="w-9 h-9 mb-4" />
          <h1 className="text-2xl font-black text-white tracking-tight">Create your account</h1>
          <p className="text-sm text-white/40 mt-1">Join the Engineers Spark platform</p>
        </div>

        <form onSubmit={handleSubmit}
          className="relative border border-white/8 bg-white/[0.02] backdrop-blur-sm rounded-xl p-7 space-y-4"
        >
          <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-sky-400/40 rounded-tl-xl" />
          <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-sky-400/40 rounded-br-xl" />

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/45 uppercase tracking-wide">Username</label>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} placeholder="Choose a username" required
              className="w-full px-3.5 py-2.5 rounded-md text-sm text-white bg-white/[0.03] border border-white/10 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-white/20" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/45 uppercase tracking-wide">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@university.edu" required
              className="w-full px-3.5 py-2.5 rounded-md text-sm text-white bg-white/[0.03] border border-white/10 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-white/20" />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/45 uppercase tracking-wide">Password</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required
                className="w-full px-3.5 py-2.5 pr-10 rounded-md text-sm text-white bg-white/[0.03] border border-white/10 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-white/20" />
              <button type="button" onClick={() => setShowPw(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors">
                {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            {password && (
              <div className="flex items-center gap-2 pt-0.5">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="w-6 h-0.5 rounded-full transition-all"
                      style={{ background: i <= ["", "Weak", "Fair", "Good", "Strong"].indexOf(str.label) ? str.color : "rgba(255,255,255,0.1)" }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-medium" style={{ color: str.color }}>{str.label}</span>
              </div>
            )}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/45 uppercase tracking-wide">Confirm password</label>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} placeholder="••••••••" required
              className="w-full px-3.5 py-2.5 rounded-md text-sm text-white bg-white/[0.03] border border-white/10 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-white/20" />
            {match && <p className="text-[11px] flex items-center gap-1 text-emerald-400 pt-0.5"><Check size={11} /> Passwords match</p>}
            {noMatch && <p className="text-[11px] text-red-400 pt-0.5">Passwords don't match</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-white/45 uppercase tracking-wide">Registration Code</label>
            <input type="text" value={registrationCode} onChange={e => setRegistrationCode(e.target.value)} placeholder="Enter registration code" required
              className="w-full px-3.5 py-2.5 rounded-md text-sm text-white bg-white/[0.03] border border-white/10 focus:border-sky-400/50 focus:outline-none focus:ring-1 focus:ring-sky-400/30 transition-all placeholder-white/20" />
          </div>

          {error && (
            <div className="text-xs px-3 py-2 rounded-md border border-red-500/25 bg-red-500/[0.06] text-red-300">
              {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-md bg-white text-black font-semibold text-sm hover:bg-sky-50 transition-all disabled:opacity-50"
          >
            {loading ? "Creating account..." : "Create Account"}
            {!loading && <ArrowRight size={15} />}
          </button>

          <p className="text-center text-xs text-white/35">
            Already registered?{" "}
            <Link to="/login" className="text-sky-300 hover:text-sky-200 font-medium">Sign in</Link>
          </p>
        </form>

        <p className="text-center text-xs text-white/25 mt-6">
          <Link to="/" className="hover:text-white/50 transition-colors">← Back to home</Link>
        </p>
      </motion.div>
    </div>
  );
}