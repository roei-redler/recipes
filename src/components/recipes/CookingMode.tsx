import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, CheckCircle2, Timer, Play, Pause, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Recipe } from '../../lib/types';

interface CookingModeProps {
  recipe: Recipe;
  onExit: () => void;
}

function playBeep() {
  try {
    const ctx = new AudioContext();
    const gainNode = ctx.createGain();
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    gainNode.connect(ctx.destination);

    // Three pleasant tones
    const freqs = [523, 659, 784]; // C5, E5, G5 — a major chord
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
      osc.connect(gainNode);
      osc.start(ctx.currentTime + i * 0.15);
      osc.stop(ctx.currentTime + i * 0.15 + 1.0);
    });
  } catch {
    // AudioContext not available — silent fail
  }
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function CookingMode({ recipe, onExit }: CookingModeProps) {
  const steps = recipe.steps ?? [];
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState<Set<number>>(new Set());

  // Timer state
  const [timerSeconds, setTimerSeconds] = useState<number | null>(null);
  const [timerRunning, setTimerRunning] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const beeped = useRef(false);

  const step = steps[currentStep];

  // Reset timer when step changes
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    beeped.current = false;
    const dur = step?.duration;
    setTimerSeconds(dur && dur > 0 ? dur * 60 : null);
  }, [currentStep, step?.duration]);

  // Countdown
  useEffect(() => {
    if (!timerRunning) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    intervalRef.current = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev === null || prev <= 0) return prev;
        const next = prev - 1;
        if (next === 0 && !beeped.current) {
          beeped.current = true;
          playBeep();
        }
        return next;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [timerRunning]);

  const resetTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setTimerRunning(false);
    beeped.current = false;
    const dur = step?.duration;
    setTimerSeconds(dur && dur > 0 ? dur * 60 : null);
  }, [step?.duration]);

  const markDone = () => {
    setCompleted((prev) => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      setCurrentStep((s) => s + 1);
    }
  };

  const goNext = () => { if (currentStep < steps.length - 1) setCurrentStep((s) => s + 1); };
  const goPrev = () => { if (currentStep > 0) setCurrentStep((s) => s - 1); };

  const allDone = completed.size === steps.length;

  const timerDone = timerSeconds === 0;
  const timerColor = timerDone
    ? 'text-fresh-500'
    : timerSeconds !== null && timerSeconds <= 30
    ? 'text-red-500'
    : 'text-brand-500';

  return (
    <div className="fixed inset-0 z-50 bg-warm-950 flex flex-col" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <h2 className="text-white font-bold text-lg line-clamp-1">{recipe.title}</h2>
          <span className="text-white/40 text-sm">
            {currentStep + 1} / {steps.length}
          </span>
        </div>
        <button
          onClick={onExit}
          className="w-9 h-9 rounded-full bg-white/10 text-white/70 flex items-center justify-center hover:bg-white/20 hover:text-white transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex items-center gap-1.5 px-4 pt-4 pb-2">
        {steps.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentStep(i)}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === currentStep
                ? 'bg-brand-400 w-8'
                : completed.has(i)
                ? 'bg-fresh-500 w-4'
                : 'bg-white/20 w-4'
            }`}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.25 }}
            className="max-w-lg mx-auto"
          >
            {/* Step number */}
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-bold shadow-lg ${
                completed.has(currentStep)
                  ? 'bg-fresh-500 text-white'
                  : 'bg-brand-500 text-white'
              }`}>
                {completed.has(currentStep) ? <CheckCircle2 size={24} /> : currentStep + 1}
              </div>
              <span className="text-white/50 text-sm">שלב {currentStep + 1}</span>
            </div>

            {/* Step image */}
            {step?.image_url && (
              <img
                src={step.image_url}
                alt={`שלב ${currentStep + 1}`}
                className="w-full rounded-2xl mb-5 max-h-56 object-cover"
              />
            )}

            {/* Step description */}
            <p className="text-white text-xl leading-relaxed font-medium mb-8">
              {step?.description}
            </p>

            {/* Timer */}
            {timerSeconds !== null && (
              <div className={`bg-white/10 rounded-2xl p-6 mb-6 text-center border ${timerDone ? 'border-fresh-500/50' : 'border-white/10'}`}>
                {timerDone ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center gap-2"
                  >
                    <CheckCircle2 size={40} className="text-fresh-400" />
                    <p className="text-fresh-400 font-bold text-lg">הזמן עבר!</p>
                    <button
                      onClick={resetTimer}
                      className="flex items-center gap-1.5 text-xs text-white/50 hover:text-white/80 transition-colors mt-1"
                    >
                      <RotateCcw size={12} /> איפוס
                    </button>
                  </motion.div>
                ) : (
                  <>
                    <div className={`text-5xl font-bold tabular-nums tracking-tight mb-4 ${timerColor}`}>
                      {formatTime(timerSeconds)}
                    </div>
                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setTimerRunning((r) => !r)}
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 text-white font-semibold hover:bg-brand-600 transition-colors"
                      >
                        {timerRunning ? <Pause size={18} /> : <Play size={18} />}
                        {timerRunning ? 'עצור' : 'התחל'}
                      </button>
                      <button
                        onClick={resetTimer}
                        className="w-10 h-10 rounded-xl bg-white/10 text-white/70 flex items-center justify-center hover:bg-white/20 hover:text-white transition-colors"
                      >
                        <RotateCcw size={16} />
                      </button>
                    </div>
                    {step?.duration && (
                      <p className="text-white/30 text-xs mt-3 flex items-center justify-center gap-1">
                        <Timer size={11} /> {step.duration} דקות
                      </p>
                    )}
                  </>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom controls */}
      <div className="px-4 pb-8 pt-4 border-t border-white/10">
        {allDone ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-4"
          >
            <p className="text-fresh-400 text-2xl font-bold mb-2">המתכון מוכן!</p>
            <p className="text-white/50 text-sm mb-5">בתיאבון</p>
            <button
              onClick={onExit}
              className="px-8 py-3 rounded-2xl bg-fresh-500 text-white font-bold hover:bg-fresh-600 transition-colors"
            >
              סיים
            </button>
          </motion.div>
        ) : (
          <div className="flex items-center gap-3 max-w-lg mx-auto">
            <button
              onClick={goPrev}
              disabled={currentStep === 0}
              className="w-12 h-12 rounded-xl bg-white/10 text-white/70 flex items-center justify-center hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight size={22} />
            </button>

            <button
              onClick={markDone}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 rounded-2xl bg-gradient-to-l from-brand-600 to-orange-500 text-white font-bold text-base shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
            >
              <CheckCircle2 size={20} />
              {completed.has(currentStep) ? 'שלב הושלם — הבא' : 'סמן כהושלם והבא'}
            </button>

            <button
              onClick={goNext}
              disabled={currentStep === steps.length - 1}
              className="w-12 h-12 rounded-xl bg-white/10 text-white/70 flex items-center justify-center hover:bg-white/20 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft size={22} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
