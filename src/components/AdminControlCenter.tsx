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
  Lock,
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
  const [remainingSec, setRemainingSec] = useState<number>(() => teamManager.getRemainingSeconds());

  const [emergencyAlert, setEmergencyAlert] = useState('');
  const [alertSent, setAlertSent] = useState(false);

  // In-App Confirmation Modal States (Replaces window.confirm for iframe reliability)
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{ teamId: string; teamName: string } | null>(null);
  const [confirmResetTarget, setConfirmResetTarget] = useState<{ teamId: string; teamName: string } | null>(null);
  const [showResetAllModal, setShowResetAllModal] = useState<boolean>(false);
  const [showPurgeDemosModal, setShowPurgeDemosModal] = useState<boolean>(false);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  // Live timer tick & listener matching User Panel
  useEffect(() => {
    if (!isAuthenticated) return;
    const updateTimer = () => {
      setRemainingSec(teamManager.getRemainingSeconds());
    };
    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    const unsub = teamManager.subscribe(updateTimer);
    return () => {
      clearInterval(interval);
      unsub();
    };
  }, [isAuthenticated]);

  const formatTimer = (totalSeconds: number): string => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

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
    const updated = Math.max(5, configuredDuration + mins);
    setConfiguredDuration(updated);
    setCustomDurationInput(updated.toString());
    setRemainingSec(teamManager.getRemainingSeconds());
    showNotification(`Adjusted mission timer by ${mins > 0 ? '+' : ''}${mins} minutes across all screens.`);
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
      setRemainingSec(teamManager.getRemainingSeconds());
      showNotification(`Saved authoritative duration (${parsed}m) to Firebase across all screens.`);
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

  // Execution of Delete Single Team
  const executeDeleteTeam = async () => {
    if (!confirmDeleteTarget) return;
    const { teamId: targetId, teamName: targetName } = confirmDeleteTarget;
    setIsDeleting(true);
    soundFx.playFlagError();

    try {
      // Optimistically remove from local state immediately
      setLiveTeams((prev) => prev.filter((t) => t.teamId !== targetId));
      const ok = await teamManager.adminDeleteTeam(targetId);
      if (ok) {
        showNotification(`Team "${targetName}" (${targetId}) permanently deleted.`);
      } else {
        showNotification(`Failed to delete team "${targetName}". Check database connection.`);
      }
    } catch (err: any) {
      showNotification(`Error deleting team: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsDeleting(false);
      setConfirmDeleteTarget(null);
    }
  };

  // Execution of Reset Single Team
  const executeResetTeam = async () => {
    if (!confirmResetTarget) return;
    const { teamId: targetId, teamName: targetName } = confirmResetTarget;
    soundFx.playFlagError();

    try {
      await teamManager.adminResetTeam(targetId);
      showNotification(`Team "${targetName}" (${targetId}) gameplay progress has been reset.`);
    } catch (err: any) {
      showNotification(`Error resetting team: ${err?.message || 'Unknown error'}`);
    } finally {
      setConfirmResetTarget(null);
    }
  };

  // Execution of Reset All Teams
  const executeResetAllTeams = async () => {
    soundFx.playFlagError();
    setShowResetAllModal(false);

    try {
      const count = await teamManager.adminResetAllTeams();
      showNotification(`Reset gameplay state for ${count} squads in Firebase.`);
    } catch (err: any) {
      showNotification(`Error resetting all teams: ${err?.message || 'Unknown error'}`);
    }
  };

  // Execution of Purge Demos
  const executePurgeDemos = async () => {
    soundFx.playKeyTick();
    setShowPurgeDemosModal(false);

    try {
      const count = await teamManager.adminPurgeLegacyDemos();
      showNotification(`Purged ${count} legacy demo squads from database.`);
    } catch (err: any) {
      showNotification(`Error purging demo squads: ${err?.message || 'Unknown error'}`);
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
                <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-red-400" />
                  <span>MASTER SECURITY PASSKEY</span>
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter security passkey..."
                  required
                  autoFocus
                  className="w-full bg-slate-900 border border-slate-700 focus:border-red-500 px-3.5 py-2 text-sm font-mono text-white rounded outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 text-white font-orbitron font-bold text-xs tracking-widest uppercase rounded cursor-pointer transition-colors shadow-[0_0_20px_rgba(239,68,68,0.3)]"
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
                  <div className="text-yellow-400 font-bold font-orbitron tracking-wider">
                    {formatTimer(remainingSec)}
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
                  <span className="text-[10px] text-yellow-400 font-bold">
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
                      onClick={() => setShowResetAllModal(true)}
                      className="py-1.5 px-2 bg-red-950/70 border border-red-500/50 hover:bg-red-900 text-red-200 font-bold uppercase rounded cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>RESET ALL TEAMS</span>
                    </button>
                    <button
                      onClick={() => setShowPurgeDemosModal(true)}
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
                                  type="button"
                                  onClick={() => setConfirmResetTarget({ teamId: t.teamId, teamName: t.teamName })}
                                  className="px-2.5 py-1 bg-yellow-950/70 border border-yellow-500/50 hover:bg-yellow-900 text-yellow-300 rounded text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
                                  title="Reset gameplay while keeping accounts"
                                >
                                  RESET
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteTarget({ teamId: t.teamId, teamName: t.teamName })}
                                  className="px-2.5 py-1 bg-red-950/70 border border-red-500/50 hover:bg-red-900 text-red-300 rounded text-[10px] font-bold cursor-pointer transition-colors shadow-sm"
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

        {/* =========================================================================
            IN-APP MODAL 1: CONFIRM TEAM DELETION (REPLACES BROKEN window.confirm)
            ========================================================================= */}
        {confirmDeleteTarget && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
            <div className="w-full max-w-md bg-slate-950 border border-red-500 rounded-xl p-6 shadow-[0_0_60px_rgba(239,68,68,0.4)] space-y-4 font-mono text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-sm">
                <AlertTriangle className="w-5 h-5 text-red-400 animate-pulse" />
                <span>CONFIRM PERMANENT DELETION</span>
              </div>

              <p className="text-slate-300 leading-relaxed">
                Are you sure you want to permanently delete team{' '}
                <strong className="text-white font-orbitron text-sm">{confirmDeleteTarget.teamName}</strong>{' '}
                (<span className="text-yellow-400 font-bold">{confirmDeleteTarget.teamId}</span>)?
              </p>

              <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-red-300 text-[11px] leading-relaxed">
                ⚠️ <span className="font-bold">PERMANENT ACTION:</span> This completely purges the team registration, score, accounts, and telemetry from Firestore. This cannot be undone.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setConfirmDeleteTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={executeDeleteTeam}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold uppercase rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.5)] disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{isDeleting ? 'DELETING...' : 'DELETE SQUAD'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            IN-APP MODAL 2: CONFIRM TEAM RESET
            ========================================================================= */}
        {confirmResetTarget && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
            <div className="w-full max-w-md bg-slate-950 border border-yellow-500 rounded-xl p-6 shadow-[0_0_60px_rgba(234,179,8,0.3)] space-y-4 font-mono text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-yellow-400 font-bold uppercase tracking-wider text-sm">
                <RotateCcw className="w-5 h-5 text-yellow-400" />
                <span>CONFIRM GAMEPLAY RESET</span>
              </div>

              <p className="text-slate-300 leading-relaxed">
                Are you sure you want to reset gameplay for team{' '}
                <strong className="text-white font-orbitron text-sm">{confirmResetTarget.teamName}</strong>{' '}
                (<span className="text-yellow-400 font-bold">{confirmResetTarget.teamId}</span>)?
              </p>

              <div className="p-3 bg-yellow-950/40 border border-yellow-500/40 rounded-lg text-yellow-300 text-[11px] leading-relaxed">
                ℹ️ <span className="font-bold">GAMEPLAY RESET:</span> Clears score (0 XP), completed sectors, hints used, and timer. Team registration, usernames, and authentication accounts remain intact.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setConfirmResetTarget(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={executeResetTeam}
                  className="px-4 py-2 bg-yellow-500 hover:bg-yellow-400 text-black font-bold uppercase rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-[0_0_20px_rgba(234,179,8,0.4)]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RESET PROGRESS</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            IN-APP MODAL 3: CONFIRM RESET ALL TEAMS
            ========================================================================= */}
        {showResetAllModal && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
            <div className="w-full max-w-md bg-slate-950 border border-red-500 rounded-xl p-6 shadow-[0_0_60px_rgba(239,68,68,0.4)] space-y-4 font-mono text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-red-400 font-bold uppercase tracking-wider text-sm">
                <RotateCcw className="w-5 h-5 text-red-400 animate-spin" />
                <span>CONFIRM RESET ALL SQUADS</span>
              </div>

              <p className="text-slate-300 leading-relaxed">
                Are you sure you want to reset gameplay progress for <strong className="text-white">ALL registered teams</strong> in Firebase?
              </p>

              <div className="p-3 bg-red-950/50 border border-red-500/40 rounded-lg text-red-300 text-[11px] leading-relaxed">
                ⚠️ This resets all squads' scores to 0, clears all solves, and restarts their status while preserving team registrations and operative credentials.
              </div>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowResetAllModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={executeResetAllTeams}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold uppercase rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-[0_0_20px_rgba(239,68,68,0.5)]"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>RESET ALL TEAMS</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* =========================================================================
            IN-APP MODAL 4: CONFIRM PURGE DEMO SQUADS
            ========================================================================= */}
        {showPurgeDemosModal && (
          <div className="fixed inset-0 z-[60] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 select-none">
            <div className="w-full max-w-md bg-slate-950 border border-cyan-500 rounded-xl p-6 shadow-[0_0_60px_rgba(6,182,212,0.3)] space-y-4 font-mono text-xs animate-in fade-in duration-200">
              <div className="flex items-center gap-2 text-cyan-400 font-bold uppercase tracking-wider text-sm">
                <Trash2 className="w-5 h-5 text-cyan-400" />
                <span>PURGE LEGACY DEMO SQUADS</span>
              </div>

              <p className="text-slate-300 leading-relaxed">
                Scan Firestore and purge any remaining legacy demo squads (e.g. OMEGA-017 / CYBER VANGUARD)?
              </p>

              <div className="flex justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPurgeDemosModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold rounded-lg cursor-pointer transition-colors"
                >
                  CANCEL
                </button>
                <button
                  type="button"
                  onClick={executePurgeDemos}
                  className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase rounded-lg cursor-pointer transition-colors flex items-center gap-1.5 shadow-[0_0_20px_rgba(6,182,212,0.4)]"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>PURGE DEMOS</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
