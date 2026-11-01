import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { Trophy, Users, Target, Search } from "lucide-react";
import { ctfdApi } from "../../services/ctfdApi";

interface Team { id: number; name: string; score: number; place: number; members_count?: number; }

const CLEARANCE = [
  { label: "APEX", color: "#67e8f9" },
  { label: "ALPHA", color: "#a78bfa" },
  { label: "BETA", color: "#8fe3b2" },
];

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
      <div
        className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(103,232,249,0.12) 0%, transparent 70%)", filter: "blur(60px)" }}
      />
    </div>
  );
}

export function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      const all: Team[] = [];
      let page = 1;
      while (true) {
        const r = await ctfdApi.getTeams({ page });
        all.push(...(r.data || []));
        const pages = r.meta?.pagination?.pages;
        if (!pages || page >= pages) break;
        page++;
      }
      setTeams(all);
      setLoading(false);
    };
    fetchAll().catch(() => setLoading(false));
  }, []);

  const filtered = teams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="bg-[#07080a] text-white flex flex-col relative">
      <GridBackground />
      <Header />

      <main className="relative z-10 pt-28 pb-16 px-4 max-w-6xl mx-auto w-full">

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-9">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-red-500/20 bg-red-500/[0.06] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-[2px] text-red-300/80 uppercase">Teams</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Teams</h1>
          <p className="text-sm text-white/35 mt-2 font-mono">{teams.length} teams participating</p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-8">
          {[
            { label: "Teams", value: teams.length, icon: Users },
            { label: "Top Score", value: teams[0]?.score?.toLocaleString() || "—", icon: Trophy },
            { label: "Total Members", value: teams.reduce((s, t) => s + (t.members_count || 0), 0) || "—", icon: Target },
          ].map((s, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.08 }}
              className="relative border border-white/8 bg-white/[0.02] p-5"
            >
              <div className="absolute -top-px -left-px w-3.5 h-3.5 border-t border-l border-white/20" />
              <div className="absolute -bottom-px -right-px w-3.5 h-3.5 border-b border-r border-white/20" />
              <s.icon size={16} className="text-white/40 mb-3" />
              <div className="text-2xl font-black mb-0.5">{loading ? "—" : s.value}</div>
              <div className="text-[10px] font-mono tracking-wide uppercase text-white/30">{s.label}</div>
            </motion.div>
          ))}
        </div>

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="relative mb-6 max-w-md">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/25" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search team..."
            className="w-full pl-10 pr-4 py-2.5 rounded-md text-sm text-white bg-white/[0.03] border border-white/10 focus:border-red-400/40 focus:outline-none focus:ring-1 focus:ring-red-400/20 transition-all placeholder-white/20"
          />
          {search && (
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[10px] font-mono text-white/30">
              {filtered.length} found
            </span>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
          className="relative border border-white/8 bg-white/[0.02] backdrop-blur-sm overflow-hidden"
        >
          <div className="absolute -top-px -left-px w-3.5 h-3.5 border-t border-l border-white/20" />
          <div className="absolute -bottom-px -right-px w-3.5 h-3.5 border-b border-r border-white/20" />

          <div className="flex items-center gap-2 px-5 py-2.5 text-[10px] font-mono uppercase tracking-[2px] text-white/25 border-b border-white/6">
            <span className="w-10 shrink-0">Rank</span>
            <span className="flex-1">Team</span>
            <span className="w-20 text-center shrink-0">Members</span>
            <span className="w-24 text-right shrink-0">Score</span>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <p className="text-sm text-white/25 font-mono animate-pulse">indexing teams...</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 text-sm text-white/25 font-mono">no teams found</div>
          ) : (
            <AnimatePresence>
              {filtered.map((team, idx) => {
                const rank = team.place || idx + 1;
                const isTop = rank <= 3;
                const c = isTop ? CLEARANCE[rank - 1] : null;
                return (
                  <motion.div key={team.id}
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + idx * 0.02 }}
                    className="flex items-center gap-2 px-5 py-3 text-sm border-b border-white/[0.03] transition-colors"
                    style={{ borderLeft: isTop ? `2px solid ${c!.color}` : "2px solid transparent" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <div className="w-10 shrink-0 font-bold font-mono" style={{ color: isTop ? c!.color : "rgba(255,255,255,0.35)" }}>
                      #{rank}
                    </div>
                    <div className="flex-1 flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 flex items-center justify-center text-[10px] font-bold border shrink-0"
                        style={{
                          borderColor: isTop ? `${c!.color}50` : "rgba(255,255,255,0.1)",
                          background: isTop ? `${c!.color}0d` : "rgba(255,255,255,0.02)",
                          color: isTop ? c!.color : "rgba(255,255,255,0.5)",
                        }}
                      >
                        {team.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <span className="truncate block font-medium" style={{ color: isTop ? c!.color : "rgba(255,255,255,0.8)" }}>
                          {team.name}
                        </span>
                        {isTop && (
                          <span className="text-[9px] font-mono uppercase tracking-wide" style={{ color: `${c!.color}90` }}>
                            {c!.label} team
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="w-20 text-center text-xs text-white/30 shrink-0 font-mono">{team.members_count ?? "—"}</div>
                    <div className="w-24 text-right font-bold shrink-0 font-mono" style={{ color: isTop ? c!.color : "rgba(255,255,255,0.7)" }}>
                      {team.score.toLocaleString()}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
}
