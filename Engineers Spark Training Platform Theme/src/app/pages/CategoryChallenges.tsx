import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { ctfdApi } from "../../services/ctfdApi";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { X, Flag, CheckCircle, Lock, Globe, Cpu, Shield, Zap, Search, Terminal, ArrowLeft, Brain, ExternalLink, Server, Square, Timer } from "lucide-react";
import type { ChallengeSolveEntry } from "../../services/ctfdApi";

// Types
interface Challenge {
  id: number; name: string; value: number; description?: string;
  solved_by_me: boolean; solves?: number; category?: string; type?: string;
}

// Category config
export const CATEGORIES: Record<string, { label: string; slug: string; icon: any; color: string }> = {
  "general-knowledge":     { label: "General Knowledge",  slug: "general-knowledge",     icon: Brain,     color: "#67e8f9" },
  "reverse-engineering": { label: "Reverse Engineering", slug: "reverse-engineering", icon: Cpu,      color: "#ff6622" },
  "web-exploitation":    { label: "Web Exploitation",    slug: "web-exploitation",    icon: Globe,    color: "#00aaff" },
  "forensics":           { label: "Forensics",           slug: "forensics",           icon: Shield,   color: "#00ff41" },
  "pwn":                 { label: "PWN",                 slug: "pwn",                 icon: Terminal, color: "#ff2222" },
  "hardware":            { label: "Hardware",            slug: "hardware",            icon: Zap,      color: "#ffb000" },
  "crypto":              { label: "Crypto",              slug: "crypto",              icon: Lock,     color: "#aa44ff" },
  "osint":               { label: "OSINT",               slug: "osint",               icon: Search,   color: "#00ccff" },
  "misc":                { label: "Misc",                slug: "misc",                icon: Search,   color: "rgba(0,255,65,0.6)" },
};

// Maps api category strings to our slug
function matchSlug(apiCat: string): string {
  const k = (apiCat || "").toLowerCase().trim();
  if (k.includes("reverse") || k.includes("rev"))        return "reverse-engineering";
  if (k.includes("web"))                                  return "web-exploitation";
  if (k.includes("general") || k.includes("knowledge") || k === "gk") return "general-knowledge";
  if (k.includes("forensic") || k.includes("foren"))     return "forensics";
  if (k.includes("pwn"))                                  return "pwn";
  if (k.includes("hardware") || k.includes("hw"))        return "hardware";
  if (k.includes("crypto"))                               return "crypto";
  if (k.includes("osint"))                               return "osint";
  return "misc";
}

// Challenge text is administrator-authored but is still treated as untrusted input.
// This deliberately supports a useful Markdown subset while escaping all raw HTML.
function renderChallengeMarkdown(markdown: string) {
  const escapeHtml = (value: string) => value.replace(/[&<>"']/g, char => ({
    "&": "&", "<": "<", ">": ">", '"': "\"", "'": "'",
  }[char] || char));

  const safeHref = (raw: string) => {
    try {
      const url = new URL(raw, "https://markdown.invalid");
      if (raw.startsWith("/") || raw.startsWith("#")) return raw.startsWith("#") ? url.hash : `${url.pathname}${url.search}${url.hash}`;
      return ["http:", "https:", "mailto:"].includes(url.protocol) ? url.href : null;
    } catch { return null; }
  };

  const inline = (value: string) => {
    let output = escapeHtml(value);
    output = output.replace(/\[([^\]]+)]\(([^\s)]+)\)/g, (_match, label, href) => {
      const safe = safeHref(href);
      return safe ? `<a href="${safe}" target="_blank" rel="noopener noreferrer">${label}</a>` : label;
    });
    output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
    output = output.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    output = output.replace(/__([^_]+)__/g, "<strong>$1</strong>");
    output = output.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    return output;
  };

  const lines = markdown.replace(/\r\n?/g, "\n").split("\n");
  const html: string[] = [];
  let code: string[] = [];
  let inCode = false;
  let listType: "ul" | "ol" | null = null;

  const closeList = () => { if (listType) { html.push(`</${listType}>`); listType = null; } };
  const closeCode = () => { if (inCode) { html.push(`<pre><code>${escapeHtml(code.join("\n"))}</code></pre>`); code = []; inCode = false; } };

  for (const line of lines) {
    if (line.trim().startsWith("```")) { if (inCode) closeCode(); else { closeList(); inCode = true; } continue; }
    if (inCode) { code.push(line); continue; }
    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    const unordered = line.match(/^[-*+]\s+(.+)$/);
    const ordered = line.match(/^\d+\.\s+(.+)$/);
    if (heading) { closeList(); const level = heading[1].length; html.push(`<h${level}>${inline(heading[2])}</h${level}>`); }
    else if (unordered) { if (listType !== "ul") { closeList(); listType = "ul"; html.push("<ul>"); } html.push(`<li>${inline(unordered[1])}</li>`); }
    else if (ordered) { if (listType !== "ol") { closeList(); listType = "ol"; html.push("<ol>"); } html.push(`<li>${inline(ordered[1])}</li>`); }
    else if (!line.trim()) { closeList(); }
    else if (/^\s*(?:>{1,2}\s*)?author\s*:/i.test(line)) {
      closeList();
      const author = line.replace(/^\s*(?:>{1,2}\s*)?author\s*:\s*/i, "");
      html.push(`<p class="challenge-author"><span>Author</span>${inline(author)}</p>`);
    }
    else { closeList(); html.push(`<p>${inline(line)}</p>`); }
  }
  closeList(); closeCode();
  return html.join("");
}

