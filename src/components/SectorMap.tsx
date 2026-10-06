import React from 'react';
import { SECTORS } from '../data/sectors';
import { TeamState, SectorDefinition } from '../types';
import { teamManager } from '../services/teamService';
import { soundFx } from '../utils/audio';
import { isSectorSolved } from '../utils/validation';
import { Lock, CheckCircle2, Zap, Shield, ChevronRight } from 'lucide-react';

interface SectorMapProps {
  teamState: TeamState;
  onSelectSector: (sectorId: string) => void;
}

export const SectorMap: React.FC<SectorMapProps> = ({ teamState, onSelectSector }) => {
  const isSectorCompleted = (id: string) => isSectorSolved(teamState.completedSectors, id);
  // Allow team to access any level at any time
  const isSectorUnlocked = (_id: string) => true;
  const isSectorActive = (id: string) => teamState.activeSectorId === id;

  const handleNodeClick = (sector: SectorDefinition) => {
    soundFx.playSectorTransition();
    teamManager.setActiveSector(sector.id);
    onSelectSector(sector.id);
  };

  // Organize into tiers for branching tree display
  const tiers: { label: string; sectorIds: string[] }[] = [
    { label: 'TIER 1 // GATEWAY', sectorIds: ['01'] },
    { label: 'TIER 2 // RECON & CIPHER', sectorIds: ['02', '03'] },
    { label: 'TIER 3 // SIGNAL & REASONING', sectorIds: ['04', '05'] },
    { label: 'TIER 4 // SYSTEM CORE & INTRUSION', sectorIds: ['06', '07', '08'] },
    { label: 'TIER 5 // ANOMALY VECTOR', sectorIds: ['09'] },
    { label: 'TIER 6 // EMBEDDED & GRID', sectorIds: ['10', '11'] },
    { label: 'TIER 7 // ALGORITHMIC GUARDIAN', sectorIds: ['12'] },
    { label: 'TIER 8 // AUTONOMOUS NEURAL', sectorIds: ['13', '14'] },
    { label: 'FINAL MISSION // CORE ASSEMBLY', sectorIds: ['15'] },
  ];

  return (
    <div className="w-full bg-gradient-to-b from-slate-950/90 via-slate-900/60 to-slate-950/90 border border-cyan-500/30 rounded-lg p-4 sm:p-6 backdrop-blur-md shadow-[0_0_50px_rgba(6,182,212,0.1)]">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 mb-6 border-b border-slate-800">
        <div>
          <h2 className="text-sm font-orbitron font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-blue-400 tracking-widest uppercase flex items-center gap-2">
            <Zap className="w-4 h-4 text-cyan-400" />
            <span>SECTOR GRID NAVIGATION MATRIX</span>
          </h2>
          <p className="text-xs font-mono text-slate-400 mt-0.5">
            ALL 15 LEVELS UNRESTRICTED · ENTER ANY SECTOR FREELY · SQUAD SYNCHRONIZED
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> COMPLETED
          </span>
          <span className="flex items-center gap-1.5 text-cyan-400">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" /> ACTIVE
          </span>
          <span className="flex items-center gap-1.5 text-slate-300">
            <span className="w-2 h-2 rounded-full bg-blue-500" /> OPEN ACCESS
          </span>
        </div>
      </div>

      {/* Grid Tree Flow */}
      <div className="space-y-6">
        {tiers.map((tier, tierIdx) => (
          <div key={tierIdx} className="relative">
            {/* Tier Header Line with gradient */}
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[10px] font-mono text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-bold uppercase tracking-widest">
                {tier.label}
              </span>
              <div className="flex-1 h-px bg-gradient-to-r from-cyan-500/30 via-slate-800 to-transparent" />
            </div>

            {/* Nodes Container */}
            <div className={`grid gap-3 ${
              tier.sectorIds.length === 1
                ? 'grid-cols-1 max-w-md mx-auto'
                : tier.sectorIds.length === 2
                ? 'grid-cols-1 sm:grid-cols-2 max-w-2xl mx-auto'
                : 'grid-cols-1 sm:grid-cols-3'
            }`}>
              {tier.sectorIds.map((id) => {
                const sector = SECTORS.find((s) => s.id === id);
                if (!sector) return null;

                const completed = isSectorCompleted(id);
                const active = isSectorActive(id);
                const isOmegaCore = id === '15';

                return (
                  <button
                    key={id}
                    onClick={() => handleNodeClick(sector)}
                    className={`relative p-3.5 rounded-lg border text-left transition-all cursor-pointer group ${
                      active
                        ? 'bg-gradient-to-br from-cyan-950/80 via-blue-950/60 to-slate-900 border-cyan-400 shadow-[0_0_25px_rgba(6,182,212,0.4)] scale-[1.02]'
                        : completed
                        ? 'bg-gradient-to-br from-emerald-950/40 via-teal-950/30 to-slate-900 border-emerald-500/50 hover:border-emerald-400'
                        : isOmegaCore
                        ? 'bg-gradient-to-br from-red-950/40 via-rose-950/30 to-slate-900 border-red-500/50 hover:border-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]'
                        : 'bg-gradient-to-br from-slate-900/80 to-slate-950 border-slate-800 hover:border-cyan-500/60 hover:shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                    }`}
                  >
                    {/* Top Node Meta */}
                    <div className="flex items-center justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          completed
                            ? 'bg-emerald-900/60 text-emerald-300 border border-emerald-500/30'
                            : active
                            ? 'bg-cyan-900/60 text-cyan-200 border border-cyan-400/40'
                            : 'bg-slate-800/80 text-slate-300'
                        }`}>
                          SECTOR {sector.number}
                        </span>

                        <span className="text-[10px] font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 to-amber-400">
                          +{sector.baseXp} XP
                        </span>
                      </div>

                      {completed ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : active ? (
                        <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 group-hover:translate-x-0.5 transition-all" />
                      )}
                    </div>

                    {/* Sector Title */}
                    <div className="font-orbitron font-bold text-xs sm:text-sm text-white truncate tracking-wide group-hover:text-cyan-200 transition-colors">
                      {sector.title}
                    </div>

                    {/* Category & Status */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                      <span className="truncate max-w-[130px]">{sector.category}</span>
                      <span className={`text-[10px] uppercase font-semibold ${
                        completed ? 'text-emerald-400 font-bold' : active ? 'text-cyan-300 font-bold' : 'text-slate-400'
                      }`}>
                        {completed ? 'CLEARED ✓' : active ? 'ACTIVE NOW' : 'READY TO PLAY'}
                      </span>
                    </div>

                    {/* Core Fragment Badge if applicable */}
                    {sector.coreFragment && (
                      <div className={`mt-2 text-[10px] font-mono px-2 py-0.5 rounded flex items-center gap-1 ${
                        completed
                          ? 'text-cyan-300 bg-cyan-950/70 border border-cyan-600'
                          : 'text-slate-500 bg-black/40 border border-slate-800'
                      }`}>
                        <Shield className="w-3 h-3 text-cyan-400" />
                        <span>{completed ? 'FRAGMENT SECURED' : 'CONTAINS CORE FRAGMENT'}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
