import React, { useState, useEffect } from 'react';
import { TeamState, OperativeRole } from '../types';
import { teamManager } from '../services/teamService';
import { soundFx } from '../utils/audio';
import { Shield, Clock, Volume2, VolumeX, Trophy, Users, AlertTriangle, Terminal, Clapperboard } from 'lucide-react';

interface CommandCenterHUDProps {
  teamState: TeamState;
  currentRole: OperativeRole;
  onOpenLeaderboard: () => void;
  onOpenAdmin: () => void;
  onReplayIntro?: () => void;
}

export const CommandCenterHUD: React.FC<CommandCenterHUDProps> = ({
  teamState,
  currentRole,
  onOpenLeaderboard,
  onOpenAdmin,
  onReplayIntro,
}) => {
  const [remainingSec, setRemainingSec] = useState<number>(() => teamManager.getRemainingSeconds());
  const [isMuted, setIsMuted] = useState(soundFx.getMuted());

  // Tick the authoritative countdown every 1 second
  useEffect(() => {
    const updateTimer = () => {
      const sec = teamManager.getRemainingSeconds();
      setRemainingSec(sec);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [teamState.missionStartedAt, teamState.missionDurationMinutes]);

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const isLowTime = remainingSec <= 600; // < 10 mins
  const isUrgent = remainingSec <= 300; // < 5 mins

  const toggleSound = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
    soundFx.playKeyTick();
  };

  const handleRoleSwitch = (newRole: OperativeRole) => {
    soundFx.playKeyTick();
    teamManager.setCurrentRole(newRole);
  };

  return (
    <header className="relative z-30 w-full bg-gradient-to-r from-slate-950 via-[#031525] to-slate-950 border-b border-cyan-500/30 backdrop-blur-md px-4 sm:px-6 py-3 shadow-[0_4px_25px_rgba(6,182,212,0.1)]">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Left Zone: Brand & Team ID with gradient styling */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-start">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded border border-cyan-500/50 bg-gradient-to-br from-cyan-950/80 to-blue-950/80 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Shield className="w-4 h-4 text-cyan-300" />
            </div>
            <div>
              <div className="font-orbitron font-extrabold text-sm sm:text-base text-white tracking-widest flex items-center gap-2">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-400">
                  SYSTEM OMEGA
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-gradient-to-r from-cyan-950/80 to-blue-950/80 border border-cyan-500/40 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]">
                  {teamState.teamId}
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 truncate max-w-[180px]">
                {teamState.teamName}
              </div>
            </div>
          </div>

          {/* Operatives Active Status */}
          <div className="flex items-center gap-1.5 bg-slate-900/90 border border-slate-800 rounded px-2 py-1">
            <button
              onClick={() => handleRoleSwitch('OPERATIVE_A')}
              className={`flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded transition-all ${
                currentRole === 'OPERATIVE_A'
                  ? 'bg-gradient-to-r from-cyan-600/40 to-blue-600/40 text-cyan-200 font-bold border border-cyan-400/50 shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Click to act as Operative A"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>OP-A</span>
            </button>

            <span className="text-slate-700">|</span>

            <button
              onClick={() => handleRoleSwitch('OPERATIVE_B')}
              className={`flex items-center gap-1.5 text-[11px] font-mono px-2 py-0.5 rounded transition-all ${
                currentRole === 'OPERATIVE_B'
                  ? 'bg-gradient-to-r from-emerald-600/40 to-teal-600/40 text-emerald-200 font-bold border border-emerald-400/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Click to act as Operative B"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>OP-B</span>
            </button>
          </div>
        </div>

        {/* Center Zone: Authoritative Mission Timer */}
        <div className="flex items-center gap-3">
          <div className={`flex items-center gap-2.5 px-4 py-1.5 rounded border backdrop-blur-sm transition-all ${
            isUrgent
              ? 'bg-gradient-to-r from-red-950/80 to-rose-950/80 border-red-500 text-red-400 animate-pulse glow-red'
              : isLowTime
              ? 'bg-gradient-to-r from-amber-950/80 to-yellow-950/80 border-amber-500 text-amber-300 glow-amber'
              : 'bg-gradient-to-r from-slate-900/90 via-cyan-950/50 to-slate-900/90 border-cyan-500/40 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
          }`}>
            <Clock className={`w-4 h-4 ${isUrgent ? 'animate-spin' : ''}`} />
            <div className="flex flex-col">
              <span className="text-[9px] font-mono tracking-widest uppercase text-slate-400">
                AUTHORITATIVE TIMER
              </span>
              <span className="font-orbitron font-bold text-lg sm:text-xl tracking-widest tabular-nums">
                {formatTimer(remainingSec)}
              </span>
            </div>
          </div>
        </div>

        {/* Right Zone: XP Score, Sectors count, Controls */}
        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {/* XP Score */}
          <div className="text-right">
            <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400">
              TEAM SCORE
            </div>
            <div className="font-orbitron font-bold text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-yellow-500 tracking-wider tabular-nums">
              {String(teamState.score).padStart(4, '0')} <span className="text-xs text-yellow-500 font-mono">XP</span>
            </div>
          </div>

          {/* Sectors Completed */}
          <div className="text-right pl-3 border-l border-slate-800">
            <div className="text-[9px] font-mono tracking-widest uppercase text-slate-400">
              SECTORS
            </div>
            <div className="font-orbitron font-bold text-base sm:text-lg text-cyan-300 tracking-wider tabular-nums">
              {teamState.completedSectors.length} <span className="text-xs text-slate-500 font-mono">/ 15</span>
            </div>
          </div>

          {/* Action buttons with Small Glowing Dot for Admin */}
          <div className="flex items-center gap-2 pl-2">
            {onReplayIntro && (
              <button
                type="button"
                onClick={onReplayIntro}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono text-cyan-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-cyan-500/40 rounded transition-all cursor-pointer shadow-[0_0_10px_rgba(6,182,212,0.15)]"
                title="Watch / Replay Starting Animation"
              >
                <Clapperboard className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Intro</span>
              </button>
            )}

            <button
              onClick={onOpenLeaderboard}
              className="p-2 text-slate-400 hover:text-yellow-400 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-yellow-500/40 rounded transition-all cursor-pointer"
              title="View Leaderboard"
            >
              <Trophy className="w-4 h-4" />
            </button>

            <button
              onClick={toggleSound}
              className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-900/70 hover:bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded transition-all cursor-pointer"
              title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>

            {/* Admin Panel Trigger: Small Glowing Dot as requested */}
            <button
              onClick={onOpenAdmin}
              className="relative p-2 flex items-center justify-center cursor-pointer group"
              title="Facility Telemetry (Admin Override)"
            >
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_12px_#ef4444] animate-pulse group-hover:scale-125 transition-transform" />
              <span className="absolute w-4 h-4 rounded-full border border-red-500/40 animate-ping pointer-events-none" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
