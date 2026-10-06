import React, { useState } from 'react';
import { TeamState } from '../types';
import { teamManager, MOCK_LEADERBOARD } from '../services/teamService';
import { soundFx } from '../utils/audio';
import { ShieldAlert, Key, Users, Clock, Zap, AlertTriangle, Check, RefreshCw, X } from 'lucide-react';

interface AdminControlCenterProps {
  teamState: TeamState;
  onClose: () => void;
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({ teamState, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [emergencyAlert, setEmergencyAlert] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playKeyTick();
    if (password === 'OMEGA-OVERRIDE-2026' || password === 'admin' || password === 'omega') {
      setIsAuthenticated(true);
      setAuthError('');
      soundFx.playFlagSuccess();
    } else {
      setAuthError('INVALID PASSKEY. ACCESS DENIED.');
      soundFx.playFlagError();
    }
  };

  const handleAddMinutes = (mins: number) => {
    soundFx.playKeyTick();
    teamManager.adminAddMinutes(mins);
  };

  const handleAdjustScore = (delta: number) => {
    soundFx.playKeyTick();
    teamManager.adminAdjustScore(delta);
  };

  const handleUnlockAll = () => {
    soundFx.playFlagSuccess();
    teamManager.adminUnlockAllSectors();
  };

  const handleResetTeam = () => {
    if (confirm('Are you sure you want to reset current team session?')) {
      soundFx.playFlagError();
      teamManager.adminResetTeam();
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyAlert) return;
    soundFx.playFlagSuccess();
    setAlertSent(true);
    setTimeout(() => setAlertSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-950 border border-red-500/40 rounded-lg p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded hover:bg-slate-900 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {!isAuthenticated ? (
          <div className="max-w-md mx-auto py-6">
            <div className="flex items-center gap-2 text-red-400 mb-2 font-mono text-xs uppercase tracking-widest">
              <ShieldAlert className="w-5 h-5" />
              <span>CLASSIFIED ADMIN OVERRIDE</span>
            </div>
            <h2 className="text-xl font-orbitron font-bold text-white mb-2">
              OMEGA CONTROL AUTHORIZATION
            </h2>
            <p className="text-xs font-mono text-slate-400 mb-6">
              Enter the master security passkey to access event control telemetry.
            </p>

            <form onSubmit={handleLogin} className="space-y-4">
              {authError && (
                <div className="p-2.5 bg-red-950/40 border border-red-500/50 text-red-400 text-xs font-mono rounded">
                  {authError}
                </div>
              )}

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">
                  MASTER PASSKEY (Default: OMEGA-OVERRIDE-2026)
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter passkey..."
                  required
                  className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 px-3.5 py-2 text-sm font-mono text-white rounded outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs tracking-widest uppercase rounded cursor-pointer transition-colors"
              >
                AUTHENTICATE
              </button>
            </form>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Header Telemetry */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>EVENT STATUS: LIVE EVENT RUNNING</span>
                </div>
                <h1 className="text-2xl font-orbitron font-extrabold text-white mt-1">
                  OMEGA CONTROL CENTER
                </h1>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">TOTAL TEAMS</div>
                  <div className="text-white font-bold">125</div>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">ACTIVE</div>
                  <div className="text-emerald-400 font-bold">121</div>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">COMPLETED</div>
                  <div className="text-cyan-400 font-bold">4</div>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">TIME REMAINING</div>
                  <div className="text-yellow-400 font-bold">
                    {Math.floor(teamManager.getRemainingSeconds() / 60)}m
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions & Overrides */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Telemetry Adjustments */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded space-y-3 font-mono text-xs">
                <div className="text-cyan-400 font-bold uppercase">TEAM TIME & SCORE CONTROLS</div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Timer Override:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAddMinutes(15)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                    >
                      +15 Min
                    </button>
                    <button
                      onClick={() => handleAddMinutes(-15)}
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                    >
                      -15 Min
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Score Override:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAdjustScore(100)}
                      className="px-2.5 py-1 bg-emerald-950 text-emerald-300 hover:bg-emerald-900 rounded cursor-pointer"
                    >
                      +100 XP
                    </button>
                    <button
                      onClick={() => handleAdjustScore(-50)}
                      className="px-2.5 py-1 bg-red-950 text-red-300 hover:bg-red-900 rounded cursor-pointer"
                    >
                      -50 XP
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex gap-2">
                  <button
                    onClick={handleUnlockAll}
                    className="flex-1 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase rounded cursor-pointer"
                  >
                    Unlock All 15 Sectors
                  </button>
                  <button
                    onClick={handleResetTeam}
                    className="px-3 py-1.5 bg-red-900/50 hover:bg-red-800 text-red-300 uppercase rounded cursor-pointer"
                  >
                    Reset Team
                  </button>
                </div>
              </div>

              {/* Broadcast Alert */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded space-y-3 font-mono text-xs">
                <div className="text-yellow-400 font-bold uppercase">EVENT BROADCAST ANNOUNCEMENT</div>
                <form onSubmit={handleBroadcast} className="space-y-2">
                  <input
                    type="text"
                    value={emergencyAlert}
                    onChange={(e) => setEmergencyAlert(e.target.value)}
                    placeholder="e.g. 15 minutes remaining! Sector 12 First Blood claimed!"
                    className="w-full bg-black/60 border border-slate-700 px-3 py-1.5 text-white rounded outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase rounded cursor-pointer"
                  >
                    {alertSent ? 'BROADCAST DISPATCHED ✓' : 'TRANSMIT TO ALL OPERATIVES'}
                  </button>
                </form>
              </div>
            </div>

            {/* Live Teams Monitoring Table */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded font-mono text-xs">
              <div className="text-slate-400 font-bold uppercase mb-2">LIVE TEAM TELEMETRY</div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                      <th className="py-2">TEAM ID</th>
                      <th className="py-2">TEAM NAME</th>
                      <th className="py-2">SCORE</th>
                      <th className="py-2">SECTORS</th>
                      <th className="py-2">STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-slate-800/60 bg-cyan-950/20 text-cyan-200">
                      <td className="py-2 font-bold">{teamState.teamId} (CURRENT)</td>
                      <td>{teamState.teamName}</td>
                      <td className="text-yellow-400 font-bold">{teamState.score} XP</td>
                      <td>{teamState.completedSectors.length} / 15</td>
                      <td className="text-emerald-400 font-bold">{teamState.status.toUpperCase()}</td>
                    </tr>
                    {MOCK_LEADERBOARD.slice(0, 4).map((t) => (
                      <tr key={t.teamId} className="border-b border-slate-800/40">
                        <td className="py-2">{t.teamId}</td>
                        <td>{t.teamName}</td>
                        <td className="text-yellow-400">{t.xp} XP</td>
                        <td>{t.sectorsCount} / 15</td>
                        <td className="text-slate-400">{t.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
