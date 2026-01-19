
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter, Routes, Route, Link, useParams, useNavigate, useLocation } from 'react-router-dom';
import { AdminPanel } from './components/AdminPanel';
import { StudentExam } from './components/StudentExam';
import { MOCK_EXAMS } from './constants';
import { 
  GraduationCap, ChevronRight, CheckCircle, 
  Menu, X, ArrowLeft, HelpCircle, Trophy, Baby, Home, BarChart3, Clock,
  AlertTriangle, ShieldCheck, KeyRound, ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Exam } from './types';
import { supabase } from './services/supabase';

const Navigation = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { label: 'Bosh sahifa', path: '/', icon: <Home size={20}/> },
    { label: 'Imtihonga kirish', path: '/join', icon: <KeyRound size={20}/> },
    { label: 'Imtihonlar (16 oy)', path: '/admin', icon: <GraduationCap size={20}/> },
    { label: 'Teacher (Admin)', path: '/admin', icon: <ShieldCheck size={20}/> },
    { label: 'Yordam / Kontakt', path: '/', icon: <HelpCircle size={20}/> },
  ];

  const showBackButton = location.pathname !== '/';

  return (
    <>
      <nav className="fixed top-0 left-0 right-0 h-16 bg-white/80 backdrop-blur-lg border-b border-slate-100 z-[60] px-4 md:px-8 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => setIsOpen(true)} className="p-2.5 hover:bg-slate-50 rounded-xl transition text-slate-900 active:scale-90"><Menu size={24} strokeWidth={2.5} /></button>
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => navigate('/')}>
            <div className="bg-orange-600 p-1.5 rounded-lg group-hover:rotate-12 transition-transform shadow-md shadow-orange-100"><GraduationCap className="text-white h-5 w-5" strokeWidth={2.5} /></div>
            <span className="text-xl font-black text-slate-900 tracking-tight">EduExam</span>
          </div>
        </div>
        {showBackButton && (
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-slate-800 transition active:scale-95"><ArrowLeft size={16} /> Orqaga</button>
        )}
      </nav>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsOpen(false)} className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25 }} className="fixed top-0 left-0 bottom-0 w-72 bg-white z-[80] shadow-2xl p-6 flex flex-col">
              <div className="flex justify-between items-center mb-8">
                <span className="text-xl font-black text-orange-600">EduExam</span>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-100 rounded-xl transition"><X size={20} /></button>
              </div>
              <div className="space-y-2">
                {menuItems.map((item, idx) => (
                  <button key={idx} onClick={() => { navigate(item.path); setIsOpen(false); }} className="w-full flex items-center gap-3.5 p-3.5 rounded-xl hover:bg-orange-50 text-slate-600 hover:text-orange-600 font-bold text-sm transition-all text-left">
                    {item.icon} <span className="ml-1">{item.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

const LandingPage = () => (
  <div className="min-h-screen bg-white pt-16">
    <main className="max-w-6xl mx-auto px-6 pt-16 text-center pb-20">
      <div className="inline-block bg-orange-50 text-orange-600 px-5 py-1.5 rounded-full text-xs font-black uppercase tracking-[0.2em] mb-6">Smart Exams for Smart Learning</div>
      <h1 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight tracking-tight">Bilimingizni <br/><span className="text-orange-600">EduExam</span> bilan sinang</h1>
      <p className="text-lg text-slate-500 max-w-2xl mx-auto mb-10 font-medium leading-relaxed">Zamonaviy va aqlli imtihon platformasi. PIN kod orqali tezkor kirish va real-vaqtda kuzatuv.</p>
      
      <div className="flex flex-wrap justify-center gap-6 mt-4">
        <Link to="/join" className="group px-10 py-5 bg-slate-900 text-white text-xl font-black rounded-3xl shadow-2xl shadow-slate-200 hover:scale-105 transition-all flex items-center gap-3 active:scale-95">
          <KeyRound size={28} className="text-orange-500 group-hover:rotate-12 transition-transform" /> 
          Imtihonga kirish
        </Link>
        
        <Link to="/admin" className="px-10 py-5 bg-orange-600 text-white text-xl font-black rounded-3xl shadow-2xl shadow-orange-100 hover:scale-105 transition-all flex items-center gap-3 active:scale-95">
          O'qituvchi paneli <ChevronRight size={24}/>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-24 text-left">
        <FeatureCard icon={<BarChart3 size={24}/>} title="Real-time" text="Natijalarni o'quvchi tugatishi bilan darhol ko'ring." />
        <FeatureCard icon={<Baby size={24}/>} title="Kids Mode" text="Bolalar uchun maxsus rangli va oson interfeys." />
        <FeatureCard icon={<Clock size={24}/>} title="Jonli kuzatuv" text="Jarayonni real vaqtda kuzatib boring." />
      </div>
    </main>
  </div>
);

const FeatureCard = ({ icon, title, text }: any) => (
  <div className="p-8 bg-gray-50 rounded-[2.5rem] border border-slate-100 hover:bg-white hover:shadow-xl transition-all duration-300">
    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-6 text-orange-600">{icon}</div>
    <h3 className="text-xl font-black mb-2 text-slate-900">{title}</h3>
    <p className="text-sm text-slate-500 font-medium leading-relaxed">{text}</p>
  </div>
);

const JoinPage = () => {
  const [pin, setPin] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  const handleChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // Numeric only
    
    const newPin = [...pin];
    newPin[index] = value.slice(-1); // Take last digit if multiple
    setPin(newPin);
    setError(null);

    // Auto-advance
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newPin = [...pin];
      newPin[index - 1] = '';
      setPin(newPin);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6).split('');
    const newPin = [...pin];
    pastedData.forEach((char, idx) => {
      if (/^\d$/.test(char)) {
        newPin[idx] = char;
      }
    });
    setPin(newPin);
    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleJoin = async () => {
    const code = pin.join('');
    if (code.length < 6) return;

    setLoading(true);
    // Lookup sessions first
    const { data: sessionData, error: sessionError } = await supabase
      .from('sessions')
      .select('exam_short_code')
      .eq('join_code', code)
      .eq('status', 'active')
      .single();

    if (sessionError || !sessionData) {
      setError("Kod noto‘g‘ri yoki sessiya faol emas.");
      setPin(['', '', '', '', '', '']);
      inputRefs.current[0]?.focus();
      setLoading(false);
    } else {
      navigate(`/exam/${sessionData.exam_short_code}`);
    }
  };

  const isComplete = pin.every(digit => digit !== '');

  return (
    <div className="min-h-screen bg-orange-50 flex items-center justify-center p-6 pt-24">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="max-w-md w-full bg-white p-10 rounded-[3rem] shadow-2xl border-4 border-white text-center"
      >
        <div className="w-20 h-20 bg-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-8 text-white shadow-xl shadow-orange-200">
          <KeyRound size={40} />
        </div>
        
        <h2 className="text-3xl font-black text-slate-900 mb-2">Imtihon kodi</h2>
        <p className="text-slate-500 font-bold mb-8">6 xonali PIN kodni kiriting</p>

        <div className="flex justify-between gap-2 mb-8" onPaste={handlePaste}>
          {pin.map((digit, idx) => (
            <input
              key={idx}
              ref={el => { inputRefs.current[idx] = el; }}
              type="text"
              inputMode="numeric"
              value={digit}
              onChange={e => handleChange(idx, e.target.value)}
              onKeyDown={e => handleKeyDown(idx, e)}
              className={`w-12 h-16 text-center text-3xl font-black rounded-2xl border-4 transition-all duration-200 ${
                error ? 'border-red-200 bg-red-50 text-red-600' : 'border-slate-100 bg-slate-50 focus:border-orange-500 focus:bg-white text-slate-800'
              }`}
              placeholder="•"
            />
          ))}
        </div>

        {error && (
          <motion.div 
            initial={{ y: -10, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="mb-6 p-4 bg-red-50 text-red-600 rounded-2xl font-bold text-sm"
          >
            {error}
          </motion.div>
        )}

        <button 
          onClick={handleJoin}
          disabled={!isComplete || loading}
          className={`w-full py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 transition-all active:scale-95 shadow-xl ${
            isComplete && !loading ? 'bg-orange-600 text-white shadow-orange-200 hover:bg-orange-700' : 'bg-slate-100 text-slate-300 shadow-none cursor-not-allowed'
          }`}
        >
          {loading ? (
            <div className="w-6 h-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <>Kirish <ArrowRight size={24} /></>
          )}
        </button>
      </motion.div>
    </div>
  );
};

const ExamPage = () => {
  const { examCode } = useParams();
  const [exam, setExam] = useState<Exam | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (examCode) fetchExam();
  }, [examCode]);

  const fetchExam = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('exams').select('*').eq('short_code', examCode.toUpperCase()).single();
    if (error) {
      setError("Imtihon topilmadi yoki havola noto'g'ri.");
    } else {
      setExam({
        id: data.id,
        title: data.title,
        month: data.month,
        mode: data.mode as any,
        duration: data.duration_minutes,
        questions: data.questions_json,
        published: true,
        centerId: 'supabase',
        createdAt: new Date(data.created_at).getTime()
      });
    }
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-orange-50">
       <div className="w-16 h-16 border-4 border-orange-600 border-t-transparent rounded-full animate-spin mb-4"></div>
       <div className="text-2xl font-black text-orange-600 text-center">Imtihon yuklanmoqda...</div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center bg-orange-50 p-6">
      <div className="max-w-md w-full bg-white p-10 rounded-[2.5rem] shadow-2xl text-center border-4 border-red-50">
        <AlertTriangle className="mx-auto text-red-500 mb-6" size={64}/>
        <h2 className="text-2xl font-black text-slate-900 mb-4">{error}</h2>
        <Link to="/" className="inline-block bg-orange-600 text-white px-8 py-3 rounded-2xl font-black hover:bg-orange-700 transition">Bosh sahifaga qaytish</Link>
      </div>
    </div>
  );

  return <StudentExam exam={exam!} shortCode={examCode!.toUpperCase()} />;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Navigation />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/join" element={<JoinPage />} />
        <Route path="/admin" element={<AdminPanel />} />
        <Route path="/exam/:examCode" element={<ExamPage />} />
      </Routes>
    </HashRouter>
  );
};

export default App;
