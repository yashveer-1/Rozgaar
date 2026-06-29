import { useEffect, useMemo, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, Bell, BookOpen, BriefcaseBusiness, Building2, CalendarDays,
  Check, ChevronDown, ChevronRight, CircleHelp, CloudUpload, Download, FileCheck2,
  FileText, HandCoins, Home, IndianRupee, Languages, LayoutDashboard, LockKeyhole,
  LogOut, MapPin, Menu, MessageCircleMore, Moon, MoreHorizontal, QrCode, Search,
  ShieldCheck, Sparkles, Star, Sun, Target, TrendingUp, Upload, UserRound,
  UsersRound, WalletCards, X, Zap,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { incomeData, jobs, notifications, schemes } from './data';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/passport', icon: UserRound, label: 'My Passport' },
  { to: '/income', icon: TrendingUp, label: 'Income Insights' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/jobs', icon: BriefcaseBusiness, label: 'Job Matches', badge: 6 },
  { to: '/schemes', icon: HandCoins, label: 'Govt. Schemes', badge: 3 },
  { to: '/skills', icon: BookOpen, label: 'Skills & Growth' },
];

const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: .35 } };

function App() {
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [assistant, setAssistant] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  return (
    <div className="app-shell">
      <Sidebar mobile={mobile} close={() => setMobile(false)} />
      <div className="main-area">
        <Topbar dark={dark} setDark={setDark} openMenu={() => setMobile(true)} />
        <main className="page-wrap">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/passport" element={<Passport />} />
            <Route path="/income" element={<Income />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/skills" element={<Skills />} />
          </Routes>
        </main>
      </div>
      <button className="ai-fab" onClick={() => setAssistant(true)} aria-label="Ask Lens AI"><Sparkles size={20}/><span>Ask Lens AI</span></button>
      <Assistant open={assistant} close={() => setAssistant(false)} />
    </div>
  );
}

function Logo() {
  return <div className="logo"><div className="logo-mark"><span></span><span></span><span></span></div><div><strong>SHRAMIK</strong><b>LENS</b></div></div>;
}

function Sidebar({ mobile, close }) {
  return <>
    {mobile && <div className="scrim" onClick={close}/>}
    <aside className={`sidebar ${mobile ? 'open' : ''}`}>
      <div className="side-head"><Logo/><button className="icon-btn side-close" onClick={close}><X size={19}/></button></div>
      <div className="passport-mini">
        <div className="avatar">AS<span><BadgeCheck size={16}/></span></div>
        <div><b>Asha Sharma</b><small><span className="live-dot"/> Identity verified</small></div>
        <ChevronRight size={16}/>
      </div>
      <nav>
        <p className="nav-title">YOUR SPACE</p>
        {nav.map(({ to, icon: Icon, label, badge }) => <NavLink key={to} to={to} end={to === '/'} onClick={close}>
          <Icon size={18}/><span>{label}</span>{badge && <em>{badge}</em>}
        </NavLink>)}
      </nav>
      <div className="side-bottom">
        <div className="support-card"><MessageCircleMore size={21}/><div><b>Need help?</b><small>Talk to our support team</small></div><ArrowRight size={16}/></div>
        <button><CircleHelp size={18}/> Help & support</button>
        <button><LogOut size={18}/> Sign out</button>
      </div>
    </aside>
  </>;
}

function Topbar({ dark, setDark, openMenu }) {
  const location = useLocation();
  const labels = { '/passport': 'My Livelihood Passport', '/income': 'Income Insights', '/documents': 'Document Vault', '/jobs': 'Job Matches', '/schemes': 'Government Schemes', '/skills': 'Skills & Growth' };
  return <header className="topbar">
    <div className="top-left"><button className="icon-btn menu-btn" onClick={openMenu}><Menu/></button><div><small>WORKER PORTAL</small><h3>{labels[location.pathname] || 'Good afternoon, Asha 👋'}</h3></div></div>
    <div className="top-actions">
      <div className="global-search"><Search size={17}/><input placeholder="Search jobs, schemes, documents..."/><kbd>⌘ K</kbd></div>
      <button className="icon-btn" onClick={() => setDark(!dark)}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>
      <div className="notif"><Bell size={19}/><i>3</i></div>
      <div className="user-chip"><div className="avatar tiny">AS</div><div><b>Asha Sharma</b><small>Worker account</small></div><ChevronDown size={15}/></div>
    </div>
  </header>;
}

function PageTitle({ eyebrow, title, text, action }) {
  return <div className="page-title"><div><small>{eyebrow}</small><h1>{title}</h1>{text && <p>{text}</p>}</div>{action}</div>;
}

function Dashboard() {
  const navigate = useNavigate();
  return <motion.div {...fade}>
    <PageTitle eyebrow="MONDAY, 29 JUNE" title={<>Your livelihood, <span>in one place.</span></>} text="Keep building your verified work identity and unlock better opportunities." action={<button className="primary-btn" onClick={() => navigate('/passport')}><QrCode size={17}/> View passport</button>}/>
    <div className="trust-strip"><ShieldCheck size={20}/><div><b>Your profile is verified</b><span>3 employers and 8 documents support your work history.</span></div><div className="trust-score"><strong>84</strong><span>Trust strength</span></div><ChevronRight size={18}/></div>
    <div className="stat-grid">
      <Stat icon={WalletCards} color="mint" label="Estimated monthly income" value="₹19,200" delta="+8.5%" note="vs last month"/>
      <Stat icon={Target} color="purple" label="Financial readiness" value="Good" delta="78/100" note="Based on verified records"/>
      <Stat icon={BriefcaseBusiness} color="orange" label="Job matches" value="6 new" delta="96%" note="Best match nearby"/>
      <Stat icon={FileCheck2} color="blue" label="Profile completion" value="86%" delta="+12%" note="Add education to improve"/>
    </div>
    <div className="dashboard-grid">
      <section className="card chart-card">
        <CardHead title="Income overview" sub="Verified earnings from the last 6 months" action={<button className="text-btn" onClick={() => navigate('/income')}>View insights <ArrowRight size={15}/></button>}/>
        <div className="chart-kpis"><div><small>6-month earnings</small><strong>₹1,00,300</strong></div><div><span className="up"><TrendingUp size={14}/> 14.2%</span><small>steady growth</small></div></div>
        <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={incomeData} margin={{ left: -24, right: 4, top: 8 }}><defs><linearGradient id="income" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5e5ce6" stopOpacity=".3"/><stop offset="100%" stopColor="#5e5ce6" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }}/><Tooltip contentStyle={{ border: 0, borderRadius: 12, boxShadow: '0 8px 30px #0002' }} formatter={(v) => [`₹${v.toLocaleString('en-IN')}`, 'Income']}/><Area type="monotone" dataKey="income" stroke="#5e5ce6" strokeWidth={2.5} fill="url(#income)"/></AreaChart></ResponsiveContainer></div>
      </section>
      <section className="card next-card">
        <CardHead title="Next best actions" sub="Small steps that improve your opportunities"/>
        <ActionRow n="01" title="Add education details" text="+4% profile strength" icon={BookOpen} color="purple"/>
        <ActionRow n="02" title="Upload June payment proof" text="Keep income insights current" icon={Upload} color="green"/>
        <ActionRow n="03" title="Explore PM Vishwakarma" text="You appear eligible" icon={HandCoins} color="amber"/>
      </section>
    </div>
    <div className="bottom-grid">
      <section className="card">
        <CardHead title="Top job matches" sub="Ranked for your skills and preferences" action={<button className="text-btn" onClick={() => navigate('/jobs')}>See all 6 <ArrowRight size={15}/></button>}/>
        <div className="job-list">{jobs.slice(0,2).map(job => <JobRow key={job.id} job={job}/>)}</div>
      </section>
      <section className="card">
        <CardHead title="Schemes for you" sub="Eligibility based on your verified profile" action={<button className="text-btn" onClick={() => navigate('/schemes')}>See all <ArrowRight size={15}/></button>}/>
        {schemes.slice(0,2).map((s,i) => <div className="scheme-row" key={s.name}><div className={`scheme-icon ${s.color}`}>{i ? <ShieldCheck/> : <HandCoins/>}</div><div><b>{s.name}</b><small>{s.benefit}</small></div><span>{s.eligibility}</span></div>)}
      </section>
    </div>
  </motion.div>;
}

function Stat({ icon: Icon, color, label, value, delta, note }) {
  return <motion.div className="card stat-card" whileHover={{ y: -3 }}><div className={`stat-icon ${color}`}><Icon/></div><div className="stat-main"><small>{label}</small><strong>{value}</strong><div><span>{delta}</span> {note}</div></div><MoreHorizontal size={18}/></motion.div>;
}
function CardHead({ title, sub, action }) { return <div className="card-head"><div><h3>{title}</h3><p>{sub}</p></div>{action}</div>; }
function ActionRow({ n, title, text, icon: Icon, color }) { return <button className="action-row" onClick={() => toast.success(`${title} opened`)}><span className={`action-icon ${color}`}><Icon/></span><div><b>{title}</b><small>{text}</small></div><em>{n}</em><ChevronRight size={17}/></button>; }
function JobRow({ job }) { return <div className="job-row"><div className="company-logo">{job.logo}</div><div className="job-info"><b>{job.title}</b><span>{job.company}</span><small><MapPin size={13}/>{job.location}<i/> {job.pay}</small></div><div className="match-ring">{job.match}<small>%</small><span>match</span></div><button className="outline-btn" onClick={() => toast.success(`Application started for ${job.title}`)}>View job</button></div>; }

function Passport() {
  return <motion.div {...fade}>
    <PageTitle eyebrow="VERIFIED WORK IDENTITY" title={<>Your livelihood <span>passport.</span></>} text="A portable, verifiable record of your skills, earnings and work history." action={<button className="primary-btn" onClick={() => toast.success('Passport PDF prepared')}><Download size={17}/> Download PDF</button>}/>
    <div className="passport-layout">
      <section className="passport-card">
        <div className="passport-top"><Logo/><span><ShieldCheck size={15}/> VERIFIED PASSPORT</span></div>
        <div className="passport-person">
          <div className="big-avatar">AS</div><div><small>WORKER ID · SL-2026-08147</small><h2>Asha Sharma <BadgeCheck/></h2><p>Tailoring & Garment Production</p><span><MapPin/> Jaipur, Rajasthan</span></div>
          <div className="qr"><QRCodeSVG value="https://shramiklens.in/verify/SL-2026-08147" size={88}/><small>Scan to verify</small></div>
        </div>
        <div className="passport-stats"><div><small>EXPERIENCE</small><b>7+ years</b></div><div><small>VERIFIED JOBS</small><b>3 employers</b></div><div><small>READINESS</small><b>78 · Good</b></div><div><small>LANGUAGES</small><b>Hindi, English</b></div></div>
        <div className="passport-section"><h4>Verified skills</h4><div className="chips"><span>Industrial stitching <Check/></span><span>Pattern cutting <Check/></span><span>Embroidery <Check/></span><span>Quality control <Check/></span></div></div>
        <div className="passport-section"><h4>Recent employment</h4><div className="history"><i/><div><b>Senior Tailor · Meera Garments</b><small>Jan 2023 – Present · Verified by employer</small></div><BadgeCheck/></div><div className="history"><i/><div><b>Tailoring Associate · Rang Sutra</b><small>Aug 2020 – Dec 2022 · Document verified</small></div><BadgeCheck/></div></div>
        <div className="passport-foot"><LockKeyhole/> Sensitive personal and banking details are never shown publicly.<span>Last updated 28 Jun 2026</span></div>
      </section>
      <aside className="passport-side">
        <div className="card strength"><CardHead title="Passport strength" sub="Your verified profile quality"/><div className="strength-score"><div><strong>84</strong><small>/100</small></div><span>Strong</span></div><div className="progress"><i style={{width:'84%'}}/></div><p>Add education and one reference to reach “Excellent”.</p></div>
        <div className="card"><CardHead title="Visibility controls" sub="Choose what verifiers can see"/>{['Basic profile & skills','Employment history','Income range','Contact details'].map((x,i)=><label className="toggle-row" key={x}><span>{x}</span><input type="checkbox" defaultChecked={i<3}/><i/></label>)}</div>
        <button className="share-passport" onClick={() => { navigator.clipboard?.writeText('https://shramiklens.in/verify/SL-2026-08147'); toast.success('Verification link copied'); }}><QrCode/><div><b>Share verification link</b><small>Let employers verify your passport</small></div><ArrowRight/></button>
      </aside>
    </div>
  </motion.div>;
}

function Income() {
  return <motion.div {...fade}><PageTitle eyebrow="VERIFIED EARNING RECORDS" title={<>Income that tells <span>your story.</span></>} text="Insights are estimated from records you upload—never a credit score." action={<button className="primary-btn"><Upload size={17}/> Add income proof</button>}/>
    <div className="income-hero"><div><small>ESTIMATED MONTHLY INCOME</small><h2>₹19,200</h2><span><TrendingUp/> 8.5% from May</span></div><div><small>PAYMENT REGULARITY</small><h3>Consistent</h3><p>Payments received 4–6 times monthly</p></div><div><small>FINANCIAL READINESS INDEX</small><h3>78 <em>/100</em></h3><p>Good · built from verified patterns</p></div></div>
    <section className="card large-chart"><CardHead title="Earning trend" sub="Monthly verified income · January–June 2026"/><div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={incomeData}><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line)"/><XAxis dataKey="month" axisLine={false} tickLine={false}/><Tooltip formatter={v=>`₹${v}`}/><Area dataKey="income" type="monotone" stroke="#5e5ce6" strokeWidth={3} fill="#5e5ce622"/></AreaChart></ResponsiveContainer></div></section>
  </motion.div>;
}

