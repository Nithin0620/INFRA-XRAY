/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { Server, Clock, AlertCircle, RefreshCw, X, Sparkles } from 'lucide-react';
import { subscribeToApiActivity } from '../services/api';

export default function ColdStartBanner() {
  const [isSlow, setIsSlow] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    let timer = null;
    let secondsTimer = null;

    const unsubscribe = subscribeToApiActivity((pendingRequests) => {
      if (pendingRequests > 0) {
        // If requests are taking more than 3.5 seconds, trigger cold-start banner
        if (!timer) {
          timer = setTimeout(() => {
            setIsSlow(true);
            setIsDismissed(false);
            setSecondsElapsed(3);
            secondsTimer = setInterval(() => {
              setSecondsElapsed((prev) => prev + 1);
            }, 1000);
          }, 3500);
        }
      } else {
        // All requests finished
        if (timer) clearTimeout(timer);
        if (secondsTimer) clearInterval(secondsTimer);
        timer = null;
        secondsTimer = null;
        setIsSlow(false);
        setSecondsElapsed(0);
      }
    });

    return () => {
      unsubscribe();
      if (timer) clearTimeout(timer);
      if (secondsTimer) clearInterval(secondsTimer);
    };
  }, []);

  if (!isSlow || isDismissed) return null;

  return (
    <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-xl animate-in fade-in slide-in-from-top-4 duration-300">
      <div className="glass-card p-4 sm:p-5 border-2 border-amber-300 bg-white/95 shadow-2xl rounded-3xl backdrop-blur-xl text-stone-900">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="relative w-10 h-10 rounded-2xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md">
              <Server className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-amber-600"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h4 className="text-sm font-bold text-stone-900 flex items-center gap-1.5">
                  Backend Server Waking Up (Cold Start)
                </h4>
                <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  {secondsElapsed}s elapsed
                </span>
              </div>
              <p className="text-xs text-stone-600 mt-1 leading-relaxed">
                Our free-tier cloud backend spins down after inactivity. Please allow{' '}
                <strong className="text-amber-900 font-bold">1–2 minutes</strong> for the instance to warm up. Sorry for the brief wait!
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsDismissed(true)}
            className="text-stone-400 hover:text-stone-700 p-1 transition-colors"
            title="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Animated Warmup Progress Bar */}
        <div className="mt-3.5 w-full bg-stone-100 rounded-full h-1.5 overflow-hidden border border-stone-200">
          <div
            className="bg-gradient-to-r from-amber-500 via-amber-700 to-amber-600 h-full rounded-full transition-all duration-500"
            style={{ width: `${Math.min(95, 15 + secondsElapsed * 2)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
