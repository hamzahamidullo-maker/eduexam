
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Exam, Question } from '../types';
import { Clock, CheckCircle2, Star, ChevronRight, ChevronLeft, Flag, FileText, User, Download, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabase';

interface StudentExamProps {
  exam: Exam;
  shortCode: string;
}

export const StudentExam: React.FC<StudentExamProps> = ({ exam, shortCode }) => {
  const [step, setStep] = useState<'LOGIN' | 'READY' | 'TESTING' | 'FINISHED'>('LOGIN');
  const [studentInfo, setStudentInfo] = useState({ firstName: '', lastName: '' });
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(exam.duration * 60);
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);
  const [startTime, setStartTime] = useState<number | null>(null);

  const isKids = exam.mode === 'KIDS';
  const resumeCheckPerformed = useRef(false);

  // Resume logic
  useEffect(() => {
    if (resumeCheckPerformed.current) return;
    resumeCheckPerformed.current = true;

    const checkResume = async () => {
      const savedAttemptId = localStorage.getItem(`eduexam_attempt_${shortCode}`);
      if (savedAttemptId) {
        const { data, error } = await supabase.from('attempts').select('*').eq('id', savedAttemptId).single();
        if (data && data.status === 'in_progress') {
          const startedAt = new Date(data.started_at).getTime();
          const durationMs = exam.duration * 60 * 1000;
          const elapsed = Date.now() - startedAt;
          const remaining = Math.max(0, Math.floor((durationMs - elapsed) / 1000));

          if (remaining > 0) {
            setStudentInfo({ firstName: data.first_name, lastName: data.last_name });
            setAttemptId(data.id);
            setStartTime(startedAt);
            setTimeLeft(remaining);
            setAnswers(data.answers_json || {});
            setStep('TESTING');
          } else {
            // Expired attempt
            await supabase.from('attempts').update({ status: 'timeout' }).eq('id', savedAttemptId);
            localStorage.removeItem(`eduexam_attempt_${shortCode}`);
          }
        }
      }
    };
    checkResume();
  }, [shortCode, exam.duration]);

  const calculateResults = () => {
    let score = 0;
    let correct = 0;
    let wrong = 0;
    exam.questions.forEach(q => {
      const studentAnswer = (answers[q.id] || '').trim().toLowerCase();
      const correctAnswer = q.correctAnswer.trim().toLowerCase();
      if (studentAnswer === correctAnswer) {
        score += q.points;
        correct++;
      } else {
        wrong++;
      }
    });
    return { score, correct, wrong };
  };

  const syncAttempt = async (status: 'finished' | 'timeout') => {
    if (!attemptId) return;
    const { score, correct, wrong } = calculateResults();
    
    await supabase.from('attempts').update({
      submitted_at: new Date().toISOString(),
      score,
      correct_count: correct,
      wrong_count: wrong,
      answers_json: answers,
      status
    }).eq('id', attemptId);
    
    localStorage.removeItem(`eduexam_attempt_${shortCode}`);
  };

  const finishExam = useCallback(async (status: 'finished' | 'timeout' = 'finished') => {
    setStep('FINISHED');
    await syncAttempt(status);
  }, [answers, attemptId, shortCode]);

  // Periodic answer backup
  useEffect(() => {
    if (step === 'TESTING' && attemptId) {
      const interval = setInterval(() => {
        supabase.from('attempts').update({ answers_json: answers }).eq('id', attemptId);
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [step, attemptId, answers]);

  useEffect(() => {
    let timer: any;
    if (step === 'TESTING' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(timer);
            setIsAutoSubmitting(true);
            setTimeout(() => finishExam('timeout'), 2000);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, timeLeft, finishExam]);

  const handleStart = async () => {
    if (!studentInfo.firstName.trim() || !studentInfo.lastName.trim()) {
      alert("Iltimos, Ism va Familyangizni kiriting!");
      return;
    }
    
    const { data, error } = await supabase.from('attempts').insert({
      exam_short_code: shortCode,
      first_name: studentInfo.firstName,
      last_name: studentInfo.lastName,
      status: 'in_progress',
      started_at: new Date().toISOString(),
      answers_json: {}
    }).select().single();

    if (error) {
      alert("Xatolik yuz berdi. Iltimos qayta urinib ko'ring.");
      return;
    }

    setAttemptId(data.id);
    localStorage.setItem(`eduexam_attempt_${shortCode}`, data.id);
    setStartTime(new Date(data.started_at).getTime());
    setStep('READY');
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const currentQuestion = exam.questions[currentQuestionIndex];

  if (step === 'LOGIN') {
    return (
      <div className={`min-h-screen flex items-center justify-center p-6 ${isKids ? 'bg-orange-50 kids-font' : 'bg-slate-50'}`}>
        <div className={`max-w-md w-full bg-white p-10 shadow-2xl ${isKids ? 'rounded-[3rem] border-orange-200 border-8' : 'rounded-[2.5rem] border-slate-100 border'}`}>
          <div className="text-center mb-10">
            <h1 className={`text-4xl font-black mb-3 ${isKids ? 'text-orange-600 kids-title' : 'text-slate-900'}`}>EduExam</h1>
            <p className="text-slate-500 font-medium">Imtihon: <span className="text-slate-900 font-bold">{exam.title}</span></p>
          </div>
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700 ml-1">Ism</label>
              <input type="text" placeholder="Ism" value={studentInfo.firstName} onChange={e => setStudentInfo({...studentInfo, firstName: e.target.value})} className="w-full p-4 edu-input rounded-2xl" />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-black text-slate-700 ml-1">Familya</label>
              <input type="text" placeholder="Familya" value={studentInfo.lastName} onChange={e => setStudentInfo({...studentInfo, lastName: e.target.value})} className="w-full p-4 edu-input rounded-2xl" />
            </div>
            <button onClick={handleStart} className="w-full py-5 bg-orange-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-orange-200">Boshlash</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'READY') {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50">
        <div className="text-center max-w-lg">
          <h2 className="text-5xl font-black mb-8 text-slate-900">{studentInfo.firstName}, tayyormisiz?</h2>
          <div className="grid grid-cols-2 gap-6 mb-12">
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-orange-100">
              <Clock className="mx-auto mb-3 text-orange-500" size={32} />
              <p className="font-black text-2xl text-slate-800">{exam.duration}m</p>
            </div>
            <div className="bg-white p-8 rounded-[2rem] shadow-xl border border-orange-100">
              <FileText className="mx-auto mb-3 text-blue-500" size={32} />
              <p className="font-black text-2xl text-slate-800">{exam.questions.length}</p>
            </div>
          </div>
          <button onClick={() => setStep('TESTING')} className="px-16 py-6 bg-orange-600 text-white font-black text-3xl rounded-2xl shadow-2xl">Tayyorman!</button>
        </div>
      </div>
    );
  }

  if (step === 'TESTING') {
    return (
      <div className={`min-h-screen flex flex-col ${isKids ? 'bg-orange-50 kids-font' : 'bg-white'}`}>
        <header className="px-8 py-5 border-b flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-30 shadow-sm">
          <div className="flex flex-col">
            <h1 className="font-black text-xl text-slate-900">{exam.title}</h1>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{studentInfo.firstName} {studentInfo.lastName}</p>
          </div>
          
          <div className={`px-8 py-3 rounded-2xl font-black text-2xl flex items-center gap-3 ${timeLeft <= 30 ? 'bg-red-600 text-white animate-pulse shadow-lg shadow-red-200' : timeLeft <= 120 ? 'bg-red-50 text-red-600 border-2 border-red-200' : 'bg-orange-50 text-orange-700 border-2 border-orange-100'}`}>
            <Clock size={24} />
            <span className="font-mono">Qolgan vaqt: {formatTime(timeLeft)}</span>
          </div>
        </header>

        {/* Warning Banners */}
        <AnimatePresence>
          {timeLeft <= 120 && timeLeft > 30 && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-red-50 text-red-700 px-8 py-2 text-center text-sm font-black border-b border-red-100 overflow-hidden">
               DIQQAT: 2 daqiqa qoldi! Iltimos javoblarni tekshirib tugating.
            </motion.div>
          )}
          {timeLeft <= 30 && timeLeft > 0 && (
            <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="bg-red-600 text-white px-8 py-2 text-center text-sm font-black border-b border-red-700 overflow-hidden flex items-center justify-center gap-2">
               <AlertTriangle size={16}/> TEST TUGAMOQDA: {timeLeft} soniya qoldi!
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-2 w-full bg-slate-100">
          <motion.div 
            className="h-full bg-orange-600" 
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / exam.questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>

        <main className="flex-1 max-w-5xl w-full mx-auto p-8 flex flex-col justify-center">
          <motion.div key={currentQuestionIndex} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="p-12 bg-white rounded-[3rem] shadow-2xl border border-slate-100">
            <span className="text-sm font-black uppercase text-orange-600 tracking-widest">Savol {currentQuestionIndex + 1} / {exam.questions.length}</span>
            <h2 className="mt-4 text-2xl md:text-3xl font-bold text-slate-900 mb-8">{currentQuestion.text}</h2>
            {currentQuestion.type === 'CHOICE' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {currentQuestion.options?.map(opt => (
                  <button key={opt.key} onClick={() => setAnswers({...answers, [currentQuestion.id]: opt.key})} className={`flex items-center p-6 border-4 rounded-3xl text-left transition-all ${answers[currentQuestion.id] === opt.key ? 'border-orange-500 bg-orange-50' : 'border-slate-50 bg-slate-50/30'}`}>
                    <div className={`w-12 h-12 flex items-center justify-center font-black rounded-2xl mr-4 ${answers[currentQuestion.id] === opt.key ? 'bg-orange-600 text-white' : 'bg-white text-slate-400 border'}`}>{opt.key}</div>
                    <span className="text-xl font-bold text-slate-700">{opt.text}</span>
                  </button>
                ))}
              </div>
            ) : (
              <input type="text" value={answers[currentQuestion.id] || ''} onChange={e => setAnswers({...answers, [currentQuestion.id]: e.target.value})} className="w-full p-6 text-2xl font-bold edu-input rounded-[1.5rem]" placeholder="Javobni kiriting..." />
            )}
          </motion.div>
        </main>

        <footer className="p-8 border-t bg-white sticky bottom-0 flex justify-between items-center shadow-lg">
          <button disabled={currentQuestionIndex === 0} onClick={() => setCurrentQuestionIndex(prev => prev - 1)} className="font-black text-slate-400 disabled:opacity-0 flex items-center gap-2"><ChevronLeft size={20}/> Oldingi</button>
          
          <div className="flex items-center gap-4">
            <span className="text-xs font-bold text-slate-300 hidden md:block">EduExam Smart Test System</span>
            {currentQuestionIndex === exam.questions.length - 1 ? (
              <button onClick={() => finishExam()} className="px-12 py-5 bg-orange-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-orange-100 hover:scale-105 transition-transform active:scale-95">Tugatish <CheckCircle2 className="inline ml-2"/></button>
            ) : (
              <button onClick={() => setCurrentQuestionIndex(prev => prev + 1)} className="px-12 py-5 bg-orange-600 text-white font-black text-xl rounded-2xl shadow-xl shadow-orange-100 hover:scale-105 transition-transform active:scale-95">Keyingi <ChevronRight className="inline ml-2"/></button>
            )}
          </div>
        </footer>
      </div>
    );
  }

  const result = calculateResults();
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="text-center p-16 bg-white rounded-[4rem] shadow-2xl border-4 border-orange-100 max-w-xl">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 shadow-inner"><CheckCircle2 size={80} className="text-green-500" /></div>
        <h2 className="text-5xl font-black mb-6 text-slate-900">{isAutoSubmitting ? "Vaqt tugadi!" : "Test yakunlandi!"}</h2>
        <div className="bg-slate-50 p-8 rounded-[2rem] mb-10 border border-slate-100 flex justify-around">
           <div><p className="text-xs font-black text-slate-400 uppercase mb-1">Ball</p><p className="text-4xl font-black text-orange-600">{result.score}</p></div>
           <div><p className="text-xs font-black text-slate-400 uppercase mb-1">To'g'ri</p><p className="text-4xl font-black text-green-600">{result.correct}</p></div>
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-[0.3em]"><Flag className="inline mr-2" /> EduExam Smart System</p>
      </div>
    </div>
  );
};
