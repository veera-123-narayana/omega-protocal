import React, { useState } from 'react';
import { teamManager } from '../services/teamService';
import { soundFx } from '../utils/audio';
import { Users, ShieldCheck, Copy, Check, UserPlus, LogIn, Shield, Mail, Key } from 'lucide-react';

interface TeamAuthModalProps {
  onSuccess: () => void;
}

export const TeamAuthModal: React.FC<TeamAuthModalProps> = ({ onSuccess }) => {
  const [mode, setMode] = useState<'create_team' | 'create_second' | 'join_team'>('create_team');

  // Step 1: Team Leader info (ZERO PREDEFINED / EMPTY DEFAULTS)
  const [teamName, setTeamName] = useState('');
  const [leaderUsername, setLeaderUsername] = useState('');
  const [leaderEmail, setLeaderEmail] = useState('');
  const [leaderPassword, setLeaderPassword] = useState('');

  // Step 2: Operative 2 info (ZERO PREDEFINED / EMPTY DEFAULTS)
  const [generatedTeamId, setGeneratedTeamId] = useState('');
  const [secondUsername, setSecondUsername] = useState('');
  const [secondEmail, setSecondEmail] = useState('');
  const [secondPassword, setSecondPassword] = useState('');

  // Step 3: Join fields (ZERO PREDEFINED / EMPTY DEFAULTS)
  const [joinTeamId, setJoinTeamId] = useState('');
  const [joinUsername, setJoinUsername] = useState('');
  const [joinPassword, setJoinPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleStep1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!teamName.trim() || !leaderUsername.trim() || !leaderPassword.trim()) {
      setAuthError('Please fill in all leader credentials.');
      return;
    }
    soundFx.playKeyTick();
    const randomNum = Math.floor(10 + Math.random() * 90);
    const tid = `OMEGA-0${randomNum}`;
    setGeneratedTeamId(tid);
    setMode('create_second');
    soundFx.playFlagSuccess();
  };

  const handleStep2Register = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!secondUsername.trim() || !secondPassword.trim()) {
      setAuthError('Please fill in Operative 2 credentials.');
      return;
    }

    setLoading(true);
    soundFx.playKeyTick();
    try {
      const res = await teamManager.registerTeam({
        teamId: generatedTeamId,
        teamName,
        leaderUsername,
        leaderEmail,
        leaderPassword,
        operative2Username: secondUsername,
        operative2Email: secondEmail,
        operative2Password: secondPassword,
      });

      if (res.success) {
        soundFx.playFlagSuccess();
        onSuccess();
      } else {
        soundFx.playFlagError();
        setAuthError(res.error || 'Failed to register team in Firebase.');
      }
    } catch (err: any) {
      soundFx.playFlagError();
      setAuthError(err?.message || 'Network error connecting to database.');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    if (!joinTeamId.trim() || !joinUsername.trim() || !joinPassword.trim()) {
      setAuthError('Please enter Team ID, username/email, and password.');
      return;
    }

    setLoading(true);
    soundFx.playKeyTick();
    try {
      const res = await teamManager.joinTeam(joinTeamId, joinUsername, joinPassword);
      if (res.success) {
        soundFx.playFlagSuccess();
        onSuccess();
      } else {
        soundFx.playFlagError();
        setAuthError(res.error || 'AUTHENTICATION FAILED: Check Team ID and credentials.');
      }
    } catch (err: any) {
      soundFx.playFlagError();
      setAuthError(err?.message || 'Authentication error.');
    } finally {
      setLoading(false);
    }
  };

  const copyCredentials = () => {
    const text = `SYSTEM OMEGA SQUAD CREDENTIALS\nTeam ID: ${generatedTeamId}\nTeam Name: ${teamName}\nOperative 2: ${secondUsername}\nOperative 2 Passkey: ${secondPassword}`;
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
                2 OPERATIVES PER SQUAD · STORED DIRECTLY IN FIREBASE
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800">
            <button
              onClick={() => {
                setMode('create_team');
                setAuthError('');
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
                setAuthError('');
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

        {authError && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-500/50 text-red-300 text-xs font-mono rounded-lg flex items-center gap-2">
            <Key className="w-4 h-4 text-red-400 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {/* MODE 1: CREATE TEAM (LEADER INFORMATION) */}
        {mode === 'create_team' && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">TEAM NAME</label>
              <input
                type="text"
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                placeholder="Enter squad designation..."
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
                  placeholder="Leader callsign"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-cyan-400" /> LEADER EMAIL
                </label>
                <input
                  type="email"
                  value={leaderEmail}
                  onChange={(e) => setLeaderEmail(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                  placeholder="leader@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">LEADER PASSWORD</label>
              <input
                type="password"
                value={leaderPassword}
                onChange={(e) => setLeaderPassword(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                placeholder="Secure leader passkey"
              />
            </div>

            <button
              type="submit"
              className="w-full mt-2 py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:opacity-95 text-black font-orbitron font-bold text-xs tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer flex items-center justify-center gap-2"
            >
              <UserPlus className="w-4 h-4" />
              <span>CONTINUE TO OPERATIVE 2 CREDENTIALS</span>
            </button>
          </form>
        )}

        {/* MODE 2: SECOND OPERATIVE INFORMATION */}
        {mode === 'create_second' && (
          <form onSubmit={handleStep2Register} className="space-y-4">
            {/* Holographic Generated Credentials Card */}
            <div className="p-4 bg-gradient-to-br from-cyan-950/70 via-blue-950/50 to-slate-950 border border-cyan-400/50 rounded-xl shadow-[0_0_25px_rgba(6,182,212,0.2)]">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-cyan-500/20">
                <span className="text-xs font-orbitron font-bold text-cyan-300 flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-cyan-400" /> SQUAD ASSIGNMENT SUMMARY
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
                  <span className="text-slate-400">LEADER HANDLE:</span>
                  <span className="font-bold text-cyan-200">{leaderUsername}</span>
                </div>
              </div>
            </div>

            <div className="text-xs font-mono text-cyan-400 tracking-wider uppercase">
              OPERATIVE 2 CREDENTIALS (SECOND OPERATIVE)
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">OPERATIVE 2 USERNAME</label>
                <input
                  type="text"
                  value={secondUsername}
                  onChange={(e) => setSecondUsername(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                  placeholder="Operative 2 callsign"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1 flex items-center gap-1">
                  <Mail className="w-3 h-3 text-cyan-400" /> OPERATIVE 2 EMAIL
                </label>
                <input
                  type="email"
                  value={secondEmail}
                  onChange={(e) => setSecondEmail(e.target.value)}
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                  placeholder="operative2@domain.com"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">OPERATIVE 2 PASSWORD</label>
              <input
                type="password"
                value={secondPassword}
                onChange={(e) => setSecondPassword(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                placeholder="Passkey for second device login"
              />
            </div>

            <p className="text-xs font-mono text-slate-400">
              Credentials are securely hashed and stored in Firestore. Share the Team ID and passkey with Operative 2 to synchronize both devices in real time.
            </p>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 text-black font-orbitron font-bold text-xs tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <ShieldCheck className="w-4 h-4" />
              <span>{loading ? 'REGISTERING IN FIREBASE...' : 'REGISTER SQUAD IN FIREBASE & ENTER'}</span>
            </button>
          </form>
        )}

        {/* MODE 3: JOIN EXISTING TEAM (OPERATIVE 2 LOGIN) */}
        {mode === 'join_team' && (
          <form onSubmit={handleJoinTeam} className="space-y-4">
            <div className="text-xs font-mono text-cyan-400 tracking-wider uppercase mb-1">
              CONNECT AS OPERATIVE 2 WITH SQUAD PASS
            </div>

            <div>
              <label className="block text-xs font-mono text-slate-400 mb-1">TEAM ID</label>
              <input
                type="text"
                value={joinTeamId}
                onChange={(e) => setJoinTeamId(e.target.value)}
                required
                className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none uppercase font-bold text-yellow-300"
                placeholder="e.g. OMEGA-042"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">OPERATIVE 2 USERNAME / EMAIL</label>
                <input
                  type="text"
                  value={joinUsername}
                  onChange={(e) => setJoinUsername(e.target.value)}
                  required
                  className="w-full bg-slate-900/90 border border-slate-700 focus:border-cyan-400 px-3.5 py-2 text-sm font-mono text-white rounded-lg outline-none"
                  placeholder="Enter handle or email"
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
                  placeholder="Enter passkey"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-500 text-black font-orbitron font-bold text-xs tracking-widest uppercase rounded-lg shadow-[0_0_20px_rgba(16,185,129,0.4)] cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <LogIn className="w-4 h-4" />
              <span>{loading ? 'AUTHENTICATING...' : 'AUTHENTICATE & SYNCHRONIZE SQUAD'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
