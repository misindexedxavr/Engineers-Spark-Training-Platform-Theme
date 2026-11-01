import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ctfdApi } from "../../services/ctfdApi";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { useAuth } from "../context/AuthContext";
import { CheckCircle2, Lock, Globe, Cpu, ShieldCheck, Zap, Terminal, Edit2, Save, X } from "lucide-react";

const catIcon = (cat: string) => {
  const c = cat.toLowerCase();
  if (c.includes("crypto")) return <Lock size={12} />;
  if (c.includes("web")) return <Globe size={12} />;
  if (c.includes("rev")) return <Cpu size={12} />;
  if (c.includes("pwn")) return <Terminal size={12} />;
  if (c.includes("for")) return <ShieldCheck size={12} />;
  return <Zap size={12} />;
};

function GridBackground() {
  return (
    <div className="fixed inset-0 z-0 pointer-events-none">
      <div
        className="absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
          backgroundSize: "48px 48px",
          maskImage: "radial-gradient(ellipse 80% 50% at 50% 0%, black 20%, transparent 100%)",
        }}
      />
    </div>
  );
}

function formatSolveTime(raw: unknown): string {
  if (typeof raw !== "string" || !raw.trim()) return "Unknown";
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return raw;
  return d.toLocaleString();
}

function FileCard({ label, title, children, className = "" }: { label?: string; title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative border border-white/8 bg-white/[0.02] backdrop-blur-sm ${className}`}>
      <div className="absolute -top-px -left-px w-3.5 h-3.5 border-t border-l border-white/20" />
      <div className="absolute -bottom-px -right-px w-3.5 h-3.5 border-b border-r border-white/20" />
      {(label || title) && (
        <div className="flex items-center justify-between px-5 py-3 border-b border-white/6 bg-white/[0.015]">
          <span className="text-[13px] font-semibold text-white/70">{title}</span>
          {label && <span className="text-[10px] font-mono tracking-[2px] text-white/25 uppercase">{label}</span>}
        </div>
      )}
      {children}
    </div>
  );
}

export function Profile() {
  const { user } = useAuth();
  const [solves, setSolves] = useState<any[]>([]);
  const [stats, setStats] = useState({ rank: "--", points: 0, solved: 0 });
  const [totals, setTotals] = useState<{ points: number; byCategory: Record<string, number> }>({ points: 0, byCategory: {} });
  const [website, setWebsite] = useState<string>("");
  const [editingWebsite, setEditingWebsite] = useState(false);
  const [savingWebsite, setSavingWebsite] = useState(false);
  const [websiteError, setWebsiteError] = useState<string>("");

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([ctfdApi.getUserSolves(user.id), ctfdApi.getCurrentUser(), ctfdApi.getChallenges()])
      .then(([sr, ur, cr]) => {
        setSolves(sr.data || []);
        const u = ur.data;
        setWebsite(u?.website || "");
        const all = (cr.data || []) as any[];
        const totalPoints = all.reduce((n: number, c: any) => n + (c.value || 0), 0);
        const totalByCategory: Record<string, number> = {};
        for (const c of all) {
          const cat = c.category || "unknown";
          totalByCategory[cat] = (totalByCategory[cat] || 0) + 1;
        }
        setTotals({ points: totalPoints, byCategory: totalByCategory });
        setStats({ rank: u?.place ? `#${u.place}` : "--", points: u?.score || 0, solved: (sr.data || []).length });
      }).catch(() => {});
  }, [user?.id]);

  const byCategory: Record<string, number> = {};
  solves.forEach(s => {
    const cat = s.challenge?.category || "unknown";
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  });

  const saveWebsite = async () => {
    // Client-side validation
    const trimmed = website.trim();
    if (!trimmed) {
      setWebsite("");
      setEditingWebsite(false);
      return;
    }
    
    // Validate URL format
    try {
      const url = new URL(trimmed);
      if (url.protocol !== "http:" && url.protocol !== "https:") {
        setWebsiteError("Invalid URL: must use http:// or https://");
        return;
      }
    } catch {
      setWebsiteError("Invalid URL format");
      return;
    }
    
    setSavingWebsite(true);
    setWebsiteError("");
    try {
      await ctfdApi.updateUserProfile({ website: trimmed });
      setEditingWebsite(false);
    } catch (err: any) {
      setWebsiteError(err?.message || "Failed to save website");
    } finally {
      setSavingWebsite(false);
    }
  };

  return (
    <div className="bg-[#07080a] text-white flex flex-col relative">
      <GridBackground />
      <Header />

      <main className="relative z-10 pt-28 pb-16 px-4 max-w-5xl mx-auto w-full">

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-red-500/20 bg-red-500/[0.06] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-[2px] text-red-300/80 uppercase">Your profile</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Agent Profile</h1>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          <motion.div initial={{ opacity: 0, x: -14 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <FileCard label="Identity">
              <div className="p-6">
                <div className="w-16 h-16 rounded-lg mx-auto mb-4 flex items-center justify-center border border-white/10 bg-white/[0.03] text-2xl font-black text-white/50">
                  {(user?.name || "?").slice(0, 2).toUpperCase()}
                </div>

                <p className="text-lg font-bold text-center mb-0.5">{user?.name || "Unknown Agent"}</p>
                <p className="text-xs text-white/30 text-center mb-5 font-mono">{user?.email || "No email available"}</p>

                <div className="space-y-2 text-xs">
                  {[
                    { label: "Rank", value: stats.rank },
                    { label: "Score", value: `${stats.points.toLocaleString()} pts` },
                    { label: "Solved", value: `${stats.solved} challenges` },
                    { label: "Account", value: "ACTIVE", accent: true },
                    { label: "Website", value: website || "Not set", accent: false },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="flex justify-between py-2 border-b border-white/[0.05]">
                      <span className="text-white/35">{label}</span>
                      <span className={accent ? "text-red-300 font-semibold" : "text-white/70 font-medium"}>{value}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4">
                  {editingWebsite ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex gap-2">
                        <input
                          type="url"
                          value={website}
                          onChange={e => setWebsite(e.target.value)}
                          placeholder="https://your-website.com"
                          className={`flex-1 px-3 py-2 rounded-md text-sm text-white bg-white/[0.03] border transition-all placeholder-white/20 ${
                            websiteError
                              ? "border-red-400 focus:border-red-400"
                              : "border-white/10 focus:border-cyan-300/50"
                          }`}
                          disabled={savingWebsite}
                        />
                        <button
                          onClick={saveWebsite}
                          disabled={savingWebsite}
                          className="px-4 py-2 rounded-md bg-cyan-400 text-black font-semibold text-sm hover:bg-cyan-300 transition-colors disabled:opacity-50"
                        >
                          {savingWebsite ? <Save size={14} className="animate-spin" /> : <Save size={14} />}
                        </button>
                        <button
                          onClick={() => { setEditingWebsite(false); setWebsiteError(""); }}
                          className="px-4 py-2 rounded-md bg-white/10 text-white/60 text-sm hover:bg-white/20 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </div>
                      {websiteError && (
                        <p className="text-xs text-red-300 font-mono">{websiteError}</p>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => setEditingWebsite(true)}
                      className="w-full px-4 py-2 rounded-md border border-white/10 bg-white/[0.02] text-white/60 text-sm hover:bg-white/10 hover:border-white/20 hover:text-white transition-colors flex items-center justify-center gap-2"
                    >
                      <Edit2 size={13} /> Edit Website
                    </button>
                  )}
                </div>

                {Object.keys(byCategory).length > 0 && (
                  <>
                    <p className="text-[10px] font-mono tracking-[2px] uppercase text-white/25 mt-6 mb-3">Category Breakdown</p>
                    <div className="space-y-2.5">
                      {Object.entries(byCategory).map(([cat, count]) => {
                        const total = totals.byCategory[cat] ?? count;
                        const pct = total > 0 ? Math.min(100, Math.round((count / total) * 100)) : 0;
                        return (
                        <div key={cat}>
                          <div className="flex justify-between mb-1 text-xs">
                            <span className="text-white/45 flex items-center gap-1.5">{catIcon(cat)} {cat}</span>
                            <span className="text-white/60">{count}/{total}</span>
                          </div>
                          <div className="h-1.5 rounded-full bg-white/[0.08]">
                            <motion.div className="h-full rounded-full bg-cyan-300 shadow-[0_0_8px_rgba(103,232,249,0.45)]"
                              initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                              transition={{ duration: 0.8, delay: 0.3 }}
                            />
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>
            </FileCard>
          </motion.div>

          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Global Rank", value: stats.rank },
                { label: "Total Score", value: stats.points.toLocaleString() },
                { label: "Flags Found", value: stats.solved },
              ].map((s, i) => (
                <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
                  className="relative border border-white/8 bg-white/[0.02] p-4 text-center"
                >
                  <div className="text-2xl font-black mb-0.5">{s.value}</div>
                  <div className="text-[10px] font-mono tracking-wide uppercase text-white/30">{s.label}</div>
                </motion.div>
              ))}
            </div>

            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
              <FileCard>
                <div className="p-5">
                  {(() => {
                    // Dynamic challenges decay over time, so a player's banked score can
                    // exceed the sum of *current* challenge values. Clamp the scale so
                    // the bar never overflows and the label never reads x/y with x>y.
                    const scale = Math.max(totals.points, stats.points, 1);
                    const pct = Math.min(100, Math.round((stats.points / scale) * 100));
                    return (<>
                  <div className="flex justify-between text-xs mb-2 text-white/40">
                    <span>Score Progress</span>
                    <span className="text-white/60 font-mono">{stats.points.toLocaleString()}/{scale.toLocaleString()} · {pct}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-white/[0.08]">
                    <motion.div className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500 shadow-[0_0_12px_rgba(103,232,249,0.5)]"
                      initial={{ width: 0 }} animate={{ width: `${pct}%` }}
                      transition={{ duration: 1, delay: 0.4 }}
                    />
                  </div>
                    </>);
                  })()}
                </div>
              </FileCard>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <FileCard title="Solve History" label={`${solves.length} entries`}>
                <div className="p-4">
                  {solves.length === 0 ? (
                    <div className="text-center py-10 text-sm text-white/25">
                      <p>No entries yet</p>
                      <p className="text-xs mt-1 text-white/15">Solve challenges to populate this log</p>
                    </div>
                  ) : (
                    <div className="space-y-0.5 max-h-72 overflow-y-auto">
                      {solves.map((s, i) => {
                        const cat = s.challenge?.category || "unknown";
                        const pts = s.value || s.challenge?.value || 0;
                        const name = s.challenge?.name || `challenge_${s.challenge_id}`;
                        const when = formatSolveTime(s.date);
                        return (
                          <motion.div key={i}
                            initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 + i * 0.02 }}
                            className="flex items-center justify-between py-2.5 text-xs border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <CheckCircle2 size={12} className="text-red-300 shrink-0" />
                              <span className="text-white/25 shrink-0 font-mono uppercase">[{cat}]</span>
                              <span className="truncate text-white/70">{name}</span>
                            </div>
                            <div className="flex items-center gap-3 shrink-0 ml-3">
                              <span className="text-white/30 font-mono text-[10px]">{when}</span>
                              <span className="font-bold text-red-300">+{pts}</span>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </FileCard>
            </motion.div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
