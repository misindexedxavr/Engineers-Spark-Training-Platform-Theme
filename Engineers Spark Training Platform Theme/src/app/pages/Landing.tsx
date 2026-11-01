import { useEffect, useState } from "react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ctfdApi } from "../../services/ctfdApi";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { ArrowRight, ArrowUpRight, Check, Cpu, Flag, Lock, Shield, Target, Trophy } from "lucide-react";
import crest from "../../assets/engineers-spark-logo.png";

function SignalCore() {
  return (
    <div className="relative mx-auto grid aspect-square w-full max-w-[420px] place-items-center" aria-hidden="true">
      <div className="absolute inset-[2%] rounded-full border border-dashed border-cyan-200/15 animate-[spin_42s_linear_infinite]" />
      <div className="absolute inset-[11%] rotate-45 rounded-[28%] border border-cyan-200/20 bg-[radial-gradient(circle_at_50%_40%,rgba(21,88,131,.28),rgba(8,14,28,.72)_64%,transparent_65%)] shadow-[inset_0_0_75px_rgba(56,189,248,.12),0_28px_75px_rgba(0,0,0,.32)]" />
      <div className="absolute inset-[22%] rotate-45 rounded-[25%] border border-white/10 bg-[#07111d]/70" />
      <img src={crest} alt="" className="relative z-10 w-[92%] object-contain drop-shadow-[0_15px_28px_rgba(0,0,0,.55)]" />
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return <div className="border-l border-white/12 pl-4"><div className="mb-2 flex items-center gap-2 text-cyan-200"><Icon size={14} /><span className="text-[10px] font-mono tracking-[.16em] text-white/35">{label}</span></div><p className="text-2xl font-bold tracking-tight text-white">{value}</p></div>;
}

export function Landing() {
  const [stats, setStats] = useState({ challenges: 0, points: 0 });
  useEffect(() => { ctfdApi.getChallenges().then(r => { const all = r.data || []; setStats({ challenges: all.length, points: all.reduce((n: number, c: any) => n + (c.value || 0), 0) }); }).catch(() => {}); }, []);

  return (
    <div className="min-h-screen text-white flex flex-col overflow-hidden" style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Header />
      <main className="relative flex-1 pt-24">
        <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
          <div className="absolute -right-32 -top-36 h-[31rem] w-[31rem] rounded-full bg-sky-400/[.12] blur-[115px]" />
          <div className="absolute -bottom-32 -left-28 h-[28rem] w-[28rem] rounded-full bg-blue-600/[.10] blur-[110px]" />
        </div>
        <div className="pointer-events-none absolute inset-0 opacity-40" style={{ backgroundImage: "linear-gradient(rgba(130,157,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(130,157,255,.08) 1px, transparent 1px)", backgroundSize: "64px 64px", maskImage: "linear-gradient(to bottom, black, transparent 78%)" }} />
        <section className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 px-5 py-12 lg:grid-cols-[1.15fr_.85fr] lg:min-h-[520px] lg:px-8">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: .65 }} className="relative z-10">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[.045] px-4 py-2"><span className="h-1.5 w-1.5 rounded-full bg-emerald-300 shadow-[0_0_9px_#43e97b]" /><span className="text-[10px] font-mono tracking-[.18em] text-white/55">PRACTICE · LEARN · COMPETE</span></div>
            <h1 className="max-w-3xl text-[clamp(2.4rem,4.8vw,4.4rem)] font-bold leading-[.96] tracking-[-.05em]">YOUR CYBERSECURITY<br /><span className="bg-gradient-to-r from-white to-white/45 bg-clip-text text-transparent">JOURNEY</span><br />STARTS HERE.</h1>
            <p className="mt-7 max-w-xl text-[15px] leading-7 text-white/55">A cyber range for students who want to think critically, solve precisely, and build systems that endure.</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link to="/challenges" className="group inline-flex items-center gap-2 rounded-full bg-white px-6 py-3.5 text-sm font-bold text-black shadow-[0_16px_45px_rgba(255,255,255,.10)] transition hover:-translate-y-0.5">Begin training <ArrowRight size={16} className="transition group-hover:translate-x-1" /></Link>
              <Link to="/scoreboard" className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[.025] px-6 py-3.5 text-sm font-semibold text-white/75 transition hover:-translate-y-0.5 hover:border-white/25 hover:bg-white/[.06]">View rankings <ArrowUpRight size={16} /></Link>
            </div>
            <div className="mt-12 grid max-w-xl grid-cols-2 gap-5"><Metric icon={Target} label="CHALLENGES" value={stats.challenges || "—"} /><Metric icon={Trophy} label="TOTAL POINTS" value={stats.points ? stats.points.toLocaleString() : "—"} /></div>
          </motion.div>
          <motion.div initial={{ opacity: 0, scale: .95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: .8, delay: .15 }} className="relative"><SignalCore /></motion.div>
        </section>

        <section className="relative mx-auto grid max-w-7xl grid-cols-1 gap-px border-y border-white/10 bg-white/10 md:grid-cols-3">
          {[
            [Cpu, "Think like an attacker", "Web, crypto, reverse engineering and more."],
            [Shield, "Defend with evidence", "Turn discovery into practical defensive skill."],
            [Lock, "Respect the boundary", "Only challenge infrastructure is in scope."],
          ].map(([Icon, title, body]: any, i) => <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * .08 }} key={title} className="bg-[#0c1120]/80 p-7 backdrop-blur-sm"><Icon size={19} className="mb-5 text-cyan-200" /><h2 className="font-semibold text-white">{title}</h2><p className="mt-2 text-sm leading-6 text-white/45">{body}</p></motion.div>)}
        </section>
        <motion.section className="relative mx-auto max-w-6xl px-5 py-20 lg:px-8"
          initial={{ opacity: 0, y: 34 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.22 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
          <div className="mb-10 text-center"><p className="mb-3 text-[10px] font-mono tracking-[.22em] text-cyan-200/65">OPERATOR BRIEFING</p><h2 className="text-3xl font-bold tracking-tight">What you’ll find here</h2><p className="mx-auto mt-3 max-w-xl text-sm text-white/45">A focused cyber range built to turn curiosity into practical security skill.</p></div>
          <div className="mb-9 flex flex-wrap justify-center gap-2">{["General Knowledge", "Reverse Engineering", "Web Exploitation", "Forensics", "PWN", "Hardware", "Crypto", "OSINT", "Misc"].map(category => <span key={category} className="rounded-full border border-cyan-300/20 bg-cyan-300/[.07] px-3 py-1.5 text-[11px] font-medium text-cyan-100/80">{category}</span>)}</div>
                     <div className="grid gap-5 md:grid-cols-2"><div className="rounded-2xl border border-white/10 bg-[#11182b]/80 p-6 shadow-[0_22px_55px_rgba(0,0,0,.16)]"><h3 className="mb-4 text-base font-bold text-cyan-200">Objectives</h3>{["Solve challenges across multiple categories", "Submit flags in the format Spark{...}", "Earn points and climb the scoreboard", "Level up your cybersecurity skills"].map(item => <p key={item} className="mb-2 flex items-start gap-2 text-sm leading-6 text-white/50"><Check size={14} className="mt-1 shrink-0 text-cyan-300" />{item}</p>)}</div><div className="rounded-2xl border border-white/10 bg-[#11182b]/80 p-6 shadow-[0_22px_55px_rgba(0,0,0,.16)]"><h3 className="mb-4 flex items-center gap-2 text-base font-bold text-cyan-200"><Flag size={15} />Rules</h3>{["All activity on this platform is monitored", "Only exploit the intended challenge environments", "Do not share flags or spoilers with others"].map(item => <p key={item} className="mb-2 flex items-start gap-2 text-sm leading-6 text-white/50"><Check size={14} className="mt-1 shrink-0 text-cyan-300" />{item}</p>)}</div></div>
        </motion.section>

        <div className="mx-auto w-full max-w-6xl px-5 pb-10 text-center lg:px-8">
          <p className="text-sm font-bold tracking-tight text-white">{"Spark{Y0UR_P0T3NT14L_0UR_P4SS10N}"}</p>
        </div>
      </main>
      <Footer />
    </div>
  );
}
