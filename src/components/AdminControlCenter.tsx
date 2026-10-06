import React, { useState, useEffect } from 'react';
import { TeamState } from '../types';
import { teamManager } from '../services/teamService';
import { listenToAllTeams, listenToEventConfig } from '../services/firebaseService';
import { soundFx } from '../utils/audio';
import {
  ShieldAlert,
  Clock,
  Zap,
  AlertTriangle,
  Check,
  RotateCcw,
  Trash2,
  Save,
  X,
  Users,
  ShieldCheck,
} from 'lucide-react';

interface AdminControlCenterProps {
  teamState: TeamState;
  onClose: () => void;
}

export const AdminControlCenter: React.FC<AdminControlCenterProps> = ({ teamState, onClose }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState('');

  const [liveTeams, setLiveTeams] = useState<any[]>([]);
  const [configuredDuration, setConfiguredDuration] = useState<number>(105);
  const [customDurationInput, setCustomDurationInput] = useState<string>('105');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const [emergencyAlert, setEmergencyAlert] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  // Subscribe to real-time teams and eventConfig
  useEffect(() => {
    if (!isAuthenticated) return;

    const unsubTeams = listenToAllTeams((teams) => {
      setLiveTeams(teams);
    });

    const unsubConfig = listenToEventConfig((cfg) => {
      if (cfg && cfg.durationMinutes) {
        setConfiguredDuration(cfg.durationMinutes);
        setCustomDurationInput(cfg.durationMinutes.toString());
      }
    });

    return () => {
      unsubTeams();
      unsubConfig();
    };
  }, [isAuthenticated]);

  const showNotification = (msg: string) => {
    setActionNotice(msg);
    setTimeout(() => setActionNotice(null), 4000);
  };

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

  const handleAddMinutes = async (mins: number) => {
    soundFx.playKeyTick();
    await teamManager.adminAddMinutes(mins);
    showNotification(`Adjusted mission timer by ${mins > 0 ? '+' : ''}${mins} minutes.`);
  };

  const handleSaveCustomDuration = async (e: React.FormEvent) => {
    e.preventDefault();
    soundFx.playKeyTick();
    const parsed = parseInt(customDurationInput, 10);
    if (isNaN(parsed) || parsed < 5) {
      showNotification('Duration must be at least 5 minutes.');
      return;
    }
    const ok = await teamManager.adminSetCustomDuration(parsed);
    if (ok) {
      soundFx.playFlagSuccess();
      setConfiguredDuration(parsed);
      showNotification(`Saved authoritative duration (${parsed}m) to Firebase.`);
    } else {
      soundFx.playFlagError();
      showNotification('Failed to save event duration to Firebase.');
    }
  };

  const handleAdjustScore = async (delta: number) => {
    soundFx.playKeyTick();
    await teamManager.adminAdjustScore(delta);
    showNotification(`Adjusted score by ${delta > 0 ? '+' : ''}${delta} XP.`);
  };

  const handleUnlockAll = async () => {
    soundFx.playFlagSuccess();
    await teamManager.adminUnlockAllSectors();
    showNotification('Unlocked all 15 sectors for current squad.');
  };

  // Reset single team
  const handleResetSingleTeam = async (targetTeamId: string, teamName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to reset gameplay for team "${teamName}" (${targetTeamId})?\n\nThis clears score, sectors cleared, hints, penalties, and timer while preserving registration accounts.`
    );
    if (confirmed) {
      soundFx.playFlagError();
      await teamManager.adminResetTeam(targetTeamId);
      showNotification(`Team "${teamName}" gameplay has been reset.`);
    }
  };

  // Reset ALL teams
  const handleResetAllTeams = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to reset all teams?\n\nThis clears game progress, scores, and completed sectors for all registered squads while preserving team registrations.'
    );
    if (confirmed) {
      soundFx.playFlagError();
      const count = await teamManager.adminResetAllTeams();
      showNotification(`Reset gameplay state for ${count} squads in Firebase.`);
    }
  };

  // Delete team completely
  const handleDeleteSingleTeam = async (targetTeamId: string, teamName: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to PERMANENTLY DELETE team "${teamName}" (${targetTeamId})?\n\nThis removes the team registration and all associated data completely from Firestore.`
    );
    if (confirmed) {
      soundFx.playFlagError();
      const ok = await teamManager.adminDeleteTeam(targetTeamId);
      if (ok) {
        showNotification(`Team "${teamName}" permanently deleted from Firestore.`);
      }
    }
  };

  // Purge legacy demo teams
  const handlePurgeDemos = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to purge any old demo/mock squads from Firebase?'
    );
    if (confirmed) {
      soundFx.playKeyTick();
      const count = await teamManager.adminPurgeLegacyDemos();
      showNotification(`Purged ${count} legacy demo squads from database.`);
    }
  };

  const handleBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emergencyAlert) return;
    soundFx.playFlagSuccess();
    teamManager.sendChatMessage(`[ADMIN BROADCAST] ${emergencyAlert}`, true);
    setAlertSent(true);
    setEmergencyAlert('');
    setTimeout(() => setAlertSent(false), 3000);
  };

  const totalTeamsCount = liveTeams.length;
  const activeTeamsCount = liveTeams.filter((t) => t.status === 'active').length;
  const completedTeamsCount = liveTeams.filter(
    (t) => t.status === 'completed' || (Array.isArray(t.completedSectors) && t.completedSectors.length >= 15)
  ).length;

  return (
    <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto">
      <div className="w-full max-w-4xl bg-slate-950 border border-red-500/40 rounded-lg p-6 sm:p-8 shadow-[0_0_50px_rgba(239,68,68,0.2)] relative max-h-[90vh] flex flex-col my-auto">
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
          <div className="space-y-6 overflow-y-auto pr-1 flex-1">
            {/* Action Notice Toast */}
            {actionNotice && (
              <div className="p-3 bg-cyan-950/80 border border-cyan-400 text-cyan-200 text-xs font-mono rounded flex items-center gap-2">
                <Check className="w-4 h-4 text-cyan-400" />
                <span>{actionNotice}</span>
              </div>
            )}

            {/* Header Telemetry */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-red-400 font-bold uppercase tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>EVENT STATUS: AUTHORITATIVE FIREBASE SYNC</span>
                </div>
                <h1 className="text-2xl font-orbitron font-extrabold text-white mt-1">
                  OMEGA CONTROL CENTER
                </h1>
              </div>

              <div className="grid grid-cols-4 gap-2 text-center text-xs font-mono">
                <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">TOTAL TEAMS</div>
                  <div className="text-white font-bold">{totalTeamsCount}</div>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">ACTIVE</div>
                  <div className="text-emerald-400 font-bold">{activeTeamsCount}</div>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">COMPLETED</div>
                  <div className="text-cyan-400 font-bold">{completedTeamsCount}</div>
                </div>
                <div className="bg-slate-900 px-3 py-1.5 rounded border border-slate-800">
                  <div className="text-slate-500 text-[9px]">TIME REMAINING</div>
                  <div className="text-yellow-400 font-bold">
                    {Math.floor(teamManager.getRemainingSeconds() / 60)}m
                  </div>
                </div>
              </div>
            </div>

            {/* Time Settings & Controls */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mission Duration Configuration (Firebase eventConfig/main) */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded space-y-3 font-mono text-xs">
                <div className="text-cyan-400 font-bold uppercase flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-cyan-400" /> MISSION TIME SETTINGS
                  </span>
                  <span className="text-[10px] text-yellow-400">
                    CURRENT: {configuredDuration} MIN
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Quick Adjust Active:</span>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleAddMinutes(15)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                    >
                      +15m
                    </button>
                    <button
                      onClick={() => handleAddMinutes(-15)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                    >
                      -15m
                    </button>
                    <button
                      onClick={() => handleAddMinutes(5)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                    >
                      +5m
                    </button>
                    <button
                      onClick={() => handleAddMinutes(-5)}
                      className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded cursor-pointer"
                    >
                      -5m
                    </button>
                  </div>
                </div>

                <form onSubmit={handleSaveCustomDuration} className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block text-[11px] text-slate-400">
                    CONFIGURE DURATION (Default: 105 Minutes)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="5"
                      max="600"
                      value={customDurationInput}
                      onChange={(e) => setCustomDurationInput(e.target.value)}
                      className="flex-1 bg-black/60 border border-slate-700 px-3 py-1.5 text-white font-mono rounded outline-none"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-black font-bold uppercase rounded cursor-pointer flex items-center gap-1"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Config</span>
                    </button>
                  </div>
                </form>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
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
              </div>

              {/* Broadcast Alert & Global Actions */}
              <div className="p-4 bg-slate-900/60 border border-slate-800 rounded space-y-3 font-mono text-xs">
                <div className="text-yellow-400 font-bold uppercase">EVENT BROADCAST ANNOUNCEMENT</div>
                <form onSubmit={handleBroadcast} className="space-y-2">
                  <input
                    type="text"
                    value={emergencyAlert}
                    onChange={(e) => setEmergencyAlert(e.target.value)}
                    placeholder="e.g. 15 minutes remaining! Sector 10 anomaly detected!"
                    className="w-full bg-black/60 border border-slate-700 px-3 py-1.5 text-white rounded outline-none"
                  />
                  <button
                    type="submit"
                    className="w-full py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase rounded cursor-pointer"
                  >
                    {alertSent ? 'BROADCAST TRANSMITTED ✓' : 'TRANSMIT TO ALL OPERATIVES'}
                  </button>
                </form>

                <div className="pt-3 border-t border-slate-800 space-y-2">
                  <div className="text-red-400 font-bold uppercase text-[10px]">GLOBAL EVENT CONTROLS</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={handleResetAllTeams}
                      className="py-1.5 px-2 bg-red-950/70 border border-red-500/50 hover:bg-red-900 text-red-200 font-bold uppercase rounded cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RESET ALL TEAMS</span>
                    </button>
                    <button
                      onClick={handlePurgeDemos}
                      className="py-1.5 px-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-slate-300 uppercase rounded cursor-pointer flex items-center justify-center gap-1.5 text-[11px]"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Purge Demos</span>
                    </button>
                  </div>
                  <button
                    onClick={handleUnlockAll}
                    className="w-full py-1.5 bg-cyan-950/50 border border-cyan-500/40 hover:bg-cyan-900/50 text-cyan-200 font-bold uppercase rounded cursor-pointer"
                  >
                    Unlock All 15 Sectors (Current Squad)
                  </button>
                </div>
              </div>
            </div>

            {/* Live Teams Monitoring Table with RESET and DELETE Controls */}
            <div className="p-4 bg-slate-900/40 border border-slate-800 rounded font-mono text-xs space-y-2">
              <div className="flex items-center justify-between">
                <div className="text-slate-400 font-bold uppercase">
                  LIVE TEAMS TELEMETRY & MANAGEMENT ({liveTeams.length})
                </div>
                <div className="text-[10px] text-slate-500">
                  REAL-TIME FIRESTORE DATA
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-slate-300">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                      <th className="py-2">TEAM ID</th>
                      <th className="py-2">TEAM NAME</th>
                      <th className="py-2">OPERATIVES</th>
                      <th className="py-2">SCORE</th>
                      <th className="py-2">SECTORS</th>
                      <th className="py-2">STATUS</th>
                      <th className="py-2 text-right">MANAGE ACTIONS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {liveTeams.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                          No teams registered yet.
                        </td>
                      </tr>
                    ) : (
                      liveTeams.map((t) => {
                        const isCurrent = t.teamId === teamState.teamId;
                        const sectorsCount = Array.isArray(t.completedSectors) ? t.completedSectors.length : 0;
                        const leaderName = t.leader?.username || '—';
                        const op2Name = t.operative2?.username || '—';

                        return (
                          <tr
                            key={t.teamId}
                            className={`border-b border-slate-800/60 ${
                              isCurrent ? 'bg-cyan-950/20 text-cyan-200' : ''
                            }`}
                          >
                            <td className="py-2 font-bold">
                              {t.teamId} {isCurrent && '(CURRENT)'}
                            </td>
                            <td>{t.teamName}</td>
                            <td className="text-[10px] text-slate-400">
                              {leaderName} &amp; {op2Name}
                            </td>
                            <td className="text-yellow-400 font-bold">{t.score || 0} XP</td>
                            <td>{sectorsCount} / 15</td>
                            <td>
                              <span
                                className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                  t.status === 'completed'
                                    ? 'bg-emerald-950 text-emerald-400'
                                    : t.status === 'active'
                                    ? 'bg-cyan-950 text-cyan-400'
                                    : 'bg-slate-900 text-slate-400'
                                }`}
                              >
                                {(t.status || 'WAITING').toUpperCase()}
                              </span>
                            </td>
                            <td className="py-2 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleResetSingleTeam(t.teamId, t.teamName)}
                                  className="px-2 py-0.5 bg-yellow-950/70 border border-yellow-500/40 hover:bg-yellow-900 text-yellow-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                  title="Reset gameplay while keeping accounts"
                                >
                                  RESET
                                </button>
                                <button
                                  onClick={() => handleDeleteSingleTeam(t.teamId, t.teamName)}
                                  className="px-2 py-0.5 bg-red-950/70 border border-red-500/40 hover:bg-red-900 text-red-300 rounded text-[10px] font-bold cursor-pointer transition-colors"
                                  title="Delete team permanently from database"
                                >
                                  DELETE
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
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
