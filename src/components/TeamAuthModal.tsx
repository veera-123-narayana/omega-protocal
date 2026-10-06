import React, { useState } from 'react';
import { teamManager, PREDEFINED_SQUADS, PredefinedSquad } from '../services/teamService';
import { soundFx } from '../utils/audio';
import { Users, Key, ShieldCheck, UserCheck, Copy, Check, ArrowRight, UserPlus, LogIn, Sparkles, Zap, Shield } from 'lucide-react';

interface TeamAuthModalProps {
  onSuccess: () => void;
}

export const TeamAuthModal: React.FC<TeamAuthModalProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'create_team' | 'create_second' | 'join_team'>('create_team');
  const [teamName, setTeamName] = useState(PREDEFINED_SQUADS[0].teamName);
  const [leaderUsername, setLeaderUsername] = useState(PREDEFINED_SQUADS[0].leaderUsername);
  const [leaderPassword, setLeaderPassword] = useState('omega_pass_2026');

  const [generatedTeamId, setGeneratedTeamId] = useState('');
  const [secondUsername, setSecondUsername] = useState(PREDEFINED_SQUADS[0].secondUsername);
  const [secondPassword, setSecondPassword] = useState(PREDEFINED_SQUADS[0].secondPassword);

  // Join fields
  const [joinTeamId, setJoinTeamId] = useState('');
  const [joinUsername, setJoinUsername] = useState('');
  const [joinPassword, setJoinPassword] = useState('');
  const [joinError, setJoinError] = useState('');

  const [copied, setCopied] = useState(false);

  // Pre-load squad template
  const handleSelectPreset = (squad: PredefinedSquad) => {
    soundFx.playKeyTick();
    setTeamName(squad.teamName);
    setLeaderUsername(squad.leaderUsername);
    setSecondUsername(squad.secondUsername);
    setSecondPassword(squad.secondPassword);
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamName || !leaderUsername) return;
    soundFx.playKeyTick();
    const tid = teamManager.initializeTeam(teamName, leaderUsername);
    setGeneratedTeamId(tid);
    setJoinTeamId(tid);
    setJoinUsername(secondUsername);
    setJoinPassword(secondPassword);
    setMode('create_second');
    soundFx.playFlagSuccess();
  };

  const handleCreateSecondOperative = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secondUsername || !secondPassword) return;
    soundFx.playKeyTick();
    teamManager.createSecondOperative(secondUsername, secondPassword);
    soundFx.playFlagSuccess();
    onSuccess();
  };

  const handleSimulateInstantSync = () => {
    soundFx.playKeyTick();
    const squad = PREDEFINED_SQUADS[1];
    const tid = teamManager.initializeTeam(squad.teamName, squad.leaderUsername);
    teamManager.createSecondOperative(squad.secondUsername, squad.secondPassword);
    soundFx.playFlagSuccess();
    onSuccess();
  };

  const handleJoinTeam = (e: React.FormEvent) => {
    e.preventDefault();
    setJoinError('');
    soundFx.playKeyTick();
    const ok = teamManager.joinAsSecondOperative(joinTeamId, joinUsername, joinPassword);
    if (ok) {
      soundFx.playFlagSuccess();
      onSuccess();
    } else {
      soundFx.playFlagError();
      setJoinError('AUTHENTICATION FAILED: Check Team ID and Password.');
    }
  };

  const copyCredentials = () => {
    const text = `SYSTEM OMEGA SQUAD DISPATCH\nTeam ID: ${generatedTeamId}\nOperative B: ${secondUsername}\nPasskey: ${secondPassword}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 select-none">
      <div className="w-full max-w-xl bg-gradient-to-b from-slate-950 via-[#030e1c] to-slate-950 border border-cyan-500/40 rounded-xl p-6 sm:p-8 shadow-[0_0_60px_rgba(6,182,212,0.2)] relative overflow-hidden">
        {/* Holographic Header Bar */}
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg text-black">
              <Users className="w-5 h-5 text-black" />
            </div>
            <div>
              <h2 className="font-orbitron font-bold text-base sm:text-lg text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-400 tracking-wider">
                {mode === 'join_team' ? 'AUTHENTICATE OPERATIVE B' : 'SQUAD INITIALIZATION'}
              </h2>
              <div className="text-[10px] font-mono text-slate-400">
                2 OPERATIVES PER SQUAD · ENCRYPTED MISSION CREDENTIALS
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setMode('create_team');
                soundFx.playKeyTick();
              }}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                mode !== 'join_team'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Leader (New)
            </button>
            <button
              onClick={() => {
                setMode('join_team');
                soundFx.playKeyTick();
              }}
              className={`px-3 py-1 text-xs font-mono rounded-md transition-all cursor-pointer ${
                mode === 'join_team'
                  ? 'bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-bold shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Teammate (Join)
            </button>
          </div>
        </div>

        {/* MODE 1: CREATE TEAM (OPERATIVE A) */}
        {mode === 'create_team' && (
          <form onSubmit={handleCreateTeam} className="space-y-4">
            {/* Predefined Squad Presets */}
            <div>
              <div className="text-[11px] font-mono text-cyan-400 tracking-wider uppercase mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>PREDEFINED SQUAD PROFILES (CLICK TO LOAD)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {PREDEFINED_SQUADS.map((squad) => {
                  const isSelected = teamName === squad.teamName;
                  return (
                    <button
                      type="button"
                      key={squad.id}
                      onClick={() => handleSelectPreset(squad)}
                      className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-gradient-to-br from-cyan-950/70 to-blue-950/50 border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]'
                          : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="font-orbitron font-bold text-[11px] text-white truncate">
                        {squad.teamName}
                      </div>
                      <div className="text-[10px] font-mono text-cyan-300 mt-0.5">
                        {squad.leaderUsername} &amp; {squad.secondUsername}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-900">
              <label className="block text-xs font-mono text-slate-400 mb-1">TEAM NAME</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                placeholder="e.g. CYBER PIONEERS"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">LEADER USERNAME</label>
                <input
                  type="text"
                  value={leaderUsername}
                  onChange={(e) => setLeaderUsername(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">PASSWORD</label>
                <input
                  type="password"
                  value={leaderPassword}
                  onChange={(e) => setLeaderPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:opacity-95 text-black font-orbitron font-bold text-xs tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>INITIALIZE TEAM &amp; GENERATE PASS</span>
            </button>

            {/* Quick Demo Simulator */}
            <div className="pt-2 text-center">
              <button
                type="button"
                onClick={handleSimulateInstantSync}
                className="text-xs font-mono text-slate-400 hover:text-cyan-300 transition-colors underline cursor-pointer"
              >
                ⚡ Instant Provision: Auto-Pair Both Operatives
              </button>
            </div>
          </form>
        )}

        {/* MODE 2: SECOND OPERATIVE ACCESS PASS CREATION */}
        {mode === 'create_second' && (
          <form onSubmit={handleCreateSecondOperative} className="space-y-4">
            {/* Holographic Generated Credentials Card */}
            <div className="p-4 bg-gradient-to-br from-cyan-950/70 via-blue-950/50 to-slate-950 border border-cyan-400/50 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.2)]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-cyan-500/20">
                <span className="text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" /> OPERATIVE B ACCESS PASS
                </span>
                <button
                  type="button"
                  onClick={copyCredentials}
                  className="px-2.5 py-1 text-xs font-mono bg-cyan-500 text-black font-bold rounded flex items-center gap-1 cursor-pointer hover:bg-cyan-400"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'COPIED!' : 'COPY PASS'}</span>
                </button>
              </div>

              <div className="space-y-1.5 font-mono text-xs text-slate-300">
                <div className="flex justify-between">
                  <span className="text-slate-400">ASSIGNED TEAM ID:</span>
                  <span className="font-bold text-yellow-400 text-sm">{generatedTeamId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">TEAM NAME:</span>
                  <span className="font-bold text-white">{teamName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">OPERATIVE B HANDLE:</span>
                  <span className="font-bold text-cyan-200">{secondUsername}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">JOIN PASSKEY:</span>
                  <span className="font-bold text-emerald-400">{secondPassword}</span>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-cyan-400 tracking-wider uppercase">
              CONFIRM SECOND OPERATIVE CREDENTIALS
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">OPERATIVE B USERNAME</label>
                <input
                  type="text"
                  value={secondUsername}
                  onChange={(e) => setSecondUsername(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">JOIN PASSWORD</label>
                <input
                  type="text"
                  value={secondPassword}
                  onChange={(e) => setSecondPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                />
              </div>
            </div>

            <p className="text-xs font-mono text-slate-400">
              Share the credentials with your teammate. When they join, the squad will synchronize in real time.
            </p>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-black font-orbitron font-bold text-xs tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer flex items-center justify-center gap-2"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>DISPATCH CREDENTIALS &amp; ENTER MISSION</span>
            </button>
          </form>
        )}

        {/* MODE 3: JOIN EXISTING TEAM (OPERATIVE B) */}
        {mode === 'join_team' && (
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div className="text-xs font-mono text-cyan-400 tracking-wider uppercase mb-1">
              CONNECT AS OPERATIVE B WITH SQUAD PASS
            </div>

            {joinError && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 text-red-400 text-xs font-mono rounded-lg">
                {joinError}
              </div>
            )}

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">TEAM ID</label>
              <input
                type="text"
                value={joinTeamId}
                onChange={(e) => setJoinTeamId(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none uppercase font-bold text-yellow-300"
                placeholder="e.g. OMEGA-017"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">OPERATIVE B USERNAME</label>
                <input
                  type="text"
                  value={joinUsername}
                  onChange={(e) => setJoinUsername(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                  placeholder="CIPHER_GHOST"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">PASSWORD</label>
                <input
                  type="password"
                  value={joinPassword}
                  onChange={(e) => setJoinPassword(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-black font-orbitron font-bold text-xs tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer flex items-center justify-center gap-2"
            >
              <LogIn className="w-4 h-4" />
              <span>AUTHENTICATE &amp; SYNCHRONIZE SQUAD</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
