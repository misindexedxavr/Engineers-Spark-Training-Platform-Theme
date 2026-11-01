import { useEffect, useState } from "react";

/* Kept as a no-op so existing <MatrixCanvas /> calls in pages don't break.
   Remove the calls entirely once you clean up each page. */
export function MatrixCanvas({ opacity = 0.15 }: { opacity?: number }) {
  return null;
}

export function useTypewriter(text: string, speed = 40, startDelay = 0) {
  const [out, setOut] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    setOut(""); setDone(false);
    let idx = 0;
    const start = setTimeout(() => {
      const t = setInterval(() => {
        idx++;
        setOut(text.slice(0, idx));
        if (idx >= text.length) { clearInterval(t); setDone(true); }
      }, speed);
      return () => clearInterval(t);
    }, startDelay);
    return () => clearTimeout(start);
  }, [text, speed, startDelay]);
  return { out, done };
}

export function TermLine({ text, color }: { prompt?: string; text: string; delay?: number; color?: string; showPrompt?: boolean }) {
  return <p className="text-sm" style={{ color: color ?? "rgba(255,255,255,0.7)" }}>{text}</p>;
}

export function TermPanel({
  title,
  children,
  className = "",
  glow = false,
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-lg border border-white/8 bg-white/[0.02] backdrop-blur-sm ${className}`}
      style={{ boxShadow: glow ? "0 0 40px rgba(99,102,241,0.08)" : "none" }}
    >
      {title && (
        <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/6 bg-white/[0.015]">
          <span className="text-xs font-medium text-white/40">{title}</span>
        </div>
      )}
      <div className="relative">{children}</div>
    </div>
  );
}

export function TermInput({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  rightEl,
}: {
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  rightEl?: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium text-white/45 uppercase tracking-wide">{label}</label>
      <div className="relative">
        <input
          type={type} value={value} onChange={e => onChange(e.target.value)}
          placeholder={placeholder} required={required}
          className="w-full px-3.5 py-2.5 rounded-md text-sm text-white bg-white/[0.03] border border-white/10 focus:border-indigo-400/50 focus:outline-none focus:ring-1 focus:ring-indigo-400/30 transition-all placeholder-white/20"
        />
        {rightEl && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightEl}</div>}
      </div>
    </div>
  );
}

export function TermButton({
  children,
  onClick,
  type = "button",
  disabled,
  full = false,
  variant = "primary",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit";
  disabled?: boolean;
  full?: boolean;
  variant?: "primary" | "ghost";
}) {
  const isPrimary = variant === "primary";
  return (
    <button
      type={type} onClick={onClick} disabled={disabled}
      className={`rounded-md text-sm font-semibold transition-all ${full ? "w-full" : ""}`}
      style={{
        padding: "10px 24px",
        background: isPrimary ? "#fff" : "transparent",
        color: isPrimary ? "#000" : "rgba(255,255,255,0.7)",
        border: isPrimary ? "none" : "1px solid rgba(255,255,255,0.15)",
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? "not-allowed" : "pointer",
      }}
    >
      {children}
    </button>
  );
}

export function AsciiDivider({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-white/8" />
      {label && <span className="text-[11px] font-medium uppercase tracking-[2px] text-white/30">{label}</span>}
      <div className="flex-1 h-px bg-white/8" />
    </div>
  );
}