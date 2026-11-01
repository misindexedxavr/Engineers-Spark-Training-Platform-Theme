import logo from "../../assets/engineers-spark-logo.png";
import { Facebook, Instagram, Linkedin } from "lucide-react";

const socials = [
  { label: "LinkedIn", href: "https://www.linkedin.com/company/engineers-spark-iset-com/", icon: Linkedin },
  { label: "Facebook", href: "https://www.facebook.com/engineers.spark", icon: Facebook },
  { label: "Instagram", href: "https://www.instagram.com/engineers_spark/", icon: Instagram },
];

export function Footer() {
  return (
    <footer className="relative z-10 border-t border-white/6 bg-[#07080a]">
      <div className="mx-auto grid max-w-7xl items-center gap-4 px-4 py-7 sm:grid-cols-[1fr_auto_1fr]">
        <div className="flex items-center gap-2.5">
          <img src={logo} alt="" className="w-5 h-5 opacity-80" />
          <span className="text-xs text-white/35">Engineers Spark</span>
        </div>
        <nav className="flex items-center justify-center gap-2" aria-label="Engineers Spark social media">
            {socials.map(({ label, href, icon: Icon }) => (
              <a key={label} href={href} target="_blank" rel="noreferrer" aria-label={label}
                className="grid h-8 w-8 place-items-center rounded-full border border-white/10 text-white/45 transition hover:-translate-y-0.5 hover:border-cyan-300/45 hover:bg-cyan-300/10 hover:text-cyan-200">
                <Icon size={14} strokeWidth={1.8} />
              </a>
            ))}
        </nav>
        <span className="text-center text-xs text-white/25 sm:text-right">Built by <a className="font-medium text-white/55 transition hover:text-cyan-200" href="https://github.com/sylvath3nomad" target="_blank" rel="noreferrer">Xavyr</a></span>
      </div>
    </footer>
  );
}
