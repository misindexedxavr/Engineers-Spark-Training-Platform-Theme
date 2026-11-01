import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ctfdApi } from "../../services/ctfdApi";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Link } from "react-router";
interface Player { id: number; name: string; score: number; place: number; solves?: number; }

const CHART_COLORS = ["#67e8f9", "#a78bfa", "#38bdf8", "#8fe3b2", "#f9a8d4"];
const CLEARANCE = [
  { label: "APEX", color: "#67e8f9" },
  { label: "ALPHA", color: "#a78bfa" },
  { label: "BETA", color: "#8fe3b2" },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="text-xs p-3 rounded border border-white/10 bg-[#08090c]/95 backdrop-blur-sm font-mono">
      <p className="mb-1.5 text-white/35">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }}>{p.name}: {p.value}</p>
      ))}
    </div>
  );
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
      <div
        className="absolute top-[-15%] left-1/2 -translate-x-1/2 w-[800px] h-[500px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse, rgba(103,232,249,0.12) 0%, transparent 70%)", filter: "blur(60px)" }}
      />
    </div>
  );
}

function FileCard({ label, title, children, className = "" }: { label?: string; title?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative border border-white/8 bg-white/[0.02] backdrop-blur-sm ${className}`}>
      <div className="absolute -top-px -left-px w-4 h-4 border-t border-l border-white/25" />
      <div className="absolute -bottom-px -right-px w-4 h-4 border-b border-r border-white/25" />
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

export function Scoreboard() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [sbr, topr] = await Promise.all([
          ctfdApi.getScoreboard(),
          ctfdApi.getScoreboardTop(10),
        ]);
        
        // Fetch solves for each player to get solve counts
        const playersData = sbr.data || [];
        const playersWithSolves = await Promise.all(
          playersData.map(async (e: any, i: number) => {
            let solves = 0;
            try {
              const sr = await ctfdApi.getUserSolves(e.account_id);
              solves = (sr.data || []).length;
            } catch {}
            return {
              id: e.account_id,
              name: e.name,
              score: e.score || 0,
              place: e.place || i + 1,
              solves,
            };
          })
        );
        setPlayers(playersWithSolves);

        const topData = topr.data || {};
        const entries = Object.values(topData as any).slice(0, 5) as any[];
        if (entries.length > 0) {
          const allDates = [...new Set(entries.flatMap(v => (v.solves || []).map((s: any) => s.date?.slice(0, 13) || "")))].sort();
          const pts = allDates.slice(0, 12).map(d => {
            const row: any = { t: d.slice(11) || d.slice(0, 10) };
            entries.forEach(v => {
              row[v.name] = (v.solves || []).filter((s: any) => (s.date || "") <= d).reduce((acc: number, s: any) => acc + (s.value || 0), 0);
            });
            return row;
          });
          setChartData(pts.length >= 2 ? pts : [
            { t: "Start", ...Object.fromEntries(playersWithSolves.slice(0, 5).map(p => [p.name, 0])) },
            { t: "Now", ...Object.fromEntries(playersWithSolves.slice(0, 5).map(p => [p.name, p.score])) },
          ]);
        } else if (playersWithSolves.length > 0) {
          setChartData([
            { t: "Start", ...Object.fromEntries(playersWithSolves.slice(0, 5).map(p => [p.name, 0])) },
            { t: "Now", ...Object.fromEntries(playersWithSolves.slice(0, 5).map(p => [p.name, p.score])) },
          ]);
        }
      } catch {
        try {
          const r = await ctfdApi.getTeams({ page: 1 });
          const list = (r.data || []).map((t: any, i: number) => ({ id: t.id, name: t.name, score: t.score || 0, place: t.place || i + 1 }));
          setPlayers(list);
        } catch {}
      } finally { setLoading(false); }
    };
    load();
  }, []);

  return (
    <div className="bg-[#07080a] text-white flex flex-col relative">
      <GridBackground />
      <Header />

      <main className="relative z-10 pt-28 pb-16 px-4 max-w-5xl mx-auto w-full">

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-9">
          <div className="inline-flex items-center gap-2 px-3 py-1 mb-4 border border-red-500/20 bg-red-500/[0.06] rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
            <span className="text-[10px] font-mono tracking-[2px] text-red-300/80 uppercase">Live rankings</span>
          </div>
          <h1 className="text-4xl font-black tracking-tight">Leaderboard</h1>
<p className="text-sm text-white/35 mt-2 font-mono">
            {players.length} players · ranked by score
          </p>
        </motion.div>

        {!loading && players.length >= 1 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
              {players.slice(0, 3).map((p, i) => {
                const c = CLEARANCE[i];
                return (
                  <div key={p.id}
                    className={`relative border p-5 ${i === 0 ? "sm:order-2" : i === 1 ? "sm:order-1" : "sm:order-3"}`}
                    style={{ borderColor: `${c.color}30`, background: `${c.color}08` }}
                  >
                    <div className="absolute -top-px -left-px w-3.5 h-3.5 border-t border-l" style={{ borderColor: c.color }} />
                    <div className="absolute -bottom-px -right-px w-3.5 h-3.5 border-b border-r" style={{ borderColor: c.color }} />
                    <span className="inline-block text-[9px] font-mono tracking-[2px] uppercase px-2 py-0.5 mb-3 border rounded-sm"
                      style={{ color: c.color, borderColor: `${c.color}50` }}
                    >
                      {c.label} place
                    </span>
                    <p className="text-sm font-semibold truncate text-white/85 mb-1">{p.name}</p>
                    <p className="text-2xl font-black font-mono" style={{ color: c.color }}>
                      {p.score.toLocaleString()}
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5 uppercase tracking-wide">points logged</p>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {chartData.length >= 2 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mb-5">
            <FileCard title="Score Progression" label="Top 5 Agents">
              <div className="p-5 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      {players.slice(0, 5).map((p, i) => (
                        <linearGradient key={p.id} id={`g${i}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={CHART_COLORS[i]} stopOpacity={0.25} />
                          <stop offset="95%" stopColor={CHART_COLORS[i]} stopOpacity={0} />
                        </linearGradient>
                      ))}
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                    <XAxis dataKey="t" stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.25)" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    {players.slice(0, 5).map((p, i) => (
                      <Area key={p.id} type="monotone" dataKey={p.name} stroke={CHART_COLORS[i]} fill={`url(#g${i})`} strokeWidth={1.5} />
                    ))}
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </FileCard>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <FileCard title="Players" label={`${players.length} total`}>
            <div className="flex items-center gap-3 px-5 py-2.5 text-[10px] font-mono uppercase tracking-[2px] text-white/25 border-b border-white/6">
              <span className="w-10 shrink-0">Rank</span>
              <span className="flex-1">Handle</span>
              <span className="w-16 text-center shrink-0">Solves</span>
              <span className="w-24 text-right shrink-0">Score</span>
            </div>

            {loading ? (
              <div className="flex justify-center py-16">
                <p className="text-sm text-white/25 font-mono animate-pulse">indexing agents...</p>
              </div>
) : players.length === 0 ? (
            <div className="text-center py-16 text-sm text-white/25 font-mono">no data available</div>
          ) : (
                        players.map((p, i) => {
              const isTop = i < 3;
              const color = isTop ? CLEARANCE[i].color : "rgba(255,255,255,0.35)";
              return (
                <Link to={`/users/${p.id}`} key={p.id}>
                  <motion.div
                    initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 + i * 0.02 }}
                    className="flex cursor-pointer items-center gap-3 px-5 py-3 text-sm border-b border-white/[0.03] transition-colors"
                    style={{ borderLeft: isTop ? `2px solid ${color}` : "2px solid transparent" }}
                    onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.015)"}
                    onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = "transparent"}
                  >
                    <div className="w-10 shrink-0 text-sm font-bold font-mono" style={{ color }}>
                      #{i + 1}
                    </div>
                    <div className="flex-1 flex items-center gap-2.5 min-w-0">
                      <span className="w-7 h-7 flex items-center justify-center text-[10px] font-bold border shrink-0"
                        style={{ borderColor: isTop ? `${color}50` : "rgba(255,255,255,0.1)", background: isTop ? `${color}0d` : "rgba(255,255,255,0.02)", color: isTop ? color : "rgba(255,255,255,0.5)" }}
                      >
                        {p.name.slice(0, 2).toUpperCase()}
                      </span>
                      <span className="truncate text-white/80">{p.name}</span>
                    </div>
                    <div className="w-16 text-center text-xs text-white/30 shrink-0 font-mono">{p.solves ?? "—"}</div>
                    <div className="w-24 text-right font-bold shrink-0 font-mono" style={{ color: isTop ? color : "rgba(255,255,255,0.7)" }}>
                      {p.score.toLocaleString()}
                    </div>
                  </motion.div>
                </Link>
              );
            })
          )}
            
          </FileCard>
        </motion.div>
        
      </main>
      <Footer />
    </div>
  );
}
