
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Exam, Question } from '../types';
import { MONTHS } from '../constants';
import { 
  Plus, LayoutDashboard, FileText, Users, ExternalLink, Settings, 
  Clock, CheckCircle, AlertCircle, Play, LogOut, UploadCloud, 
  ChevronRight, BarChart3, ShieldCheck, Copy, FileUp, Save, Eye,
  Share2, Download, FileJson, X, Bell, Wand2, Power, Loader2, RotateCcw
} from 'lucide-react';
import { parseTestContent, autoFixFormatting } from '../services/geminiService';
import { supabase, DbAttempt, DbExam, DbSession } from '../services/supabase';
import { motion, AnimatePresence } from 'framer-motion';

declare const mammoth: any;

export const AdminPanel: React.FC = () => {
  const navigate = useNavigate();
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('eduexam_auth') === 'true' || sessionStorage.getItem('eduexam_auth') === 'true';
  });
  const [loginForm, setLoginForm] = useState({ user: '', pass: '', remember: true });
  const [loginError, setLoginError] = useState('');
  
  const [activeTab, setActiveTab] = useState<'exams' | 'live' | 'create' | 'results' | 'upload'>('exams');
  const [exams, setExams] = useState<DbExam[]>([]);
  const [attempts, setAttempts] = useState<DbAttempt[]>([]);
  const [activeSessions, setActiveSessions] = useState<DbSession[]>([]);
  const [notifications, setNotifications] = useState<{id: string, text: string, type: 'info' | 'success' | 'error'}[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [rawText, setRawText] = useState('');
  const [previewQuestions, setPreviewQuestions] = useState<Question[] | null>(null);
  const [activeJoinCode, setActiveJoinCode] = useState<string | null>(null);
  const [copyToast, setCopyToast] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [lastSaveStatus, setLastSaveStatus] = useState<{ time: string; success: boolean } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchExams();
      fetchAttempts();
      fetchSessions();
      
      const channel = supabase
        .channel('admin-dashboard')
        .on('postgres_changes', { event: '*', table: 'attempts' }, (payload) => {
          fetchAttempts();
          if (payload.eventType === 'INSERT') {
            const newAttempt = payload.new as DbAttempt;
            addNotification(`${newAttempt.first_name} ${newAttempt.last_name} testni boshladi.`, 'info');
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as DbAttempt;
            if (updated.status === 'finished' || updated.status === 'timeout') {
              const typeLabel = updated.status === 'timeout' ? 'vaqti tugadi' : 'testni tugatdi';
              addNotification(`${updated.first_name} ${updated.last_name} ${typeLabel}. Ball: ${updated.score}`, 'success');
            }
          }
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [isLoggedIn]);

  const fetchExams = async () => {
    try {
      const { data, error } = await supabase.from('exams').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setExams(data);
    } catch (err: any) {
      const errorMsg = err.message || (typeof err === 'string' ? err : "Ulanish xatosi");
      console.error(`Failed to fetch exams: ${errorMsg}`);
    }
  };

  const fetchAttempts = async () => {
    try {
      const { data, error } = await supabase.from('attempts').select('*').order('started_at', { ascending: false });
      if (error) throw error;
      if (data) setAttempts(data);
    } catch (err: any) {
      const errorMsg = err.message || (typeof err === 'string' ? err : "Ulanish xatosi");
      console.error(`Failed to fetch attempts: ${errorMsg}`);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data, error } = await supabase.from('sessions').select('*').eq('status', 'active');
      if (error) throw error;
      if (data) setActiveSessions(data);
    } catch (err: any) {
      const errorMsg = err.message || (typeof err === 'string' ? err : "Ulanish xatosi");
      console.error(`Failed to fetch sessions: ${errorMsg}`);
    }
  };

  const addNotification = (text: string, type: 'info' | 'success' | 'error') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [{ id, text, type }, ...prev].slice(0, 20));
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginForm.user === 'hamidullo_17' && loginForm.pass === '12345678') {
      setIsLoggedIn(true);
      if (loginForm.remember) {
        localStorage.setItem('eduexam_auth', 'true');
      } else {
        sessionStorage.setItem('eduexam_auth', 'true');
      }
      setLoginError('');
    } else {
      setLoginError('Login yoki parol noto‘g‘ri.');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('eduexam_auth');
    sessionStorage.removeItem('eduexam_auth');
    navigate('/');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      let text = '';
      if (file.name.endsWith('.docx')) {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.extractRawText({ arrayBuffer });
        text = result.value;
      } else {
        text = await file.text();
      }
      setRawText(text);
      const parsed = await parseTestContent(text);
      setPreviewQuestions(parsed);
      setLastSaveStatus(null);
    } catch (error: any) {
      addNotification(`Faylni tahlil qilib bo'lmadi: ${error.message || 'Noma' + "'" + 'lum xato'}`, "error");
    } finally {
      setIsUploading(false);
    }
  };

  const handleAutoFix = async () => {
    setIsUploading(true);
    try {
      const fixed = await autoFixFormatting(rawText);
      const parsed = await parseTestContent(fixed);
      setPreviewQuestions(parsed);
    } catch (error: any) {
      addNotification("Tuzatishda xatolik yuz berdi.", "error");
    } finally {
      setIsUploading(false);
    }
  };

  const generate6DigitCode = () => Math.floor(100000 + Math.random() * 900000).toString();
  const generateShortCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

  const handleSaveExam = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // 1. Pre-validation
    const formData = new FormData(e.currentTarget);
    const title = (formData.get('title') as string).trim();
    const month = parseInt(formData.get('month') as string);
    const mode = (formData.get('mode') as string).toLowerCase(); // Normalize to 'adult' | 'kids'
    const duration = parseInt(formData.get('duration') as string);

    if (!title) {
      addNotification("Imtihon nomi kiritilishi shart!", "error");
      return;
    }
    if (!previewQuestions || previewQuestions.length === 0) {
      addNotification("Savollar aniqlanmagan. Iltimos, faylni qayta yuklang.", "error");
      return;
    }
    if (isNaN(duration) || duration <= 0) {
      addNotification("Vaqt 0 dan katta bo'lishi kerak.", "error");
      return;
    }

    setSaveLoading(true);
    setLastSaveStatus(null);
    const shortCode = generateShortCode();
    
    try {
      // 2. DB Write
      const { data: upsertData, error: upsertError } = await supabase.from('exams').insert({
        short_code: shortCode,
        title: title,
        month: month,
        mode: mode,
        duration_minutes: duration,
        questions_json: previewQuestions
      }).select().single();

      if (upsertError) {
        console.error("Supabase Error Details:", JSON.stringify(upsertError, null, 2));
        throw new Error(upsertError.message || "Tizimga yozishda xatolik");
      }

      // 3. Verified Re-fetch
      const { data: verifiedData, error: fetchError } = await supabase
        .from('exams')
        .select('*')
        .eq('short_code', shortCode)
        .single();

      if (fetchError || !verifiedData) {
        throw new Error("Ma'lumotlarni tekshirishda xatolik yuz berdi. Verified re-fetch failed.");
      }

      // 4. Verification logic
      const isQuestionsMatch = Array.isArray(verifiedData.questions_json) && 
                               verifiedData.questions_json.length === previewQuestions.length;
      
      if (!isQuestionsMatch) {
        throw new Error(`Savollar to'liq saqlanmadi. Kutilgan: ${previewQuestions.length}, Saqlangan: ${verifiedData.questions_json?.length || 0}`);
      }

      // Success
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSaveStatus({ time: now, success: true });
      addNotification("Imtihon saqlandi ✅", "success");
      
      // Reload UI list
      await fetchExams();
      
      // Navigate to list after delay
      setTimeout(() => {
        setActiveTab('exams');
        setPreviewQuestions(null);
        setRawText('');
      }, 1000);

    } catch (error: any) {
      console.error("Save Pipeline Failure:", error);
      const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      setLastSaveStatus({ time: now, success: false });
      
      let errorMsg = "Saqlashda xatolik yuz berdi.";
      if (error instanceof Error) {
        errorMsg = error.message;
        if (error.message.includes("fetch")) {
          errorMsg = "Tarmoq xatosi (Failed to fetch). Supabase URL va Key sozlamalarini tekshiring.";
        }
      } else if (typeof error === 'string') {
        errorMsg = error;
      } else {
        errorMsg = JSON.stringify(error);
      }

      addNotification(errorMsg, "error");
    } finally {
      setSaveLoading(false);
    }
  };

  const handleStartSession = async (examShortCode: string) => {
    const joinCode = generate6DigitCode();
    try {
      const { error } = await supabase.from('sessions').insert({
        join_code: joinCode,
        exam_short_code: examShortCode,
        status: 'active'
      });

      if (error) throw error;

      setActiveJoinCode(joinCode);
      fetchSessions();
      addNotification("Imtihon sessiyasi boshlandi ✅", "success");
    } catch (err: any) {
      addNotification(`Sessiya boshlashda xatolik: ${err.message || "Ulanish xatosi"}`, "error");
    }
  };

  const handleEndSession = async (sessionId: string) => {
    try {
      const { error } = await supabase.from('sessions').update({ status: 'ended' }).eq('id', sessionId);
      if (error) throw error;
      fetchSessions();
      addNotification("Sessiya yakunlandi", "info");
      if (activeJoinCode) {
        const currentSession = activeSessions.find(s => s.id === sessionId);
        if (currentSession?.join_code === activeJoinCode) setActiveJoinCode(null);
      }
    } catch (err: any) {
      addNotification(`Sessiyani yakunlashda xatolik: ${err.message || "Ulanish xatosi"}`, "error");
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 2000);
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl border border-orange-100">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 text-white shadow-lg shadow-orange-200">
              <ShieldCheck size={32} />
            </div>
            <h2 className="text-3xl font-black text-slate-900">Teacher kirish</h2>
            <p className="text-slate-500 mt-2">O'qituvchi paneli uchun tizimga kiring</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4" noValidate>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Login</label>
              <input 
                type="text" 
                value={loginForm.user}
                autoComplete="off"
                onChange={e => setLoginForm({ ...loginForm, user: e.target.value })}
                className="w-full p-4 edu-input rounded-2xl" 
                placeholder="Login" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1 ml-1">Parol</label>
              <input 
                type="password" 
                value={loginForm.pass}
                autoComplete="new-password"
                onChange={e => setLoginForm({ ...loginForm, pass: e.target.value })}
                className="w-full p-4 edu-input rounded-2xl" 
                placeholder="Parol" 
              />
            </div>
            <div className="flex items-center gap-2 ml-1">
              <input 
                type="checkbox" 
                id="remember" 
                checked={loginForm.remember} 
                onChange={e => setLoginForm({...loginForm, remember: e.target.checked})}
                className="w-4 h-4 accent-orange-600"
              />
              <label htmlFor="remember" className="text-sm font-bold text-slate-600 cursor-pointer">Eslab qolish</label>
            </div>
            {loginError && <p className="text-red-500 text-sm font-bold text-center px-2">{loginError}</p>}
            <button className="w-full bg-orange-600 text-white py-4 rounded-2xl font-black text-lg hover:bg-orange-700 transition shadow-xl shadow-orange-200 mt-2">
              Kirish
            </button>
          </form>
        </div>
      </div>
    );
  }

  const liveAttempts = attempts.filter(a => a.status === 'in_progress');
  const finishedResults = attempts.filter(a => a.status !== 'in_progress');

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Sidebar */}
      <div className="w-72 bg-slate-900 text-white p-6 flex flex-col z-50">
        <div className="flex items-center gap-3 mb-10 px-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-orange-600 p-2 rounded-xl">
            <LayoutDashboard className="text-white h-6 w-6" />
          </div>
          <h1 className="text-2xl font-black tracking-tight">EduExam</h1>
        </div>
        
        <nav className="space-y-2 flex-1">
          <NavItem active={activeTab === 'exams'} onClick={() => setActiveTab('exams')} icon={<FileText size={20}/>} label="Imtihonlar" />
          <NavItem active={activeTab === 'upload'} onClick={() => setActiveTab('upload')} icon={<UploadCloud size={20}/>} label="Smart Import" />
          <NavItem active={activeTab === 'live'} onClick={() => setActiveTab('live')} icon={<Users size={20}/>} label="Aktiv topshiruvchilar" />
          <NavItem active={activeTab === 'results'} onClick={() => setActiveTab('results')} icon={<BarChart3 size={20}/>} label="Natijalar" />
        </nav>

        <button onClick={handleLogout} className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-white/10 transition text-red-400 font-bold">
          <LogOut size={20} /> Chiqish
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-auto p-10 relative pt-24">
        {/* Header inside content area */}
        <header className="fixed top-0 right-0 left-72 bg-white/95 backdrop-blur-md border-b border-slate-100 px-10 h-16 flex justify-between items-center z-40">
          <h2 className="text-xl font-black text-slate-900">
            {activeTab === 'exams' && 'Mavjud imtihonlar'}
            {activeTab === 'live' && 'Aktiv topshirayotganlar'}
            {activeTab === 'results' && 'Natijalar'}
            {activeTab === 'upload' && 'Smart Import (Savollarni yuklash)'}
          </h2>
          
          <div className="flex items-center gap-4">
             <div className="relative">
                <button className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition text-slate-600 relative">
                  <Bell size={18}/>
                  {notifications.filter(n => n.type !== 'error').length > 0 && (
                    <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-orange-600 border-2 border-white rounded-full animate-pulse"></span>
                  )}
                </button>
             </div>
             <button onClick={() => setActiveTab('upload')} className="bg-orange-600 text-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg shadow-orange-100 hover:bg-orange-700 transition flex items-center gap-2">
               <Plus size={16}/> Imtihon qo'shish
             </button>
          </div>
        </header>

        {activeJoinCode && (
           <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="mb-8 p-8 bg-slate-900 text-white rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:rotate-12 transition-transform">
                <ShieldCheck size={120}/>
              </div>
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                   <h4 className="text-orange-500 font-black text-sm uppercase tracking-widest mb-2">Aktiv sessiya kodi</h4>
                   <div className="flex items-center gap-4">
                      <span className="text-6xl font-black tracking-[0.2em]">{activeJoinCode}</span>
                      <button onClick={() => copyToClipboard(activeJoinCode!)} className="p-3 bg-white/10 rounded-2xl hover:bg-white/20 transition">
                        <Copy size={24}/>
                      </button>
                   </div>
                   <p className="text-slate-400 mt-4 font-bold">O'quvchilarga ushbu 6 xonali kodni bering.</p>
                </div>
                <button 
                  onClick={() => {
                    const session = activeSessions.find(s => s.join_code === activeJoinCode);
                    if (session) handleEndSession(session.id);
                  }}
                  className="bg-red-600 text-white px-8 py-4 rounded-2xl font-black text-lg hover:bg-red-700 transition flex items-center gap-2 shadow-xl shadow-red-900/40"
                >
                  <Power size={20}/> Sessiyani tugatish
                </button>
              </div>
           </motion.div>
        )}

        {/* Content Tabs */}
        {activeTab === 'exams' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {exams.length === 0 ? (
              <div className="col-span-full py-24 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-slate-100 text-slate-400">
                <FileText size={64} className="mx-auto mb-6 opacity-10" />
                <p className="font-bold text-xl">Imtihonlar hali mavjud emas</p>
                <button onClick={() => setActiveTab('upload')} className="mt-4 text-orange-600 font-black hover:underline px-6 py-2 bg-orange-50 rounded-xl">Hozir yaratish</button>
              </div>
            ) : exams.map(exam => {
              const activeSession = activeSessions.find(s => s.exam_short_code === exam.short_code);
              return (
                <div 
                  key={exam.id} 
                  className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 hover:shadow-xl hover:border-orange-200 transition-all group flex flex-col"
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-black px-3 py-1 rounded-full tracking-widest ${exam.mode === 'kids' ? 'bg-pink-100 text-pink-700' : 'bg-orange-100 text-orange-700'}`}>
                      {exam.mode === 'kids' ? 'BOLALAR' : 'KATTALAR'}
                    </span>
                    <span className="text-xs font-black text-slate-400">{exam.month}-OY</span>
                  </div>
                  <h3 className="text-lg font-black text-slate-800 mb-2 leading-tight group-hover:text-orange-600 transition-colors h-12 overflow-hidden">{exam.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-slate-500 mb-auto pb-6">
                    <span className="flex items-center gap-1.5 font-bold"><Clock size={14} className="text-orange-500" /> {exam.duration_minutes} daq.</span>
                    <span className="flex items-center gap-1.5 font-bold"><FileText size={14} className="text-blue-500" /> {exam.questions_json?.length || 0} savol</span>
                  </div>
                  <div className="pt-5 border-t border-slate-50 flex flex-col gap-3">
                    {activeSession ? (
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-2xl border border-green-100">
                        <div className="flex flex-col">
                           <span className="text-[10px] font-black text-green-600 uppercase">Aktiv sessiya</span>
                           <span className="text-xl font-black text-green-700 tracking-wider">{activeSession.join_code}</span>
                        </div>
                        <button onClick={() => handleEndSession(activeSession.id)} className="p-2 bg-white text-red-500 rounded-xl hover:bg-red-50 shadow-sm transition">
                          <Power size={18}/>
                        </button>
                      </div>
                    ) : (
                      <button 
                        onClick={() => handleStartSession(exam.short_code)}
                        className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-sm hover:bg-slate-800 transition flex items-center justify-center gap-2"
                      >
                        <Play size={16}/> Sessiyani boshlash
                      </button>
                    )}
                    
                    <div className="flex gap-2">
                       <button 
                        onClick={() => copyToClipboard(`${window.location.origin}${window.location.pathname}#/exam/${exam.short_code}`)}
                        className="flex-1 flex items-center justify-center gap-2 text-orange-600 font-bold text-xs bg-orange-50 px-3 py-2 rounded-xl hover:bg-orange-100 transition"
                      >
                        <Share2 size={14}/> Havola
                      </button>
                      <button onClick={() => navigate(`/exam/${exam.short_code}`)} className="flex-1 flex items-center justify-center gap-2 text-slate-400 font-bold text-xs hover:text-orange-600 transition">
                        <Eye size={16}/> Ko'rish
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === 'live' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-sm font-black text-slate-600 uppercase">O'quvchi</th>
                  <th className="px-8 py-5 text-sm font-black text-slate-600 uppercase">Imtihon</th>
                  <th className="px-8 py-5 text-sm font-black text-slate-600 uppercase">Boshlangan vaqt</th>
                  <th className="px-8 py-5 text-sm font-black text-slate-600 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {liveAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-20 text-center text-slate-400 font-medium italic">Hozirda aktiv topshirayotganlar yo'q</td>
                  </tr>
                ) : liveAttempts.map(a => (
                  <tr key={a.id} className="animate-fade-up">
                    <td className="px-8 py-6 font-bold text-slate-800">{a.first_name} {a.last_name}</td>
                    <td className="px-8 py-6 text-slate-500">{exams.find(e => e.short_code === a.exam_short_code)?.title || '...'}</td>
                    <td className="px-8 py-6 text-slate-500 font-mono">{new Date(a.started_at).toLocaleTimeString()}</td>
                    <td className="px-8 py-6">
                      <span className="flex items-center gap-2 text-blue-600 font-black text-sm uppercase">
                        <Play size={14} className="animate-pulse" /> Jarayonda
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'results' && (
          <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-8 py-5 text-sm font-black text-slate-600 uppercase">O'quvchi</th>
                  <th className="px-8 py-5 text-sm font-black text-slate-600 uppercase">Ball / Foiz</th>
                  <th className="px-8 py-5 text-sm font-black text-slate-600 uppercase">To'g'ri/Xato</th>
                  <th className="px-8 py-5 text-sm font-black text-slate-600 uppercase">Status</th>
                  <th className="px-8 py-5 text-sm font-black text-slate-600 uppercase">Sana</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {finishedResults.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-slate-400 font-medium italic">Natijalar hali mavjud emas</td>
                  </tr>
                ) : finishedResults.map(a => (
                  <tr key={a.id}>
                    <td className="px-8 py-6 font-bold text-slate-800">{a.first_name} {a.last_name}</td>
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="font-black text-lg text-slate-900">{a.score} ball</span>
                        <span className="text-xs font-black text-green-600">{Math.round((a.correct_count / (a.correct_count + a.wrong_count || 1)) * 100 || 0)}%</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                         <span className="text-green-600 font-bold bg-green-50 px-2 py-1 rounded-lg">{a.correct_count} ✔</span>
                         <span className="text-red-500 font-bold bg-red-50 px-2 py-1 rounded-lg">{a.wrong_count} ✖</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${a.status === 'timeout' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                        {a.status === 'timeout' ? 'Vaqt tugadi' : 'Tugatildi'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-slate-400 text-sm font-medium">
                      {new Date(a.started_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'upload' && (
          <div className="max-w-4xl mx-auto pb-20">
            <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-slate-100 mb-10">
              <h2 className="text-2xl font-black text-slate-900 mb-2">Savollarni yuklash (Smart Import)</h2>
              <p className="text-slate-500 mb-8 font-medium">Faylni tanlang (DOCX yoki TXT), tizim avtomatik ravishda savollarni ajratib beradi.</p>
              <div className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem] p-12 hover:border-orange-200 transition-colors bg-slate-50/50 group cursor-pointer relative" onClick={() => fileInputRef.current?.click()}>
                <input type="file" ref={fileInputRef} className="hidden" accept=".txt,.docx" onChange={handleFileUpload} />
                <div className="w-20 h-20 bg-orange-100 rounded-3xl flex items-center justify-center text-orange-600 mb-4 group-hover:scale-110 transition-transform">
                  <FileUp size={40} />
                </div>
                <p className="text-xl font-black text-slate-800 mb-1">Faylni tanlang</p>
                <p className="text-slate-400 font-medium">.docx yoki .txt formatlari</p>
                {isUploading && (
                   <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-[3rem] flex flex-col items-center justify-center z-10 animate-fade-up">
                      <div className="w-12 h-12 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                      <p className="text-orange-600 font-black text-lg">Tahlil qilinmoqda...</p>
                      <p className="text-slate-400 text-sm font-bold">Savollar ajratilmoqda...</p>
                   </div>
                )}
              </div>
            </div>

            {previewQuestions && (
              <form onSubmit={handleSaveExam} className="bg-white p-10 rounded-[2.5rem] shadow-xl border-4 border-orange-100 space-y-8 animate-fade-up">
                <div className="flex justify-between items-center pb-4 border-b border-slate-50">
                   <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center text-orange-600">
                        <Eye size={24}/>
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">Tayyor test ko'rinishi</h3>
                   </div>
                   <div className="flex items-center gap-4">
                     {lastSaveStatus && (
                       <span className={`text-xs font-black ${lastSaveStatus.success ? 'text-green-600' : 'text-red-500'} flex items-center gap-1`}>
                         {lastSaveStatus.success ? <CheckCircle size={14}/> : <AlertCircle size={14}/>}
                         Oxirgi urinish: {lastSaveStatus.time} {lastSaveStatus.success ? "(Saqlandi)" : "(Xatolik)"}
                       </span>
                     )}
                     <button 
                      type="button"
                      onClick={handleAutoFix}
                      disabled={isUploading || saveLoading}
                      className="flex items-center gap-2 bg-slate-100 text-slate-700 px-4 py-2 rounded-xl font-bold text-sm hover:bg-slate-200 transition disabled:opacity-50"
                     >
                       <Wand2 size={16}/> Formatni tuzatish
                     </button>
                   </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Imtihon nomi</label>
                    <input name="title" required className="w-full edu-input rounded-2xl p-4 font-bold" placeholder="Masalan: Ingliz tili 1-oy testi" />
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Modul (Oy)</label>
                    <select name="month" className="w-full edu-input rounded-2xl p-4 font-bold cursor-pointer">
                      {MONTHS.map(m => <option key={m} value={m}>{m}-oy</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Guruh turi</label>
                    <select name="mode" className="w-full edu-input rounded-2xl p-4 font-bold cursor-pointer">
                      <option value="ADULT">KATTALAR</option>
                      <option value="KIDS">BOLALAR</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-black text-slate-700 mb-2 ml-1">Imtihon vaqti (daqiqa)</label>
                    <input name="duration" type="number" defaultValue={30} className="w-full edu-input rounded-2xl p-4 font-bold" />
                  </div>
                </div>

                <div className="space-y-4">
                   <p className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Aniqlangan savollar ro'yxati ({previewQuestions.length})</p>
                   <div className="max-h-[400px] overflow-y-auto space-y-4 pr-3 border-2 border-slate-50 p-6 rounded-[2rem] bg-slate-50/30">
                      {previewQuestions.map((q, i) => (
                        <div key={i} className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
                           <div className="flex justify-between items-start mb-3">
                              <p className="text-lg font-bold text-slate-800 leading-tight flex-1"><span className="text-orange-600 mr-2">#{i+1}</span> {q.text}</p>
                              <span className="bg-slate-50 text-slate-400 text-[10px] font-black px-2 py-1 rounded-md">{q.type}</span>
                           </div>
                           {q.options && (
                             <div className="grid grid-cols-2 gap-2 mb-4">
                               {q.options.map(o => (
                                 <div key={o.key} className={`text-xs p-2 rounded-xl border ${q.correctAnswer === o.key ? 'bg-green-50 border-green-200 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-500'} font-bold`}>
                                   <span className="mr-1">{o.key}:</span> {o.text}
                                 </div>
                               ))}
                             </div>
                           )}
                           <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                              <span className="text-xs font-black text-green-600 uppercase tracking-wider">To'g'ri javob: {q.correctAnswer}</span>
                              <span className="text-xs font-black text-orange-600 uppercase tracking-wider">{q.points} BALL</span>
                           </div>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="flex gap-4">
                  <button 
                    type="submit" 
                    disabled={saveLoading}
                    className="flex-1 bg-orange-600 text-white py-5 rounded-3xl font-black text-xl hover:bg-orange-700 shadow-xl shadow-orange-100 flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50"
                  >
                    {saveLoading ? (
                      <><Loader2 className="w-6 h-6 animate-spin"/> Saqlanmoqda...</>
                    ) : (
                      <><Save size={24}/> Saqlash va E'lon qilish</>
                    )}
                  </button>
                  
                  {lastSaveStatus && !lastSaveStatus.success && (
                    <button 
                      type="submit"
                      disabled={saveLoading}
                      className="bg-red-50 text-red-600 px-6 rounded-3xl font-black hover:bg-red-100 transition-colors flex items-center gap-2"
                    >
                      <RotateCcw size={20}/> Qayta urinish
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      <div className="fixed top-24 right-6 z-[100] space-y-3 pointer-events-none">
        <AnimatePresence>
          {notifications.slice(0, 3).map(n => (
            <motion.div 
              key={n.id}
              initial={{ x: 300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 300, opacity: 0 }}
              className={`p-5 rounded-2xl shadow-2xl border-l-8 w-80 pointer-events-auto bg-white flex items-center gap-3 ${
                n.type === 'success' ? 'border-green-500' : 
                n.type === 'error' ? 'border-red-500' : 'border-blue-500'
              }`}
            >
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                n.type === 'success' ? 'bg-green-100 text-green-600' : 
                n.type === 'error' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
              }`}>
                 {n.type === 'success' ? <CheckCircle size={20}/> : 
                  n.type === 'error' ? <AlertCircle size={20}/> : <AlertCircle size={20}/>}
              </div>
              <p className="text-sm font-bold text-slate-800 leading-tight">{n.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      
      {copyToast && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-8 py-4 rounded-2xl shadow-2xl font-black animate-fade-up z-[101]">
          Nusxa olindi ✅
        </div>
      )}
    </div>
  );
};

const NavItem = ({ active, onClick, icon, label }: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${active ? 'bg-orange-600 text-white shadow-xl shadow-orange-900/40 scale-[1.03]' : 'hover:bg-white/5 text-slate-400 font-bold'}`}>
    {icon} <span className="text-sm tracking-tight">{label}</span>
  </button>
);
