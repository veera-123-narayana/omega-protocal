import React, { useState } from 'react';
import { TeamState } from '../types';
import { MOCK_LEADERBOARD } from '../services/teamService';
import { Trophy, X, Shield, Medal, Search, Flame, Crown, Sparkles, Zap, ArrowUpRight } from 'lucide-react';

interface LeaderboardModalProps {
  teamState: TeamState;
  onClose: () => void;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({ teamState, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');

  // Combine current team dynamically into full leaderboard list
  const currentTeamEntry = {
    rank: 2,
    teamId: teamState.teamId,
    teamName: teamState.teamName,
    xp: teamState.score,
    sectorsCount: teamState.completedSectors.length,
    status: teamState.status === 'completed' ? ('COMPLETED' as const) : ('ACTIVE' as const),
    lastSolvedTime: 'Active now',
    isCurrentTeam: true,
  };

  const otherTeams = MOCK_LEADERBOARD.filter((t) => t.teamId !== teamState.teamId).map((t) => ({
    ...t,
    isCurrentTeam: false,
  }));

  const allTeams = [currentTeamEntry, ...otherTeams]
    .sort((a, b) => b.xp - a.xp)
    .map((team, idx) => ({ ...team, rank: idx + 1 }));

  const filteredTeams = allTeams.filter(
    (t) =>
      t.teamId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.teamName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const top3 = allTeams.slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex items-center justify-center p-3 sm:p-6 overflow-y-auto select-none">
      <div className="w-full max-w-4xl bg-gradient-to-b from-slate-950 via-[#030d1a] to-slate-950 border border-yellow-500/40 rounded-xl p-5 sm:p-8 shadow-[0_0_80px_rgba(234,179,8,0.2)] relative my-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1.5 rounded-lg bg-slate-900/60 hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header with Radiant Gradients */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-6 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-br from-yellow-400 via-amber-500 to-yellow-600 rounded-xl shadow-[0_0_25px_rgba(234,179,8,0.4)] text-black">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h2 className="font-orbitron font-black text-xl sm:text-2xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-200 to-yellow-500 tracking-wider">
                TACTICAL CTF LEADERBOARD
              </h2>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                REAL-TIME TOURNAMENT STANDINGS · 125 REGISTERED SQUADS
              </p>
            </div>
          </div>

          {/* Search Filter */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search team or ID..."
              className="w-full bg-slate-900/90 border border-slate-700 focus:border-yellow-500/60 pl-9 pr-3 py-1.5 rounded-lg text-xs font-mono text-white outline-none"
            />
          </div>
        </div>

        {/* TOP 3 PODIUM CARDS (Gold, Silver, Bronze) */}
        {!searchQuery && top3.length >= 3 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {/* 2nd Place: Silver */}
            <div className="order-2 md:order-1 relative p-4 rounded-xl border border-slate-400/40 bg-gradient-to-b from-slate-900/90 via-slate-900/40 to-slate-950 flex flex-col justify-between shadow-[0_0_20px_rgba(203,213,225,0.15)]">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gradient-to-r from-slate-200 to-slate-400 text-black">
                  #2 SILVER
                </span>
                <Medal className="w-5 h-5 text-slate-300" />
              </div>

              <div>
                <div className="font-orbitron font-bold text-sm text-white truncate">
                  {top3[1].teamName}
                </div>
                <div className="text-[11px] font-mono text-cyan-300">
                  {top3[1].teamId} {top3[1].isCurrentTeam && '(YOU)'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between font-mono">
                <span className="text-xs text-slate-400">{top3[1].sectorsCount}/15 SECTORS</span>
                <span className="font-orbitron font-bold text-sm text-slate-200 tabular-nums">
                  {top3[1].xp} XP
                </span>
              </div>
            </div>

            {/* 1st Place: Gold (Hero Center) */}
            <div className="order-1 md:order-2 relative p-5 rounded-xl border-2 border-yellow-400/80 bg-gradient-to-b from-yellow-950/40 via-amber-950/30 to-slate-950 flex flex-col justify-between shadow-[0_0_35px_rgba(234,179,8,0.3)] md:-translate-y-2">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2.5 py-0.5 rounded text-[10px] font-orbitron font-bold bg-gradient-to-r from-yellow-300 via-amber-300 to-yellow-500 text-black flex items-center gap-1 shadow-md">
                  <Crown className="w-3.5 h-3.5" /> #1 CHAMPION
                </span>
                <Trophy className="w-6 h-6 text-yellow-400 animate-pulse" />
              </div>

              <div>
                <div className="font-orbitron font-black text-base text-yellow-200 truncate">
                  {top3[0].teamName}
                </div>
                <div className="text-xs font-mono text-yellow-400/90 font-bold">
                  {top3[0].teamId} {top3[0].isCurrentTeam && '(YOU)'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-yellow-500/30 flex items-center justify-between font-mono">
                <span className="text-xs text-yellow-300/80">{top3[0].sectorsCount}/15 SECTORS CLEARED</span>
                <span className="font-orbitron font-extrabold text-lg text-yellow-300 tabular-nums text-glow-white">
                  {top3[0].xp} XP
                </span>
              </div>
            </div>

            {/* 3rd Place: Bronze */}
            <div className="order-3 md:order-3 relative p-4 rounded-xl border border-orange-500/40 bg-gradient-to-b from-orange-950/30 via-slate-900/40 to-slate-950 flex flex-col justify-between shadow-[0_0_20px_rgba(249,115,22,0.15)]">
              <div className="flex items-center justify-between mb-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-gradient-to-r from-orange-400 to-amber-600 text-black">
                  #3 BRONZE
                </span>
                <Medal className="w-5 h-5 text-orange-400" />
              </div>

              <div>
                <div className="font-orbitron font-bold text-sm text-white truncate">
                  {top3[2].teamName}
                </div>
                <div className="text-[11px] font-mono text-cyan-300">
                  {top3[2].teamId} {top3[2].isCurrentTeam && '(YOU)'}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between font-mono">
                <span className="text-xs text-slate-400">{top3[2].sectorsCount}/15 SECTORS</span>
                <span className="font-orbitron font-bold text-sm text-orange-300 tabular-nums">
                  {top3[2].xp} XP
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Full Standings Table */}
        <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950/60">
          <table className="w-full text-left font-mono text-xs text-slate-300">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 text-[10px] uppercase tracking-wider">
                <th className="py-3 px-4">RANK</th>
                <th className="py-3 px-4">SQUAD</th>
                <th className="py-3 px-4">SCORE PROGRESS</th>
                <th className="py-3 px-4">CLEARED</th>
                <th className="py-3 px-4">STATUS</th>
              </tr>
            </thead>
            <tbody>
              {filteredTeams.map((team) => {
                const maxScore = 2700;
                const scorePercent = Math.min(100, Math.round((team.xp / maxScore) * 100));

                return (
                  <tr
                    key={team.teamId}
                    className={`border-b border-slate-900/80 transition-colors ${
                      team.isCurrentTeam
                        ? 'bg-gradient-to-r from-cyan-950/60 via-blue-950/40 to-slate-900/60 text-cyan-200 border-cyan-500/50 font-bold'
                        : 'hover:bg-slate-900/50'
                    }`}
                  >
                    {/* Rank */}
                    <td className="py-3.5 px-4 font-orbitron font-bold">
                      {team.rank === 1 ? (
                        <span className="text-yellow-400 flex items-center gap-1">
                          <Crown className="w-3.5 h-3.5" /> #1
                        </span>
                      ) : team.rank === 2 ? (
                        <span className="text-slate-300">#2</span>
                      ) : team.rank === 3 ? (
                        <span className="text-orange-400">#3</span>
                      ) : (
                        `#${team.rank}`
                      )}
                    </td>

                    {/* Squad Details */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white tracking-wide">{team.teamId}</span>
                        <span className="text-slate-400 text-[11px] truncate max-w-[160px]">
                          {team.teamName}
                        </span>
                        {team.isCurrentTeam && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-cyan-500 text-black">
                            YOUR SQUAD
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Score Progress Bar */}
                    <td className="py-3.5 px-4 min-w-[180px]">
                      <div className="flex items-center justify-between text-[11px] mb-1">
                        <span className="font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                          {team.xp} XP
                        </span>
                        <span className="text-slate-500 text-[9px]">{scorePercent}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                        <div
                          className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-yellow-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.max(5, scorePercent)}%` }}
                        />
                      </div>
                    </td>

                    {/* Sectors Cleared */}
                    <td className="py-3.5 px-4 tabular-nums">
                      <span className="font-bold text-white">{team.sectorsCount}</span>
                      <span className="text-slate-500 text-[10px]"> / 15</span>
                    </td>

                    {/* Status Pill */}
                    <td className="py-3.5 px-4">
                      <span className={`text-[10px] uppercase px-2 py-0.5 rounded-full font-bold inline-flex items-center gap-1 ${
                        team.status === 'COMPLETED'
                          ? 'bg-gradient-to-r from-emerald-950 to-teal-950 text-emerald-400 border border-emerald-500/50'
                          : 'bg-slate-900 text-slate-300 border border-slate-800'
                      }`}>
                        {team.status === 'COMPLETED' && <Sparkles className="w-3 h-3" />}
                        {team.status}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