interface SwarmInstance { subdomain: string; port?: number | string; scheme?: string; expires_at: number; }

function swarmUrl(instance: SwarmInstance) {
  try {
    const scheme = instance.scheme === "https" ? "https" : "http";
    const port = instance.port && !["80", "443", 80, 443].includes(instance.port) ? `:${instance.port}` : "";
    return new URL(`${scheme}://${instance.subdomain}${port}/`).href;
  } catch { return null; }
}

function ChallengeRow({ ch, onClick, index }: { ch: Challenge; onClick: () => void; index: number }) {
  const [hover, setHover] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.025 }}
      className="flex cursor-pointer items-center gap-3 border-b border-white/[.06] px-5 py-4 text-sm transition-all hover:bg-white/[.035]"
      style={{
        background: hover ? "rgba(255,255,255,.035)" : ch.solved_by_me ? "rgba(103,232,249,.035)" : "transparent",
      }}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div className="w-5 shrink-0">
        {ch.solved_by_me
          ? <CheckCircle size={15} className="text-cyan-200" />
          : <div className="h-3 w-3 rounded-full border border-white/20" />}
      </div>

      <span className={`flex-1 truncate font-medium ${ch.solved_by_me ? "text-cyan-100" : "text-white/75"}`}>
        {ch.name}
      </span>

      <span className="w-14 shrink-0 text-right text-sm font-bold text-white/70">{ch.value}
      </span>

      <span className="hidden w-14 shrink-0 text-right text-xs text-white/30 md:block">
        {ch.solves || 0}✓
      </span>
    </motion.div>
  );
}

