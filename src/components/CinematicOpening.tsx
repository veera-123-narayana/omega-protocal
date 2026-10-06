import React, { useState, useEffect } from 'react';
import { OperativeDescentScene } from './3d/OperativeDescentScene';
import { soundFx } from '../utils/audio';
import { Shield, Cpu, Activity, Terminal, ChevronRight, Zap } from 'lucide-react';

interface CinematicOpeningProps {
  onComplete: () => void;
}

export const CinematicOpening: React.FC<CinematicOpeningProps> = ({ onComplete }) => {
  // Cinematic scenes: 'boot_1' -> 'boot_2' -> 'descent' -> 'crystals' -> 'omega_online'
  const [scene, setScene] = useState<'boot_1' | 'boot_2' | 'descent' | 'crystals' | 'omega_online'>('boot_1');
  const [bootLines, setBootLines] = useState<string[]>([]);

  useEffect(() => {
    // SCENE 1 - SYSTEM BOOT
    soundFx.playBootHum();

    const t1 = setTimeout(() => {
      setBootLines((prev) => [...prev, 'NETWORK CORE ........ ONLINE']);
      soundFx.playKeyTick();
    }, 1200);

    const t2 = setTimeout(() => {
      setBootLines((prev) => [...prev, 'SECURITY CORE ....... ONLINE']);
      soundFx.playKeyTick();
    }, 2000);

    const t3 = setTimeout(() => {
      setBootLines((prev) => [...prev, 'NEURAL CORE ......... ONLINE']);
      soundFx.playKeyTick();
    }, 2800);

    const t4 = setTimeout(() => {
      setBootLines((prev) => [...prev, 'OPERATIVE SYSTEM ... ONLINE']);
      soundFx.playKeyTick();
    }, 3600);

    const t5 = setTimeout(() => {
      setScene('boot_2');
    }, 4500);

    // Transition to Human Descent
    const t6 = setTimeout(() => {
      setScene('descent');
    }, 6200);

    // Safety fallback timer: Ensure sequence smoothly advances even if 3D animation encounters frame drops
    const safetyDescent = setTimeout(() => {
      setScene((curr) => (curr === 'descent' ? 'crystals' : curr));
    }, 12000);

    const safetyCrystals = setTimeout(() => {
      setScene((curr) => (curr === 'crystals' ? 'omega_online' : curr));
    }, 18000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
      clearTimeout(t6);
      clearTimeout(safetyDescent);
      clearTimeout(safetyCrystals);
    };
  }, []);

  const handleLandingImpact = () => {
    soundFx.playLandingImpact();
    // After impact, transition to nano-crystal activation
    setTimeout(() => {
      setScene('crystals');
      soundFx.playCrystalSparkle();
    }, 900);
  };

  const handleCrystalsAssembled = () => {
    setTimeout(() => {
      setScene('omega_online');
      soundFx.playCountdownBeep(true);
    }, 800);
  };

  const mapPhaseFor3D = (): 'boot' | 'descent' | 'crystals' | 'complete' => {
    if (scene === 'boot_1' || scene === 'boot_2') return 'boot';
    if (scene === 'descent') return 'descent';
    if (scene === 'crystals') return 'crystals';
    return 'complete';
  };

  return (
    <div className="relative w-screen h-screen bg-[#020617] text-slate-100 flex flex-col items-center justify-center overflow-hidden">
      {/* 3D WebGL Descent Scene */}
      <OperativeDescentScene
        phase={mapPhaseFor3D()}
        onLandingImpact={handleLandingImpact}
        onCrystalsAssembled={handleCrystalsAssembled}
      />

      {/* Cyberpunk Scanlines and Grid */}
      <div className="absolute inset-0 scanlines opacity-60 pointer-events-none z-10" />
      <div className="absolute inset-0 cyber-grid opacity-30 pointer-events-none z-10" />

      {/* Top Controls: Replay and Skip Buttons */}
      <div className="absolute top-6 right-6 z-30 flex items-center gap-2">
        <button
          type="button"
          onClick={() => {
            soundFx.playKeyTick();
            setScene('boot_1');
          }}
          className="px-3 py-1.5 rounded-sm border border-cyan-500/30 bg-black/60 backdrop-blur-md text-xs font-mono text-cyan-400 hover:text-cyan-200 hover:border-cyan-400 transition-colors uppercase tracking-widest cursor-pointer"
        >
          Restart
        </button>

        <button
          type="button"
          onClick={onComplete}
          className="px-3.5 py-1.5 rounded-sm border border-cyan-500/50 bg-cyan-950/60 backdrop-blur-md text-xs font-mono text-cyan-300 hover:text-white hover:border-cyan-400 transition-colors uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.3)]"
        >
          <span>Skip Sequence</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* SCENE 1 — SYSTEM BOOT TEXT OVERLAYS */}
      {scene === 'boot_1' && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-xl">
          <div className="w-12 h-12 rounded-full border border-cyan-500/40 flex items-center justify-center mb-6 animate-pulse bg-cyan-950/20">
            <Zap className="w-6 h-6 text-cyan-400" />
          </div>

          <h1 className="text-3xl sm:text-5xl font-orbitron font-extrabold tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-white to-blue-500 mb-2">
            SYSTEM OMEGA
          </h1>
          <p className="font-mono text-xs text-cyan-300 tracking-[0.3em] mb-8 animate-pulse">
            INITIALIZING...
          </p>

          {/* Diagnostic Online Check */}
          <div className="w-full max-w-sm flex flex-col gap-2 font-mono text-xs sm:text-sm text-left bg-black/70 border border-slate-800 p-4 rounded backdrop-blur-sm">
            {bootLines.map((line, idx) => (
              <div key={idx} className="flex justify-between items-center text-cyan-400/90 tracking-wider">
                <span>{line.split('...')[0]}</span>
                <span className="text-emerald-400 font-bold ml-2">ONLINE</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {scene === 'boot_2' && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-4">
          <div className="text-cyan-500/80 font-mono text-sm tracking-widest mb-2">
            OMEGA PROTOCOL
          </div>
          <h2 className="text-2xl sm:text-4xl font-orbitron font-bold text-white tracking-widest mb-4">
            LOADING OPERATIVE INTERFACE
          </h2>
          <div className="w-48 h-1 bg-slate-900 rounded-full overflow-hidden border border-cyan-500/30">
            <div className="h-full bg-cyan-400 animate-[pulse_1s_infinite] w-full" />
          </div>
        </div>
      )}

      {/* SCENE 2 — HUMAN DESCENT HUD */}
      {scene === 'descent' && (
        <div className="relative z-20 pointer-events-none flex flex-col items-center">
          <div className="text-xs font-mono text-cyan-400/80 tracking-widest uppercase mb-1 bg-black/60 px-3 py-1 border border-cyan-500/20 backdrop-blur-sm">
            DESCENT TRAJECTORY LOCKED // TERMINAL VELOCITY
          </div>
        </div>
      )}

      {/* SCENE 3 — NANO-CRYSTAL ACTIVATION */}
      {scene === 'crystals' && (
        <div className="relative z-20 pointer-events-none text-center px-4">
          <div className="inline-block text-xs font-mono text-cyan-300 tracking-[0.25em] uppercase mb-2 bg-black/60 px-4 py-1.5 border border-cyan-500/30 backdrop-blur-sm">
            NANO-CRYSTAL MATRIX ASSEMBLED // NEURAL FUSION ACTIVE
          </div>
        </div>
      )}

      {/* SCENE 4 — OMEGA ACTIVATION */}
      {scene === 'omega_online' && (
        <div className="relative z-20 flex flex-col items-center justify-center text-center px-4 max-w-2xl animate-fade-in">
          <div className="inline-flex items-center gap-2 px-3 py-1 border border-emerald-500/30 bg-emerald-950/20 text-emerald-400 text-xs font-mono tracking-widest uppercase mb-4 rounded-sm">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>ALL CORES OPERATIONAL</span>
          </div>

          <h1 className="text-4xl sm:text-6xl font-orbitron font-black tracking-widest text-white mb-2 text-glow-cyan">
            SYSTEM OMEGA
          </h1>

          <div className="text-xl sm:text-2xl font-orbitron font-semibold text-cyan-400 tracking-[0.4em] mb-4">
            ONLINE
          </div>

          <p className="font-mono text-sm text-slate-400 tracking-wider mb-8 max-w-md">
            OPERATIVE IDENTIFICATION REQUIRED TO PROCEED WITH OMEGA PROTOCOL
          </p>

          <button
            onClick={onComplete}
            className="group relative px-8 py-3.5 bg-cyan-500 text-black font-orbitron font-bold text-sm tracking-widest uppercase rounded hover:bg-cyan-400 transition-all shadow-[0_0_25px_rgba(6,182,212,0.5)] cursor-pointer flex items-center gap-3"
          >
            <span>INITIALIZE OPERATIVE</span>
            <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Bottom Status Ticker info */}
      <div className="absolute bottom-6 left-6 right-6 z-20 flex justify-between items-center text-[10px] font-mono text-slate-600 border-t border-slate-900 pt-3">
        <span>FACILITY: APEX_SECTOR_OMEGA</span>
        <span className="hidden sm:inline">SECURITY PROTOCOL: LEVEL 5 TITAN</span>
        <span>15 SECTORS // 105 MINUTES</span>
      </div>
    </div>
  );
};
