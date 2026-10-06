import React, { useEffect } from 'react';
import { TeamState } from '../types';
import { soundFx } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Shield, Trophy, Check, Zap, Sparkles, X } from 'lucide-react';

interface VictoryModalProps {
  teamState: TeamState;
  onClose: () => void;
}

export const VictoryModal: React.FC<VictoryModalProps> = ({ teamState, onClose }) => {
  useEffect(() => {
    soundFx.playFlagSuccess();
    // Confetti fireworks
    try {
      confetti({
        particleCount: 120,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06b6d4', '#10b981', '#f59e0b', '#3b82f6'],
      });
    } catch {}
  }, []);

  const totalMinutes = teamState.missionStartedAt && teamState.completedAt
    ? Math.max(1, Math.round((teamState.completedAt - teamState.missionStartedAt) / 60000))
    : 84;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-slate-950 border border-cyan-400 rounded-lg p-6 sm:p-10 shadow-[0_0_80px_rgba(6,182,212,0.4)] text-center relative overflow-hidden animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Holographic Glowing Seal */}
        <div className="w-16 h-16 mx-auto rounded-full bg-cyan-950/40 border-2 border-cyan-400 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(6,182,212,0.6)]">
          <Zap className="w-8 h-8 text-cyan-300 animate-pulse" />
        </div>

        <div className="text-xs font-mono text-cyan-400 tracking-[0.3em] uppercase mb-1">
          SYSTEM OMEGA
        </div>

        <h1 className="text-3xl sm:text-4xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-emerald-400 text-glow-cyan mb-2">
          OMEGA CORE UNLOCKED
        </h1>

        <div className="text-lg font-orbitron font-bold text-emerald-400 tracking-widest uppercase mb-6">
          MISSION COMPLETE
        </div>

        {/* Mission Stats Breakdown */}
        <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-5 mb-6 text-left font-mono text-xs space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="text-slate-400">TEAM CODE:</span>
            <span className="text-white font-bold text-sm">{teamState.teamId} ({teamState.teamName})</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">OPERATIVE A ({teamState.leader.username}):</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" /> VERIFIED
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">OPERATIVE B ({teamState.secondOperative?.username || 'NOVA_PRIME'}):</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <Check className="w-4 h-4" /> VERIFIED
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">SECTORS CLEARED:</span>
            <span className="text-cyan-300 font-bold">15 / 15 SECTORS</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">TOTAL MISSION TIME:</span>
            <span className="text-slate-200 font-bold">{totalMinutes} MINUTES</span>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-slate-800">
            <span className="text-yellow-400 font-bold">FINAL ACCUMULATED SCORE:</span>
            <span className="text-yellow-300 font-orbitron font-extrabold text-base sm:text-lg">
              {teamState.score} XP
            </span>
          </div>
        </div>

        <div className="inline-block px-4 py-2 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 font-orbitron font-bold text-xs tracking-widest uppercase mb-6">
          STATUS: OMEGA PROTOCOL COMPLETE · RANK #2 OF 125
        </div>

        <button
          onClick={onClose}
          className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 text-black font-orbitron font-bold text-xs tracking-widest uppercase rounded cursor-pointer transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)]"
        >
          RETURN TO COMMAND CENTER
        </button>
      </div>
    </div>
  );
};
