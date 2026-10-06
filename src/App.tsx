/**
 * TECH ESCAPE ROOM: THE OMEGA PROTOCOL
 * SYSTEM OMEGA
 * 15 LEVELS. 105 MINUTES. 1 MISSION.
 */

import React, { useState, useEffect } from 'react';
import { TeamState, OperativeRole } from './types';
import { teamManager } from './services/teamService';
import { SECTORS } from './data/sectors';
import { soundFx } from './utils/audio';

import { CinematicOpening } from './components/CinematicOpening';
import { TeamAuthModal } from './components/TeamAuthModal';
import { MissionLobby } from './components/MissionLobby';
import { CommandCenterHUD } from './components/CommandCenterHUD';
import { SectorMap } from './components/SectorMap';
import { SectorWorkspace } from './components/sectors/SectorWorkspace';
import { LeaderboardModal } from './components/LeaderboardModal';
import { AdminControlCenter } from './components/AdminControlCenter';
import { VictoryModal } from './components/VictoryModal';
import { TeamChatBox } from './components/TeamChatBox';
import { initAntiInspectSecurity, registerSecurityWarningCallback } from './utils/antiInspect';
import { syncTeamMemberToFirebase } from './services/firebaseService';

import { QrCode, Sparkles, AlertCircle, Compass, ShieldAlert } from 'lucide-react';

