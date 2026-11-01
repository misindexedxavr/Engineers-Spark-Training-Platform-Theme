import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { ctfdApi } from "../../services/ctfdApi";
import { useAuth } from "../context/AuthContext";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import {
  Users, Shield, Target, Trophy, Star, Terminal, Plus,
  Copy, Crown, Settings, Trash2, Eye, EyeOff, Zap, AlertCircle,
} from "lucide-react";

const Rain = () => (
  <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-15">
    <style>{`@keyframes fall{0%{transform:translateY(-100%);opacity:0}10%{opacity:1}100%{transform:translateY(100vh);opacity:0}}.tm-fall{animation:fall linear infinite;writing-mode:vertical-rl;text-orientation:upright;}`}</style>
    {Array.from({length:12}).map((_,i)=>(
      <div key={i} className="absolute top-[-100px] text-[10px] font-mono font-bold tm-fall"
        style={{left:`${(i/12)*100}%`,color:i%2===0?'#60ffff':'#9200da',animationDuration:`${2+(i%4)*0.7}s`,animationDelay:`${(i%5)*0.4}s`,textShadow:'0 0 6px currentColor'}}>
        {["システム","アクセス","サイバー","スパーク","データ","コード"][i%6]}
      </div>
    ))}
  </div>
);

const Input = ({label,type='text',value,onChange,placeholder,eye}:{label:string;type?:string;value:string;onChange:(v:string)=>void;placeholder?:string;eye?:boolean}) => {
  const [show,setShow]=useState(false);
  return (
    <div className="space-y-1.5">
      <label className="font-['Greenth'] text-[9px] text-[#60ffff] uppercase tracking-[3px]">{label}</label>
      <div className="relative">
        <input type={eye?(show?'text':'password'):type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
          className="w-full bg-white/[0.03] border border-white/10 focus:border-[#60ffff]/60 py-2.5 px-3 text-white font-['Greenth'] text-sm placeholder-white/20 focus:outline-none transition-all" />
        {eye && <button type="button" onClick={()=>setShow(s=>!s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">{show?<EyeOff size={14}/>:<Eye size={14}/>}</button>}
      </div>
    </div>
  );
};

const Modal = ({title,onClose,children}:{title:string;onClose:()=>void;children:React.ReactNode}) => (
  <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
    onClick={onClose}
  >
    <motion.div initial={{scale:0.95,opacity:0}} animate={{scale:1,opacity:1}} exit={{scale:0.95,opacity:0}}
      onClick={e=>e.stopPropagation()}
      className="relative w-full max-w-md bg-[#0f0038]/95 border border-[#60ffff]/20 p-6 shadow-[0_0_40px_rgba(96,255,255,0.08)]"
    >
      <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#60ffff]" />
      <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#9200da]" />
      <h2 className="font-['Greenth'] text-lg font-black tracking-[3px] text-white mb-5">{title}</h2>
      {children}
    </motion.div>
  </motion.div>
);

const Btn = ({onClick,disabled,children,variant='cyan',className=''}:{onClick?:()=>void;disabled?:boolean;children:React.ReactNode;variant?:'cyan'|'purple'|'red'|'ghost';className?:string}) => {
  const styles={cyan:'border-[#60ffff]/40 text-[#60ffff] hover:bg-[#60ffff]/10',purple:'border-[#9200da]/40 text-[#9200da] hover:bg-[#9200da]/10',red:'border-red-500/40 text-red-400 hover:bg-red-500/10',ghost:'border-white/10 text-white/50 hover:bg-white/5'};
  return <button onClick={onClick} disabled={disabled} className={`px-4 py-2 border font-['Greenth'] text-xs uppercase tracking-[2px] transition-all disabled:opacity-40 ${styles[variant]} ${className}`}>{children}</button>;
};

interface Member { id:number; name:string; score?:number; }
interface Team { id:number; name:string; score:number; place?:number; captain_id?:number; members?:any[]; members_count?:number; solves?:any[]; website?:string; affiliation?:string; country?:string; }

export function TeamManagement() {
  const navigate = useNavigate();
  const { user, isAuthenticated, loading: authLoading, checkAuthStatus } = useAuth();
  const [loading, setLoading] = useState(true);
  const [team, setTeam] = useState<Team|null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [allTeams, setAllTeams] = useState<Team[]>([]);
  const [solves, setSolves] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDisband, setShowDisband] = useState(false);

  const [createName, setCreateName] = useState('');
  const [createPass, setCreatePass] = useState('');
  const [joinName, setJoinName] = useState('');
  const [joinPass, setJoinPass] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [editName, setEditName] = useState('');
  const [editSite, setEditSite] = useState('');
  const [editAff, setEditAff] = useState('');
  const [editCountry, setEditCountry] = useState('');

  const [busy, setBusy] = useState(false);
  const [inviteBusy, setInviteBusy] = useState(false);

  const isCaptain = team && user && team.captain_id === user.id;

  const flash = (msg:string, isErr=false) => {
    if(isErr) setError(msg); else setSuccess(msg);
    setTimeout(()=>{ setError(''); setSuccess(''); }, 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [ur, tr] = await Promise.all([ctfdApi.getCurrentUser(), ctfdApi.getTeams({perPage:100})]);
      setAllTeams(tr.data||[]);
      const uid = ur.data;
      if(uid?.team_id) {
        const teamRes = await ctfdApi.getTeam(uid.team_id);
        const t = teamRes.data;
        setTeam(t);
        setEditName(t.name||''); setEditSite(t.website||''); setEditAff(t.affiliation||''); setEditCountry(t.country||'');
        // resolve members
        const raw = Array.isArray(t.members) ? t.members : [];
        const resolved = await Promise.all(raw.map(async (m:any):Promise<Member> => {
          if(typeof m === 'number') {
            try { const r = await ctfdApi.getUser(m); return {id:r.data.id,name:r.data.name,score:r.data.score}; }
            catch { return {id:m,name:`User #${m}`}; }
          }
          return {id:m.id,name:m.name,score:m.score};
        }));
        setMembers(resolved);
        // solves
        try { const sr = await ctfdApi.getTeamSolves(uid.team_id); setSolves(sr.data||[]); } catch{}
      } else { setTeam(null); setMembers([]); }
    } catch(e:any) { flash(e.message||'Failed to load',true); }
    finally { setLoading(false); }
  };

  useEffect(()=>{ if(!authLoading && !isAuthenticated) navigate('/login'); },[authLoading,isAuthenticated]);
  useEffect(()=>{ if(isAuthenticated) loadData(); },[isAuthenticated]);

  const handleCreate = async () => {
    if(!createName.trim()) return flash('Team name required',true);
    setBusy(true);
    try { await ctfdApi.createTeam(createName.trim(),createPass||undefined); await checkAuthStatus(); await loadData(); setShowCreate(false); setCreateName(''); setCreatePass(''); flash('Team created!'); }
    catch(e:any) { flash(e.message||'Failed',true); }
    finally { setBusy(false); }
  };

  const handleJoin = async () => {
    if(joinCode.trim()) { let c=joinCode.trim(); try{const u=new URL(c);c=u.searchParams.get('code')||c;}catch{} window.location.href=`/teams/invite?code=${encodeURIComponent(c)}`; return; }
    if(!joinName.trim()) return flash('Team name or invite code required',true);
    setBusy(true);
    try { await ctfdApi.joinTeam({teamName:joinName.trim(),password:joinPass||undefined}); await checkAuthStatus(); await loadData(); setShowJoin(false); setJoinName(''); setJoinPass(''); setJoinCode(''); flash('Joined team!'); }
    catch(e:any) { flash(e.message||'Failed',true); }
    finally { setBusy(false); }
  };

  const handleSettings = async () => {
    if(!team||!editName.trim()) return flash('Name required',true);
    setBusy(true);
    try { await ctfdApi.updateTeamSettings(team.id,{name:editName,website:editSite,affiliation:editAff,country:editCountry}); await loadData(); setShowSettings(false); flash('Settings saved!'); }
    catch(e:any) { flash(e.message||'Failed',true); }
    finally { setBusy(false); }
  };

  const handleDisband = async () => {
    setBusy(true);
    try { await ctfdApi.disbandTeam(); await checkAuthStatus(); await loadData(); setShowDisband(false); flash('Team disbanded'); }
    catch(e:any) { flash(e.message||'Failed',true); }
    finally { setBusy(false); }
  };

  const handleInvite = async () => {
    setInviteBusy(true);
    try {
      const code = await ctfdApi.generateTeamInviteCode();
      const link = `${window.location.origin}/teams/invite?code=${encodeURIComponent(code)}`;
      setInviteLink(link);
      await navigator.clipboard.writeText(link);
      flash('Invite link copied!');
    } catch(e:any) { flash(e.message||'Failed',true); }
    finally { setInviteBusy(false); }
  };

  if(authLoading||loading) return (
    <div className="min-h-screen bg-[#0f0038] flex items-center justify-center">
      <motion.div animate={{rotate:360}} transition={{duration:1.5,repeat:Infinity,ease:"linear"}} className="w-12 h-12 border-2 border-[#60ffff]/20 border-t-[#60ffff]" />
    </div>
  );

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col bg-[#0f0038] text-white">
      <Rain />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-[#4c0ded]/10 blur-[120px] pointer-events-none z-0" />
      <Header />

      <div className="relative z-10 pt-28 px-4 pb-20 max-w-5xl mx-auto flex-1 w-full">

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="font-['Greenth'] text-4xl font-black tracking-[6px] mb-1">
            <span className="text-white">TEAM </span><span className="text-[#60ffff] drop-shadow-[0_0_15px_#60ffff]">MANAGEMENT</span>
          </h1>
          <div className="h-px w-40 mx-auto mt-3 bg-gradient-to-r from-transparent via-[#60ffff]/40 to-transparent" />
        </div>

        {/* Alerts */}
        <AnimatePresence>
          {error && <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mb-4 p-3 border border-red-500/30 bg-red-500/10 text-red-400 font-['Greenth'] text-xs tracking-wider">{error}</motion.div>}
          {success && <motion.div initial={{opacity:0,y:-10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className="mb-4 p-3 border border-[#60ffff]/30 bg-[#60ffff]/10 text-[#60ffff] font-['Greenth'] text-xs tracking-wider">✓ {success}</motion.div>}
        </AnimatePresence>

        {!team ? (
          /* ── NO TEAM ── */
          <>
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="relative border border-[#60ffff]/15 bg-[#0f0038]/80 p-6 mb-8">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#60ffff]" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#9200da]" />
              <h2 className="font-['Greenth'] text-xl font-black tracking-[3px] text-white mb-1">YOU'RE NOT IN A TEAM YET</h2>
              <p className="font-['Greenth'] text-xs text-white/30 mb-5">Create a new team or join an existing one to compete.</p>
              <div className="flex gap-3">
                <Btn onClick={()=>setShowCreate(true)} variant="cyan"><Plus size={13} className="inline mr-1"/>Create Team</Btn>
                <Btn onClick={()=>setShowJoin(true)} variant="purple"><Users size={13} className="inline mr-1"/>Join Team</Btn>
              </div>
            </motion.div>

            {/* Available teams */}
            <h3 className="font-['Greenth'] text-sm font-black tracking-[3px] text-white/60 mb-4 uppercase">Available Teams</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {allTeams.slice(0,9).map((t,i)=>(
                <motion.div key={t.id} initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:i*0.04}}
                  className="relative border border-white/5 bg-white/[0.02] p-4 hover:border-[#60ffff]/30 transition-all group"
                >
                  <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-[#60ffff]/0 group-hover:border-[#60ffff]/50 transition-all" />
                  <p className="font-['Greenth'] font-black text-white mb-1 truncate">{t.name}</p>
                  <p className="font-['Greenth'] text-[9px] text-white/30 mb-3">{t.members_count||0} members · {t.score} pts</p>
                  <Btn onClick={()=>{setJoinName(t.name);setShowJoin(true);}} variant="cyan" className="text-[9px] py-1 px-3">Join</Btn>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          /* ── HAS TEAM ── */
          <>
            {/* Team header card */}
            <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="relative border border-[#60ffff]/15 bg-[#0f0038]/80 p-6 mb-5">
              <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-[#60ffff]" />
              <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-[#9200da]" />
              <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
                <div>
                  <h2 className="font-['Greenth'] text-2xl font-black text-white tracking-wider">{team.name}</h2>
                  <p className="font-['Greenth'] text-[10px] text-white/30 tracking-[3px] uppercase mt-0.5">{members.length} members</p>
                </div>
                {isCaptain && (
                  <div className="flex gap-2 flex-wrap">
                    <Btn onClick={()=>setShowSettings(true)} variant="purple"><Settings size={12} className="inline mr-1"/>Settings</Btn>
                    <Btn onClick={()=>setShowDisband(true)} variant="red"><Trash2 size={12} className="inline mr-1"/>Disband</Btn>
                  </div>
                )}
              </div>
              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 border-t border-white/5 pt-4">
                {[
                  {label:'Rank',value:team.place?`#${team.place}`:'--',icon:Trophy,color:'#60ffff'},
                  {label:'Score',value:team.score?.toLocaleString(),icon:Zap,color:'#9200da'},
                  {label:'Solves',value:solves.length,icon:Target,color:'#c028ec'},
                ].map((s,i)=>(
                  <div key={i} className="text-center p-3 border border-white/5 bg-white/[0.02]">
                    <s.icon size={16} className="mx-auto mb-1 opacity-60" style={{color:s.color}} />
                    <div className="font-['Greenth'] text-xl font-black text-white">{s.value}</div>
                    <div className="font-['Greenth'] text-[9px] uppercase tracking-[2px] text-white/30">{s.label}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Invite link (captain only) */}
            {isCaptain && (
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.1}} className="relative border border-[#9200da]/15 bg-[#0f0038]/80 p-5 mb-5">
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#9200da]/40" />
                <h3 className="font-['Greenth'] text-sm font-black tracking-[3px] text-white mb-3">INVITE MEMBERS</h3>
                <div className="flex gap-2">
                  <input readOnly value={inviteLink} placeholder="Click Generate to create invite link"
                    className="flex-1 bg-white/[0.03] border border-white/10 py-2 px-3 text-white/60 font-['Greenth'] text-xs focus:outline-none placeholder-white/20" />
                  <Btn onClick={handleInvite} disabled={inviteBusy} variant="purple">{inviteBusy?'..':'Generate'}</Btn>
                  {inviteLink && <Btn onClick={()=>{navigator.clipboard.writeText(inviteLink);flash('Copied!');}} variant="cyan"><Copy size={13}/></Btn>}
                </div>
              </motion.div>
            )}

            {/* Members */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="relative border border-[#60ffff]/10 bg-[#0f0038]/80 overflow-hidden">
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-[#60ffff]/40" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t border-r border-[#60ffff]/40" />
              <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                <Shield size={14} className="text-[#60ffff]" />
                <span className="font-['Greenth'] text-sm font-black tracking-[3px] text-white">{team.name.toUpperCase()} // ROSTER</span>
              </div>
              <div className="divide-y divide-white/[0.04]">
                {members.map((m,i)=>(
                  <motion.div key={m.id} initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:0.2+i*0.04}}
                    className="flex items-center justify-between p-4 hover:bg-[#60ffff]/[0.03] transition-colors group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 flex items-center justify-center text-xs font-black bg-[#002b7d]/40 border border-white/10 font-['Greenth'] text-white/60">
                        {m.name.substring(0,2).toUpperCase()}
                      </div>
                      <div>
                        <span className="font-['Greenth'] font-bold text-white group-hover:text-[#60ffff] transition-colors block">{m.name}</span>
                        {m.id === team.captain_id && <span className="font-['Greenth'] text-[9px] text-[#60ffff] flex items-center gap-1"><Crown size={9}/>Captain</span>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Star size={11} className="text-[#9200da]" fill="#9200da" />
                      <span className="font-['Greenth'] font-black text-[#9200da]">{m.score??0}</span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Solves */}
            {solves.length > 0 && (
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:0.25}} className="relative border border-[#9200da]/10 bg-[#0f0038]/80 mt-5 overflow-hidden">
                <div className="p-4 border-b border-white/5 bg-white/[0.02] flex items-center gap-2">
                  <Terminal size={14} className="text-[#9200da]" />
                  <span className="font-['Greenth'] text-sm font-black tracking-[3px] text-white">SOLVE HISTORY</span>
                </div>
                <div className="divide-y divide-white/[0.04] max-h-60 overflow-y-auto" style={{scrollbarWidth:'thin',scrollbarColor:'#60ffff transparent'}}>
                  {solves.map((s,i)=>(
                    <div key={i} className="flex items-center justify-between px-4 py-3 hover:bg-white/[0.02]">
                      <span className="font-['Greenth'] text-sm text-white/70">{s.challenge?.name||`Challenge #${s.challenge_id}`}</span>
                      <span className="font-['Greenth'] text-xs font-black text-[#60ffff]">+{s.value||s.challenge?.value||0}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </>
        )}
      </div>
      <Footer />

      {/* MODALS */}
      <AnimatePresence>
        {showCreate && (
          <Modal title="CREATE TEAM" onClose={()=>setShowCreate(false)}>
            <div className="space-y-3 mb-5">
              <Input label="Team Name" value={createName} onChange={setCreateName} placeholder="UNIT_NAME" />
              <Input label="Password (optional)" value={createPass} onChange={setCreatePass} placeholder="TEAM_PASSWORD" eye />
            </div>
            <div className="flex gap-3">
              <Btn onClick={()=>setShowCreate(false)} variant="ghost" className="flex-1">Cancel</Btn>
              <Btn onClick={handleCreate} disabled={busy} variant="cyan" className="flex-1">{busy?'Creating...':'Create'}</Btn>
            </div>
          </Modal>
        )}
        {showJoin && (
          <Modal title="JOIN TEAM" onClose={()=>setShowJoin(false)}>
            <div className="space-y-3 mb-5">
              <Input label="Invite Link or Code" value={joinCode} onChange={setJoinCode} placeholder="Paste invite link or code" />
              <p className="font-['Greenth'] text-[9px] text-white/30 tracking-wider">— OR enter team name + password —</p>
              <Input label="Team Name" value={joinName} onChange={setJoinName} placeholder="UNIT_NAME" />
              <Input label="Password" value={joinPass} onChange={setJoinPass} placeholder="TEAM_PASSWORD" eye />
            </div>
            <div className="flex gap-3">
              <Btn onClick={()=>setShowJoin(false)} variant="ghost" className="flex-1">Cancel</Btn>
              <Btn onClick={handleJoin} disabled={busy} variant="cyan" className="flex-1">{busy?'Joining...':'Join'}</Btn>
            </div>
          </Modal>
        )}
        {showSettings && (
          <Modal title="TEAM SETTINGS" onClose={()=>setShowSettings(false)}>
            <div className="space-y-3 mb-5">
              <Input label="Team Name" value={editName} onChange={setEditName} />
              <Input label="Website" value={editSite} onChange={setEditSite} placeholder="https://..." />
              <Input label="Affiliation" value={editAff} onChange={setEditAff} />
              <Input label="Country" value={editCountry} onChange={setEditCountry} />
            </div>
            <div className="flex gap-3">
              <Btn onClick={()=>setShowSettings(false)} variant="ghost" className="flex-1">Cancel</Btn>
              <Btn onClick={handleSettings} disabled={busy} variant="purple" className="flex-1">{busy?'Saving...':'Save'}</Btn>
            </div>
          </Modal>
        )}
        {showDisband && (
          <Modal title="DISBAND TEAM?" onClose={()=>setShowDisband(false)}>
            <p className="font-['Greenth'] text-xs text-white/40 mb-5">This will permanently disband <span className="text-white">{team?.name}</span>. This cannot be undone.</p>
            <div className="flex gap-3">
              <Btn onClick={()=>setShowDisband(false)} variant="ghost" className="flex-1">Cancel</Btn>
              <Btn onClick={handleDisband} disabled={busy} variant="red" className="flex-1">{busy?'Disbanding...':'Disband'}</Btn>
            </div>
          </Modal>
        )}
      </AnimatePresence>
    </div>
  );
}
