import { useEffect, useRef, useState } from 'react';
import { NavLink, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight, BadgeCheck, Bell, BookOpen, BriefcaseBusiness, Building2, CalendarDays,
  Check, ChevronDown, ChevronRight, CircleHelp, CloudUpload, Download, FileCheck2,
  FileText, HandCoins, Home, IndianRupee, Languages, LayoutDashboard, LockKeyhole,
  LogOut, MapPin, Menu, MessageCircleMore, Moon, MoreHorizontal, QrCode, Search,
  ShieldCheck, Sparkles, Star, Sun, Target, TrendingUp, Upload, UserRound,
  UsersRound, WalletCards, X, Zap, Eye, EyeOff, Mail, KeyRound, Trash2,
  Mic, Volume2, VolumeX,
} from 'lucide-react';
import {
  Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis,
} from 'recharts';
import { QRCodeSVG } from 'qrcode.react';
import { toast } from 'sonner';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiFetch, formatMoney, formatPay } from './api';
import { absoluteApiUrl } from './config';
import {
  authenticate, clearSession, loadSession, millisecondsUntilRefresh, refreshSession, revokeSession,
} from './auth';
import { INDIAN_STATES } from './constants';

const nav = [
  { to: '/', icon: LayoutDashboard, label: 'Overview' },
  { to: '/passport', icon: UserRound, label: 'My Passport' },
  { to: '/income', icon: TrendingUp, label: 'Income Insights' },
  { to: '/documents', icon: FileText, label: 'Documents' },
  { to: '/jobs', icon: BriefcaseBusiness, label: 'Job Matches' },
  { to: '/schemes', icon: HandCoins, label: 'Govt. Schemes' },
  { to: '/skills', icon: BookOpen, label: 'Skills & Growth' },
  { to: '/rights', icon: ShieldCheck, label: 'Rights & Safety' },
];

const fade = { initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: .35 } };

const workerDataQueryKeys = [
  'dashboard',
  'income-summary',
  'income-records',
  'documents',
  'worker-profile',
  'jobs',
  'schemes',
  'passport',
  'credit-profile',
];

function invalidateWorkerData(queryClient) {
  workerDataQueryKeys.forEach(queryKey => queryClient.invalidateQueries({ queryKey: [queryKey] }));
}

