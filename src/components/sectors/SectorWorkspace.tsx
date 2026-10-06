import React, { useState } from 'react';
import { SectorDefinition, TeamState, OperativeRole } from '../../types';
import { teamManager } from '../../services/teamService';
import { soundFx } from '../../utils/audio';
import { isSectorSolved, areAllPrecedingSectorsSolved } from '../../utils/validation';
import {
  DnsBlackoutChallenge,
  WhoIsTheOperativeChallenge,
  CrypticVaultChallenge,
  GhostSignalChallenge,
  HumanOrAiChallenge,
  EmptyLogChallenge,
  ForensicZeroChallenge,
  ModularShadowChallenge,
  DiscreteMatrixMathChallenge,
  AfterIendChallenge,
  PacketHuntChallenge,
  BossFightAlgorithmChallenge,
  ForgottenArchiveChallenge,
  AgentChaosChallenge,
  FahhThreeLoopChallenge,
  RealityGlitchChallenge,
  OmegaCoreChallenge,
} from './InteractiveChallenges';
import {
  Shield,
  HelpCircle,
  Send,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  ArrowLeft,
  Flame,
  Zap,
  Bot,
  Terminal,
} from 'lucide-react';

interface SectorWorkspaceProps {
  sector: SectorDefinition;
  teamState: TeamState;
  currentRole: OperativeRole;
  onBackToMap: () => void;
}