function Documents() {
  const [uploaded, setUploaded] = useState(false);
  const docs = [
    ['June UPI payments','Income proof','28 Jun 2026','Verified'],['Tailoring certificate','Skill certificate','14 May 2026','Verified'],['Meera Garments letter','Employment proof','02 Apr 2026','Verified'],['Aadhaar card','Identity proof','18 Jan 2026','Protected'],
  ];
  return <motion.div {...fade}><PageTitle eyebrow="SECURE DOCUMENT VAULT" title={<>Proof, safely <span>organised.</span></>} text="Documents are encrypted and only used with your permission."/>
    <label className="dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();setUploaded(true);toast.success('Document uploaded and queued for verification')}}><input type="file" onChange={()=>{setUploaded(true);toast.success('Document uploaded')}}/><div><CloudUpload/></div><h3>{uploaded ? 'Document ready for review' : 'Drop a document here'}</h3><p>UPI screenshot, bank statement, salary SMS, certificate or ID proof</p><button className="outline-btn">Choose file</button><small>PNG, JPG or PDF · Max 10 MB</small></label>
    <section className="card doc-card"><CardHead title="Your documents" sub="8 documents · 7 verified"/><div className="doc-table"><div className="doc-tr head"><span>DOCUMENT</span><span>TYPE</span><span>ADDED</span><span>STATUS</span><span/></div>{docs.map(d=><div className="doc-tr" key={d[0]}><span><i><FileText/></i><b>{d[0]}</b></span><span>{d[1]}</span><span>{d[2]}</span><span><em className={d[3]==='Protected'?'protected':''}><Check/>{d[3]}</em></span><button className="icon-btn"><MoreHorizontal/></button></div>)}</div></section>
  </motion.div>;
}