function SwarmPanel({ challengeId }: { challengeId: number }) {
  const [instance, setInstance] = useState<SwarmInstance | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [remaining, setRemaining] = useState(0);

  const refresh = async () => {
    try { const response = await ctfdApi.getSwarmInstance(challengeId); setInstance(response.instance || null); }
    catch { setError("Unable to load this instance."); }
  };
  useEffect(() => { void refresh(); }, [challengeId]);
  useEffect(() => {
    if (!instance?.expires_at) { setRemaining(0); return; }
    const tick = () => setRemaining(Math.max(0, Math.round(instance.expires_at - Date.now() / 1000)));
    tick(); const timer = window.setInterval(tick, 1000); return () => window.clearInterval(timer);
  }, [instance]);

  const spawn = async () => {
    setBusy(true); setError("");
    try { const response = await ctfdApi.spawnSwarmInstance(challengeId); if (response.success && response.instance) setInstance(response.instance); else setError(response.error || response.message || "Could not start the instance."); }
    catch (err: any) { setError(err?.message || "Could not start the instance."); }
    finally { setBusy(false); }
  };
  const stop = async () => {
    setBusy(true); setError("");
    try { const response = await ctfdApi.stopSwarmInstance(challengeId); if (response.success) { setInstance(null); await refresh(); } else setError(response.error || response.message || "Could not stop the instance."); }
    catch (err: any) { setError(err?.message || "Could not stop the instance."); }
    finally { setBusy(false); }
  };
  const url = instance ? swarmUrl(instance) : null;

  return <section className="mb-5 rounded-xl border border-cyan-300/20 bg-cyan-300/[.055] p-4">
    <div className="mb-3 flex items-center gap-2 text-[10px] font-mono tracking-[.16em] text-cyan-100/75"><Server size={14} /> SWARM INSTANCE</div>
    {instance ? <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="text-sm font-bold text-cyan-100">Instance running</p>{url ? <a href={url} target="_blank" rel="noopener noreferrer" className="mt-1 inline-flex items-center gap-1 text-xs text-cyan-200 hover:text-white">{instance.subdomain}{instance.port ? `:${instance.port}` : ""} <ExternalLink size={12} /></a> : <p className="mt-1 text-xs text-rose-300">Invalid instance address.</p>}</div><div className="flex items-center gap-2"><span className="inline-flex items-center gap-1 text-xs text-white/45"><Timer size={13} />{remaining}</span><button type="button" onClick={() => void stop()} disabled={busy} className="rounded-lg border border-white/15 px-3 py-2 text-xs font-bold text-white/70 transition hover:border-rose-300/50 hover:text-rose-200 disabled:opacity-50"><Square size={11} className="mr-1 inline" />Stop</button></div></div> : <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-xs text-white/45">Start a private challenge instance.</p><button type="button" onClick={() => void spawn()} disabled={busy} className="rounded-lg bg-cyan-200 px-3.5 py-2 text-xs font-bold text-slate-950 transition hover:bg-white disabled:opacity-50">{busy ? "Starting..." : "Spawn instance"}</button></div>}
    {error && <p className="mt-3 text-xs text-rose-300">{error}</p>}
  </section>;
}

function FlagModal({ ch, loadingDescription, onClose }: { ch: Challenge; loadingDescription: boolean; onClose: () => void }) {
  const [flag, setFlag] = useState("");
  const [msg, setMsg]   = useState("");
  const [ok, setOk]     = useState(false);
  const [busy, setBusy] = useState(false);
  const [solvers, setSolvers] = useState<ChallengeSolveEntry[]>([]);
  const [tab, setTab] = useState<"challenge" | "solves">("challenge");

useEffect(() => {
  ctfdApi.getChallengeSolves(ch.id).then(r => setSolvers(r.data || [])).catch(() => {});
}, [ch.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flag.trim()) return;
    setBusy(true); setMsg("");
    try {
      const r = await ctfdApi.submitFlag(ch.id, flag.trim());
      if (r.data?.status === "correct") { setOk(true); setMsg("FLAG ACCEPTED - Well done, agent."); }
      else setMsg(r.data?.message || "INCORRECT FLAG - Try again.");
    } catch { setMsg("SUBMISSION_FAILED - Connection error."); }
    finally { setBusy(false); }
    
  };

  return (
    <motion.div className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      style={{ background: "rgba(5, 8, 16, 0.78)", backdropFilter: "blur(12px)" }}
      onClick={onClose}
    >
      <motion.div initial={{ scale: 0.95, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
        className="w-full max-w-[720px] min-h-[500px] overflow-y-auto rounded-2xl border border-white/10 bg-[#101727] shadow-[0_28px_90px_rgba(0,0,0,.5)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="h-px bg-gradient-to-r from-transparent via-cyan-300/70 to-transparent" />
        <div className="flex items-center justify-between border-b border-white/8 bg-white/[.025] px-5">
  <div className="flex items-center gap-1">
    <button
      onClick={() => setTab("challenge")}
      className="px-4 py-3 text-sm font-medium transition border-b-2"
      style={{
        color: tab === "challenge" ? "#fff" : "rgba(255,255,255,0.4)",
        borderColor: tab === "challenge" ? "#fff" : "transparent",
      }}
    >
      Challenge
    </button>
    <button
      onClick={() => setTab("solves")}
      className="px-4 py-3 text-sm font-medium transition border-b-2"
      style={{
        color: tab === "solves" ? "#e0505a" : "rgba(255,255,255,0.4)",
        borderColor: tab === "solves" ? "#e0505a" : "transparent",
      }}
    >
      {solvers.length || ch.solves || 0} Solves
    </button>
  </div>
  <button onClick={onClose} className="text-white/40 transition hover:text-white"><X size={17} /></button>
</div>

        <div className="p-6">
          {tab === "challenge" ? (
  <>
    <div className="flex items-start justify-between gap-3 mb-2">
      <h2 className="text-2xl font-bold tracking-tight text-white">{ch.name}</h2>
      <span className="shrink-0 rounded-full bg-cyan-300/10 px-3 py-1 text-sm font-bold text-cyan-200">{ch.value} pts</span>
    </div>
    <div className="mb-5 flex items-center gap-4 text-xs text-white/40">
      {ch.solved_by_me && <span className="text-cyan-200"><CheckCircle size={10} className="mr-1 inline" />SOLVED</span>}
    </div>

    <div className="mb-5 rounded-xl border border-white/8 bg-black/15 p-4 text-sm leading-relaxed text-white/60" style={{ maxHeight: "280px", overflow: "auto" }}>
      {loadingDescription ? (
        <span className="animate-pulse text-white/35">Loading challenge details...</span>
      ) : ch.description ? (
        <div className="ctfd-challenge-description" dangerouslySetInnerHTML={{ __html: renderChallengeMarkdown(ch.description) }} />
      ) : (
        "No description available."
      )}
    </div>
    {ch.type === "swarm" && <SwarmPanel challengeId={ch.id} />}
    {ch.files && ch.files.length > 0 && (
      <div className="mb-4">
        <p className="mb-2 text-[10px] font-mono tracking-[.16em] text-white/35">FILES</p>
        <div className="flex flex-wrap gap-2">
          {ch.files.map((file: string, i: number) => {
              const fileUrl = file.startsWith('/files/') ? file : `/files/${file}`;
              const fileName = file.split('/').pop()?.split('?')[0] || file;
              return (
                <a
                  key={i}
                  href={file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-sm bg-white/[0.03] border border-white/10 rounded-md text-white/70 hover:bg-white/[0.05] hover:border-white/20 transition-colors"
                >
                  <svg width="14" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-white/50 shrink-0">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                  </svg>
                  <span className="truncate max-w-[200px]">{fileName}</span>
                </a>
              );
            })}
        </div>
      </div>
    )}
    <p className="mb-2 text-[10px] font-mono tracking-[.16em] text-white/35">FLAG SUBMISSION</p>

    {!ch.solved_by_me ? (
      <form onSubmit={submit} className="space-y-2 mt-3">
        <div className="flex gap-2">
          <input value={flag} onChange={e => setFlag(e.target.value)} placeholder="Spark{...}"
            className="flex-1 rounded-lg border border-white/10 bg-black/20 px-3 py-2.5 text-sm text-white outline-none focus:border-cyan-300/60"
          />
          <button type="submit" disabled={busy || ok}
            className="rounded-lg bg-cyan-200 px-4 text-xs font-bold tracking-wide text-slate-950 transition hover:bg-white disabled:opacity-60"
          >
            {busy ? "..." : ok ? "✓" : "SUBMIT"}
          </button>
        </div>
        {msg && <p className={`text-xs ${ok ? "text-cyan-200" : "text-rose-300"}`}>{msg}</p>}
      </form>
    ) : (
      <div className="mt-3 rounded-lg border border-cyan-300/25 bg-cyan-300/[.08] py-3 text-center text-sm text-cyan-200">Challenge completed</div>
    )}
  </>
) : (
  <div className="max-h-[420px] overflow-y-auto pr-1">
  {solvers.length === 0 ? (
    <p className="py-8 text-center text-sm text-white/30">No solves yet.</p>
  ) : (
    solvers.map((s, i) => (
      <Link
        key={i}
        to={`/users/${s.account_id}`}
        className="flex items-center justify-between gap-3 border-b border-white/[.05] py-2.5 text-sm transition-colors hover:bg-white/[.02]"
        style={{ textDecoration: "none" }}
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/[.06] text-[10px] font-bold text-white/50">
            {s.name.slice(0, 2).toUpperCase()}
          </span>
          <span className="truncate text-white/75" style={{ color: "rgba(255,255,255,0.75)" }}>{s.name}</span>
        </div>
        <span className="shrink-0 text-xs text-white/30">{new Date(s.date).toLocaleDateString()}</span>
      </Link>
    ))
  )}
</div>
)}
        </div>
      </motion.div>
    </motion.div>
);
}

function CategoryChallenges() {
  const { category } = useParams<{ category: string }>();
  const catConfig = CATEGORIES[category || "misc"] ?? CATEGORIES["misc"];
  const Icon = catConfig.icon;

  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState("");
  const [selected, setSelected]     = useState<Challenge | null>(null);
  const [loadingDescription, setLoadingDescription] = useState(false);

  useEffect(() => {
    ctfdApi.getChallenges()
      .then(r => {
        const all: Challenge[] = r.data || [];
        const filtered = all.filter(c => matchSlug(c.category || "") === (category || "misc"));
        setChallenges(filtered);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [category]);

  const filtered = challenges.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase())
  );

  const solved = challenges.filter(c => c.solved_by_me).length;
  const pts    = challenges.filter(c => c.solved_by_me).reduce((s, c) => s + (c.value || 0), 0);

  const openChallenge = async (summary: Challenge) => {
    setSelected(summary);
    setLoadingDescription(true);
    try {
      const response = await ctfdApi.getChallenge(summary.id);
      if (response.data) {
        setSelected(current => current?.id === summary.id ? { ...summary, ...response.data } : current);
      }
    } finally {
      setLoadingDescription(false);
    }
  };

  return (
    <div className="bg-[#07080a] text-white flex flex-col">
      <AnimatePresence>{selected && <FlagModal ch={selected} loadingDescription={loadingDescription} onClose={() => setSelected(null)} />}</AnimatePresence>
      <Header />
      <main className="relative z-10 mx-auto w-full max-w-6xl px-4 pb-16 pt-28">
        <div className="mb-7">
          <Link to="/challenges"
            className="inline-flex items-center gap-2 text-xs font-medium tracking-wide text-white/45 transition hover:text-cyan-200"
          >
            <ArrowLeft size={14} /> Back to categories
          </Link>
        </div>

        <div className="mb-8">
          <p className="mb-3 text-[10px] font-mono tracking-[.18em] text-cyan-200/60">CHALLENGE COLLECTION</p>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Icon size={28} style={{ color: catConfig.color }} />
              <h1 className="text-4xl font-bold tracking-tight text-white">{catConfig.label}</h1>
            </div>
            <div className="flex items-center gap-4 text-xs text-white/45">
              <span><b className="text-white">{pts.toLocaleString()}</b> pts</span><span className="text-white/15">/</span>
              <span><b className="text-white">{solved}/{challenges.length}</b> solved</span>
            </div>
          </div>
        </div>

        <div className="mb-4 flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1 max-w-sm">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-white/30" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search challenges"
              className="w-full rounded-xl border border-white/10 bg-white/[.035] py-2.5 pl-9 pr-4 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-cyan-300/50" />
          </div>
        </div>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-white/[.025] shadow-[0_20px_60px_rgba(0,0,0,.18)]">
          <div className="flex items-center gap-3 border-b border-white/8 bg-white/[.025] px-5 py-3 text-[10px] font-mono tracking-[.12em] text-white/35">
            <span className="w-5 shrink-0">ST</span>
            <span className="flex-1">CHALLENGE</span>
            <span className="w-14 text-right shrink-0">PTS</span>
            <span className="hidden md:block w-14 text-right shrink-0">SOLVES</span>
          </div>

          {loading ? (
            <div className="flex justify-center items-center py-20">
              <p className="text-sm animate-pulse text-white/35">Loading challenges…</p>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-20 text-center text-sm text-white/35">No challenges found in this category.</div>
          ) : (
            filtered.map((ch, i) => (
              <ChallengeRow key={ch.id} ch={ch} index={i} onClick={() => void openChallenge(ch)} />
            ))
          )}
</section>
      </main>
      <Footer />
    </div>
  );
}
export { CategoryChallenges };
