import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ctfdApi } from "../../services/ctfdApi";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ArrowLeft, User, Search } from "lucide-react";

interface UserListEntry {
  id: number;
  name: string;
  email: string;
  score: number;
  place: number | null;
  website: string | null;
  country: string | null;
  affiliation: string | null;
  bracket_id: number | null;
  bracket_name: string | null;
  type: string;
  hidden: boolean;
  banned: boolean;
}

export function Users() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  useEffect(() => {
    let mounted = true;
    ctfdApi.getUsersList()
      .then(async (r) => {
        console.log("[Users] API response:", r);
        if (!mounted) return;
        // Filter out admin/root and hidden/banned users
        const usersData = (r.data || []).filter(u => 
          (u.hidden !== true) && (u.banned !== true) && u.name !== "admin" && u.name !== "root"
        );
        console.log("[Users] Filtered data:", usersData);

        // Fetch scoreboard to get place (rank) for each user
        try {
          const sb = await ctfdApi.getScoreboard();
          console.log("[Users] Scoreboard response:", sb);
          if (!mounted) return;
          const sbData = (sb.data || []).filter(u => u.name !== "admin");
          
          // Create lookup maps from scoreboard for place (rank)
          // Scoreboard uses 'pos' field, not 'place'
          const placeMap = new Map(sbData.map(u => [u.name, u.pos || u.place || null]));
          const scoreMap = new Map(sbData.map(u => [u.name, u.score || 0]));
          const accountIdMap = new Map(sbData.map(u => [u.name, u.account_id || u.id]));
          
          // Users in scoreboard get their rank; others get computed rank by score
          const scoreboardNames = new Set(sbData.map(u => u.name));
          const scoreboardUsers = sbData.map(u => ({ name: u.name, score: u.score || 0 }));
          
          // Merge users data with scoreboard data
          const merged = usersData.map(u => {
            const inScoreboard = scoreboardNames.has(u.name);
            const place = inScoreboard ? (placeMap.get(u.name) || null) : null;
            const score = scoreMap.get(u.name) || u.score || 0;
            return {
              ...u,
              score,
              place,
              account_id: accountIdMap.get(u.name) || u.id,
            };
          });
          
          // Compute rank for users not in scoreboard (sort by score descending)
          const usersWithScore = merged.filter(u => (u.score || 0) > 0);
          usersWithScore.sort((a, b) => (b.score || 0) - (a.score || 0));
          usersWithScore.forEach((u, idx) => {
            if (!u.place) u.place = idx + 1 + (sbData.length || 0);
          });
          
          console.log("[Users] Merged data:", merged);
          if (mounted) setUsers(merged);
        } catch (err) {
          console.error("[Users] Scoreboard merge error:", err);
          // Fallback: use users data as-is
          if (mounted) setUsers(usersData);
        }
      })
      .catch(err => {
        console.error("[Users] API error:", err);
        if (!mounted) return;
        setError(err?.message || "Failed to load users");
      })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, []);

  const filtered = users.filter(u =>
    !search || u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="bg-[#07080a] text-white flex flex-col">
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-28">
        <div className="mb-7">
          <Link to="/"
            className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-white/45 transition hover:text-cyan-200"
          >
            <ArrowLeft size={14} /> Back to home
          </Link>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-[10px] font-mono tracking-[.18em] text-cyan-200/60">TRAINING PARTICIPANTS</p>
          <h1 className="text-4xl font-bold tracking-tight">Users</h1>
        </div>

        <div className="mb-4">
          <div className="relative max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search users..."
              className="w-full rounded-xl border border-white/10 bg-white/[.035] py-2.5 pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50"
            />
          </div>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg border border-red-500/25 bg-red-500/[0.06] text-red-300 text-sm font-mono">
            Error: {error}
          </div>
        )}

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025] shadow-[0_20px_60px_rgba(0,0,0,.18)]">
          <div className="flex items-center gap-3 border-b border-white/8 bg-white/[.025] px-5 py-3 text-[10px] font-mono tracking-[.12em] text-white/35">
            <span className="w-8 shrink-0">#</span>
            <span className="flex-1">USER</span>
            <span className="w-32 text-right shrink-0 md:block">WEBSITE</span>
            <span className="w-24 text-right shrink-0 md:block">RANK</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <p className="text-sm animate-pulse text-white/35">Loading users…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-white/35">No users found.</div>
          ) : (
            filtered.map((u, i) => (
              <Link to={`/users/${u.id}`} className="block">
                <motion.div
                  key={u.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.025 }}
                  className="flex cursor-pointer items-center gap-3 border-b border-white/[.06] px-5 py-4 text-sm transition-all hover:bg-white/[.035]"
                >
                <span className="w-8 shrink-0 text-center text-white/40">{u.place || i + 1}</span>

                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-cyan-300/10 flex items-center justify-center shrink-0">
                    <User size={14} className="text-cyan-200" />
                  </div>
                  <div>
                    <span className="font-medium text-white truncate block">{u.name}</span>
                    {u.email && <span className="text-xs text-white/30">@{u.email.split("@")[0]}</span>}
                  </div>
                </div>

                <span className="w-32 shrink-0 text-right text-sm text-white/50 truncate max-w-[160px]">
                  {u.website ? (
                    <a href={u.website.startsWith("http") ? u.website : `https://${u.website}`} 
                       target="_blank" rel="noopener noreferrer" 
                       className="text-cyan-300 hover:text-cyan-100 underline truncate block">
                      {u.website.replace(/^https?:\/\//, "")}
                    </a>
                  ) : (
                    <span className="text-white/30">—</span>
                  )}
                </span>
                <span className="w-24 shrink-0 text-right text-sm font-medium text-cyan-200">#{u.place || "—"}</span>
              </motion.div>
              </Link>
            ))
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
}