function Jobs() {
  const [applied,setApplied]=useState([]);
  return <motion.div {...fade}><PageTitle eyebrow="AI-RANKED OPPORTUNITIES" title={<>Work that fits <span>you.</span></>} text="Matched using your verified skills, experience, location and preferences." action={<button className="outline-btn"><SlidersIcon/> Match preferences</button>}/>
    <div className="filter-row"><button className="active">All matches <span>6</span></button><button>Near me</button><button>Full-time</button><button>Contract</button><div/><select><option>Best match first</option><option>Highest pay</option></select></div>
    <div className="jobs-page">{[...jobs,...jobs.slice(1).map((j,i)=>({...j,id:j.id+3,match:j.match-8,title:i?'Sampling Tailor':'Production Tailor'}))].map(job=><motion.article className="card job-card" key={job.id} whileHover={{y:-3}}><div className="job-card-top"><div className="company-logo large">{job.logo}</div><span className="match-pill"><Sparkles/>{job.match}% match</span><button className="icon-btn"><Star/></button></div><h3>{job.title}</h3><p>{job.company} <BadgeCheck/></p><div className="job-meta"><span><MapPin/>{job.location}</span><span><IndianRupee/>{job.pay}</span><span><CalendarDays/>{job.type}</span></div><div className="skill-tags"><span>Tailoring</span><span>Pattern cutting</span><span>+2 skills</span></div><div className="why"><Zap/><span><b>Why it fits:</b> Strong skill overlap and preferred travel radius</span></div><button disabled={applied.includes(job.id)} className="primary-btn full" onClick={()=>{setApplied([...applied,job.id]);toast.success('Application sent successfully')}}>{applied.includes(job.id)?<><Check/> Applied</>:<>View & apply <ArrowRight/></>}</button></motion.article>)}</div>
  </motion.div>;
}
function SlidersIcon(){return <Target size={17}/>}

