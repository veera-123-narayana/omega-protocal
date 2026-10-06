import React, { useState } from 'react';
import { 
  Download, 
  FileText, 
  Image as ImageIcon, 
  Database, 
  AlertTriangle, 
  CheckCircle2, 
  Terminal, 
  Layers, 
  HelpCircle, 
  FolderArchive, 
  Eye, 
  X, 
  Zap,
  Lock,
  ChevronRight
} from 'lucide-react';
import { SectorDefinition } from '../../types';

interface ForgottenArchiveChallengeCardProps {
  sector?: SectorDefinition;
  onFlagSubmit?: (flag: string) => void;
}

interface RecoveredFile {
  name: string;
  size: string;
  type: string;
  modified: string;
  isSuspicious?: boolean;
  suspiciousBadge?: string;
  description: string;
  previewContent?: string;
  isImage?: boolean;
  downloadUrl?: string;
}

export const ForgottenArchiveChallengeCard: React.FC<ForgottenArchiveChallengeCardProps> = ({ sector }) => {
  const [selectedFile, setSelectedFile] = useState<RecoveredFile | null>(null);
  const [activeHint, setActiveHint] = useState<number | null>(null);

  // Sector display number (default to Sector 14 or sector.number)
  const sectorHeaderTag = sector?.number 
    ? `SECTOR ${sector.number} • FILE FORENSICS • +300 XP` 
    : 'SECTOR 14 • FILE FORENSICS • +300 XP';

  const recoveredFiles: RecoveredFile[] = [
    {
      name: 'README.txt',
      size: '131 B',
      type: 'ASCII Text Document',
      modified: '2018-04-12 03:14:06 UTC',
      description: 'System administrator readme document describing workstation snapshot.',
      previewContent: `FORGOTTEN ARCHIVE\n\nBackup recovered from an old workstation.\n\nMost files are routine.\nOne artifact may be worth closer inspection.`,
    },
    {
      name: 'manifest.txt',
      size: '55 B',
      type: 'Checksum & Manifest',
      modified: '2018-04-12 03:14:06 UTC',
      description: 'Listing of archived files included in backup set.',
      previewContent: `backup_01.txt\nnotes.txt\narchive_fragment.png\nthumbs.db`,
    },
    {
      name: 'backup_01.txt',
      size: '76 B',
      type: 'Log File',
      modified: '2018-04-12 03:14:06 UTC',
      description: 'Scheduled nightly cron job output.',
      previewContent: `Nightly backup completed successfully.\nNo integrity warnings were reported.`,
    },
    {
      name: 'notes.txt',
      size: '57 B',
      type: 'Text Document',
      modified: '2018-04-12 03:14:06 UTC',
      description: 'Operator reminder memo.',
      previewContent: `Remember to archive old project material before cleanup.`,
    },
    {
      name: 'thumbs.db',
      size: '1.0 KB',
      type: 'OLE Compound Storage',
      modified: '2018-04-12 03:14:06 UTC',
      description: 'Windows Explorer thumbnail cache database artifact.',
      previewContent: `[BINARY ARTIFACT: OLE2 COMPOUND STORAGE]\nMagic: D0 CF 11 E0 A1 B1 1A E1\nCatalog: Thumbnail Cache Storage (2018-04-12T03:14:07Z)\nStatus: 0 anomalies detected in cache structure`,
    },
    {
      name: 'archive_fragment.png',
      size: '756 KB',
      type: 'PNG Image (RGBA 8-bit)',
      modified: '2018-04-12 03:14:06 UTC',
      isSuspicious: true,
      suspiciousBadge: 'Suspicious artifact detected',
      description: 'Workstation diagram raster image. Contains subtle pixel channel anomalies.',
      isImage: true,
      downloadUrl: '/archive_fragment.png',
    },
  ];

  const subtleHints = [
    { id: 1, title: 'RECON', text: 'Not every file in the archive is what it appears to be.' },
    { id: 2, title: 'TARGET IDENTIFICATION', text: 'Look closely at the suspicious image.' },
    { id: 3, title: 'CARRIER ANALYSIS', text: 'The image contains more than pixels.' },
    { id: 4, title: 'CASCADE EXTRACTION', text: "Once you extract the hidden text, don't stop decoding." },
  ];

  return (
    <div className="w-full bg-[#030712] border border-cyan-500/40 rounded-xl overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.15)] font-mono text-xs text-slate-200">
      
      {/* =========================================================================
          1. HEADER HUD
          ========================================================================= */}
      <div className="bg-gradient-to-r from-slate-950 via-[#061426] to-slate-950 border-b border-cyan-500/30 px-4 sm:px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Header Badge */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1 bg-cyan-950/80 border border-cyan-400/60 rounded text-[11px] font-bold text-cyan-300 tracking-wider shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              <span>{sectorHeaderTag}</span>
            </div>
            <span className="text-[10px] text-amber-400 border border-amber-500/30 bg-amber-950/40 px-2 py-0.5 rounded uppercase font-semibold">
              DIFFICULTY: MEDIUM
            </span>
          </div>

          {/* Telemetry Status Right */}
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5 text-rose-400 font-semibold bg-rose-950/40 border border-rose-500/40 px-2.5 py-0.5 rounded animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-400 inline-block" />
              <span>ANOMALOUS ARTIFACT DETECTED</span>
            </div>
            <div className="hidden md:flex items-center gap-1 text-slate-400">
              <span className="text-slate-500">FORMAT:</span>
              <span className="text-cyan-400">ZIP FORENSICS</span>
            </div>
          </div>
        </div>

        {/* Large Title */}
        <div className="mt-3 flex flex-col md:flex-row md:items-baseline justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-orbitron font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-white to-sky-400 tracking-wider">
              THE FORGOTTEN ARCHIVE
            </h1>
            <p className="text-xs text-cyan-400/80 font-rajdhani font-semibold mt-0.5 flex items-center gap-2">
              <span>WORKSTATION WS-04 DISK BACKUP</span>
              <span className="text-slate-600">•</span>
              <span>FILE FORENSICS & STEGANOGRAPHY</span>
            </p>
          </div>

          <a
            href="/the_forgotten_archive.zip"
            download="the_forgotten_archive.zip"
            className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-bold text-xs rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD the_forgotten_archive.zip</span>
          </a>
        </div>
      </div>

      {/* =========================================================================
          2. CHALLENGE WORKSPACE BODY
          ========================================================================= */}
      <div className="p-4 sm:p-6 space-y-6">

        {/* --- TERMINAL STATUS MESSAGES --- */}
        <div className="p-3 bg-black/70 border border-cyan-500/30 rounded-lg text-[11px] font-mono text-cyan-400/90 space-y-1">
          <div className="flex items-center gap-2 text-slate-400 text-[10px] pb-1 border-b border-slate-800">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>SYSTEM CONSOLE TELEMETRY</span>
          </div>
          <div className="text-slate-400">&gt; ARCHIVE ACQUIRED: the_forgotten_archive.zip</div>
          <div className="text-cyan-300">&gt; 6 FILES RECOVERED FROM DISK IMAGE</div>
          <div className="text-slate-400">&gt; INTEGRITY CHECK COMPLETE</div>
          <div className="text-rose-400 font-semibold">&gt; ANOMALOUS ARTIFACT DETECTED: archive_fragment.png</div>
          <div className="text-amber-300 font-semibold">&gt; INVESTIGATION REQUIRED</div>
        </div>

        {/* --- DESCRIPTION & OBJECTIVE PANEL --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* DESCRIPTION */}
          <div className="p-4 bg-gradient-to-b from-[#091524] to-[#040914] border border-cyan-500/20 rounded-lg relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider pb-2 mb-2 border-b border-cyan-900/50">
              <FolderArchive className="w-3.5 h-3.5 text-cyan-400" />
              <span>CHALLENGE DESCRIPTION</span>
            </div>
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              An old backup archive has been recovered from a forgotten workstation.
              <br /><br />
              Most of the contents appear harmless.
              <br /><br />
              One artifact, however, doesn't belong.
              <br /><br />
              Recover the hidden message and follow the trail until you reach the final flag.
            </p>
          </div>

          {/* OBJECTIVE */}
          <div className="p-4 bg-gradient-to-b from-[#071926] to-[#030d17] border border-cyan-500/20 rounded-lg relative overflow-hidden group hover:border-cyan-500/40 transition-colors">
            <div className="flex items-center gap-2 text-sky-400 font-bold text-xs uppercase tracking-wider pb-2 mb-2 border-b border-sky-900/50">
              <Zap className="w-3.5 h-3.5 text-sky-400" />
              <span>OBJECTIVE</span>
            </div>
            <p className="text-slate-200 font-medium leading-relaxed font-sans text-xs">
              Recover the hidden flag from the forgotten archive.
            </p>
            <div className="mt-4 p-3 bg-black/60 border border-slate-800 rounded text-[11px] space-y-1.5">
              <div className="text-amber-400 font-semibold flex items-center gap-1.5">
                <span>FLAG FORMAT:</span>
                <code className="text-cyan-300 font-mono bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-500/30">
                  sctf{'{...}'}
                </code>
              </div>
              <div className="text-slate-400 text-[10px]">
                The final flag begins with the lowercase letter <strong className="text-pink-400">"s"</strong>.
              </div>
              <div className="text-slate-500 text-[10px] pt-1 border-t border-slate-800">
                Solved entirely by inspecting the archive. No web exploits or brute force needed.
              </div>
            </div>
          </div>
        </div>

        {/* --- SECTION: FILES RECOVERED (INTERACTIVE RECON) --- */}
        <div className="space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div className="flex items-center gap-2 text-cyan-300 font-bold text-xs uppercase tracking-wider">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>FILES RECOVERED ({recoveredFiles.length})</span>
            </div>
            <span className="text-[10px] text-slate-500">
              CLICK ANY ITEM TO INSPECT FORENSIC METADATA
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {recoveredFiles.map((file) => {
              const isSelected = selectedFile?.name === file.name;
              return (
                <div
                  key={file.name}
                  onClick={() => setSelectedFile(file)}
                  className={`p-3 rounded-lg border cursor-pointer transition-all ${
                    file.isSuspicious
                      ? 'bg-rose-950/20 border-rose-500/50 hover:border-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]'
                      : isSelected
                      ? 'bg-cyan-950/30 border-cyan-400'
                      : 'bg-black/40 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      {file.isImage ? (
                        <ImageIcon className={`w-4 h-4 flex-shrink-0 ${file.isSuspicious ? 'text-rose-400' : 'text-cyan-400'}`} />
                      ) : file.name.endsWith('.db') ? (
                        <Database className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      ) : (
                        <FileText className="w-4 h-4 text-slate-400 flex-shrink-0" />
                      )}
                      <span className="font-bold text-slate-200 truncate text-[11px]">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono flex-shrink-0">{file.size}</span>
                  </div>

                  {file.isSuspicious && (
                    <div className="mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-[10px] font-bold text-rose-300 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-rose-400" />
                      <span>{file.suspiciousBadge}</span>
                    </div>
                  )}

                  <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
                    <span>{file.type}</span>
                    <span className="text-cyan-400 hover:underline flex items-center gap-0.5">
                      INSPECT <ChevronRight className="w-3 h-3 inline" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* --- FILE INSPECTION PREVIEW DRAWER (WHEN CLICKED) --- */}
        {selectedFile && (
          <div className="p-4 bg-slate-950 border border-cyan-500/40 rounded-xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-cyan-400 font-bold text-xs uppercase">ARTIFACT INSPECTOR:</span>
                <span className="text-slate-100 font-mono font-bold bg-black/60 px-2 py-0.5 rounded border border-slate-800">
                  {selectedFile.name}
                </span>
                {selectedFile.isSuspicious && (
                  <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/40 text-[10px] text-rose-300 font-bold">
                    SUSPICIOUS
                  </span>
                )}
              </div>
              <button
                type="button"
                onClick={() => setSelectedFile(null)}
                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-slate-400">
              <div className="bg-black/50 p-2 rounded border border-slate-900">
                <span className="text-slate-500 block">FILE SIZE</span>
                <span className="text-slate-200 font-semibold">{selectedFile.size}</span>
              </div>
              <div className="bg-black/50 p-2 rounded border border-slate-900">
                <span className="text-slate-500 block">TYPE</span>
                <span className="text-cyan-300 font-semibold truncate block">{selectedFile.type}</span>
              </div>
              <div className="bg-black/50 p-2 rounded border border-slate-900">
                <span className="text-slate-500 block">TIMESTAMP</span>
                <span className="text-slate-300 font-semibold">{selectedFile.modified}</span>
              </div>
              <div className="bg-black/50 p-2 rounded border border-slate-900 flex items-center justify-center">
                {selectedFile.downloadUrl ? (
                  <a
                    href={selectedFile.downloadUrl}
                    download={selectedFile.name}
                    className="w-full text-center py-1 bg-cyan-600 hover:bg-cyan-500 text-black font-bold rounded"
                  >
                    DOWNLOAD RAW
                  </a>
                ) : (
                  <span className="text-slate-500">INSIDE ZIP</span>
                )}
              </div>
            </div>

            {selectedFile.isImage ? (
              <div className="space-y-3 pt-2">
                <div className="p-3 bg-black/90 border border-rose-500/30 rounded-lg flex flex-col sm:flex-row items-center gap-4">
                  <div className="w-full sm:w-64 max-h-48 overflow-hidden rounded border border-slate-800 bg-black flex items-center justify-center">
                    <img
                      src="/archive_fragment.png"
                      alt="archive_fragment.png forensic artifact"
                      className="max-h-44 object-contain"
                    />
                  </div>
                  <div className="space-y-2 text-xs text-slate-300 flex-1">
                    <div className="text-rose-400 font-bold flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" />
                      <span>FORENSIC ADVISORY: CARRIER DETECTED</span>
                    </div>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">
                      The image dimensions and bitplanes deviate from ordinary compressed screenshots.
                      Examine the pixel channels for low-level encoding structures.
                    </p>
                    <div className="pt-2 flex flex-wrap gap-2 text-[10px]">
                      <a
                        href="/archive_fragment.png"
                        download="archive_fragment.png"
                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-cyan-500 hover:bg-cyan-400 text-black font-bold rounded shadow-[0_0_10px_rgba(6,182,212,0.3)]"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>DOWNLOAD archive_fragment.png</span>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-black/80 border border-slate-800 rounded font-mono text-[11px] text-cyan-300/90 whitespace-pre-wrap max-h-48 overflow-y-auto">
                {selectedFile.previewContent}
              </div>
            )}
          </div>
        )}

        {/* --- SECTION: SUBTLE HINTS --- */}
        <div className="p-4 bg-gradient-to-b from-slate-950 to-[#040812] border border-amber-500/30 rounded-lg space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-amber-500/20">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
              <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>SUBTLE INVESTIGATIVE HINTS</span>
            </div>
            <span className="text-[10px] text-slate-400">TACTICAL ASSISTANCE</span>
          </div>

          <div className="space-y-2">
            {subtleHints.map((hint, idx) => {
              const isOpen = activeHint === idx;
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
                    onClick={() => setActiveHint(isOpen ? null : idx)}
                    className="w-full text-left px-3 py-2 flex items-center justify-between text-xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/60 border border-slate-700 text-amber-400">
                        HINT {hint.id}
                      </span>
                      <span className="font-semibold text-slate-300">{hint.title}</span>
                    </div>
                    <span className="text-slate-500 text-[10px]">{isOpen ? 'COLLAPSE ▲' : 'REVEAL ▼'}</span>
                  </button>

                  {isOpen && (
                    <div className="px-3 pb-3 pt-1 text-xs text-amber-200/90 font-mono border-t border-amber-500/20 bg-black/30">
                      "{hint.text}"
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* --- DOWNLOAD ARCHIVE ACTION BAR --- */}
        <div className="p-4 bg-gradient-to-r from-cyan-950/30 via-slate-950 to-blue-950/30 border border-cyan-500/30 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-400/40 text-cyan-300">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-100">the_forgotten_archive.zip</div>
              <div className="text-[10px] text-slate-400">
                SHA-256 verified forensic package · 6 files enclosed · 32.8 KB
              </div>
            </div>
          </div>

          <a
            href="/the_forgotten_archive.zip"
            download="the_forgotten_archive.zip"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-extrabold text-xs rounded-lg shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all transform active:scale-95 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>DOWNLOAD ARCHIVE (.ZIP)</span>
          </a>
        </div>

      </div>

    </div>
  );
};