function App() {
  const [session, setSession] = useState(loadSession);
  const [dark, setDark] = useState(false);
  const [mobile, setMobile] = useState(false);
  const [assistant, setAssistant] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle('dark', dark);
  }, [dark]);
  useEffect(() => {
    if (!session?.refreshToken) return undefined;
    const timer = window.setTimeout(async () => {
      try {
        setSession(await refreshSession(session));
      } catch {
        clearSession();
        setSession(null);
        toast.error('Your session expired. Please sign in again.');
      }
    }, millisecondsUntilRefresh(session));
    return () => window.clearTimeout(timer);
  }, [session]);
  if (!session?.user || !session?.accessToken || !session?.refreshToken) {
    return <AuthScreen onAuthenticated={setSession} />;
  }
  const signOut = () => {
    const currentSession = session;
    clearSession();
    setSession(null);
    toast.success('Signed out successfully');
    revokeSession(currentSession).catch(() => {});
  };
  return (
    <div className="app-shell">
      <Sidebar mobile={mobile} close={() => setMobile(false)} user={session.user} signOut={signOut} openAssistant={() => setAssistant(true)} />
      <div className="main-area">
        <Topbar dark={dark} setDark={setDark} openMenu={() => setMobile(true)} user={session.user} />
        <main className="page-wrap">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/passport" element={<Passport />} />
            <Route path="/income" element={<Income />} />
            <Route path="/documents" element={<Documents />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/schemes" element={<Schemes />} />
            <Route path="/skills" element={<Skills />} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/rights" element={<Rights />} />
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

const initials = name => name.split(/\s+/).filter(Boolean).slice(0, 2).map(part => part[0]).join('').toUpperCase();

function AuthScreen({ onAuthenticated }) {
  const [mode, setMode] = useState('login');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async event => {
    event.preventDefault();
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const values = Object.fromEntries(form);
    try {
      const session = await authenticate(mode, values);
      onAuthenticated(session);
      toast.success(mode === 'register' ? 'Your account is ready' : 'Welcome back');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const changeMode = nextMode => {
    setMode(nextMode);
    setError('');
  };

  return <main className="auth-page">
    <section className="auth-story">
      <Logo/>
      <div className="auth-story-copy">
        <span className="auth-kicker"><ShieldCheck size={15}/> A verified livelihood identity</span>
        <h1>Your work deserves to be <em>seen.</em></h1>
        <p>Build a portable record of your skills, income and experience—and use it to unlock better opportunities.</p>
        <div className="auth-benefits">
          <div><BadgeCheck/><span><b>Own your work history</b><small>One secure, verified passport</small></span></div>
          <div><BriefcaseBusiness/><span><b>Find work that fits</b><small>Matches built around your skills</small></span></div>
          <div><LockKeyhole/><span><b>Your data stays yours</b><small>Private and permission-based</small></span></div>
        </div>
      </div>
      <small className="auth-story-foot">Built for India’s workforce · सरल · सुरक्षित · आपका</small>
    </section>
    <section className="auth-panel">
      <div className="auth-box">
        <div className="auth-mobile-logo"><Logo/></div>
        <span className="auth-eyebrow">{mode === 'login' ? 'WELCOME BACK' : 'CREATE YOUR PASSPORT'}</span>
        <h2>{mode === 'login' ? 'Sign in to your account' : 'Start building your future'}</h2>
        <p>{mode === 'login' ? 'Continue to your livelihood dashboard.' : 'Create a secure account in just a minute.'}</p>
        <div className="auth-tabs">
          <button type="button" className={mode === 'login' ? 'active' : ''} onClick={() => changeMode('login')}>Sign in</button>
          <button type="button" className={mode === 'register' ? 'active' : ''} onClick={() => changeMode('register')}>Register</button>
        </div>
        <form className="auth-form" onSubmit={submit}>
          {mode === 'register' && <>
            <label>Full name<div><UserRound/><input name="name" autoComplete="name" placeholder="Your full name" minLength="2" required/></div></label>
            <label>I am looking to<div className="auth-select"><UsersRound/><select name="role" defaultValue="worker"><option value="worker">Find work</option><option value="employer">Hire workers</option></select></div></label>
          </>}
          <label>Email address<div><Mail/><input type="email" name="email" autoComplete="email" placeholder="you@example.com" required/></div></label>
          <label>Password<div><KeyRound/><input type={showPassword ? 'text' : 'password'} name="password" autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder={mode === 'register' ? 'At least 8 characters' : 'Enter your password'} minLength="8" required/><button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff/> : <Eye/>}</button></div></label>
          {error && <div className="auth-error" role="alert">{error}</div>}
          <button className="auth-submit" disabled={busy}>{busy ? 'Please wait…' : mode === 'login' ? <>Sign in <ArrowRight/></> : <>Create account <ArrowRight/></>}</button>
        </form>
        <p className="auth-switch">{mode === 'login' ? 'New to Shramik Lens?' : 'Already have an account?'} <button type="button" onClick={() => changeMode(mode === 'login' ? 'register' : 'login')}>{mode === 'login' ? 'Create an account' : 'Sign in'}</button></p>
      </div>
    </section>
  </main>;
}

function Sidebar({ mobile, close, user, signOut, openAssistant }) {
  const navigate = useNavigate();
  const userInitials = initials(user.name);
  const {data}=useQuery({queryKey:['dashboard'],queryFn:()=>apiFetch('/dashboard'),enabled:user.role==='worker'});
  const dynamicNav=nav.map(item=>item.to==='/jobs'?{...item,badge:data?.jobMatches?.length||null}:item.to==='/schemes'?{...item,badge:data?.governmentSchemes?.length||null}:item);
  return <>
    {mobile && <div className="scrim" onClick={close}/>}
    <aside className={`sidebar ${mobile ? 'open' : ''}`}>
      <div className="side-head"><Logo/><button className="icon-btn side-close" onClick={close}><X size={19}/></button></div>
      <div className="passport-mini" onClick={() => {
        if (window.hasUnsavedChanges && !window.confirm('You have unsaved changes. Discard them and leave?')) return;
        navigate('/profile');
        close();
      }} style={{ cursor: 'pointer' }}>
        <div className="avatar">{userInitials}<span><BadgeCheck size={16}/></span></div>
        <div><b>{user.name}</b><small><span className="live-dot"/> Account active</small></div>
        <ChevronRight size={16}/>
      </div>
      <nav>
        <p className="nav-title">YOUR SPACE</p>
        {dynamicNav.map(({ to, icon: Icon, label, badge }) => <NavLink key={to} to={to} end={to === '/'} onClick={(e) => {
          if (window.hasUnsavedChanges && !window.confirm('You have unsaved changes. Discard them and leave?')) {
            e.preventDefault();
            return;
          }
          close();
        }}>
          <Icon size={18}/><span>{label}</span>{badge && <em>{badge}</em>}
        </NavLink>)}
      </nav>
      <div className="side-bottom">
        <div className="support-card" onClick={() => { openAssistant(); close(); }} style={{ cursor: 'pointer' }}><MessageCircleMore size={21}/><div><b>Need help?</b><small>Talk to our support team</small></div><ArrowRight size={16}/></div>
        <button onClick={() => { openAssistant(); close(); }}><CircleHelp size={18}/> Help & support</button>
        <button onClick={signOut}><LogOut size={18}/> Sign out</button>
      </div>
    </aside>
  </>;
}

function Topbar({ dark, setDark, openMenu, user }) {
  const location = useLocation();
  const navigate = useNavigate();
  const {data}=useQuery({queryKey:['dashboard'],queryFn:()=>apiFetch('/dashboard'),enabled:user.role==='worker'});
  const labels = { '/passport': 'My Livelihood Passport', '/income': 'Income Insights', '/documents': 'Document Vault', '/jobs': 'Job Matches', '/schemes': 'Government Schemes', '/skills': 'Skills & Growth', '/profile': 'Profile Setup & Edit', '/rights': 'Rights & Safety' };
  return <header className="topbar">
    <div className="top-left"><button className="icon-btn menu-btn" onClick={openMenu}><Menu/></button><div><small>{user.role.toUpperCase()} PORTAL</small><h3>{labels[location.pathname] || `Welcome, ${user.name.split(' ')[0]} 👋`}</h3></div></div>
    <div className="top-actions">
      <div className="global-search"><Search size={17}/><input placeholder="Search jobs, schemes, documents..."/><kbd>⌘ K</kbd></div>
      <button className="icon-btn" onClick={() => setDark(!dark)}>{dark ? <Sun size={19}/> : <Moon size={19}/>}</button>
      <div className="notif"><Bell size={19}/>{Boolean(data?.unreadNotifications)&&<i>{data.unreadNotifications}</i>}</div>
      <div className="user-chip" onClick={() => {
        if (window.hasUnsavedChanges && !window.confirm('You have unsaved changes. Discard them and leave?')) return;
        navigate('/profile');
      }} style={{ cursor: 'pointer' }}><div className="avatar tiny">{initials(user.name)}</div><div><b>{user.name}</b><small>{user.role[0].toUpperCase() + user.role.slice(1)} account</small></div><ChevronDown size={15}/></div>
    </div>
  </header>;
}

function PageTitle({ eyebrow, title, text, action }) {
  return <div className="page-title"><div><small>{eyebrow}</small><h1>{title}</h1>{text && <p>{text}</p>}</div>{action}</div>;
}

function Dashboard() {
  const navigate = useNavigate();
  const navigateConfirm = (to) => {
    if (window.hasUnsavedChanges && !window.confirm('You have unsaved changes. Discard them and leave?')) return;
    navigate(to);
  };
  const { data, isLoading, error } = useQuery({ queryKey: ['dashboard'], queryFn: () => apiFetch('/dashboard') });
  if (isLoading) return <LoadingState text="Calculating your livelihood dashboard…"/>;
  if (error) return <ErrorState error={error}/>;
  const graph = data.incomeGraph || [];
  const bestMatch = data.jobMatches?.[0]?.matchScore || 0;
  return <motion.div {...fade}>
    <PageTitle eyebrow={new Date().toLocaleDateString('en-IN', { weekday:'long', day:'numeric', month:'long' }).toUpperCase()} title={<>Your livelihood, <span>in one place.</span></>} text="Keep building your verified work identity and unlock better opportunities." action={<button className="primary-btn" onClick={() => navigateConfirm('/passport')}><QrCode size={17}/> View passport</button>}/>
    <div className="trust-strip" onClick={() => navigateConfirm('/passport')} style={{ cursor: 'pointer' }}><ShieldCheck size={20}/><div><b>{data.trust.badge} trust profile</b><span>{data.verifiedDocuments} verified documents support your livelihood record.</span></div><div className="trust-score"><strong>{data.trust.score}</strong><span>Trust strength</span></div><ChevronRight size={18}/></div>
    <div className="stat-grid">
      <Stat icon={WalletCards} color="mint" label="Current month income" value={formatMoney(data.monthlyIncome)} delta={`${data.incomeGrowthPercentage >= 0 ? '+' : ''}${data.incomeGrowthPercentage}%`} note="vs last month" onClick={() => navigateConfirm('/income')}/>
      <Stat icon={Target} color="purple" label="Financial readiness" value={data.financialReadiness.category} delta={`${data.financialReadiness.score}/100`} note="Based on verified records" onClick={() => navigateConfirm('/income')}/>
      <Stat icon={BriefcaseBusiness} color="orange" label="Job matches" value={`${data.jobMatches.length} open`} delta={`${bestMatch}%`} note="Best match" onClick={() => navigateConfirm('/jobs')}/>
      <Stat icon={FileCheck2} color="blue" label="Profile completion" value={`${data.profileCompletion}%`} delta={`${100-data.profileCompletion}%`} note="remaining" onClick={() => navigateConfirm('/profile')}/>
    </div>
    <div className="dashboard-grid">
      <section className="card chart-card">
        <CardHead title="Income overview" sub="Verified earnings from the last 6 months" action={<button className="text-btn" onClick={() => navigateConfirm('/income')}>View insights <ArrowRight size={15}/></button>}/>
        <div className="chart-kpis"><div><small>6-month earnings</small><strong>{formatMoney(data.sixMonthTotal)}</strong></div><div><span className="up"><TrendingUp size={14}/> {data.incomeGrowthPercentage}%</span><small>month-on-month</small></div></div>
        <div className="chart"><ResponsiveContainer width="100%" height="100%"><AreaChart data={graph} margin={{ left: -24, right: 4, top: 8 }}><defs><linearGradient id="income" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#5e5ce6" stopOpacity=".3"/><stop offset="100%" stopColor="#5e5ce6" stopOpacity="0"/></linearGradient></defs><CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line)"/><XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: 'var(--muted)', fontSize: 12 }}/><Tooltip contentStyle={{ border: 0, borderRadius: 12, boxShadow: '0 8px 30px #0002' }} formatter={(v) => [formatMoney(v), 'Income']}/><Area type="monotone" dataKey="income" stroke="#5e5ce6" strokeWidth={2.5} fill="url(#income)"/></AreaChart></ResponsiveContainer></div>
      </section>
      <section className="card next-card">
        <CardHead title="Next best actions" sub="Small steps that improve your opportunities"/>
        {data.nextBestActions.length ? data.nextBestActions.map((action,index)=><ActionRow key={action.title} n={`0${index+1}`} title={action.title} text={action.text} icon={[BookOpen,Upload,HandCoins][index]} color={['purple','green','amber'][index]} onClick={() => {
          if (action.type === 'profile') navigateConfirm('/profile');
          else if (action.type === 'document') navigateConfirm('/documents');
          else if (action.type === 'income') navigateConfirm('/income');
          else if (action.type === 'scheme') navigateConfirm('/schemes');
          else toast.success(`${action.title} opened`);
        }}/>) : <EmptyState text="Your core livelihood records are up to date."/>}
      </section>
    </div>
    <div className="bottom-grid">
      <section className="card">
        <CardHead title="Top job matches" sub="Ranked for your skills and preferences" action={<button className="text-btn" onClick={() => navigateConfirm('/jobs')}>See all {data.jobMatches.length} <ArrowRight size={15}/></button>}/>
        <div className="job-list">{data.jobMatches.length ? data.jobMatches.slice(0,2).map(job => <JobRow key={job._id} job={job}/>) : <EmptyState text="Add skills and location to unlock job matches."/>}</div>
      </section>
      <section className="card">
        <CardHead title="Schemes for you" sub="Eligibility based on your verified profile" action={<button className="text-btn" onClick={() => navigateConfirm('/schemes')}>See all <ArrowRight size={15}/></button>}/>
        {data.governmentSchemes.length ? data.governmentSchemes.slice(0,2).map((s,i) => <div className="scheme-row" key={s._id}><div className={`scheme-icon ${i ? 'green' : 'amber'}`}>{i ? <ShieldCheck/> : <HandCoins/>}</div><div><b>{s.name}</b><small>{s.benefits}</small></div><span>Eligible</span></div>) : <EmptyState text="No scheme currently matches your completed profile."/>}
      </section>
    </div>
  </motion.div>;
}

function Stat({ icon: Icon, color, label, value, delta, note, onClick }) {
  return <motion.div className="card stat-card" whileHover={{ y: -3 }} onClick={onClick} style={onClick ? { cursor: 'pointer' } : {}}><div className={`stat-icon ${color}`}><Icon/></div><div className="stat-main"><small>{label}</small><strong>{value}</strong><div><span>{delta}</span> {note}</div></div><MoreHorizontal size={18}/></motion.div>;
}
function CardHead({ title, sub, action }) { return <div className="card-head"><div><h3>{title}</h3><p>{sub}</p></div>{action}</div>; }
function ActionRow({ n, title, text, icon: Icon, color, onClick }) { return <button className="action-row" onClick={onClick}><span className={`action-icon ${color}`}><Icon/></span><div><b>{title}</b><small>{text}</small></div><em>{n}</em><ChevronRight size={17}/></button>; }
function JobRow({ job }) { return <div className="job-row"><div className="company-logo">{job.employer?.name?.[0] || job.title[0]}</div><div className="job-info"><b>{job.title}</b><span>{job.employer?.name || 'Employer'}</span><small><MapPin size={13}/>{job.location?.city || 'Location flexible'}<i/> {formatPay(job.pay)}</small></div><div className="match-ring">{job.matchScore || 0}<small>%</small><span>match</span></div><button className="outline-btn" onClick={() => toast.info(`Open ${job.title} from Job Matches`)}>View job</button></div>; }

function LoadingState({ text }) { return <div className="card state-card"><Sparkles/><h3>{text}</h3></div>; }
function ErrorState({ error }) { return <div className="card state-card error"><CircleHelp/><h3>Could not load this page</h3><p>{error.message}</p></div>; }
function EmptyState({ text }) { return <div className="empty-state">{text}</div>; }

function Passport() {
  const session=loadSession();
  const {data,isLoading,error}=useQuery({queryKey:['dashboard'],queryFn:()=>apiFetch('/dashboard')});
  const generate=useMutation({mutationFn:()=>apiFetch('/passport',{method:'POST'}),onSuccess:()=>toast.success('Passport generated and saved'),onError:e=>toast.error(e.message)});
  const download=async()=>{try{const blob=await apiFetch('/passport/download');const url=URL.createObjectURL(blob);const link=document.createElement('a');link.href=url;link.download='livelihood-passport.pdf';link.click();URL.revokeObjectURL(url);}catch(e){toast.error(e.message);}};
  if(isLoading)return <LoadingState text="Building your livelihood passport…"/>;
  if(error)return <ErrorState error={error}/>;
  const profile=data.profile||{};
  const publicId=profile.publicId||'Generate passport to create ID';
  const verifiedSkills=(profile.skills||[]).filter(skill=>skill.verified);
  return <motion.div {...fade}>
    <PageTitle eyebrow="VERIFIED WORK IDENTITY" title={<>Your livelihood <span>passport.</span></>} text="A portable, verifiable record of your skills, earnings and work history." action={<div className="passport-actions"><button className="outline-btn" onClick={()=>generate.mutate()} disabled={generate.isPending}>Generate</button><button className="primary-btn" onClick={download}><Download size={17}/> Download PDF</button></div>}/>
    <div className="passport-layout">
      <section className="passport-card">
        <div className="passport-top"><Logo/><span><ShieldCheck size={15}/> {data.verifiedDocuments > 0 ? 'VERIFIED PASSPORT' : 'BUILDING PASSPORT'}</span></div>
        <div className="passport-person">
          <div className="big-avatar">{initials(session.user.name)}</div><div><small>WORKER ID · {publicId}</small><h2>{session.user.name} <BadgeCheck/></h2><p>{profile.occupation||'Occupation not added'}</p><span><MapPin/> {[profile.location?.city,profile.location?.state].filter(Boolean).join(', ')||'Location not added'}</span></div>
          <div className="qr"><QRCodeSVG value={absoluteApiUrl(`/public/passport/${profile.publicId || ''}`)} size={88}/><small>Scan to verify</small></div>
        </div>
        <div className="passport-stats"><div><small>EXPERIENCE</small><b>{profile.experienceYears||0} years</b></div><div><small>VERIFIED DOCS</small><b>{data.verifiedDocuments}</b></div><div><small>READINESS</small><b>{data.financialReadiness.score} · {data.financialReadiness.category}</b></div><div><small>MONTHLY INCOME</small><b>{formatMoney(data.monthlyIncome)}</b></div></div>
        <div className="passport-section"><h4>Verified skills</h4><div className="chips">{verifiedSkills.length?verifiedSkills.map(skill=><span key={skill._id||skill.name}>{skill.name}<Check/></span>):<EmptyState text="No skills verified yet."/>}</div></div>
        <div className="passport-section"><h4>Recent employment</h4>{profile.employmentHistory?.length?profile.employmentHistory.map(item=><div className="history" key={item._id}><i/><div><b>{item.title} · {item.employerName}</b><small>{item.verified?'Verified by employer':'Awaiting verification'}</small></div>{item.verified&&<BadgeCheck/>}</div>):<EmptyState text="No employment history added yet."/>}</div>
        <div className="passport-foot"><LockKeyhole/> Sensitive personal and banking details are never shown publicly.<span>Last updated {new Date().toLocaleDateString('en-IN')}</span></div>
      </section>
      <aside className="passport-side">
        <div className="card strength"><CardHead title="Passport strength" sub="Your verified profile quality"/><div className="strength-score"><div><strong>{data.trust.score}</strong><small>/100</small></div><span>{data.trust.badge}</span></div><div className="progress"><i style={{width:`${data.trust.score}%`}}/></div><p>Strength is calculated from verified profile evidence.</p></div>
        <div className="card"><CardHead title="Visibility controls" sub="Choose what verifiers can see"/>{['Basic profile & skills','Employment history','Income range','Contact details'].map((x,i)=><label className="toggle-row" key={x}><span>{x}</span><input type="checkbox" defaultChecked={i<3}/><i/></label>)}</div>
        <button className="share-passport" onClick={() => { navigator.clipboard?.writeText(absoluteApiUrl(`/public/passport/${profile.publicId || ''}`)); toast.success('Verification link copied'); }}><QrCode/><div><b>Share verification link</b><small>Let employers verify your passport</small></div><ArrowRight/></button>
      </aside>
    </div>
  </motion.div>;
}

function Income() {
  const queryClient = useQueryClient();
  const { data, isLoading, error } = useQuery({ queryKey:['income-summary'], queryFn:()=>apiFetch('/income/summary') });
  const dashboard = useQuery({ queryKey:['dashboard'], queryFn:()=>apiFetch('/dashboard') });
  const records = useQuery({ queryKey:['income-records'], queryFn:()=>apiFetch('/income') });

  const [showModal, setShowModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [tab, setTab] = useState('upload'); // 'upload' | 'manual'
  const [form, setForm] = useState({ amount:'', date:'', employerName:'', paymentMethod:'other', referenceNumber:'' });
  const fileRef = useRef(null);

  const creditProfileQuery = useQuery({ 
    queryKey: ['credit-profile'], 
    queryFn: () => apiFetch('/passport/credit-profile'),
    enabled: showCreditModal 
  });

  const invalidate = () => {
    invalidateWorkerData(queryClient);
  };

  const uploadMutation = useMutation({
    mutationFn: file => {
      const body = new FormData();
      body.append('document', file);
      body.append('type', 'payment_receipt');
      return apiFetch('/documents', { method:'POST', body });
    },
    onSuccess: doc => {
      invalidate();
      toast.success(doc.extractedData?.amount
        ? `Uploaded! ₹${doc.extractedData.amount.toLocaleString('en-IN')} detected automatically.`
        : 'Uploaded! No amount detected — add manually if needed.');
      setShowModal(false);
    },
    onError: e => toast.error(e.message),
  });

  const manualMutation = useMutation({
    mutationFn: body => apiFetch('/income', { method:'POST', body: JSON.stringify(body) }),
    onSuccess: () => {
      invalidate();
      toast.success('Income record added!');
      setShowModal(false);
      setForm({ amount:'', date:'', employerName:'', paymentMethod:'other', referenceNumber:'' });
    },
    onError: e => toast.error(e.message),
  });

  const handleManualSubmit = () => {
    if (!form.amount || !form.date) return toast.error('Amount and date are required');
    manualMutation.mutate({ ...form, amount: Number(form.amount) });
  };

  const handleDownloadCredit = async () => {
    try {
      const blob = await apiFetch('/passport/credit-profile/download');
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'livelihood-credit-statement.pdf';
      link.click();
      URL.revokeObjectURL(url);
      toast.success('Downloaded livelihood credit statement PDF');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (isLoading || dashboard.isLoading) return <LoadingState text="Calculating income insights…"/>;
  if (error || dashboard.error) return <ErrorState error={error || dashboard.error}/>;
  const readiness = dashboard.data.financialReadiness;
  const transactionFrequency = data.graph.at(-1)?.transactions || 0;

  return (
    <motion.div {...fade}>
      <PageTitle
        eyebrow="VERIFIED EARNING RECORDS"
        title={<>Income that tells <span>your story.</span></>}
        text="Insights are estimated from records you upload—never a credit score."
        action={
          <button className="primary-btn" onClick={() => { setShowModal(true); setTab('upload'); }}>
            <Upload size={17}/> Add income proof
          </button>
        }
      />

      {/* Hero stats */}
      <div className="income-hero">
        <div><small>CURRENT MONTH INCOME</small><h2>{formatMoney(data.monthlyIncome)}</h2><span><TrendingUp/> {data.growthPercentage}% from last month</span></div>
        <div><small>PAYMENT ACTIVITY</small><h3>{transactionFrequency ? 'Active' : 'No records yet'}</h3><p>{transactionFrequency} transactions recorded this month</p></div>
        <div><small>FINANCIAL READINESS INDEX</small><h3>{readiness.score} <em>/100</em></h3><p>{readiness.category} · built from verified patterns</p></div>
      </div>

      {/* Credit Profile Builder Card */}
      <section className="card" style={{ padding: 20, marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <div>
            <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}><WalletCards size={16} style={{ color: 'var(--purple)', display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/> Livelihood Credit Profile</h3>
            <p style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>A verified alternative underwriting profile designed for bank-free micro-credit approvals.</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="outline-btn" style={{ height: 32 }} onClick={() => setShowCreditModal(true)}><Eye size={13}/> View statement</button>
            <button className="primary-btn" style={{ height: 32 }} onClick={handleDownloadCredit}><Download size={13}/> Download PDF</button>
          </div>
        </div>

        {/* Micro-credit matching list */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginTop: 16 }}>
          <div className="card2" style={{ padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 7, fontWeight: 700, padding: '3px 6px', background: 'var(--purple2)', color: 'var(--purple)', borderRadius: 10 }}>ARTISANS / TRADES</span>
            <b style={{ display: 'block', fontSize: 10, marginTop: 8 }}>PM Vishwakarma Credit Support</b>
            <p style={{ fontSize: 8, color: 'var(--muted)', margin: '4px 0 10px' }}>Collateral-free enterprise growth loans up to ₹3,00,000 at concessional interest rate (5%).</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: '#13805e', background: '#e3f4ec', padding: '3px 7px', borderRadius: 8 }}>Highly Recommended</span>
              <a className="text-btn" href="https://pmvishwakarma.gov.in/" target="_blank" rel="noreferrer">Official site</a>
            </div>
          </div>

          <div className="card2" style={{ padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 7, fontWeight: 700, padding: '3px 6px', background: '#fff0dc', color: '#c27d1d', borderRadius: 10 }}>MICRO-VENDORS</span>
            <b style={{ display: 'block', fontSize: 10, marginTop: 8 }}>PM SVANidhi Scheme</b>
            <p style={{ fontSize: 8, color: 'var(--muted)', margin: '4px 0 10px' }}>Special micro-credit facility for street vendors up to ₹50,000 with timely repayment incentives.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: '#13805e', background: '#e3f4ec', padding: '3px 7px', borderRadius: 8 }}>Eligible</span>
              <a className="text-btn" href="https://pmsvanidhi.mohua.gov.in/" target="_blank" rel="noreferrer">Official site</a>
            </div>
          </div>

          <div className="card2" style={{ padding: 14, borderRadius: 10, border: '1px solid var(--line)' }}>
            <span style={{ fontSize: 7, fontWeight: 700, padding: '3px 6px', background: '#e7f2fb', color: '#4082b7', borderRadius: 10 }}>GENERAL SERVICE TRADES</span>
            <b style={{ display: 'block', fontSize: 10, marginTop: 8 }}>MUDRA Shishu Loan</b>
            <p style={{ fontSize: 8, color: 'var(--muted)', margin: '4px 0 10px' }}>Non-farm business credit up to ₹50,000 for starting or expanding small service operations.</p>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 8, color: '#13805e', background: '#e3f4ec', padding: '3px 7px', borderRadius: 8 }}>Eligible</span>
              <a className="text-btn" href="https://www.mudra.org.in/" target="_blank" rel="noreferrer">Official site</a>
            </div>
          </div>
        </div>
      </section>

      {/* Chart */}
      <section className="card large-chart">
        <CardHead title="Earning trend" sub="Monthly income records · previous six months"/>
        <div className="chart">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.graph}>
              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line)"/>
              <XAxis dataKey="month" axisLine={false} tickLine={false}/>
              <Tooltip formatter={v=>formatMoney(v)}/>
              <Area dataKey="income" type="monotone" stroke="#5e5ce6" strokeWidth={3} fill="#5e5ce622"/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Transaction list */}
      <section className="card doc-card" style={{ marginTop:20 }}>
        <CardHead title="Income records" sub={`${records.data?.length || 0} total entries`}/>
        <div className="doc-table">
          <div className="doc-tr income-tr head"><span>DATE</span><span>AMOUNT</span><span>EMPLOYER</span><span>METHOD</span><span>STATUS</span></div>
          {records.isLoading
            ? <EmptyState text="Loading records…"/>
            : records.data?.length
              ? records.data.map(r => (
                  <div className="doc-tr income-tr" key={r._id}>
                    <span><b>{new Date(r.date).toLocaleDateString('en-IN')}</b></span>
                    <span style={{ color:'var(--accent)', fontWeight:700 }}>{formatMoney(r.amount)}</span>
                    <span>{r.employerName || r.employer?.name || '—'}</span>
                    <span style={{ textTransform:'capitalize' }}>{r.paymentMethod?.replace('_',' ') || '—'}</span>
                    <span><em className={r.verified ? '' : 'protected'}>{r.verified ? <><Check size={12}/> Verified</> : 'Unverified'}</em></span>
                  </div>
                ))
              : <EmptyState text="No income records yet. Upload a payment proof to get started."/>
          }
        </div>
      </section>

      {/* Add Income Proof Modal */}
      <AnimatePresence>
        {showModal && (
          <>
            <motion.div className="assistant-scrim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowModal(false)}/>
            <motion.div
              initial={{ opacity:0, y:60 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:60 }}
              transition={{ type:'spring', damping:28 }}
              style={{
                position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
                width:'min(560px, 100vw)', background:'var(--card)', borderRadius:'20px 20px 0 0',
                padding:'28px 24px 32px', zIndex:1100, boxShadow:'0 -8px 40px rgba(0,0,0,0.35)'
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <b style={{ fontSize:15 }}>Add Income Proof</b>
                <button className="icon-btn" onClick={() => setShowModal(false)}><X size={18}/></button>
              </div>

              {/* Tab switcher */}
              <div style={{ display:'flex', gap:8, marginBottom:20 }}>
                {[['upload','Upload document'],['manual','Manual entry']].map(([t,label]) => (
                  <button key={t} onClick={() => setTab(t)}
                    className={tab === t ? 'primary-btn' : 'outline-btn'}
                    style={{ flex:1, height:36, fontSize:12 }}>
                    {label}
                  </button>
                ))}
              </div>

              {tab === 'upload' ? (
                <div>
                  <label
                    style={{
                      display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center',
                      gap:10, border:'2px dashed var(--line)', borderRadius:12, padding:'32px 16px',
                      cursor:'pointer', textAlign:'center'
                    }}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); uploadMutation.mutate(e.dataTransfer.files[0]); }}
                  >
                    <input ref={fileRef} type="file" accept=".png,.jpg,.jpeg,.webp,.pdf"
                      style={{ display:'none' }} onChange={e => uploadMutation.mutate(e.target.files[0])}/>
                    <CloudUpload size={32} style={{ color:'var(--accent)' }}/>
                    <b style={{ fontSize:13 }}>{uploadMutation.isPending ? 'Uploading & reading…' : 'Drop file or click to choose'}</b>
                    <p style={{ fontSize:11, color:'var(--muted)', margin:0 }}>UPI screenshot, bank statement or salary slip · PNG, JPG, PDF · Max 10 MB</p>
                    {!uploadMutation.isPending && (
                      <span className="outline-btn" style={{ fontSize:11, height:32, padding:'0 16px' }} onClick={() => fileRef.current?.click()}>Choose file</span>
                    )}
                  </label>
                  <p style={{ fontSize:10, color:'var(--muted)', marginTop:12, textAlign:'center' }}>
                    We'll automatically extract the amount, date and employer from your document using OCR.
                  </p>
                </div>
              ) : (
                <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
                    <div>
                      <label style={{ fontSize:10, color:'var(--muted)', display:'block', marginBottom:4 }}>AMOUNT (₹) *</label>
                      <input className="profile-input" type="number" placeholder="e.g. 12000" min={1}
                        value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} id="income-amount"/>
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:'var(--muted)', display:'block', marginBottom:4 }}>DATE *</label>
                      <input className="profile-input" type="date" value={form.date}
                        onChange={e => setForm(f => ({ ...f, date: e.target.value }))} id="income-date"/>
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:'var(--muted)', display:'block', marginBottom:4 }}>EMPLOYER / CLIENT</label>
                      <input className="profile-input" placeholder="e.g. ABC Builders" value={form.employerName}
                        onChange={e => setForm(f => ({ ...f, employerName: e.target.value }))} id="income-employer"/>
                    </div>
                    <div>
                      <label style={{ fontSize:10, color:'var(--muted)', display:'block', marginBottom:4 }}>PAYMENT METHOD</label>
                      <select className="profile-select" value={form.paymentMethod}
                        onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))} id="income-method">
                        {[['upi','UPI'],['cash','Cash'],['bank_transfer','Bank Transfer'],['cheque','Cheque'],['other','Other']].map(([v,l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize:10, color:'var(--muted)', display:'block', marginBottom:4 }}>REFERENCE / UTR NUMBER</label>
                    <input className="profile-input" placeholder="Optional" value={form.referenceNumber}
                      onChange={e => setForm(f => ({ ...f, referenceNumber: e.target.value }))} id="income-ref"/>
                  </div>
                  <button className="primary-btn full" onClick={handleManualSubmit}
                    disabled={manualMutation.isPending} style={{ marginTop:4 }}>
                    {manualMutation.isPending ? <><Sparkles size={14}/> Saving…</> : <><Check size={14}/> Add record</>}
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Credit Statement View Modal */}
      <AnimatePresence>
        {showCreditModal && (
          <>
            <motion.div className="assistant-scrim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setShowCreditModal(false)}/>
            <motion.div
              initial={{ opacity:0, y:60 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:60 }}
              transition={{ type:'spring', damping:28 }}
              style={{
                position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
                width:'min(650px, 100vw)', background:'var(--card)', borderRadius:'20px 20px 0 0',
                padding:'28px 24px 32px', zIndex:1100, boxShadow:'0 -8px 40px rgba(0,0,0,0.35)',
                maxHeight: '85vh', overflowY: 'auto'
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
                <b style={{ fontSize:15 }}><WalletCards size={18} style={{ color: 'var(--purple)', display: 'inline', marginRight: 8 }}/> Livelihood Credit Statement</b>
                <button className="icon-btn" onClick={() => setShowCreditModal(false)}><X size={18}/></button>
              </div>

              {creditProfileQuery.isLoading ? (
                <EmptyState text="Retrieving verified transaction history…"/>
              ) : creditProfileQuery.error ? (
                <ErrorState error={creditProfileQuery.error}/>
              ) : (
                <div className="printable-statement" style={{ border: '1px solid var(--line)', borderRadius: 12, padding: 20, background: 'var(--card2)', marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--purple)', paddingBottom: 12, marginBottom: 16 }}>
                    <div>
                      <h4 style={{ margin: 0, fontFamily: 'Georgia, serif', fontSize: 16, color: 'var(--purple)' }}>SHRAMIK LENS</h4>
                      <small style={{ fontSize: 7, color: 'var(--muted)', letterSpacing: 0.5 }}>DIGITAL LIVELIHOOD LEDGER</small>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ fontSize: 8, color: '#13805e', background: '#e3f4ec', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>VERIFIED PROFILE</span>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, fontSize: 11, marginBottom: 16 }}>
                    <div>
                      <span style={{ display: 'block', fontSize: 8, color: 'var(--muted)' }}>WORKER ID</span>
                      <b>{creditProfileQuery.data?.profile?.publicId || 'SL-PENDING'}</b>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 8, color: 'var(--muted)' }}>STATEMENT DATE</span>
                      <b>{new Date().toLocaleDateString('en-IN')}</b>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 8, color: 'var(--muted)' }}>HOLDER NAME</span>
                      <b>{dashboard.data?.profile?.user?.name || 'Worker'}</b>
                    </div>
                    <div>
                      <span style={{ display: 'block', fontSize: 8, color: 'var(--muted)' }}>OCCUPATION</span>
                      <b>{creditProfileQuery.data?.profile?.occupation || 'Not Specified'}</b>
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, padding: 12, background: 'var(--card)', borderRadius: 8, border: '1px solid var(--line)', marginBottom: 16, textAlign: 'center' }}>
                    <div>
                      <small style={{ fontSize: 7, color: 'var(--muted)', display: 'block' }}>READINESS SCORE</small>
                      <strong style={{ fontSize: 16, color: 'var(--purple)', fontFamily: 'Georgia, serif' }}>{creditProfileQuery.data?.scores?.financialReadiness?.score}/100</strong>
                    </div>
                    <div>
                      <small style={{ fontSize: 7, color: 'var(--muted)', display: 'block' }}>6-MONTH TOTAL</small>
                      <strong style={{ fontSize: 16, fontFamily: 'Georgia, serif' }}>{formatMoney(creditProfileQuery.data?.income?.sixMonthTotal)}</strong>
                    </div>
                    <div>
                      <small style={{ fontSize: 7, color: 'var(--muted)', display: 'block' }}>VERIFIED PAPERS</small>
                      <strong style={{ fontSize: 16, color: '#13805e', fontFamily: 'Georgia, serif' }}>{creditProfileQuery.data?.scores?.counts?.verifiedDocuments || 0}</strong>
                    </div>
                  </div>

                  <h5 style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--line)', paddingBottom: 6, margin: '14px 0 8px' }}>Earning Records (Last 6 Months)</h5>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {creditProfileQuery.data?.income?.graph?.map(item => (
                      <div key={item.month} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, padding: '4px 0', borderBottom: '1px dashed var(--line)' }}>
                        <span>{item.month} {item.year}</span>
                        <b>{formatMoney(item.income)}</b>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: 20, fontSize: 8, color: 'var(--muted)', borderTop: '1px solid var(--line)', paddingTop: 10, display: 'flex', justifyContent: 'space-between' }}>
                    <span>Generated securely via Shramik Lens</span>
                    <span>System ID: {creditProfileQuery.data?.profile?.user?._id || 'Verified'}</span>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="outline-btn" style={{ flex: 1 }} onClick={() => window.print()} disabled={creditProfileQuery.isLoading}><FileText size={14}/> Print statement</button>
                <button className="primary-btn" style={{ flex: 1 }} onClick={handleDownloadCredit} disabled={creditProfileQuery.isLoading}><Download size={14}/> Download PDF</button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}