function Schemes() {
  return <motion.div {...fade}><PageTitle eyebrow="BENEFITS & WELFARE" title={<>Schemes made <span>understandable.</span></>} text="Recommendations use your profile details. Always confirm eligibility on the official portal."/>
    <div className="scheme-banner"><div><Sparkles/></div><div><b>We found 3 schemes you may qualify for</b><p>Complete your education details to improve recommendation accuracy.</p></div><button className="white-btn">Improve profile <ArrowRight/></button></div>
    <div className="schemes-grid">{schemes.map((s,i)=><article className="card scheme-card" key={s.name}><div className="scheme-card-head"><div className={`scheme-icon ${s.color}`}>{i===0?<HandCoins/>:<ShieldCheck/>}</div><span>{s.tag}</span></div><h3>{s.name}</h3><p>{s.benefit}</p><div className="eligible"><Check/><div><b>{s.eligibility}</b><small>Based on your current profile</small></div></div><h5>What you'll need</h5><div className="chips small"><span>Aadhaar</span><span>Bank account</span><span>Mobile number</span></div><button className="outline-btn full" onClick={()=>toast.info('Opening official application guidance')}>View eligibility & apply <ArrowRight/></button></article>)}</div>
  </motion.div>;
}

function Skills() {
  const recommendations=[['Advanced pattern making','High impact','Potential +₹4k–7k/month'],['Garment quality supervisor','Career path','Qualify for team-lead roles'],['Digital catalogue & WhatsApp selling','Micro-business','Reach buyers directly']];
  return <motion.div {...fade}><PageTitle eyebrow="PERSONALISED GROWTH PATH" title={<>Skills that open <span>doors.</span></>} text="Practical recommendations based on your current work and nearby demand."/>
    <div className="skills-layout"><section className="card"><CardHead title="Your verified skills" sub="4 verified · 2 self-declared"/>{['Industrial stitching','Pattern cutting','Hand embroidery','Garment finishing'].map((x,i)=><div className="skill-line" key={x}><span><BadgeCheck/>{x}</span><div className="skill-bar"><i style={{width:`${92-i*7}%`}}/></div><b>{['Expert','Advanced','Advanced','Proficient'][i]}</b></div>)}</section><section className="card"><CardHead title="Recommended next steps" sub="Chosen for earnings impact"/>{recommendations.map((r,i)=><div className="recommend-row" key={r[0]}><span>{i+1}</span><div><b>{r[0]}</b><small>{r[1]} · {r[2]}</small></div><ChevronRight/></div>)}</section></div>
  </motion.div>;
}

function Assistant({ open, close }) {
  const [messages,setMessages]=useState([{ai:true,text:'Namaste Asha! I can explain your income trends, find schemes, or help with job applications. What would you like to know?'}]);
  const [value,setValue]=useState('');
  const send=()=>{if(!value.trim())return;const q=value;setMessages(m=>[...m,{text:q}]);setValue('');setTimeout(()=>setMessages(m=>[...m,{ai:true,text:'Based on your verified profile, PM Vishwakarma is your strongest scheme match. You meet the occupation and age criteria; you’ll need Aadhaar, a bank account and mobile number to apply.'}]),500)};
  return <AnimatePresence>{open&&<><motion.div className="assistant-scrim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={close}/><motion.aside className="assistant" initial={{x:420}} animate={{x:0}} exit={{x:420}} transition={{type:'spring',damping:28}}><div className="assistant-head"><div><span><Sparkles/></span><div><b>Lens AI</b><small><i/> Ready to help</small></div></div><button className="icon-btn" onClick={close}><X/></button></div><div className="messages">{messages.map((m,i)=><div className={m.ai?'ai-message':'my-message'} key={i}>{m.ai&&<span><Sparkles/></span>}<p>{m.text}</p></div>)}</div><div className="quick-prompts"><button onClick={()=>setValue('Which schemes am I eligible for?')}>Schemes for me</button><button onClick={()=>setValue('Explain my income trend')}>Income trend</button></div><div className="assistant-input"><input value={value} onChange={e=>setValue(e.target.value)} onKeyDown={e=>e.key==='Enter'&&send()} placeholder="Ask in English or Hindi..."/><button onClick={send}><ArrowRight/></button></div><small className="ai-note">AI can make mistakes. Verify important information.</small></motion.aside></>}</AnimatePresence>;
}

export default App;
