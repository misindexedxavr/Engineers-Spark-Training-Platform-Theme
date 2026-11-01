import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ctfdApi } from "../../services/ctfdApi";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { CATEGORIES } from "./CategoryChallenges";

function matchSlug(apiCat: string): string {
  const k = (apiCat || "").toLowerCase().trim();
  if (k.includes("reverse") || k.includes("rev")) return "reverse-engineering";
  if (k.includes("web")) return "web-exploitation";
  if (k.includes("general") || k.includes("knowledge") || k === "gk") return "general-knowledge";
  if (k.includes("forensic") || k.includes("foren")) return "forensics";
  if (k.includes("pwn")) return "pwn";
  if (k.includes("hardware") || k.includes("hw")) return "hardware";
  if (k.includes("crypto")) return "crypto";
  if (k.includes("osint")) return "osint";
  return "misc";
}

interface CatStats { total: number; solved: number; points: number; }

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

export function Challenges() {
  const [catStats, setCatStats] = useState<Record<string, CatStats>>({});
  const [totalSolved, setTotalSolved] = useState(0);
  const [totalPts, setTotalPts] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ctfdApi.getChallenges()
      .then(r => {
        const all = r.data || [];
        const stats: Record<string, CatStats> = {};
        for (const slug of Object.keys(CATEGORIES)) stats[slug] = { total: 0, solved: 0, points: 0 };
        for (const ch of all) {
          const slug = matchSlug(ch.category || "");
          if (!stats[slug]) stats[slug] = { total: 0, solved: 0, points: 0 };
          stats[slug].total++;
          stats[slug].points += ch.value || 0;
          if (ch.solved_by_me) stats[slug].solved++;
        }
        setCatStats(stats);
        setTotalSolved(all.filter((c: any) => c.solved_by_me).length);
        setTotalPts(all.filter((c: any) => c.solved_by_me).reduce((s: number, c: any) => s + (c.value || 0), 0));
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="bg-[#07080a] text-white flex flex-col relative">
      <GridBackground />
      <Header />

      <main className="relative z-10 pt-28 pb-16 px-4 max-w-6xl mx-auto w-full">

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-9">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-red-500/20 bg-red-500/[0.06] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-[2px] text-red-300/80 uppercase">Explore challenges</span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <h1 className="text-4xl font-black tracking-tight">Challenge Board</h1>
            <div className="flex items-center gap-4 text-sm font-mono">
              <span className="text-white/70"><span className="text-white font-bold">{totalPts.toLocaleString()}</span> pts</span>
              <span className="text-white/15">/</span>
              <span className="text-white/70"><span className="text-white font-bold">{totalSolved}</span> solved</span>
            </div>
          </div>
        </motion.div>

        {loading ? (
          <div className="flex justify-center py-32">
            <p className="text-sm text-white/25 font-mono animate-pulse">loading categories...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(CATEGORIES).map(([slug, cfg], i) => {
              const Icon = cfg.icon;
              const stats = catStats[slug] ?? { total: 0, solved: 0, points: 0 };
              const pct = stats.total > 0 ? Math.round((stats.solved / stats.total) * 100) : 0;

              return (
                <motion.div key={slug}
                  initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
                >
                  <Link to={`/challenges/${slug}`} className="block group">
                    <div className="relative border border-white/8 bg-white/[0.02] backdrop-blur-sm p-5 transition-all hover:border-white/16 hover:bg-white/[0.035]">
                      {slug !== "misc" && <><div className="absolute -top-px -left-px w-3.5 h-3.5 border-t border-l transition-colors" style={{ borderColor: `${cfg.color}40` }} />
                      <div className="absolute -bottom-px -right-px w-3.5 h-3.5 border-b border-r transition-colors" style={{ borderColor: `${cfg.color}40` }} /></>}

                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-9 h-9 flex items-center justify-center rounded-md shrink-0"
                          style={{ background: `${cfg.color}12`, border: `1px solid ${cfg.color}30` }}
                        >
                          <Icon size={16} style={{ color: cfg.color }} />
                        </div>
                        <span className="font-bold text-white/85">{cfg.label}</span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-white/35 mb-3 font-mono">
                        <span>{stats.total} targets</span>
                        <span className="text-white/10">·</span>
                        <span style={{ color: cfg.color }}>{stats.solved} solved</span>
                        <span className="text-white/10">·</span>
                        <span>{stats.points.toLocaleString()} pts</span>
                      </div>

                      <div className="w-full h-1 rounded-full bg-white/[0.06]">
                        <div className="h-1 rounded-full transition-all" style={{ width: `${pct}%`, background: cfg.color }} />
                      </div>
                      <div className="flex justify-between text-[11px] mt-1.5 text-white/25 font-mono">
                        <span>progress</span>
                        <span style={{ color: pct === 100 ? cfg.color : "rgba(255,255,255,0.35)" }}>{pct}%</span>
                      </div>

                      <div className="absolute right-4 bottom-4 text-xs opacity-0 group-hover:opacity-100 transition-opacity font-mono"
                        style={{ color: cfg.color }}
                      >
                        →
                      </div>
                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