function Documents() {
  const queryClient=useQueryClient();
  const {data:docs=[],isLoading,error}=useQuery({queryKey:['documents'],queryFn:()=>apiFetch('/documents')});
  const upload=useMutation({mutationFn:file=>{const body=new FormData();body.append('document',file);body.append('type','payment_receipt');return apiFetch('/documents',{method:'POST',body});},onSuccess:doc=>{invalidateWorkerData(queryClient);toast.success(doc.incomeRecord?'Document verified and income added':'Document uploaded; no complete income transaction was detected');},onError:e=>toast.error(e.message)});
  const choose=file=>file&&upload.mutate(file);

  const deleteDoc = useMutation({
    mutationFn: id => apiFetch(`/documents/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateWorkerData(queryClient);
      toast.success('Document deleted successfully');
    },
    onError: e => toast.error(e.message)
  });

  const handleDelete = id => {
    if (window.confirm('Are you sure you want to delete this document? This will also remove its extracted income record.')) {
      deleteDoc.mutate(id);
    }
  };

  if(isLoading)return <LoadingState text="Opening your secure document vault…"/>;
  if(error)return <ErrorState error={error}/>;
  return <motion.div {...fade}><PageTitle eyebrow="SECURE DOCUMENT VAULT" title={<>Proof, safely <span>organised.</span></>} text="Documents are encrypted and only used with your permission."/>
    <label className="dropzone" onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();choose(e.dataTransfer.files[0]);}}><input type="file" accept=".png,.jpg,.jpeg,.webp,.pdf" onChange={e=>choose(e.target.files[0])}/><div><CloudUpload/></div><h3>{upload.isPending?'Uploading and reading document…':'Drop a document here'}</h3><p>UPI screenshot, bank statement, salary slip, certificate or ID proof</p><span className="outline-btn">Choose file</span><small>PNG, JPG, WEBP or PDF · Max 10 MB</small></label>
    <section className="card doc-card"><CardHead title="Your documents" sub={`${docs.length} documents · ${docs.filter(d=>d.status==='verified').length} verified`}/><div className="doc-table"><div className="doc-tr document-tr head"><span>DOCUMENT</span><span>TYPE</span><span>ADDED</span><span>STATUS</span><span/></div>{docs.length?docs.map(d=><div className="doc-tr document-tr" key={d._id}><span><i><FileText/></i><b>{d.name||'Uploaded document'}</b></span><span>{d.type.replaceAll('_',' ')}</span><span>{new Date(d.createdAt).toLocaleDateString('en-IN')}</span><span><em className={d.status==='processing'?'protected':''}>{d.status==='verified'&&<Check/>}{d.status}</em></span><div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}><a className="icon-btn" href={d.url} target="_blank" rel="noreferrer" title="View Document"><Eye size={14}/></a><button className="icon-btn" style={{ color: '#ff453a' }} onClick={() => handleDelete(d._id)} title="Delete Document" disabled={deleteDoc.isPending}><Trash2 size={14}/></button></div></div>):<EmptyState text="No documents uploaded yet."/ >}</div></section>
  </motion.div>;
}

function Jobs() {
  const [applied,setApplied]=useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [applicantPhone, setApplicantPhone] = useState('');
  
  const queryClient=useQueryClient();
  const {data:jobs=[],isLoading,error}=useQuery({queryKey:['jobs'],queryFn:()=>apiFetch('/jobs')});
  const {data:profile}=useQuery({queryKey:['worker-profile'],queryFn:()=>apiFetch('/workers/me')});
  
  const apply=useMutation({
    mutationFn:id=>apiFetch(`/jobs/${id}/apply`,{method:'POST'}),
    onSuccess:(_result,id)=>{
      setApplied(list=>[...list,id]);
      queryClient.invalidateQueries({queryKey:['dashboard']});
      toast.success('Application logged on Shramik Lens portal');
      setSelectedJob(null);
    },
    onError:e=>toast.error(e.message)
  });

  useEffect(() => {
    if (selectedJob && profile) {
      const skillsList = (profile.skills || []).filter(s => s.verified).map(s => s.name).join(', ') || 'General Trade';
      const passportUrl = absoluteApiUrl(`/public/passport/${profile.publicId || ''}`);
      
      setCoverLetter(`Namaste,

I am writing to apply for the "${selectedJob.title}" position at "${selectedJob.employer?.name || 'your company'}". 

Here are my verified details from my Shramik Lens Passport:
- Candidate Name: ${profile.user?.name || 'Worker'}
- Occupation: ${profile.occupation || 'Artisan'}
- Experience: ${profile.experienceYears || 0} years
- Verified Core Skills: ${skillsList}
- Contact Number: ${profile.phone || 'Provided upon request'}
- Verified Livelihood Passport: ${passportUrl}

I look forward to discussing how my experience fits your requirements.

Thank you,
${profile.user?.name || 'Worker'}`);
      setApplicantPhone(profile.phone || '');
    }
  }, [selectedJob, profile]);

  const sendWhatsAppApplication = () => {
    if (!coverLetter || !selectedJob) return;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(coverLetter)}`;
    window.open(url, '_blank');
    apply.mutate(selectedJob._id); // Log the application to portal
  };

  const copyApplicationText = () => {
    if (!coverLetter) return;
    navigator.clipboard.writeText(coverLetter);
    toast.success('Application text copied to clipboard');
  };

  if(isLoading)return <LoadingState text="Matching jobs to your profile…"/>;
  if(error)return <ErrorState error={error}/>;
  
  return (
    <motion.div {...fade}>
      <PageTitle eyebrow="AI-RANKED OPPORTUNITIES" title={<>Work that fits <span>you.</span></>} text="Matched using your verified skills, experience, location and preferences." action={<button className="outline-btn"><SlidersIcon/> Match preferences</button>}/>
      
      <div className="filter-row">
        <button className="active">All matches <span>{jobs.length}</span></button>
        <button>Near me</button>
        <button>Full-time</button>
        <button>Contract</button>
        <div/>
        <select><option>Best match first</option><option>Highest pay</option></select>
      </div>

      <div className="jobs-page">
        {jobs.length ? jobs.map(job => (
          <motion.article className="card job-card" key={job._id} whileHover={{y:-3}}>
            <div className="job-card-top">
              <div className="company-logo large">{job.employer?.name?.[0]||job.title[0]}</div>
              <span className="match-pill"><Sparkles/>{job.matchScore||0}% match</span>
              <button className="icon-btn"><Star/></button>
            </div>
            <h3>{job.title}</h3>
            <p>{job.employer?.name||'Verified employer'} <BadgeCheck/></p>
            <div className="job-meta">
              <span><MapPin/>{job.location?.remote?'Remote':`${job.location?.city||''}, ${job.location?.state||''}`}</span>
              <span><IndianRupee/>{formatPay(job.pay)}</span>
              <span><CalendarDays/>{job.type}</span>
            </div>
            <div className="skill-tags">
              {job.skills?.slice(0,3).map(skill=><span key={skill}>{skill}</span>)}
            </div>
            <div className="why">
              <Zap/>
              <span><b>Why it fits:</b> Matches your declared experience ({profile?.experienceYears || 0} years) and ${profile?.occupation || 'trade'} occupation.</span>
            </div>
            <button 
              disabled={applied.includes(job._id)} 
              className="primary-btn full" 
              onClick={() => setSelectedJob(job)}
            >
              {applied.includes(job._id) ? <><Check/> Applied</> : <>View & apply <ArrowRight/></>}
            </button>
          </motion.article>
        )) : <EmptyState text="No open jobs are available yet."/>}
      </div>

      {/* External Portals Integration */}
      {profile && (
        <section className="card" style={{ padding: 20, marginTop: 24 }}>
          <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700 }}><BriefcaseBusiness size={18} style={{ color: 'var(--purple)', display: 'inline', marginRight: 8, verticalAlign: 'middle' }}/> Explore External Job Platforms</h3>
          <p style={{ fontSize: 9, color: 'var(--muted)', marginTop: 4 }}>Find more job postings in real-time on major platforms pre-filtered for your trade and location.</p>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 14 }}>
            <a className="outline-btn" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }} 
               href={`https://in.indeed.com/jobs?q=${encodeURIComponent(profile.occupation || 'Jobs')}&l=${encodeURIComponent(profile.location?.city || '')}`} 
               target="_blank" rel="noreferrer">
               Search Indeed &rarr;
            </a>
            <a className="outline-btn" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }} 
               href={`https://www.naukri.com/${encodeURIComponent((profile.occupation || '').toLowerCase())}-jobs-in-${encodeURIComponent((profile.location?.city || '').toLowerCase())}`} 
               target="_blank" rel="noreferrer">
               Search Naukri &rarr;
            </a>
            <a className="outline-btn" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }} 
               href={`https://www.apna.co/jobs?search=${encodeURIComponent(profile.occupation || '')}&location=${encodeURIComponent(profile.location?.city || '')}`} 
               target="_blank" rel="noreferrer">
               Search Apna &rarr;
            </a>
            <a className="outline-btn" style={{ textDecoration: 'none', color: 'inherit', display: 'inline-flex', alignItems: 'center' }} 
               href={`https://www.workindia.in/jobs-in-${encodeURIComponent((profile.location?.city || '').toLowerCase())}/`} 
               target="_blank" rel="noreferrer">
               Search WorkIndia &rarr;
            </a>
          </div>
        </section>
      )}

      {/* Application Popup Modal */}
      <AnimatePresence>
        {selectedJob && (
          <>
            <motion.div className="assistant-scrim" initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} onClick={() => setSelectedJob(null)}/>
            <motion.div
              initial={{ opacity:0, y:60 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:60 }}
              transition={{ type:'spring', damping:28 }}
              style={{
                position:'fixed', bottom:0, left:'50%', transform:'translateX(-50%)',
                width:'min(560px, 100vw)', background:'var(--card)', borderRadius:'20px 20px 0 0',
                padding:'28px 24px 32px', zIndex:1100, boxShadow:'0 -8px 40px rgba(0,0,0,0.35)',
                maxHeight: '85vh', overflowY: 'auto'
              }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16 }}>
                <div>
                  <small style={{ fontSize: 9, color: 'var(--muted)', letterSpacing: 0.5 }}>APPLYING FOR ROLE</small>
                  <b style={{ fontSize:15, display: 'block', marginTop: 2 }}>{selectedJob.title}</b>
                  <span style={{ fontSize: 11, color: 'var(--muted)' }}>{selectedJob.employer?.name || 'Verified Employer'}</span>
                </div>
                <button className="icon-btn" onClick={() => setSelectedJob(null)}><X size={18}/></button>
              </div>

              <div className="profile-form-grid" style={{ marginBottom: 20 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label className="profile-label">CANDIDATE NAME
                    <input className="profile-input" disabled value={profile?.user?.name || ''}/>
                  </label>
                  <label className="profile-label">CONTACT NUMBER
                    <input className="profile-input" type="tel" value={applicantPhone} onChange={e => setApplicantPhone(e.target.value)}/>
                  </label>
                </div>

                <label className="profile-label">AUTO-GENERATED COVER LETTER
                  <textarea 
                    className="profile-input" 
                    style={{ height: 160, padding: '10px 12px', resize: 'vertical', fontFamily: 'monospace', fontSize: 10, lineHeight: 1.4 }}
                    value={coverLetter}
                    onChange={e => setCoverLetter(e.target.value)}
                  />
                </label>
              </div>

              <div style={{ display: 'flex', gap: 10 }}>
                <button className="outline-btn" style={{ flex: 1 }} onClick={copyApplicationText}>Copy Application</button>
                <button className="primary-btn" style={{ flex: 1.5, background: '#25D366', color: 'white', border: 0 }} onClick={sendWhatsAppApplication}>
                  Send via WhatsApp
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
function SlidersIcon(){return <Target size={17}/>}

function Schemes() {
  const navigate = useNavigate();
  const {data:schemes=[],isLoading,error}=useQuery({queryKey:['schemes'],queryFn:()=>apiFetch('/schemes')});
  if(isLoading)return <LoadingState text="Checking government scheme eligibility…"/>;
  if(error)return <ErrorState error={error}/>;
  return <motion.div {...fade}><PageTitle eyebrow="BENEFITS & WELFARE" title={<>Schemes made <span>understandable.</span></>} text="Recommendations use your profile details. Always confirm eligibility on the official portal."/>
    <div className="scheme-banner"><div><Sparkles/></div><div><b>We found {schemes.length} schemes matching your current profile</b><p>Complete profile details to improve eligibility accuracy.</p></div><button className="white-btn" onClick={() => navigate('/profile')}>Improve profile <ArrowRight/></button></div>
    <div className="schemes-grid">{schemes.length?schemes.map((s,i)=><article className="card scheme-card" key={s._id}><div className="scheme-card-head"><div className={`scheme-icon ${['amber','green','blue'][i%3]}`}>{i===0?<HandCoins/>:<ShieldCheck/>}</div><span>{i===0?'Best match':'Eligible'}</span></div><h3>{s.name}</h3><p>{s.benefits}</p><div className="eligible"><Check/><div><b>{s.eligibilityStatus}</b><small>Based on your current profile</small></div></div><h5>What you'll need</h5><div className="chips small">{s.documentsRequired?.map(item=><span key={item}>{item}</span>)}</div><a className="outline-btn full" href={s.officialUrl} target="_blank" rel="noreferrer">View eligibility & apply <ArrowRight/></a></article>):<EmptyState text="No active scheme currently matches the completed profile fields."/>}</div>
  </motion.div>;
}
function Skills() {
  const {data:profile,isLoading,error}=useQuery({queryKey:['worker-profile'],queryFn:()=>apiFetch('/workers/me')});
  const ai=useQuery({queryKey:['skill-recommendations'],queryFn:()=>apiFetch('/ai/skill-recommendation',{method:'POST',body:JSON.stringify({request:'Recommend skills, certifications, career paths and expected salary improvement. Return JSON.'})}),staleTime:Infinity});
  if(isLoading)return <LoadingState text="Reviewing your verified skills…"/>;
  if(error)return <ErrorState error={error}/>;

  // Normalise the various shapes Gemini might return
  const raw = ai.data || {};
  const recommendations = (() => {
    // Collect all arrays of recommendations from any key variations
    const skills = Array.isArray(raw.recommended_skills) ? raw.recommended_skills : (Array.isArray(raw.skill_recommendations) ? raw.skill_recommendations : (Array.isArray(raw.skills) ? raw.skills : []));
    const certs  = Array.isArray(raw.recommended_certifications) ? raw.recommended_certifications : (Array.isArray(raw.certifications) ? raw.certifications : []);
    const paths  = Array.isArray(raw.career_paths) ? raw.career_paths : [];

    // If we have items from the structured keys, combine and map them
    if (skills.length > 0 || certs.length > 0 || paths.length > 0) {
      const skillsMapped = skills.map(r => ({ name: r?.skill_name || r?.name || '', desc: r?.relevance || r?.description || '' }));
      const certsMapped  = certs.map(r => ({ name: r?.certification_name || r?.name || '', desc: r?.benefits || r?.description || '' }));
      const pathsMapped  = paths.map(r => ({ name: r?.path_name || r?.name || '', desc: r?.growth_potential || r?.skills_needed || r?.description || '' }));
      return [...skillsMapped, ...certsMapped, ...pathsMapped];
    }

    // Fallback: raw itself is an array
    if (Array.isArray(raw)) {
      return raw.map(r => ({
        name: r?.name || r?.skill || r?.title || (typeof r === 'string' ? r : ''),
        desc: r?.certification || r?.careerPath || r?.expectedSalaryImprovement || r?.reason || r?.description || ''
      }));
    }

    // Fallback: raw.recommendations is an array
    if (Array.isArray(raw.recommendations)) {
      return raw.recommendations.map(r => ({
        name: r?.name || r?.skill || r?.title || (typeof r === 'string' ? r : ''),
        desc: r?.certification || r?.careerPath || r?.expectedSalaryImprovement || r?.reason || r?.description || ''
      }));
    }

    return [];
  })();

  return <motion.div {...fade}><PageTitle eyebrow="PERSONALISED GROWTH PATH" title={<>Skills that open <span>doors.</span></>} text="Practical recommendations based on your current work and nearby demand."/>
    <div className="skills-layout"><section className="card"><CardHead title="Your skills" sub={`${profile?.skills?.filter(s=>s.verified).length||0} verified · ${profile?.skills?.filter(s=>!s.verified).length||0} self-declared`}/>{profile?.skills?.length?profile.skills.map((skill,i)=><div className="skill-line" key={skill._id||skill.name}><span>{skill.verified&&<BadgeCheck/>}{skill.name}</span><div className="skill-bar"><i style={{width:`${[45,65,82,95][['beginner','proficient','advanced','expert'].indexOf(skill.level)]||65}%`}}/></div><b>{skill.level}</b></div>):<EmptyState text="Add skills to your worker profile." />}</section><section className="card"><CardHead title="Recommended next steps" sub="Generated from your current profile"/>{ai.isLoading?<EmptyState text="Generating recommendations…"/>:recommendations.length?recommendations.map((r,i)=><div className="recommend-row" key={r.name||i}><span>{i+1}</span><div><b>{r.name}</b><small>{r.desc}</small></div><ChevronRight/></div>):<EmptyState text={raw.message||'No AI recommendations available.'}/>}</section></div>
  </motion.div>;
}

// ─── PROFILE SETUP & EDIT PAGE CONSTANTS ────────────────────────────────────
const SKILLS_SUGGESTIONS = ['Tailoring','Embroidery','Carpentry','Plumbing','Electrical','Cooking','Driving','Welding','Masonry','Painting','Photography','Data Entry','Teaching','Nursing','Stitching'];
const LANGUAGES_OPTIONS = ['Hindi','English','Bengali','Telugu','Marathi','Tamil','Urdu','Gujarati','Kannada','Odia','Punjabi','Malayalam','Assamese','Maithili','Sanskrit'];
const EDUCATION_OPTIONS = ['','No Formal Education','Primary','Secondary','Higher Secondary','ITI','Diploma','Graduate','Postgraduate'];
const AVAILABILITY_OPTIONS = [{ value:'available', label:'Available' }, { value:'open', label:'Open to Work' }, { value:'unavailable', label:'Unavailable' }];
const GENDER_OPTIONS = [{ value:'', label:'Select Gender' }, { value:'female', label:'Female' }, { value:'male', label:'Male' }, { value:'non-binary', label:'Non-binary' }, { value:'prefer-not-to-say', label:'Prefer not to say' }];
const SKILL_LEVELS = ['beginner','proficient','advanced','expert'];
const UPI_REGEX = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9]+$/;
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;
const PHONE_REGEX = /^[6-9]\d{9}$/;

function CircularProgress({ pct }) {
  const r = 52; const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg className="circular-progress" viewBox="0 0 120 120">
      <circle className="bg" cx="60" cy="60" r={r}/>
      <circle className="fg" cx="60" cy="60" r={r} strokeDasharray={circ} strokeDashoffset={offset}/>
      <text x="60" y="65" textAnchor="middle" style={{ fill:'var(--text)', fontWeight:700, fontSize:18 }}>{pct}%</text>
    </svg>
  );
}

function ProfileLabel({ label, children, error }) {
  return (
    <label className="profile-label">
      {label}
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

function Profile() {
  const queryClient = useQueryClient();
  const session = loadSession();
  const { data: serverProfile, isLoading, error } = useQuery({
    queryKey: ['worker-profile'],
    queryFn: () => apiFetch('/workers/me'),
  });

  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [skillInput, setSkillInput] = useState('');
  const [skillLevel, setSkillLevel] = useState('proficient');
  const [showSkillSuggestions, setShowSkillSuggestions] = useState(false);
  const [empForm, setEmpForm] = useState({ employerName:'', title:'', startDate:'', endDate:'', currentlyWorking: false });
  const [showEmpForm, setShowEmpForm] = useState(false);
  const [refForm, setRefForm] = useState({ name:'', phone:'' });
  const [showRefForm, setShowRefForm] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);

  useEffect(() => {
    if (serverProfile && !form) {
      const p = serverProfile;
      setForm({
        phone: p.phone || '',
        gender: p.gender || '',
        dateOfBirth: p.dateOfBirth ? p.dateOfBirth.slice(0, 10) : '',
        photo: p.photo || '',
        location: { city: p.location?.city || '', district: p.location?.district || '', state: p.location?.state || '' },
        occupation: p.occupation || '',
        experienceYears: p.experienceYears ?? '',
        availability: p.availability || 'open',
        skills: p.skills || [],
        languages: p.languages || [],
        education: p.education || '',
        upiId: p.upiId || '',
        bank: { accountLast4: p.bank?.accountLast4 || '', ifsc: p.bank?.ifsc || '' },
        aadhaar: { last4: p.aadhaar?.last4 || '' },
        employmentHistory: (p.employmentHistory || []).map(e => ({
          ...e,
          startDate: e.startDate ? e.startDate.slice(0, 10) : '',
          endDate: e.endDate ? e.endDate.slice(0, 10) : '',
        })),
        references: p.references || [],
        expectedMonthlySalary: p.expectedMonthlySalary ?? 15000,
      });
    }
  }, [serverProfile, form]);

  useEffect(() => {
    window.hasUnsavedChanges = isDirty;
    return () => { window.hasUnsavedChanges = false; };
  }, [isDirty]);

  const set = (key, value) => {
    setForm(prev => ({ ...prev, [key]: value }));
    setIsDirty(true);
    setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const setNested = (key, subKey, value) => {
    setForm(prev => ({ ...prev, [key]: { ...prev[key], [subKey]: value } }));
    setIsDirty(true);
    setErrors(prev => ({ ...prev, [`${key}.${subKey}`]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (form.phone && !PHONE_REGEX.test(form.phone)) errs.phone = 'Enter a valid 10-digit mobile number';
    if (form.experienceYears !== '' && (isNaN(form.experienceYears) || form.experienceYears < 0 || form.experienceYears > 80)) errs.experienceYears = 'Must be between 0 and 80';
    if (form.upiId && !UPI_REGEX.test(form.upiId)) errs.upiId = 'Enter a valid UPI ID (e.g. name@bank)';
    if (form.bank.ifsc && !IFSC_REGEX.test(form.bank.ifsc.toUpperCase())) errs['bank.ifsc'] = 'Enter a valid IFSC code';
    if (form.bank.accountLast4 && !/^\d{4}$/.test(form.bank.accountLast4)) errs['bank.accountLast4'] = 'Enter last 4 digits only';
    if (form.aadhaar.last4 && !/^\d{4}$/.test(form.aadhaar.last4)) errs['aadhaar.last4'] = 'Enter last 4 digits of Aadhaar';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const saveMutation = useMutation({
    mutationFn: (body) => apiFetch('/workers/me', { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => {
      setIsDirty(false);
      window.hasUnsavedChanges = false;
      toast.success('Profile saved successfully');
      invalidateWorkerData(queryClient);
      queryClient.invalidateQueries({ queryKey: ['skill-recommendations'] });
    },
    onError: (err) => toast.error(err.message || 'Failed to save profile'),
  });

  const handleSave = () => {
    if (!validate()) return;
    saveMutation.mutate({
      ...form,
      bank: { accountLast4: form.bank.accountLast4, ifsc: form.bank.ifsc.toUpperCase() },
      experienceYears: form.experienceYears !== '' ? Number(form.experienceYears) : undefined,
    });
  };

  const handlePhotoUpload = async (file) => {
    if (!file) return;
    setPhotoUploading(true);
    try {
      const fd = new FormData();
      fd.append('document', file);
      fd.append('type', 'other');
      const result = await apiFetch('/documents', { method: 'POST', body: fd });
      set('photo', result.url);
      toast.success('Photo uploaded');
    } catch (e) {
      toast.error(e.message || 'Upload failed');
    } finally {
      setPhotoUploading(false);
    }
  };

  const addSkill = () => {
    const name = skillInput.trim();
    if (!name) return;
    if (form.skills.some(s => s.name.toLowerCase() === name.toLowerCase())) { toast.error('Skill already added'); return; }
    set('skills', [...form.skills, { name, level: skillLevel, verified: false }]);
    setSkillInput('');
    setShowSkillSuggestions(false);
  };

  const removeSkill = (idx) => set('skills', form.skills.filter((_, i) => i !== idx));

  const toggleLanguage = (lang) => {
    set('languages', form.languages.includes(lang)
      ? form.languages.filter(l => l !== lang)
      : [...form.languages, lang]);
  };

  const addEmployment = () => {
    if (!empForm.employerName || !empForm.title || !empForm.startDate) { toast.error('Employer name, title and start date required'); return; }
    set('employmentHistory', [...form.employmentHistory, { ...empForm, verified: false }]);
    setEmpForm({ employerName:'', title:'', startDate:'', endDate:'', currentlyWorking: false });
    setShowEmpForm(false);
  };

  const removeEmployment = (idx) => set('employmentHistory', form.employmentHistory.filter((_, i) => i !== idx));

  const addReference = () => {
    if (!refForm.name || !refForm.phone) { toast.error('Name and phone required'); return; }
    if (!PHONE_REGEX.test(refForm.phone)) { toast.error('Enter a valid 10-digit phone number'); return; }
    set('references', [...form.references, { ...refForm, verified: false }]);
    setRefForm({ name:'', phone:'' });
    setShowRefForm(false);
  };

  const removeReference = (idx) => set('references', form.references.filter((_, i) => i !== idx));

  const skillSuggestions = SKILLS_SUGGESTIONS.filter(s =>
    skillInput.length > 0 && s.toLowerCase().includes(skillInput.toLowerCase()) &&
    !form?.skills?.some(sk => sk.name.toLowerCase() === s.toLowerCase())
  );

  if (isLoading || !form) return <LoadingState text="Loading your profile…"/>;
  if (error) return <ErrorState error={error}/>;

  const completion = serverProfile?.profileCompletion ?? 0;

  return (
    <motion.div {...fade}>
      <PageTitle
        eyebrow="YOUR LIVELIHOOD IDENTITY"
        title={<>Edit your <span>profile.</span></>}
        text="Keep your details accurate to unlock better job matches, scheme eligibility and trust scores."
        action={
          <div style={{ display:'flex', gap:8 }}>
            <button className="outline-btn" onClick={() => { setForm(null); setIsDirty(false); }} disabled={saveMutation.isPending}>
              Discard
            </button>
            <button className="primary-btn" onClick={handleSave} disabled={!isDirty || saveMutation.isPending} id="profile-save-btn">
              {saveMutation.isPending ? <><Sparkles size={15}/> Saving…</> : <><Check size={15}/> Save changes</>}
            </button>
          </div>
        }
      />

      {isDirty && (
        <div className="unsaved-warning-banner">
          <Zap size={14}/> You have unsaved changes. Click <b>&nbsp;Save changes&nbsp;</b> to apply them.
        </div>
      )}

      <div className="profile-layout">
        <div className="profile-form-grid">

          {/* 1. Personal Information */}
          <section className="card profile-card">
            <h3><UserRound size={18}/> Personal Information</h3>
            <div className="profile-photo-wrapper">
              <div className="profile-avatar-large">
                {form.photo
                  ? <img src={form.photo} alt="Profile"/>
                  : <span style={{ fontSize:24, fontFamily:'Georgia', color:'#fff' }}>{initials(session?.user?.name || 'U')}</span>
                }
              </div>
              <div>
                <label htmlFor="photo-upload" style={{ display:'inline-flex', alignItems:'center', gap:6, cursor:'pointer' }} className="outline-btn">
                  {photoUploading ? <><Sparkles size={14}/> Uploading…</> : <><CloudUpload size={14}/> {form.photo ? 'Change photo' : 'Upload photo'}</>}
                </label>
                <input id="photo-upload" type="file" accept=".png,.jpg,.jpeg,.webp" style={{ display:'none' }}
                  onChange={e => handlePhotoUpload(e.target.files[0])} disabled={photoUploading}/>
                <p style={{ fontSize:9, color:'var(--muted)', marginTop:6 }}>PNG, JPG or WEBP · Max 10 MB</p>
              </div>
            </div>
            <div className="profile-fields-grid">
              <ProfileLabel label="FULL NAME">
                <input className="profile-input" value={session?.user?.name || ''} disabled title="Name is managed by your account"/>
              </ProfileLabel>
              <ProfileLabel label="PHONE NUMBER" error={errors.phone}>
                <input className="profile-input" type="tel" placeholder="9876543210" maxLength={10}
                  value={form.phone} onChange={e => set('phone', e.target.value)} id="profile-phone"/>
              </ProfileLabel>
              <ProfileLabel label="GENDER">
                <select className="profile-select" value={form.gender} onChange={e => set('gender', e.target.value)} id="profile-gender">
                  {GENDER_OPTIONS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                </select>
              </ProfileLabel>
              <ProfileLabel label="DATE OF BIRTH">
                <input className="profile-input" type="date" value={form.dateOfBirth}
                  onChange={e => set('dateOfBirth', e.target.value)} id="profile-dob"/>
              </ProfileLabel>
            </div>
          </section>

          {/* 2. Location */}
          <section className="card profile-card">
            <h3><MapPin size={18}/> Location</h3>
            <div className="profile-fields-grid">
              <ProfileLabel label="STATE">
                <select className="profile-select" value={form.location.state} onChange={e => setNested('location','state',e.target.value)} id="profile-state">
                  <option value="">Select state</option>
                  {INDIAN_STATES.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </ProfileLabel>
              <ProfileLabel label="DISTRICT">
                <input className="profile-input" placeholder="e.g. Jaipur" value={form.location.district}
                  onChange={e => setNested('location','district',e.target.value)} id="profile-district"/>
              </ProfileLabel>
              <ProfileLabel label="CITY">
                <input className="profile-input" placeholder="e.g. Jaipur" value={form.location.city}
                  onChange={e => setNested('location','city',e.target.value)} id="profile-city"/>
              </ProfileLabel>
            </div>
          </section>

          {/* 3. Occupation */}
          <section className="card profile-card">
            <h3><BriefcaseBusiness size={18}/> Occupation</h3>
            <div className="profile-fields-grid">
              <ProfileLabel label="OCCUPATION">
                <input className="profile-input" placeholder="e.g. Tailor, Carpenter" value={form.occupation}
                  onChange={e => set('occupation', e.target.value)} id="profile-occupation"/>
              </ProfileLabel>
              <ProfileLabel label="YEARS OF EXPERIENCE" error={errors.experienceYears}>
                <input className="profile-input" type="number" min={0} max={80} placeholder="e.g. 5"
                  value={form.experienceYears} onChange={e => set('experienceYears', e.target.value)} id="profile-experience"/>
              </ProfileLabel>
              <ProfileLabel label="AVAILABILITY STATUS">
                <select className="profile-select" value={form.availability} onChange={e => set('availability', e.target.value)} id="profile-availability">
                  {AVAILABILITY_OPTIONS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
              </ProfileLabel>
            </div>
          </section>

          {/* 4. Skills */}
          <section className="card profile-card">
            <h3><Zap size={18}/> Skills</h3>
            <div className="skills-input-group">
              <div style={{ flex:1, position:'relative' }}>
                <input className="profile-input" placeholder="Type a skill name…" value={skillInput}
                  onChange={e => { setSkillInput(e.target.value); setShowSkillSuggestions(true); }}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  onBlur={() => setTimeout(() => setShowSkillSuggestions(false), 150)}
                  id="skill-name-input"/>
                {showSkillSuggestions && skillSuggestions.length > 0 && (
                  <div className="autocomplete-dropdown">
                    {skillSuggestions.map(s => (
                      <div key={s} className="autocomplete-item" onMouseDown={() => { setSkillInput(s); setShowSkillSuggestions(false); }}>{s}</div>
                    ))}
                  </div>
                )}
              </div>
              <select className="profile-select" style={{ width:140, flex:'none' }}
                value={skillLevel} onChange={e => setSkillLevel(e.target.value)} id="skill-level-select">
                {SKILL_LEVELS.map(l => <option key={l} value={l}>{l.charAt(0).toUpperCase() + l.slice(1)}</option>)}
              </select>
              <button className="outline-btn" onClick={addSkill} style={{ whiteSpace:'nowrap' }} id="add-skill-btn">+ Add</button>
            </div>
            {form.skills.length > 0 ? (
              <div className="skills-list">
                {form.skills.map((skill, idx) => (
                  <div key={idx} className="skill-badge">
                    {skill.verified && <BadgeCheck size={13} style={{ color:'#0e8a67' }}/>}
                    <span>{skill.name}</span>
                    <em>{skill.level}</em>
                    {!skill.verified && <button onClick={() => removeSkill(idx)} aria-label={`Remove ${skill.name}`}><X size={12}/></button>}
                  </div>
                ))}
              </div>
            ) : <EmptyState text="Add your skills to improve job matching and scheme eligibility."/>}
          </section>

          {/* 5. Languages */}
          <section className="card profile-card">
            <h3><Languages size={18}/> Languages</h3>
            <div style={{ display:'flex', flexWrap:'wrap', gap:8, marginTop:8 }}>
              {LANGUAGES_OPTIONS.map(lang => {
                const selected = form.languages.includes(lang);
                return (
                  <button key={lang} onClick={() => toggleLanguage(lang)}
                    className={selected ? 'primary-btn' : 'outline-btn'}
                    style={{ height:32, fontSize:11, padding:'0 12px' }}
                    id={`lang-${lang.toLowerCase()}`}>
                    {lang}{selected && <Check size={12} style={{ marginLeft:4 }}/>}
                  </button>
                );
              })}
            </div>
          </section>

          {/* 6. Education */}
          <section className="card profile-card">
            <h3><BookOpen size={18}/> Education</h3>
            <div className="profile-fields-grid">
              <ProfileLabel label="HIGHEST EDUCATION">
                <select className="profile-select" value={form.education} onChange={e => set('education', e.target.value)} id="profile-education">
                  {EDUCATION_OPTIONS.map(e => <option key={e} value={e}>{e || 'Select education level'}</option>)}
                </select>
              </ProfileLabel>
            </div>
          </section>

          {/* 7. Financial Details */}
          <section className="card profile-card">
            <h3><WalletCards size={18}/> Financial Details</h3>
            <div className="profile-fields-grid">
              <ProfileLabel label="UPI ID" error={errors.upiId}>
                <input className="profile-input" placeholder="name@upi" value={form.upiId}
                  onChange={e => set('upiId', e.target.value)} id="profile-upi"/>
              </ProfileLabel>
              <ProfileLabel label="BANK ACCOUNT (LAST 4 DIGITS)" error={errors['bank.accountLast4']}>
                <input className="profile-input" placeholder="1234" maxLength={4} value={form.bank.accountLast4}
                  onChange={e => setNested('bank','accountLast4', e.target.value)} id="profile-bank-last4"/>
              </ProfileLabel>
              <ProfileLabel label="IFSC CODE" error={errors['bank.ifsc']}>
                <input className="profile-input" placeholder="SBIN0001234" value={form.bank.ifsc}
                  onChange={e => setNested('bank','ifsc', e.target.value.toUpperCase())} id="profile-ifsc"/>
              </ProfileLabel>
            </div>
            <p style={{ fontSize:9, color:'var(--muted)', marginTop:12, display:'flex', alignItems:'center', gap:4 }}>
              <LockKeyhole size={11}/> Your financial details are encrypted and never shared publicly.
            </p>
          </section>

          {/* 8. Identity */}
          <section className="card profile-card">
            <h3><ShieldCheck size={18}/> Identity</h3>
            <div className="profile-fields-grid">
              <ProfileLabel label="AADHAAR (LAST 4 DIGITS)" error={errors['aadhaar.last4']}>
                <div style={{ position:'relative' }}>
                  <input className="profile-input" placeholder="1234" maxLength={4} value={form.aadhaar.last4}
                    onChange={e => setNested('aadhaar','last4',e.target.value)} id="profile-aadhaar"
                    style={{ paddingRight: serverProfile?.aadhaar?.verified ? 36 : 12 }}/>
                  {serverProfile?.aadhaar?.verified && (
                    <BadgeCheck size={16} style={{ position:'absolute', right:10, top:'50%', transform:'translateY(-50%)', color:'#0e8a67' }}/>
                  )}
                </div>
              </ProfileLabel>
            </div>
            <p style={{ fontSize:9, color:'var(--muted)', marginTop:12, display:'flex', alignItems:'center', gap:4 }}>
              <LockKeyhole size={11}/> Aadhaar is stored securely and never displayed publicly.
            </p>
          </section>

          {/* 9. Employment History */}
          <section className="card profile-card">
            <h3><Building2 size={18}/> Employment History</h3>
            {showEmpForm && (
              <div className="dynamic-list-add-section">
                <div className="dynamic-list-add-grid">
                  <ProfileLabel label="EMPLOYER NAME">
                    <input className="profile-input" placeholder="Company / Employer" value={empForm.employerName}
                      onChange={e => setEmpForm(f => ({ ...f, employerName: e.target.value }))} id="emp-employer"/>
                  </ProfileLabel>
                  <ProfileLabel label="JOB TITLE">
                    <input className="profile-input" placeholder="e.g. Senior Tailor" value={empForm.title}
                      onChange={e => setEmpForm(f => ({ ...f, title: e.target.value }))} id="emp-title"/>
                  </ProfileLabel>
                  <ProfileLabel label="START DATE">
                    <input className="profile-input" type="date" value={empForm.startDate}
                      onChange={e => setEmpForm(f => ({ ...f, startDate: e.target.value }))} id="emp-start"/>
                  </ProfileLabel>
                  <ProfileLabel label="END DATE">
                    <input className="profile-input" type="date" value={empForm.endDate}
                      onChange={e => setEmpForm(f => ({ ...f, endDate: e.target.value }))}
                      disabled={empForm.currentlyWorking} id="emp-end"/>
                  </ProfileLabel>
                </div>
                <label style={{ display:'flex', alignItems:'center', gap:8, fontSize:11, marginBottom:12, cursor:'pointer' }}>
                  <input type="checkbox" checked={empForm.currentlyWorking}
                    onChange={e => setEmpForm(f => ({ ...f, currentlyWorking: e.target.checked, endDate: '' }))}/>
                  Currently working here
                </label>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="primary-btn" onClick={addEmployment} id="add-emp-btn">Add</button>
                  <button className="outline-btn" onClick={() => setShowEmpForm(false)}>Cancel</button>
                </div>
              </div>
            )}
            {!showEmpForm && (
              <button className="outline-btn" style={{ marginBottom:12 }} onClick={() => setShowEmpForm(true)} id="open-emp-form-btn">
                + Add employment
              </button>
            )}
            {form.employmentHistory.length > 0 ? (
              <div className="dynamic-list-container">
                {form.employmentHistory.map((emp, idx) => (
                  <div key={idx} className="dynamic-list-row">
                    <div className="dynamic-list-row-info">
                      <b>{emp.title} · {emp.employerName}</b>
                      <small>{emp.startDate} — {emp.currentlyWorking ? 'Present' : emp.endDate || '—'}</small>
                      {emp.verified && <span style={{ color:'#0e8a67', fontSize:10, display:'flex', alignItems:'center', gap:4 }}><BadgeCheck size={12}/> Verified</span>}
                    </div>
                    <div className="dynamic-list-actions">
                      {!emp.verified && <button className="icon-btn" onClick={() => removeEmployment(idx)} aria-label="Remove"><X size={15}/></button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState text="No employment history added. Add previous or current employers."/>}
          </section>

          {/* 10. References */}
          <section className="card profile-card">
            <h3><UsersRound size={18}/> References</h3>
            {showRefForm && (
              <div className="dynamic-list-add-section">
                <div className="dynamic-list-add-grid">
                  <ProfileLabel label="REFERENCE NAME">
                    <input className="profile-input" placeholder="Full name" value={refForm.name}
                      onChange={e => setRefForm(f => ({ ...f, name: e.target.value }))} id="ref-name"/>
                  </ProfileLabel>
                  <ProfileLabel label="PHONE NUMBER">
                    <input className="profile-input" type="tel" placeholder="9876543210" maxLength={10}
                      value={refForm.phone} onChange={e => setRefForm(f => ({ ...f, phone: e.target.value }))} id="ref-phone"/>
                  </ProfileLabel>
                </div>
                <div style={{ display:'flex', gap:8 }}>
                  <button className="primary-btn" onClick={addReference} id="add-ref-btn">Add</button>
                  <button className="outline-btn" onClick={() => setShowRefForm(false)}>Cancel</button>
                </div>
              </div>
            )}
            {!showRefForm && (
              <button className="outline-btn" style={{ marginBottom:12 }} onClick={() => setShowRefForm(true)} id="open-ref-form-btn">
                + Add reference
              </button>
            )}
            {form.references.length > 0 ? (
              <div className="dynamic-list-container">
                {form.references.map((ref, idx) => (
                  <div key={idx} className="dynamic-list-row">
                    <div className="dynamic-list-row-info">
                      <b>{ref.name}</b>
                      <small>{ref.phone}</small>
                      {ref.verified && <span style={{ color:'#0e8a67', fontSize:10, display:'flex', alignItems:'center', gap:4 }}><BadgeCheck size={12}/> Verified</span>}
                    </div>
                    <div className="dynamic-list-actions">
                      {!ref.verified && <button className="icon-btn" onClick={() => removeReference(idx)} aria-label="Remove"><X size={15}/></button>}
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState text="Add references who can vouch for your work."/>}
          </section>

          {/* 11. Expected Monthly Salary */}
          <section className="card profile-card">
            <h3><IndianRupee size={18}/> Expected Monthly Salary</h3>
            <div className="salary-slider-wrapper">
              <div className="salary-slider-header">
                <span style={{ fontSize:11, color:'var(--muted)' }}>Slide to set your expected salary</span>
                <strong>₹{Number(form.expectedMonthlySalary).toLocaleString('en-IN')}/month</strong>
              </div>
              <input className="salary-slider" type="range" min={3000} max={150000} step={1000}
                value={form.expectedMonthlySalary}
                onChange={e => set('expectedMonthlySalary', Number(e.target.value))}
                id="profile-salary-slider"/>
              <div style={{ display:'flex', justifyContent:'space-between', fontSize:9, color:'var(--muted)' }}>
                <span>₹3,000</span><span>₹75,000</span><span>₹1,50,000</span>
              </div>
            </div>
          </section>
        </div>

        {/* Right: Sticky completion widget */}
        <div>
          <div className="card profile-completion-card">
            <h4>Profile Completion</h4>
            <CircularProgress pct={completion}/>
            <div className="progress" style={{ width:'100%' }}>
              <i style={{ width:`${completion}%` }}/>
            </div>
            <p style={{ marginBottom:16 }}>
              {completion < 100
                ? `${100 - completion}% left. A stronger profile unlocks better opportunities.`
                : 'Your profile is 100% complete!'}
            </p>
            <div className="save-actions-panel">
              <button className="primary-btn full" onClick={handleSave}
                disabled={!isDirty || saveMutation.isPending} id="profile-save-sidebar-btn">
                {saveMutation.isPending ? <><Sparkles size={14}/> Saving…</> : <><Check size={14}/> Save changes</>}
              </button>
              {isDirty && (
                <button className="outline-btn full" onClick={() => { setForm(null); setIsDirty(false); }}>
                  Discard changes
                </button>
              )}
            </div>
            <div style={{ marginTop:20, width:'100%', textAlign:'left' }}>
              <p style={{ fontSize:9, fontWeight:700, color:'var(--muted)', letterSpacing:'1px', marginBottom:8 }}>QUICK TIPS</p>
              {[
                { done: !!form.occupation, label: 'Add your occupation' },
                { done: form.skills.length > 0, label: 'Add at least one skill' },
                { done: !!form.location.city && !!form.location.state, label: 'Set your location' },
                { done: !!form.education, label: 'Add education' },
                { done: !!form.bank.accountLast4 && !!form.bank.ifsc, label: 'Add bank details' },
                { done: form.languages.length > 0, label: 'Add a language' },
              ].map(tip => (
                <div key={tip.label} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 0', borderTop:'1px solid var(--line)', fontSize:10, color: tip.done ? 'var(--muted)' : 'var(--text)' }}>
                  {tip.done
                    ? <BadgeCheck size={13} style={{ color:'#0e8a67', flexShrink:0 }}/>
                    : <div style={{ width:13, height:13, borderRadius:'50%', border:'2px solid var(--line)', flexShrink:0 }}/>
                  }
                  <span style={{ textDecoration: tip.done ? 'line-through' : 'none', opacity: tip.done ? 0.5 : 1 }}>{tip.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── ASSISTANT ──────────────────────────────────────────────────────────────
function Assistant({ open, close }) {
  const WELCOME = 'Namaste! I\'m Lens AI. I can explain your income trends, check scheme eligibility, recommend skills, or help with job applications. What would you like to know?';
  const [messages, setMessages] = useState([{ ai: true, text: WELCOME }]);
  const [value, setValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [speakingIdx, setSpeakingIdx] = useState(null);
  const [language, setLanguage] = useState('hinglish');
  
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll to bottom whenever messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Focus input when panel opens
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300);
  }, [open]);

  // Clean up speech synthesis on close
  useEffect(() => {
    if (!open) {
      window.speechSynthesis?.cancel();
      setSpeakingIdx(null);
      if (recognitionRef.current) {
        recognitionRef.current.abort();
        setRecording(false);
      }
    }
  }, [open]);

  const sendMessage = async (q) => {
    if (!q || loading) return;
    setValue('');
    setMessages(m => [...m, { ai: false, text: q }]);
    setLoading(true);
    try {
      const res = await apiFetch('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ request: q, language }),
      });
      const text =
        res?.answer ||
        res?.message ||
        res?.response ||
        res?.text ||
        (typeof res === 'string' ? res : JSON.stringify(res, null, 2));
      setMessages(m => [...m, { ai: true, text }]);
    } catch (err) {
      setMessages(m => [...m, { ai: true, text: `Sorry, I ran into an error: ${err.message}`, error: true }]);
    } finally {
      setLoading(false);
    }
  };

  const send = () => sendMessage(value.trim());
  const quickSend = q => sendMessage(q);

  // Speech to Text (Speech Recognition)
  const toggleSpeech = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error('Voice input is not supported in this browser. Please try Chrome/Edge.');
      return;
    }

    if (recording) {
      recognitionRef.current?.stop();
      setRecording(false);
    } else {
      const rec = new SpeechRecognition();
      if (language === 'hindi') {
        rec.lang = 'hi-IN';
      } else if (language === 'hinglish') {
        rec.lang = 'hi-IN';
      } else {
        rec.lang = 'en-IN';
      }
      rec.continuous = false;
      rec.interimResults = false;

      rec.onstart = () => {
        setRecording(true);
        toast.info(`Listening… Speak now in ${language}.`);
      };

      rec.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setValue(transcript);
        toast.success('Speech captured!');
      };

      rec.onerror = (event) => {
        console.error('Speech recognition error:', event.error);
        if (event.error !== 'no-speech') {
          toast.error(`Voice input error: ${event.error}`);
        }
        setRecording(false);
      };

      rec.onend = () => {
        setRecording(false);
      };

      recognitionRef.current = rec;
      rec.start();
    }
  };

  // Text to Speech (Audio read aloud)
  const speakMessage = (text, index) => {
    if (!window.speechSynthesis) {
      toast.error('Audio playback is not supported in your browser.');
      return;
    }

    if (speakingIdx === index) {
      window.speechSynthesis.cancel();
      setSpeakingIdx(null);
    } else {
      window.speechSynthesis.cancel(); // Stop current speech
      const utterance = new SpeechSynthesisUtterance(text);
      
      const voices = window.speechSynthesis.getVoices();
      let selectedVoice = null;
      if (language === 'hindi' || language === 'hinglish') {
        selectedVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      } else {
        selectedVoice = voices.find(v => v.lang.includes('en'));
      }
      if (selectedVoice) utterance.voice = selectedVoice;

      utterance.onend = () => setSpeakingIdx(null);
      utterance.onerror = () => setSpeakingIdx(null);

      setSpeakingIdx(index);
      window.speechSynthesis.speak(utterance);
    }
  };

  const QUICK_PROMPTS = [
    'Which schemes am I eligible for?',
    'Explain my income trend',
    'What skills should I learn next?',
    'How can I improve my Trust Score?',
  ];

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div className="assistant-scrim" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={close}/>
          <motion.aside
            className="assistant"
            initial={{ x: 420 }} animate={{ x: 0 }} exit={{ x: 420 }}
            transition={{ type: 'spring', damping: 28 }}
          >
            {/* Header */}
            <div className="assistant-head">
              <div>
                <span><Sparkles/></span>
                <div>
                  <b>Lens AI</b>
                  <small><i style={{ display:'inline-block', width:7, height:7, borderRadius:'50%', background: loading ? '#f5a623' : '#0e8a67', marginRight:4 }}/>{loading ? 'Thinking…' : 'Ready to help'}</small>
                </div>
              </div>
              <button className="icon-btn" onClick={close}><X/></button>
            </div>

            {/* Language Selector pills */}
            <div style={{ display: 'flex', gap: 6, padding: '10px 18px', borderBottom: '1px solid var(--line)', background: 'var(--card2)', flexShrink: 0 }}>
              <span style={{ fontSize: 9, color: 'var(--muted)', margin: 'auto 6px auto 0', fontWeight: 700 }}>LANGUAGE:</span>
              {['english', 'hindi', 'hinglish'].map(l => (
                <button 
                  key={l}
                  onClick={() => setLanguage(l)}
                  style={{
                    border: '1px solid var(--line)',
                    background: language === l ? 'var(--purple)' : 'var(--card)',
                    color: language === l ? 'white' : 'var(--text)',
                    borderRadius: 12,
                    padding: '4px 10px',
                    fontSize: 8,
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Messages */}
            <div className="messages">
              {messages.map((m, i) => (
                <div className={m.ai ? 'ai-message' : 'my-message'} key={i}>
                  {m.ai && <span><Sparkles/></span>}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <p style={{ whiteSpace: 'pre-wrap', color: m.error ? '#e05' : undefined }}>{m.text}</p>
                    {m.ai && !m.error && (
                      <button 
                        className={`speech-btn ${speakingIdx === i ? 'active' : ''}`} 
                        onClick={() => speakMessage(m.text, i)} 
                        title={speakingIdx === i ? 'Stop Reading' : 'Read Aloud'}
                        style={{ alignSelf: 'flex-start' }}
                      >
                        {speakingIdx === i ? <VolumeX size={12}/> : <Volume2 size={12}/>}
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing indicator */}
              {loading && (
                <div className="ai-message">
                  <span><Sparkles/></span>
                  <p style={{ display:'flex', gap:4, alignItems:'center' }}>
                    <span className="typing-dot"/>
                    <span className="typing-dot"/>
                    <span className="typing-dot"/>
                  </p>
                </div>
              )}
              <div ref={bottomRef}/>
            </div>

            {/* Quick prompts */}
            <div className="quick-prompts">
              {QUICK_PROMPTS.map(q => (
                <button key={q} onClick={() => quickSend(q)} disabled={loading}>{q}</button>
              ))}
            </div>

            {/* Input */}
            <div className="assistant-input">
              <button 
                className={`speech-btn ${recording ? 'active' : ''}`}
                onClick={toggleSpeech}
                title={recording ? 'Stop Listening' : 'Speak Message'}
                disabled={loading}
                style={{ flexShrink: 0, margin: 'auto 6px', width: 28, height: 28 }}
              >
                <Mic size={14}/>
              </button>
              <input
                ref={inputRef}
                value={value}
                onChange={e => setValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                placeholder="Ask in English or Hindi…"
                disabled={loading}
              />
              <button onClick={send} disabled={loading || !value.trim()}>
                {loading ? <Sparkles size={16}/> : <ArrowRight/>}
              </button>
            </div>
            <small className="ai-note">Lens AI uses your profile data. Verify important information.</small>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── RIGHTS & SAFETY PAGE ───────────────────────────────────────────────────
function Rights() {
  const [state, setState] = useState('Rajasthan');
  const [occupation, setOccupation] = useState('Tailoring');
  const [wage, setWage] = useState('');
  const [unit, setUnit] = useState('day');
  
  // Wage Check State
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState(null);

  // Dispute Letter Form State
  const [disputeForm, setDisputeForm] = useState({
    employerName: '',
    startDate: '',
    endDate: '',
    currentlyWorking: false,
    unpaidAmount: '',
    description: '',
    employerPhone: '',
    language: 'en'
  });
  const [drafting, setDrafting] = useState(false);
  const [draftedLetter, setDraftedLetter] = useState('');

  const runWageCheck = async (e) => {
    e?.preventDefault();
    if (!wage) return toast.error('Please enter your wage');
    setChecking(true);
    try {
      const res = await apiFetch(`/rights/wage-check?state=${encodeURIComponent(state)}&occupation=${encodeURIComponent(occupation)}&wage=${wage}&unit=${unit}`);
      setCheckResult(res);
      if (res.isUnderpaid) {
        toast.warning('Your pay appears to be below the legal minimum wage.', { duration: 6000 });
      } else {
        toast.success('Your pay meets the legal minimum wage requirements!');
      }
    } catch (err) {
      toast.error(err.message);
    } finally {
      setChecking(false);
    }
  };

  const handleDraftDispute = async (e) => {
    e?.preventDefault();
    if (!disputeForm.employerName || !disputeForm.unpaidAmount || !disputeForm.startDate) {
      return toast.error('Employer name, start date, and unpaid amount are required');
    }
    setDrafting(true);
    try {
      const res = await apiFetch('/rights/dispute-letter', {
        method: 'POST',
        body: JSON.stringify({
          employerName: disputeForm.employerName,
          startDate: disputeForm.startDate,
          endDate: disputeForm.currentlyWorking ? 'Present' : disputeForm.endDate,
          unpaidAmount: Number(disputeForm.unpaidAmount),
          description: disputeForm.description,
          language: disputeForm.language
        })
      });
      setDraftedLetter(res.letter);
      toast.success('AI dispute notice drafted successfully!');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDrafting(false);
    }
  };

  const copyToClipboard = () => {
    if (!draftedLetter) return;
    navigator.clipboard.writeText(draftedLetter);
    toast.success('Message copied to clipboard');
  };

  const sendWhatsApp = () => {
    if (!draftedLetter) return;
    const phone = disputeForm.employerPhone ? disputeForm.employerPhone.replace(/\D/g, '') : '';
    const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
    const url = `https://api.whatsapp.com/send?${cleanPhone ? `phone=${cleanPhone}&` : ''}text=${encodeURIComponent(draftedLetter)}`;
    window.open(url, '_blank');
  };

  // Pre-populate dispute writer if underpaid
  const prefillDispute = () => {
    if (!checkResult) return;
    const missingDays = unit === 'month' ? 26 : 1;
    const estimatedUnpaid = checkResult.isUnderpaid 
      ? (checkResult.minimumDailyWage - checkResult.userWageNormalizedDaily) * missingDays
      : 0;

    setDisputeForm(f => ({
      ...f,
      unpaidAmount: estimatedUnpaid > 0 ? String(Math.round(estimatedUnpaid)) : '',
      description: `Dispute regarding underpayment of wages. The paid rate is below the state minimum wage of ₹${checkResult.minimumDailyWage}/day for ${occupation} in ${state}.`
    }));

    // Scroll to the dispute section
    const el = document.getElementById('dispute-section');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <motion.div {...fade}>
      <PageTitle
        eyebrow="LEGAL SAFEGUARDS & SAFETY NET"
        title={<>Your work, <span>protected.</span></>}
        text="Tools designed to safeguard your wages, resolve disputes with AI support, and connect you to social security."
      />

      <div className="rights-layout">
        {/* Left Side: Wage Calculator & Check */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <section className="card profile-card">
            <h3><ShieldCheck size={18}/> Minimum Wage Checker</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
              Compare your earnings with the legally mandated minimum wage thresholds set by state governments.
            </p>

            <form onSubmit={runWageCheck} className="profile-form-grid">
              <div className="profile-fields-grid">
                <label className="profile-label">STATE
                  <select className="profile-select" value={state} onChange={e => setState(e.target.value)}>
                    {['Rajasthan','Delhi','Maharashtra','Karnataka','Uttar Pradesh','Tamil Nadu','West Bengal'].map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </label>

                <label className="profile-label">TRADE / OCCUPATION
                  <select className="profile-select" value={occupation} onChange={e => setOccupation(e.target.value)}>
                    {SKILLS_SUGGESTIONS.map(occ => (
                      <option key={occ} value={occ}>{occ}</option>
                    ))}
                  </select>
                </label>

                <label className="profile-label">YOUR PAY (₹)
                  <input className="profile-input" type="number" placeholder="e.g. 500" required value={wage} onChange={e => setWage(e.target.value)}/>
                </label>

                <label className="profile-label">PAY UNIT
                  <select className="profile-select" value={unit} onChange={e => setUnit(e.target.value)}>
                    <option value="hour">Per Hour</option>
                    <option value="day">Per Day (8 hrs)</option>
                    <option value="month">Per Month</option>
                  </select>
                </label>
              </div>

              <button className="primary-btn" disabled={checking} style={{ marginTop: 10 }}>
                {checking ? 'Checking standards…' : 'Check legal wage'}
              </button>
            </form>

            {/* Results Output */}
            {checkResult && (
              <div className="rights-gauge-container">
                <div className="gauge-visual">
                  <div className="gauge-arc"/>
                  <div 
                    className="gauge-fill" 
                    style={{ 
                      transform: `rotate(${Math.min(180, Math.max(0, (checkResult.userWageNormalizedDaily / checkResult.minimumDailyWage) * 180 - 90))}deg)`,
                      borderColor: checkResult.isUnderpaid ? '#ff453a' : 'var(--green)'
                    }}
                  />
                  <div className="gauge-text" style={{ color: checkResult.isUnderpaid ? '#ff453a' : 'var(--green)' }}>
                    {Math.round((checkResult.userWageNormalizedDaily / checkResult.minimumDailyWage) * 100)}%
                  </div>
                </div>

                <b style={{ color: checkResult.isUnderpaid ? '#ff453a' : 'var(--green)', fontSize: 14 }}>
                  {checkResult.isUnderpaid ? 'Underpaid Rate' : 'Fair Pay Standard'}
                </b>
                <p style={{ fontSize: 11, color: 'var(--muted)', margin: '6px 0 12px' }}>
                  Your estimated daily equivalent is <b>₹{checkResult.userWageNormalizedDaily}/day</b> vs. the state mandate of <b>₹{checkResult.minimumDailyWage}/day</b> ({checkResult.skillCategory} level).
                </p>

                {checkResult.isUnderpaid ? (
                  <div className="alert-box danger" style={{ width: '100%' }}>
                    <CircleHelp size={16}/>
                    <div style={{ textAlign: 'left' }}>
                      <b>Underpayment Flagged!</b>
                      <p style={{ margin: '3px 0 0', fontSize: 10 }}>
                        Your pay is below the statutory threshold by {Math.abs(checkResult.percentageDifference)}%. You can generate a dispute notice to ask for your correct wage.
                      </p>
                      <button className="outline-btn" style={{ height: 26, fontSize: 9, marginTop: 8, background: 'var(--card)' }} onClick={prefillDispute}>
                        Use AI Dispute Assistant
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="alert-box success" style={{ width: '100%' }}>
                    <Check size={16}/>
                    <div style={{ textAlign: 'left' }}>
                      <b>Wage Standards Met!</b>
                      <p style={{ margin: '3px 0 0', fontSize: 10 }}>
                        Your rate complies with state labor mandates. Save this record as part of your Livelihood Credit Profile.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Social Welfare Checklist */}
          <section className="card profile-card">
            <h3><BookOpen size={18}/> Social Security Safety Net</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
              Key government registrations and welfare benefits available to unorganized workers in India.
            </p>

            <div className="checklist-card">
              <div className="checklist-item">
                <Check size={16}/>
                <div>
                  <b>e-Shram National Card</b>
                  <p style={{ margin: '3px 0 0', color: 'var(--muted)' }}>Provides a universal unorganized worker ID, linked to Rs. 2 lakh accidental insurance. Free registration.</p>
                  <a href="https://eshram.gov.in/" target="_blank" rel="noreferrer" style={{ display: 'inline-block', marginTop: 4, color: 'var(--purple)', fontWeight: 700, fontSize: 9 }}>Official Registration Portal &rarr;</a>
                </div>
              </div>

              <div className="checklist-item">
                <Check size={16}/>
                <div>
                  <b>BOCW Welfare Board (Construction/Masonry/Painting)</b>
                  <p style={{ margin: '3px 0 0', color: 'var(--muted)' }}>Unlocks maternity assistance, education scholarships for children, tool-buying grants, and medical aid.</p>
                  <span style={{ fontSize: 9, color: 'var(--muted)', display: 'block', marginTop: 4 }}>Requires 90 days of construction work in the last year verified by employer or union.</span>
                </div>
              </div>

              <div className="checklist-item">
                <Check size={16}/>
                <div>
                  <b>PMSBY accidental insurance (₹20/year)</b>
                  <p style={{ margin: '3px 0 0', color: 'var(--muted)' }}>Linked directly to your bank account. High-priority benefit for heavy trade workers (carpentry, electrical, driving).</p>
                </div>
              </div>
            </div>
          </section>
        </div>

        {/* Right Side: AI Wage Dispute Notice Generator */}
        <div className="rights-side-panel" id="dispute-section">
          <section className="card profile-card">
            <h3><Sparkles size={18}/> AI Wage Dispute Assistant</h3>
            <p style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 16 }}>
              Struggling to collect your unpaid wages? Draft a formal, respectful, and legally sound payment request letter using AI.
            </p>

            <form onSubmit={handleDraftDispute} className="profile-form-grid">
              <div className="profile-fields-grid" style={{ gridTemplateColumns: '1fr' }}>
                <label className="profile-label">EMPLOYER NAME
                  <input className="profile-input" placeholder="e.g. Contractor Suresh Kumar" required value={disputeForm.employerName} onChange={e => setDisputeForm(f => ({ ...f, employerName: e.target.value }))}/>
                </label>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label className="profile-label">START DATE OF WORK
                    <input className="profile-input" type="date" required value={disputeForm.startDate} onChange={e => setDisputeForm(f => ({ ...f, startDate: e.target.value }))}/>
                  </label>

                  <label className="profile-label">END DATE
                    <input className="profile-input" type="date" disabled={disputeForm.currentlyWorking} value={disputeForm.currentlyWorking ? '' : disputeForm.endDate} onChange={e => setDisputeForm(f => ({ ...f, endDate: e.target.value }))}/>
                    <label style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4, cursor: 'pointer', fontSize: 9 }}>
                      <input type="checkbox" checked={disputeForm.currentlyWorking} onChange={e => setDisputeForm(f => ({ ...f, currentlyWorking: e.target.checked }))}/>
                      Still working here
                    </label>
                  </label>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <label className="profile-label">UNPAID AMOUNT (₹)
                    <input className="profile-input" type="number" placeholder="e.g. 8500" required value={disputeForm.unpaidAmount} onChange={e => setDisputeForm(f => ({ ...f, unpaidAmount: e.target.value }))}/>
                  </label>

                  <label className="profile-label">EMPLOYER PHONE (OPTIONAL)
                    <input className="profile-input" type="tel" placeholder="e.g. 9876543210" maxLength={10} value={disputeForm.employerPhone} onChange={e => setDisputeForm(f => ({ ...f, employerPhone: e.target.value }))}/>
                  </label>
                </div>

                <label className="profile-label">LANGUAGE FOR MESSAGE
                  <select className="profile-select" value={disputeForm.language} onChange={e => setDisputeForm(f => ({ ...f, language: e.target.value }))}>
                    <option value="en">English (Professional Notice)</option>
                    <option value="hi">Hindi / हिंदी (Devanagari Notice)</option>
                  </select>
                </label>

                <label className="profile-label">WORK DETAILS & NOTES
                  <textarea 
                    className="profile-input" 
                    style={{ height: 80, padding: '10px 12px', resize: 'vertical' }}
                    placeholder="Describe what work you performed, why wages were withheld, or payment agreements made..."
                    value={disputeForm.description}
                    onChange={e => setDisputeForm(f => ({ ...f, description: e.target.value }))}
                  />
                </label>
              </div>

              <button className="primary-btn full" disabled={drafting} style={{ marginTop: 8 }}>
                {drafting ? <><Sparkles size={14}/> Drafting notice…</> : <><Sparkles size={14}/> Draft dispute notice</>}
              </button>
            </form>

            {/* Generated Output */}
            {draftedLetter && (
              <div className="dispute-letter-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '14px 0 6px' }}>
                  <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--muted)' }}>AI-GENERATED DRAFT</span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button className="outline-btn" style={{ height: 26, fontSize: 9 }} onClick={copyToClipboard}>
                      Copy Text
                    </button>
                    <button className="primary-btn" style={{ height: 26, fontSize: 9, background: '#25D366', color: 'white', border: 0 }} onClick={sendWhatsApp}>
                      Send via WhatsApp
                    </button>
                  </div>
                </div>

                <div className="whatsapp-bubble">
                  {draftedLetter}
                </div>
                
                <small style={{ fontSize: 8, color: 'var(--muted)', display: 'block', textAlign: 'center' }}>
                  Verify that bank details and dates are accurate before sending to your employer.
                </small>
              </div>
            )}
          </section>
        </div>
      </div>
    </motion.div>
  );
}

export default App;