export const SectorWorkspace: React.FC<SectorWorkspaceProps> = ({
  sector,
  teamState,
  currentRole,
  onBackToMap,
}) => {
  const [flagInput, setFlagInput] = useState('');
  const [submissionFeedback, setSubmissionFeedback] = useState<{
    success: boolean;
    message: string;
    xpDelta: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hintsExpanded, setHintsExpanded] = useState(false);

  const isCompleted = isSectorSolved(teamState.completedSectors, sector.id);
  const hintsUsedCount = teamState.hintsUsed[sector.id] || 0;
  const isOmegaCore = sector.id === '15';
  const isPrecedingReady = isOmegaCore ? areAllPrecedingSectorsSolved(teamState.completedSectors) : true;

  const currentOperativeName =
    currentRole === 'OPERATIVE_A'
      ? teamState.leader.username
      : teamState.secondOperative?.username || 'OPERATIVE_B';

  const handleFlagSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flagInput.trim() || isSubmitting) return;

    soundFx.playKeyTick();
    setIsSubmitting(true);
    setSubmissionFeedback(null);

    const result = await teamManager.submitFlag(sector.id, flagInput, currentOperativeName);
    setIsSubmitting(false);
    setSubmissionFeedback(result);

    if (result.success) {
      soundFx.playFlagSuccess();
      setFlagInput('');
    } else {
      soundFx.playFlagError();
    }
  };

  const handlePaste = async () => {
    try {
      if (navigator.clipboard) {
        const text = await navigator.clipboard.readText();
        if (text) {
          soundFx.playKeyTick();
          setFlagInput(text.trim());
        }
      }
    } catch {}
  };

  const handleUnlockHint = async (hintIndex: number, cost: number) => {
    soundFx.playKeyTick();
    const ok = await teamManager.useHint(sector.id, hintIndex, cost);
    if (ok) {
      soundFx.playFlagError(); // Deducted warning tone
    }
  };

  const renderChallengeComponent = () => {
    switch (sector.id) {
      case '01':
        return <DnsBlackoutChallenge sector={sector} teamState={teamState} />;
      case '02':
        return <WhoIsTheOperativeChallenge sector={sector} teamState={teamState} />;
      case '03':
        return <CrypticVaultChallenge sector={sector} teamState={teamState} />;
      case '04':
        return <GhostSignalChallenge sector={sector} teamState={teamState} />;
      case '05':
        return <HumanOrAiChallenge sector={sector} teamState={teamState} />;
      case '06':
        return <EmptyLogChallenge sector={sector} teamState={teamState} />;
      case '07':
        return <ForensicZeroChallenge sector={sector} teamState={teamState} />;
      case '08':
        return <ModularShadowChallenge sector={sector} teamState={teamState} />;
      case '09':
        return <DiscreteMatrixMathChallenge sector={sector} teamState={teamState} />;
      case '10':
        return <AfterIendChallenge sector={sector} teamState={teamState} />;
      case '11':
        return <PacketHuntChallenge sector={sector} teamState={teamState} />;
      case '12':
        return <BossFightAlgorithmChallenge sector={sector} teamState={teamState} />;
      case '13':
        return <ForgottenArchiveChallenge sector={sector} teamState={teamState} />;
      case '14':
        return <FahhThreeLoopChallenge sector={sector} teamState={teamState} />;
      case '15':
        return <OmegaCoreChallenge sector={sector} teamState={teamState} />;
      default:
        return <DnsBlackoutChallenge sector={sector} teamState={teamState} />;
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-4">
      {/* Top Breadcrumb & Return to Map */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBackToMap}
          className="flex items-center gap-2 text-xs font-mono text-cyan-400 hover:text-cyan-200 transition-colors bg-slate-900/60 hover:bg-slate-900 border border-slate-800 px-3 py-1.5 rounded cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>RETURN TO SECTOR MAP</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span>ENVIRONMENT:</span>
          <span className="text-white font-bold">{sector.environment}</span>
        </div>
      </div>

      {/* Main Sector Card */}
      <div className="bg-slate-950/80 border border-cyan-500/20 rounded-lg p-4 sm:p-6 backdrop-blur-md shadow-2xl relative">
        {/* Sector Header Information */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 tracking-wider mb-1">
              <span className="px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30 font-bold">
                SECTOR {sector.number}
              </span>
              <span>·</span>
              <span>{sector.category}</span>
              <span>·</span>
              <span className="text-yellow-400 font-bold">+{sector.baseXp} BASE XP</span>
            </div>

            <h1 className="text-xl sm:text-2xl font-orbitron font-extrabold text-white tracking-wide flex items-center gap-3">
              <span>{sector.title}</span>
              {isCompleted && (
                <span className="inline-flex items-center gap-1 text-xs font-mono text-emerald-400 bg-emerald-950/50 border border-emerald-500/40 px-2 py-0.5 rounded">
                  <CheckCircle2 className="w-3.5 h-3.5" /> SOLVED
                </span>
              )}
            </h1>
          </div>

          {/* AI Policy Badge & Difficulty */}
          <div className="flex items-center gap-3 self-start lg:self-center">
            <div className="text-right">
              <div className="text-[10px] font-mono text-slate-500 uppercase">DIFFICULTY</div>
              <div className="text-xs font-mono font-semibold text-slate-300">{sector.difficulty}</div>
            </div>

            <div className={`px-2.5 py-1 rounded text-xs font-mono border flex items-center gap-1.5 ${
              sector.aiPolicy === 'ALLOWED' || sector.aiPolicy === 'REQUIRED'
                ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-400'
                : sector.aiPolicy === 'AI-FREE'
                ? 'bg-red-950/30 border-red-500/40 text-red-400'
                : 'bg-amber-950/30 border-amber-500/40 text-amber-300'
            }`}>
              <Bot className="w-3.5 h-3.5" />
              <span>AI {sector.aiPolicy}</span>
            </div>
          </div>
        </div>

        {/* 2-Column Layout: Left (Scenario & Challenge), Right (Hints & Team) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (Span 2): Scenario, Objective, Interactive Component */}
          <div className="lg:col-span-2 space-y-4">
            {/* Scenario & System Message */}
            <div className="p-4 bg-slate-900/60 border border-slate-800 rounded text-xs font-mono space-y-2">
              <div className="text-slate-300 leading-relaxed">{sector.scenario}</div>
              <div className="text-cyan-300 font-semibold pt-1 border-t border-slate-800/80">
                OBJECTIVE: {sector.objective}
              </div>
              {sector.systemMessage && (
                <div className="text-[11px] text-amber-400/90 italic">
                  &gt; {sector.systemMessage}
                </div>
              )}
            </div>

            {/* DEDICATED INTERACTIVE CHALLENGE AREA */}
            <div className="mt-4">
              {renderChallengeComponent()}
            </div>
          </div>

          {/* Right Column (Span 1): Hints Drawer & Fragment info */}
          <div className="space-y-4">
            {/* Core Fragment Token Preview */}
            {sector.coreFragment && (
              <div className="p-4 bg-slate-900/50 border border-cyan-500/20 rounded text-xs font-mono">
                <div className="flex items-center gap-1.5 text-cyan-400 font-bold mb-1">
                  <Shield className="w-4 h-4" />
                  <span>CORE FRAGMENT ARTIFACT</span>
                </div>
                <div className="text-[11px] text-slate-400">{sector.coreFragment.description}</div>
                <div className="mt-2 text-xs font-bold text-white bg-black/60 p-2 rounded border border-slate-800 flex justify-between items-center">
                  <span>KEY: {isCompleted ? sector.coreFragment.code : '•••••••••••• (SOLVE SECTOR TO SECURE)'}</span>
                  <span className={isCompleted ? 'text-emerald-400' : 'text-slate-600'}>
                    {isCompleted ? 'SECURED ✓' : 'LOCKED'}
                  </span>
                </div>
              </div>
            )}

            {/* HINT SYSTEM */}
            <div className="p-4 bg-slate-900/50 border border-slate-800 rounded space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-1.5 text-xs font-mono text-yellow-400 font-bold">
                  <Lightbulb className="w-4 h-4" />
                  <span>INTELLIGENCE HINTS</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {hintsUsedCount} / 3 UNLOCKED
                </span>
              </div>

              <div className="space-y-2">
                {sector.hints.map((hint, idx) => {
                  const hintNumber = idx + 1;
                  const isUnlocked = hintsUsedCount >= hintNumber;
                  const canUnlock = hintsUsedCount === hintNumber - 1;

                  return (
                    <div
                      key={idx}
                      className={`p-2.5 rounded border text-xs font-mono transition-all ${
                        isUnlocked
                          ? 'bg-black/60 border-amber-500/40 text-amber-200'
                          : 'bg-black/30 border-slate-800/80 text-slate-500'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold">
                          HINT #{hintNumber} ({hint.cost} XP COST)
                        </span>
                        {isUnlocked ? (
                          <span className="text-emerald-400 text-[10px]">REVEALED</span>
                        ) : canUnlock ? (
                          <button
                            onClick={() => handleUnlockHint(hintNumber, hint.cost)}
                            className="px-2 py-0.5 bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/30 border border-yellow-500/30 rounded text-[10px] cursor-pointer"
                          >
                            Unlock (-{hint.cost} XP)
                          </button>
                        ) : (
                          <span className="text-slate-600 text-[10px]">LOCKED</span>
                        )}
                      </div>

                      {isUnlocked ? (
                        <p className="text-slate-300 text-[11px] leading-relaxed mt-1">
                          {hint.text}
                        </p>
                      ) : (
                        <p className="text-slate-600 text-[11px] italic">
                          Classified intel hint locked.
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Operative Collaboration Card */}
            <div className="p-3 bg-slate-900/40 border border-slate-800/80 rounded text-[11px] font-mono text-slate-400 space-y-1">
              <div className="text-cyan-400 font-bold">OPERATIVE PRESENCE</div>
              <div className="flex justify-between">
                <span>Operative A:</span>
                <span className="text-emerald-400">ONLINE</span>
              </div>
              <div className="flex justify-between">
                <span>Operative B:</span>
                <span className="text-emerald-400">ONLINE</span>
              </div>
              <div className="text-slate-500 pt-1 border-t border-slate-800">
                Both operatives can work simultaneously across sectors.
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM: FLAG SUBMISSION BAR */}
        <div className="mt-8 pt-6 border-t border-slate-800">
          <form onSubmit={handleFlagSubmit} className="space-y-3">
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full flex items-center">
                <input
                  type="text"
                  value={flagInput}
                  onChange={(e) => setFlagInput(e.target.value)}
                  disabled={isCompleted || isSubmitting || (isOmegaCore && !isPrecedingReady)}
                  placeholder={
                    isOmegaCore && !isPrecedingReady
                      ? 'LOCKED: REQUIRES ALL 14 PRECEDING SECTORS TO BE SOLVED FIRST'
                      : isOmegaCore
                      ? 'ENTER 14-CHARACTER MASTER CIPHER (L01[0] + L02[0] + ... + L14[0])'
                      : 'ENTER DISCOVERED FLAG OR TOKEN: e.g. OMEGA{...} or raw token'
                  }
                  className="w-full bg-slate-900 border border-slate-700 focus:border-cyan-400 pl-4 pr-20 py-3 rounded font-mono text-sm text-cyan-200 outline-none placeholder:text-slate-600 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={handlePaste}
                  disabled={isCompleted || isSubmitting || (isOmegaCore && !isPrecedingReady)}
                  className="absolute right-2 px-2.5 py-1 text-[11px] font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded border border-slate-700 cursor-pointer transition-colors disabled:opacity-50"
                  title="Paste from clipboard"
                >
                  PASTE
                </button>
              </div>

              <button
                type="submit"
                disabled={isCompleted || isSubmitting || !flagInput.trim() || (isOmegaCore && !isPrecedingReady)}
                className={`w-full sm:w-auto px-6 py-3 font-orbitron font-bold text-xs tracking-widest uppercase rounded transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white opacity-70 cursor-not-allowed'
                    : isOmegaCore && !isPrecedingReady
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                }`}
              >
                <Send className="w-3.5 h-3.5" />
                <span>
                  {isCompleted
                    ? (isOmegaCore ? 'OMEGA CORE SECURED ✓' : 'SECTOR SOLVED')
                    : isOmegaCore && !isPrecedingReady
                    ? 'OMEGA CORE LOCKED'
                    : isOmegaCore
                    ? 'TRANSMIT MASTER CIPHER'
                    : 'SUBMIT FLAG'}
                </span>
              </button>
            </div>

            {/* Submission feedback */}
            {submissionFeedback && (
              <div className={`p-3 rounded font-mono text-xs flex items-center justify-between ${
                submissionFeedback.success
                  ? 'bg-emerald-950/40 border border-emerald-500/50 text-emerald-300'
                  : 'bg-red-950/40 border border-red-500/50 text-red-400'
              }`}>
                <span>{submissionFeedback.message}</span>
                <span className="font-bold">
                  {submissionFeedback.xpDelta >= 0 ? `+${submissionFeedback.xpDelta}` : submissionFeedback.xpDelta} XP
                </span>
              </div>
            )}

            <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 pt-1">
              <span>
                {isOmegaCore
                  ? 'STRICT 14-CHARACTER CIPHER: L01[0] THROUGH L14[0]'
                  : 'ACCEPT: OMEGA{...} or raw token (case & format tolerant)'}
              </span>
              <span>WRONG SUBMISSION: -10 XP PENALTY</span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