export default function App() {
  const [teamState, setTeamState] = useState<TeamState>(() => teamManager.getState());
  const [currentRole, setCurrentRole] = useState<OperativeRole>(() => teamManager.getCurrentRole());

  // Security warning toast
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);

  // Initialize Anti-Inspect Protection on Mount
  useEffect(() => {
    initAntiInspectSecurity();
    registerSecurityWarningCallback((msg) => {
      setSecurityWarning(msg);
      soundFx.playFlagError();
      setTimeout(() => setSecurityWarning(null), 4500);
    });
  }, []);

  // Sync team state to Firebase in background if configured
  useEffect(() => {
    syncTeamMemberToFirebase(teamState);
  }, [teamState.score, teamState.completedSectors.length, teamState.status]);

  // Navigation and UI state - Starting animation plays on launch
  const [hasSeenCinematic, setHasSeenCinematic] = useState<boolean>(false);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showAdmin, setShowAdmin] = useState<boolean>(false);
  const [showVictory, setShowVictory] = useState<boolean>(false);
  const [showQrBonus, setShowQrBonus] = useState<boolean>(false);
  const [bonusClaimedNotice, setBonusClaimedNotice] = useState<string | null>(null);

  // View mode in Command Center: 'map' or 'sector'
  const [currentView, setCurrentView] = useState<'map' | 'sector'>('map');

  // Subscribe to team manager changes
  useEffect(() => {
    const unsubscribe = teamManager.subscribe((state) => {
      setTeamState({ ...state });
      setCurrentRole(teamManager.getCurrentRole());

      if (state.status === 'completed' && !showVictory) {
        setShowVictory(true);
      }
    });
    return unsubscribe;
  }, [showVictory]);

  // Keyboard shortcut for secret Admin console (Ctrl+Shift+O or Cmd+Shift+O)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        setShowAdmin((prev) => !prev);
        soundFx.playKeyTick();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCinematicComplete = () => {
    sessionStorage.setItem('seen_cinematic', 'true');
    setHasSeenCinematic(true);
    // If team has no second operative or not started, show team auth
    if (!teamState.secondOperative) {
      setShowAuthModal(true);
    }
  };

  const handleReplayIntro = () => {
    soundFx.playKeyTick();
    setHasSeenCinematic(false);
  };

  const handleSectorSelect = (sectorId: string) => {
    setCurrentView('sector');
  };

  const handleClaimQr = () => {
    const xp = teamManager.claimBonus('hiddenQr');
    if (xp > 0) {
      soundFx.playFlagSuccess();
      setBonusClaimedNotice(`BONUS MISSION SOLVED: HIDDEN QR DECODED (+${xp} XP)`);
      setTimeout(() => setBonusClaimedNotice(null), 4000);
    }
    setShowQrBonus(false);
  };

  const activeSector = SECTORS.find((s) => s.id === teamState.activeSectorId) || SECTORS[0];

  // 1. CINEMATIC OPENING (SCENES 1 TO 4)
  if (!hasSeenCinematic) {
    return <CinematicOpening onComplete={handleCinematicComplete} />;
  }

  // 2. MISSION LOBBY (STANDBY / COUNTDOWN BEFORE 105M TIMER STARTS)
  if (teamState.status === 'lobby' || teamState.status === 'countdown') {
    return (
      <div className="relative min-h-screen bg-gradient-to-b from-[#020614] via-[#030e20] to-[#020614]">
        {/* Anti-Inspect Security Warning Banner */}
        {securityWarning && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-mono text-xs font-bold rounded-lg border border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.7)] flex items-center gap-2 animate-bounce">
            <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
            <span>{securityWarning}</span>
          </div>
        )}

        <MissionLobby
          teamState={teamState}
          currentRole={currentRole}
          onReplayIntro={handleReplayIntro}
        />

        {/* Tactical Operative Comms Chat in Lobby */}
        <TeamChatBox teamState={teamState} currentRole={currentRole} />

        {showAuthModal && (
          <TeamAuthModal onSuccess={() => setShowAuthModal(false)} />
        )}

        {showAdmin && (
          <AdminControlCenter
            teamState={teamState}
            onClose={() => setShowAdmin(false)}
          />
        )}
      </div>
    );
  }

  // 3. MAIN COMMAND CENTER (ACTIVE / COMPLETED)
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#020614] via-[#030e20] to-[#020614] text-slate-100 flex flex-col relative">
      {/* Background cyber grid & scanline overlays */}
      <div className="fixed inset-0 scanlines opacity-40 pointer-events-none z-10" />
      <div className="fixed inset-0 cyber-grid opacity-25 pointer-events-none z-0" />

      {/* Anti-Inspect Security Warning Banner */}
      {securityWarning && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-50 px-5 py-3 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white font-mono text-xs font-bold rounded-lg border border-red-400 shadow-[0_0_30px_rgba(239,68,68,0.7)] flex items-center gap-2 animate-bounce">
          <ShieldAlert className="w-5 h-5 text-white animate-pulse" />
          <span>{securityWarning}</span>
        </div>
      )}

      {/* TOP COMMAND CENTER HUD */}
      <CommandCenterHUD
        teamState={teamState}
        currentRole={currentRole}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onOpenAdmin={() => setShowAdmin(true)}
        onReplayIntro={handleReplayIntro}
      />

      {/* Bonus notification toast */}
      {bonusClaimedNotice && (
        <div className="fixed top-18 left-1/2 -translate-x-1/2 z-40 px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black font-orbitron font-bold text-xs uppercase rounded-lg shadow-[0_0_25px_rgba(234,179,8,0.6)] animate-bounce">
          {bonusClaimedNotice}
        </div>
      )}

      {/* Main Workspace Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 relative z-20">
        {/* Navigation Bar between Sector Map & Active Sector Workspace */}
        <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-900">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                soundFx.playKeyTick();
                setCurrentView('map');
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                currentView === 'map'
                  ? 'bg-gradient-to-r from-cyan-600/40 to-blue-600/40 text-cyan-200 border border-cyan-400/50 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>SECTOR MAP GRID</span>
            </button>

            <button
              onClick={() => {
                soundFx.playKeyTick();
                setCurrentView('sector');
              }}
              className={`px-3 py-1.5 rounded-lg font-mono text-xs cursor-pointer transition-all flex items-center gap-1.5 ${
                currentView === 'sector'
                  ? 'bg-gradient-to-r from-cyan-600/40 to-blue-600/40 text-cyan-200 border border-cyan-400/50 font-bold shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>ACTIVE: SECTOR {activeSector.number} ({activeSector.title})</span>
            </button>
          </div>

          {/* Hidden QR Bonus Mission Trigger */}
          <button
            onClick={() => setShowQrBonus(true)}
            className="text-[11px] font-mono text-slate-400 hover:text-yellow-400 flex items-center gap-1 cursor-pointer transition-colors"
            title="Inspect Facility Perimeter QR Tag"
          >
            <QrCode className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Bonus QR</span>
          </button>
        </div>

        {/* View Switcher: Map vs Sector Workspace */}
        {currentView === 'map' ? (
          <SectorMap
            teamState={teamState}
            onSelectSector={handleSectorSelect}
          />
        ) : (
          <SectorWorkspace
            sector={activeSector}
            teamState={teamState}
            currentRole={currentRole}
            onBackToMap={() => setCurrentView('map')}
          />
        )}
      </main>

      {/* TACTICAL CHAT BOX WIDGET */}
      <TeamChatBox teamState={teamState} currentRole={currentRole} />

      {/* FOOTER BAR */}
      <footer className="w-full bg-slate-950/90 border-t border-slate-900 px-6 py-2.5 text-[11px] font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 relative z-20">
        <div>
          SYSTEM OMEGA // 15 SECTORS · 105 MINUTES · 2 OPERATIVES PER SQUAD
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowAdmin(true)}
            className="hover:text-red-400 cursor-pointer transition-colors flex items-center gap-1.5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
            <span>Admin Terminal</span>
          </button>
          <span>FACILITY STATUS: OPERATIONAL</span>
        </div>
      </footer>

      {/* BONUS QR CODE MODAL */}
      {showQrBonus && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-sm w-full bg-gradient-to-b from-slate-950 to-[#030d1a] border border-yellow-500/40 rounded-xl p-6 text-center shadow-2xl">
            <h3 className="font-orbitron font-bold text-white text-base mb-1">
              HIDDEN FACILITY QR TAG
            </h3>
            <p className="text-xs font-mono text-slate-400 mb-4">
              Perimeter optical tag intercepted near Sector 09 exhaust vent.
            </p>

            <div className="w-40 h-40 mx-auto bg-white p-2 rounded-lg flex items-center justify-center mb-4 shadow-md">
              <div className="w-full h-full border-4 border-black p-2 flex flex-col justify-between items-center text-black font-mono font-black text-center text-[10px] leading-tight">
                <div>■■■■■■■</div>
                <div>SCAN: OMEGA BONUS</div>
                <div className="text-xs">QR_TAG_992</div>
                <div>■■■■■■■</div>
              </div>
            </div>

            <button
              onClick={handleClaimQr}
              className="w-full py-2 bg-gradient-to-r from-yellow-400 to-amber-500 hover:opacity-95 text-black font-bold uppercase text-xs rounded-lg cursor-pointer mb-2 shadow-[0_0_15px_rgba(234,179,8,0.4)]"
            >
              {teamState.bonusMissions.hiddenQr ? 'BONUS ALREADY CLAIMED' : 'DECODE OPTICAL SCAN (+50 XP)'}
            </button>
            <button
              onClick={() => setShowQrBonus(false)}
              className="w-full py-1.5 text-xs text-slate-400 hover:text-white"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* LEADERBOARD MODAL */}
      {showLeaderboard && (
        <LeaderboardModal
          teamState={teamState}
          onClose={() => setShowLeaderboard(false)}
        />
      )}

      {/* ADMIN CONTROL MODAL */}
      {showAdmin && (
        <AdminControlCenter
          teamState={teamState}
          onClose={() => setShowAdmin(false)}
        />
      )}

      {/* VICTORY MODAL (OMEGA CORE COMPLETE) */}
      {showVictory && (
        <VictoryModal
          teamState={teamState}
          onClose={() => setShowVictory(false)}
        />
      )}
    </div>
  );
}
