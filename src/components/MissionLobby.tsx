import React, { useState, useEffect } from 'react';
import { TeamState, OperativeRole } from '../types';
import { teamManager } from '../services/teamService';
import { soundFx } from '../utils/audio';
import { Shield, Check, Clock, Radio, Users, ChevronRight, Zap, Clapperboard } from 'lucide-react';

interface MissionLobbyProps {
  teamState: TeamState;
  currentRole: OperativeRole;
  onReplayIntro?: () => void;
}

export const MissionLobby: React.FC<MissionLobbyProps> = ({ teamState, currentRole, onReplayIntro }) => {
  const [countdown, setCountdown] = useState<number | null>(null);

  const isLeaderReady = teamState.leader.isReady;
  const isSecondReady = teamState.secondOperative ? teamState.secondOperative.isReady : false;
  const bothReady = isLeaderReady && isSecondReady;

  // Handle countdown
  useEffect(() => {
    if (teamState.status === 'countdown') {
      let count = 3;
      setCountdown(3);
      soundFx.playCountdownBeep(false);

      const interval = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
          soundFx.playCountdownBeep(false);
        } else if (count === 0) {
          setCountdown(0);
          soundFx.playCountdownBeep(true);
        } else {
          clearInterval(interval);
          setCountdown(null);
          teamManager.activateMissionTimer();
          soundFx.playLandingImpact();
        }
      }, 1000);

      return () => clearInterval(interval);
    } else {
      setCountdown(null);
    }
  }, [teamState.status]);

  const toggleMyReady = () => {
    soundFx.playKeyTick();
    teamManager.toggleOperativeReady(currentRole);
  };

  const toggleTeammateReady = () => {
    soundFx.playKeyTick();
    const otherRole: OperativeRole = currentRole === 'OPERATIVE_A' ? 'OPERATIVE_B' : 'OPERATIVE_A';
    teamManager.toggleOperativeReady(otherRole);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Cyber Background elements */}
      <div className="absolute inset-0 scanlines opacity-50 pointer-events-none" />
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none" />

      {/* COUNTDOWN OVERLAY */}
      {countdown !== null && (
        <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center text-center">
          <div className="text-xs font-mono text-cyan-400 tracking-[0.4em] uppercase mb-4 animate-pulse">
            MISSION INITIALIZATION // ALL OPERATIVES READY
          </div>

          <div className="text-8xl sm:text-9xl font-orbitron font-black text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-white to-cyan-500 text-glow-cyan animate-bounce mb-6">
            {countdown === 0 ? 'START' : countdown}
          </div>

          <div className="text-xl sm:text-2xl font-orbitron text-cyan-300 tracking-widest uppercase">
            {countdown === 0 ? 'OMEGA PROTOCOL ACTIVATED' : 'SYNCHRONIZING SECURE TUNNELS...'}
          </div>
        </div>
      )}

      {/* MAIN LOBBY CARD */}
      <div className="w-full max-w-2xl bg-slate-950/90 border border-cyan-500/30 rounded-lg p-6 sm:p-10 shadow-[0_0_50px_rgba(6,182,212,0.12)] relative z-10 backdrop-blur-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono tracking-widest uppercase mb-1">
              <Shield className="w-4 h-4" />
              <span>SYSTEM OMEGA // MISSION CONTROL</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-orbitron font-bold text-white tracking-wider">
              {teamState.teamName}
            </h1>
            <div className="text-xs font-mono text-cyan-300 mt-0.5">
              TEAM ID: <span className="font-bold">{teamState.teamId}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-cyan-950/50 hover:bg-cyan-900/60 border border-cyan-500/40 text-cyan-300 hover:text-white text-xs font-mono rounded cursor-pointer transition-colors shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                title="Play or replay the starting 3D descent sequence"
              >
                <Clapperboard className="w-3.5 h-3.5 text-cyan-400" />
                <span>Watch Intro</span>
              </button>
            )}

            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded">
              <Radio className={`w-3.5 h-3.5 ${teamState.secondOperative?.isOnline ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
              <span className={`text-xs font-mono font-medium ${teamState.secondOperative?.isOnline ? 'text-emerald-400' : 'text-amber-400'}`}>
                {teamState.secondOperative?.isOnline ? '2 / 2 CONNECTED' : '1 / 2 CONNECTED'}
              </span>
            </div>
          </div>
        </div>

        {/* Briefing Stats */}
        <div className="grid grid-cols-3 gap-3 my-6 text-center">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">DURATION</div>
            <div className="text-base sm:text-lg font-orbitron font-bold text-cyan-300 mt-1">
              {teamState.missionDurationMinutes} MIN
            </div>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">SECTORS</div>
            <div className="text-base sm:text-lg font-orbitron font-bold text-white mt-1">15 SECTORS</div>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded">
            <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">FINAL TARGET</div>
            <div className="text-base sm:text-lg font-orbitron font-bold text-red-400 mt-1">OMEGA CORE</div>
          </div>
        </div>

        {/* OPERATIVE STATUS CARDS */}
        <div className="space-y-3 mb-8">
          {/* OPERATIVE A */}
          <div className={`p-4 rounded border transition-all flex items-center justify-between ${
            isLeaderReady
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/50 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isLeaderReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <div>
                <div className="text-xs font-mono text-slate-400">
                  OPERATIVE A {currentRole === 'OPERATIVE_A' && <span className="text-cyan-400 font-bold">(YOU)</span>}
                </div>
                <div className="font-orbitron font-semibold text-white">
                  {teamState.leader.username || 'LEADER'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              {isLeaderReady ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Check className="w-4 h-4" /> READY
                </span>
              ) : (
                <span className="text-amber-400">WAITING...</span>
              )}
            </div>
          </div>

          {/* OPERATIVE B */}
          <div className={`p-4 rounded border transition-all flex items-center justify-between ${
            isSecondReady
              ? 'bg-emerald-950/20 border-emerald-500/40 text-emerald-300'
              : 'bg-slate-900/50 border-slate-800 text-slate-300'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${isSecondReady ? 'bg-emerald-400' : 'bg-amber-400 animate-pulse'}`} />
              <div>
                <div className="text-xs font-mono text-slate-400">
                  OPERATIVE B {currentRole === 'OPERATIVE_B' && <span className="text-cyan-400 font-bold">(YOU)</span>}
                </div>
                <div className="font-orbitron font-semibold text-white">
                  {teamState.secondOperative?.username || 'AWAITING OPERATIVE 2'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 font-mono text-xs">
              {isSecondReady ? (
                <span className="flex items-center gap-1.5 text-emerald-400 font-bold">
                  <Check className="w-4 h-4" /> READY
                </span>
              ) : (
                <span className="text-amber-400">WAITING...</span>
              )}
            </div>
          </div>
        </div>

        {/* READY ACTION BAR */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={toggleMyReady}
            className={`w-full sm:flex-1 py-3.5 px-6 font-orbitron font-bold text-xs tracking-widest uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-2 ${
              (currentRole === 'OPERATIVE_A' ? isLeaderReady : isSecondReady)
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 hover:bg-emerald-500/30'
                : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_20px_rgba(6,182,212,0.4)]'
            }`}
          >
            <Check className="w-4 h-4" />
            <span>
              {(currentRole === 'OPERATIVE_A' ? isLeaderReady : isSecondReady)
                ? 'STANDBY (CANCEL READY)'
                : 'READY TO ENGAGE'}
            </span>
          </button>

          {/* Simulate Teammate Ready for single tester convenience */}
          <button
            onClick={toggleTeammateReady}
            title="Convenience toggle to mark teammate ready without needing 2 separate tabs"
            className="w-full sm:w-auto px-4 py-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-cyan-300 border border-slate-800 text-xs font-mono rounded transition-colors whitespace-nowrap cursor-pointer"
          >
            Toggle Teammate Ready
          </button>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-900 text-center text-xs text-slate-500 font-mono">
          {bothReady ? (
            <span className="text-cyan-400 font-bold animate-pulse">
              ALL OPERATIVES READY. ACTIVATING OMEGA PROTOCOL...
            </span>
          ) : (
            <span>MISSION LAUNCHES AUTOMATICALLY WHEN BOTH OPERATIVES ARE READY.</span>
          )}
        </div>
      </div>
    </div>
  );
};
