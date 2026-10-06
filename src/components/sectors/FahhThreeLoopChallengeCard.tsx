import React, { useState } from 'react';
import { 
  Download, 
  Eye, 
  FileCode2, 
  Flame, 
  HelpCircle, 
  Layers, 
  Maximize2, 
  ShieldAlert, 
  Terminal, 
  Unlock, 
  X, 
  Zap 
} from 'lucide-react';
import { Sector } from '../../types';

interface FahhThreeLoopChallengeCardProps {
  sector?: Sector;
  onFlagSubmit?: (flag: string) => void;
}

export const FahhThreeLoopChallengeCard: React.FC<FahhThreeLoopChallengeCardProps> = () => {
  const [activeHintIndex, setActiveHintIndex] = useState<number | null>(null);
  const [showLightbox, setShowLightbox] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);

  const hints = [
    { id: 1, title: 'CARRIER RECON', text: 'The image contains hidden data.' },
    { id: 2, title: 'FORMAT INTEGRITY', text: 'Inspect the PNG rather than trusting what is visible.' },
    { id: 3, title: 'PAYLOAD STRUCTURE', text: 'The hidden content is encoded.' },
    { id: 4, title: 'CASCADE LAYER', text: 'The encoding has been applied multiple times.' },
    { id: 5, title: 'CONVERGENCE', text: 'Keep decoding until readable plaintext appears.' },
  ];

  const handleCopyCommand = () => {
    const cmd = `# Python quick extraction helper\n# python3 -c "from PIL import Image; ... inspect RGB LSB sequence"`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(cmd);
      setCopiedCurl(true);
      setTimeout(() => setCopiedCurl(false), 2000);
    }
  };

  return (
    <div className="w-full bg-[#030712] border border-cyan-500/40 rounded-xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.15)] font-mono text-xs text-slate-200">
      
      {/* =========================================================================
          1. TOP CYBERPUNK HEADER HUD
          ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-950 via-[#061324] to-slate-950 border-b border-cyan-500/30 px-4 sm:px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Header Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-400/60 rounded text-[11px] font-bold text-cyan-300 tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              <span>SECTOR 14 • MEMEVAULT • +300 XP</span>
            </div>
            <span className="hidden sm:inline-block text-[10px] text-slate-400 border border-slate-800 bg-slate-900/60 px-2 py-0.5 rounded uppercase">
              DIFF: EXPERT
            </span>
          </div>

          {/* Telemetry Status Right */}
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold bg-amber-950/40 border border-amber-500/30 px-2.5 py-0.5 rounded">
              <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
              <span>SUSPICIOUS CARRIER DETECTED</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-slate-400">
              <span className="text-slate-500">ID:</span>
              <span className="text-cyan-400">FAHH-014-STEGO</span>
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="mt-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-orbitron font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-pink-400 tracking-wider">
              FAHH // THE THREE-LOOP
            </h1>
            <p className="text-xs text-cyan-400/90 font-rajdhani font-semibold mt-0.5 flex items-center gap-2">
              <span>MEMEVAULT STEGANOGRAPHIC ANOMALY</span>
              <span className="text-slate-600">•</span>
              <span className="text-slate-400">REVERSE ENCODING PROTOCOL</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[10px] text-slate-400 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded flex items-center gap-1.5">
              <Flame className="w-3 h-3 text-pink-500" />
              <span>FIRST BLOOD AVAILABLE (+50 BONUS)</span>
            </span>
          </div>
        </div>
      </div>

      {/* =========================================================================
          2. CHALLENGE WORKSPACE BODY
          ========================================================================= */}
      <div className="p-4 sm:p-6 space-y-6">

        {/* --- SECTION: TASK & OBJECTIVE BRIEFINGS --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* TASK CARD */}
          <div className="p-4 bg-gradient-to-b from-[#091524] to-[#040914] border border-cyan-500/20 rounded-lg relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider pb-2 mb-2 border-b border-cyan-900/50">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" />
              <span>TASK</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              A strange meme has been recovered from the MemeVault.
              Something is hidden inside the image.
              The visible text is only a distraction.
              Find the concealed message, follow the encoding trail,
              and recover the final flag.
            </p>
          </div>

          {/* OBJECTIVE CARD */}
          <div className="p-4 bg-gradient-to-b from-[#140b1e] to-[#06040c] border border-pink-500/20 rounded-lg relative overflow-hidden group hover:border-pink-500/40 transition-colors">
            <div className="absolute top-0 right-0 w-24 h-24 bg-pink-500/5 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 text-pink-400 font-bold text-xs uppercase tracking-wider pb-2 mb-2 border-b border-pink-900/50">
              <Unlock className="w-3.5 h-3.5 text-pink-400" />
              <span>OBJECTIVE</span>
            </div>
            <p className="text-slate-200 font-medium leading-relaxed font-sans text-xs">
              Extract the hidden data from the image and recover the final flag.
            </p>
            <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-300/90 bg-amber-950/40 border border-amber-500/30 p-2 rounded">
              <span className="text-amber-400 font-bold">FORMAT:</span>
              <span>Final flag starts with lowercase <code className="text-pink-300 font-mono font-bold bg-black/60 px-1 py-0.5 rounded">s</code> (e.g. <code className="text-cyan-300 font-mono">sctf{'{...}'}</code>)</span>
            </div>
          </div>
        </div>

        {/* --- CENTRAL VISUAL: THE MEME IMAGE CARD --- */}
        <div className="relative bg-slate-950 border-2 border-cyan-500/40 rounded-xl p-4 sm:p-5 shadow-[0_0_40px_rgba(6,182,212,0.12)]">
          
          {/* Cyber HUD Corner Brackets */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t-2 border-l-2 border-cyan-400 pointer-events-none" />
          <div className="absolute top-2 right-2 w-3 h-3 border-t-2 border-r-2 border-cyan-400 pointer-events-none" />
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b-2 border-l-2 border-cyan-400 pointer-events-none" />
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b-2 border-r-2 border-cyan-400 pointer-events-none" />

          {/* Top Image HUD Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-3 border-b border-slate-800 text-[11px]">
            <div className="flex items-center gap-2 text-cyan-400 font-mono">
              <span className="w-2 h-2 bg-emerald-400 rounded-full" />
              <span className="font-bold">EVIDENCE FILE:</span>
              <span className="text-slate-200 font-mono bg-black/60 px-2 py-0.5 rounded border border-slate-800">
                fahhh_three_loop_ctf.png
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowLightbox(true)}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded border border-slate-700 transition-colors"
                title="Expand View"
              >
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">VIEW FULLSCREEN</span>
              </button>

              <a
                href="/fahhh_three_loop_ctf.png"
                download="fahhh_three_loop_ctf.png"
                className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded shadow-[0_0_15px_rgba(6,182,212,0.4)] transition-all transform active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>DOWNLOAD ARTIFACT (.PNG)</span>
              </a>
            </div>
          </div>

          {/* Center Image Container */}
          <div className="relative group overflow-hidden rounded-lg border border-slate-800 bg-black/80 flex items-center justify-center min-h-[300px] max-h-[520px]">
            
            {/* Subtle Crosshair Reticle Overlay */}
            <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(#06b6d4_1px,transparent_1px)] [background-size:24px_24px] opacity-15" />
            
            <img
              src="/fahhh_three_loop_ctf.png"
              alt="MemeVault FAHH Challenge Visual"
              className="w-full h-auto max-h-[500px] object-contain transition-transform duration-300 group-hover:scale-[1.01]"
              loading="eager"
            />

            {/* Hover overlay hint */}
            <div className="absolute bottom-3 left-3 bg-black/80 backdrop-blur-md border border-cyan-500/40 text-cyan-300 px-3 py-1.5 rounded text-[11px] font-mono opacity-90 pointer-events-none">
              <span className="text-yellow-400 font-bold">WARNING:</span> Visible text is a distraction. Hidden data inside pixel matrix.
            </div>
          </div>

          {/* Bottom Telemetry HUD */}
          <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400">
            <div className="bg-black/50 p-2 rounded border border-slate-900">
              <span className="text-slate-500 block">FORMAT</span>
              <span className="text-cyan-300 font-semibold">Portable Network Graphics (PNG)</span>
            </div>
            <div className="bg-black/50 p-2 rounded border border-slate-900">
              <span className="text-slate-500 block">BIT COMPRESSION</span>
              <span className="text-emerald-400 font-semibold">Lossless RGBA (8-bit/channel)</span>
            </div>
            <div className="bg-black/50 p-2 rounded border border-slate-900">
              <span className="text-slate-500 block">RESOLUTION</span>
              <span className="text-slate-200 font-semibold">1000 × 750 px</span>
            </div>
            <div className="bg-black/50 p-2 rounded border border-slate-900">
              <span className="text-slate-500 block">ENTROPY RATING</span>
              <span className="text-rose-400 font-semibold">7.994 (Stego Signature)</span>
            </div>
          </div>
        </div>

        {/* --- SECTION: ENCODING PIPELINE & FLOW --- */}
        <div className="p-4 bg-[#050b17] border border-cyan-500/20 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>EXTRACTION TRAIL SPECIFICATION</span>
            </div>
            <span className="text-[10px] text-slate-500">STANDALONE PUZZLE • NO GUESSWORK</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1 text-[11px]">
            <div className="bg-black/60 border border-cyan-500/40 p-2.5 rounded text-center">
              <div className="text-[9px] text-cyan-400 font-bold uppercase">STAGE 1</div>
              <div className="text-slate-200 font-semibold mt-1">PNG Image</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Raw Artifact</div>
            </div>

            <div className="bg-black/60 border border-slate-800 p-2.5 rounded text-center">
              <div className="text-[9px] text-slate-400 font-bold uppercase">STAGE 2</div>
              <div className="text-slate-200 font-semibold mt-1">Stego Extract</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Bitplanes</div>
            </div>

            <div className="bg-black/60 border border-slate-800 p-2.5 rounded text-center">
              <div className="text-[9px] text-slate-400 font-bold uppercase">STAGE 3</div>
              <div className="text-slate-200 font-semibold mt-1">Hidden Text</div>
              <div className="text-[9px] text-slate-400 mt-0.5">Marker Header</div>
            </div>

            <div className="bg-black/60 border border-amber-500/40 p-2.5 rounded text-center">
              <div className="text-[9px] text-amber-400 font-bold uppercase">LOOP 1</div>
              <div className="text-slate-200 font-semibold mt-1">Hex Decode</div>
              <div className="text-[9px] text-amber-300 mt-0.5">Layer 1</div>
            </div>

            <div className="bg-black/60 border border-amber-500/40 p-2.5 rounded text-center">
              <div className="text-[9px] text-amber-400 font-bold uppercase">LOOP 2</div>
              <div className="text-slate-200 font-semibold mt-1">Hex Decode</div>
              <div className="text-[9px] text-amber-300 mt-0.5">Layer 2</div>
            </div>

            <div className="bg-black/60 border border-amber-500/40 p-2.5 rounded text-center">
              <div className="text-[9px] text-amber-400 font-bold uppercase">LOOP 3</div>
              <div className="text-slate-200 font-semibold mt-1">Hex Decode</div>
              <div className="text-[9px] text-amber-300 mt-0.5">Layer 3</div>
            </div>

            <div className="bg-gradient-to-b from-pink-950/60 to-black border border-pink-500/60 p-2.5 rounded text-center shadow-[0_0_15px_rgba(244,63,94,0.2)]">
              <div className="text-[9px] text-pink-400 font-bold uppercase">FINAL FLAG</div>
              <div className="text-white font-bold mt-1">sctf{'{...}'}</div>
              <div className="text-[9px] text-pink-300 mt-0.5">Starts with 's'</div>
            </div>
          </div>
        </div>

        {/* --- SECTION: SUBTLE HINTS --- */}
        <div className="p-4 bg-gradient-to-b from-slate-950 to-[#040812] border border-amber-500/30 rounded-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>HINTS (TACTICAL RECONNAISSANCE)</span>
            </div>
            <span className="text-[10px] text-slate-400">CLICK TO EXPAND SUBTLE ADVISORY</span>
          </div>

          <div className="space-y-2">
            {hints.map((hint, idx) => {
              const isOpen = activeHintIndex === idx;
              return (
                <div
                  key={hint.id}
                  className={`border rounded transition-all overflow-hidden ${
                    isOpen 
                      ? 'bg-amber-950/20 border-amber-500/50' 
                      : 'bg-black/40 border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setActiveHintIndex(isOpen ? null : idx)}
                    className="w-full text-left px-3 py-2 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 border border-slate-700 text-amber-400">
                        HINT 0{hint.id}
                      </span>
                      <span className="font-semibold text-slate-300">{hint.title}</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{isOpen ? 'COLLAPSE ▲' : 'REVEAL ▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 text-xs text-amber-200/90 font-mono border-t border-amber-500/20 bg-black/30">
                      {hint.text}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- SECTION: REPRODUCIBLE ANALYST TOOLKIT REFERENCE --- */}
        <div className="p-3 bg-black/50 border border-slate-800 rounded text-[11px] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-slate-400">
          <div className="flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
            <span>
              Analyze offline with standard forensic toolkits: <code className="text-cyan-300">python3-pillow</code>, <code className="text-cyan-300">zsteg</code>, <code className="text-cyan-300">CyberChef</code>, or custom bitplane scanners.
            </span>
          </div>

          <a
            href="/fahhh_three_loop_ctf.png"
            download="fahhh_three_loop_ctf.png"
            className="flex-shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-cyan-300 rounded border border-cyan-500/30 transition-colors"
          >
            <Download className="w-3 h-3" />
            <span>SAVE PNG FILE</span>
          </a>
        </div>

      </div>

      {/* =========================================================================
          3. FULLSCREEN LIGHTBOX MODAL
          ========================================================================= */}
      {showLightbox && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col items-center justify-center p-4">
          <div className="w-full max-w-5xl flex items-center justify-between pb-3 border-b border-cyan-500/30 text-xs">
            <div className="flex items-center gap-2 text-cyan-400 font-orbitron font-bold">
              <Zap className="w-4 h-4 text-cyan-400" />
              <span>MEMEVAULT ARTIFACT HIGH RESOLUTION VIEWER</span>
            </div>
            <button
              type="button"
              onClick={() => setShowLightbox(false)}
              className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="relative max-w-4xl max-h-[80vh] overflow-auto p-4 flex items-center justify-center">
            <img
              src="/fahhh_three_loop_ctf.png"
              alt="High Resolution Challenge Artifact"
              className="max-w-full max-h-[75vh] object-contain rounded border border-cyan-500/50 shadow-[0_0_50px_rgba(6,182,212,0.3)]"
            />
          </div>

          <div className="pt-3 text-[11px] text-slate-400 flex items-center gap-4">
            <span>PRESS ESC OR CLOSE TO RETURN</span>
            <a
              href="/fahhh_three_loop_ctf.png"
              download="fahhh_three_loop_ctf.png"
              className="text-cyan-400 underline font-bold"
            >
              DOWNLOAD LOSSLESS ARTIFACT
            </a>
          </div>
        </div>
      )}

    </div>
  );
};
