import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { initializeApp } from 'firebase/app';
import { getFirestore, doc, getDoc, runTransaction, serverTimestamp, arrayUnion } from 'firebase/firestore';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load firebase applet config
let firebaseConfig: any = {};
try {
  const configPath = path.resolve(__dirname, 'firebase-applet-config.json');
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Could not read firebase-applet-config.json:', e);
}

const fbApp = initializeApp(firebaseConfig);
const db = getFirestore(fbApp, firebaseConfig.firestoreDatabaseId);

// Canonical primary tokens for levels 01 to 14 (first character key source)
const CANONICAL_PRIMARY_SECTOR_TOKENS: Record<string, string> = {
  '01': 'dns_zone_recovered_2026',              // d
  '02': 'v4nd4l_99_zurich_breach',              // v
  '03': 'protocol_bass_unbased',                // p
  '04': 'spectral_ghost_882',                   // s
  '05': 'model_gamma_tcp_hallucination_exposed',// m
  '06': 'whitespace_protocol',                  // w
  '07': 'st3g0_m4g1c_byt3s_unc0v3r3d',          // s
  '08': 'crypto_71',                            // c
  '09': 'matrix_mod_38_65_10',                  // m
  '10': 'iend_trailing_stream_unlocked',        // i
  '11': 'pcap_str3am_f0ll0w_8829',              // p
  '12': 'algo_boss_defeated_o_log_n_time',       // a
  '13': '4g3nt_chaos_purified_v3rifi3d',         // 4
  '14': 'synthetic_reality_glitch_exposed',     // s
};

// All accepted tokens per sector for validation
const ALL_ACCEPTED_SECTOR_TOKENS: Record<string, string[]> = {
  '01': ['dns_zone_recovered_2026', 'T01FR0F7ZG5zX3pvbmVfcmVjb3ZlcmVkXzIwMjZ9', 'dns-zone-recovered-2026', 'NET-ALPHA-89'],
  '02': ['v4nd4l_99_zurich_breach', 'v4nd4l_99', 'v4nd4l-99-zurich-breach', 'v4nd4l99', 'zurich_breach', 'ID-V4ND4L-09'],
  '03': ['protocol_bass_unbased', 'protocol-bass-unbased', 'protocolbassunbased', 'CIPHER-KEY-7X'],
  '04': ['spectral_ghost_882', 'spectral-ghost-882', 'spectralghost882', 'SIGNAL-440-HZ'],
  '05': ['model_gamma_tcp_hallucination_exposed', 'model_gamma', 'model-gamma', 'gamma', 'NEURAL-MAP-05'],
  '06': ['whitespace_protocol', 'whitespace-protocol', 'clean_build_zero_warnings_2026', 'clean_build_zero_warnings', 'STEGO-WS-01', 'KERNEL-BOOT-06'],
  '07': ['st3g0_m4g1c_byt3s_unc0v3r3d', 'stego_magic_bytes_uncovered', 'st3g0_m4g1c_byt3s', 'MAGIC-PNG-8950'],
  '08': ['crypto_71', '71', 'crypto-71', 'priv_escalation_jwt_bypass_901', 'priv_escalation_jwt_bypass', 'jwt_bypass_901', 'CIPHER-MOD-71', 'HTTP-AUTH-08'],
  '09': ['matrix_mod_38_65_10', '38_65_10', '38-65-10', 'matrix_38_65_10', 'modular_vector_38_65_10', 'discrete_matrix_38_65_10', 'MATH-EIGEN-99', 'skibidi_sigma_aura_max_999'],
  '10': ['iend_trailing_stream_unlocked', 'iend-trailing-stream-unlocked', 'post_iend_payload_extracted', 'after_iend_multilayer', 'STEGO-IEND-350', 'gpio_i2c_bus_master_x7', 'UART-BUS-X7'],
  '11': ['pcap_str3am_f0ll0w_8829', 'pcap_stream_follow_8829', 'pcap_str3am_f0ll0w', 'pcap-stream-follow-8829', 'STREAM-1042-TCP'],
  '12': ['algo_boss_defeated_o_log_n_time', 'algo_boss_defeated', 'o_log_n_time', 'algo_boss', 'DSA-MATRIX-12'],
  '13': ['4g3nt_chaos_purified_v3rifi3d', 'agent_chaos_purified_verified', '4g3nt_chaos', 'agent_chaos', 'VERIFIER-RAG-01'],
  '14': ['synthetic_reality_glitch_exposed', 'reality_glitch_exposed', 'synthetic_reality_glitch', 'VISION-DIFF-14'],
};

function normalizeUserFlag(rawInput: string): string[] {
  let cleaned = rawInput.trim();
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '').trim();
  cleaned = cleaned.replace(/^(flag|omega|key|token|payload)\s*[:=]\s*/i, '').trim();

  const candidates: string[] = [cleaned];

  if (cleaned.includes('{') && cleaned.includes('}')) {
    const start = cleaned.indexOf('{') + 1;
    const end = cleaned.lastIndexOf('}');
    const inner = cleaned.substring(start, end).trim();
    if (inner) candidates.push(inner);
  }

  const normalizedSet = new Set<string>();
  for (const item of candidates) {
    const base = item.trim().toLowerCase();
    normalizedSet.add(base);
    normalizedSet.add(base.replace(/[-_\s]+/g, '_'));
    normalizedSet.add(base.replace(/[-_\s]+/g, ''));
    normalizedSet.add(base.replace(/[-_\s]+/g, '-'));
  }
  return Array.from(normalizedSet);
}

function checkSectorMatch(sectorId: string, submittedFlag: string): { isMatch: boolean; canonicalToken: string } {
  const num = sectorId.replace(/^level-/, '').padStart(2, '0');
  const allowed = ALL_ACCEPTED_SECTOR_TOKENS[num] || [];
  const canonical = CANONICAL_PRIMARY_SECTOR_TOKENS[num] || allowed[0] || '';

  const normalizedAllowed = new Set<string>();
  for (const t of allowed) {
    const lower = t.toLowerCase();
    normalizedAllowed.add(lower);
    normalizedAllowed.add(lower.replace(/[-_\s]+/g, '_'));
    normalizedAllowed.add(lower.replace(/[-_\s]+/g, ''));
    normalizedAllowed.add(lower.replace(/[-_\s]+/g, '-'));
  }

  const tokens = normalizeUserFlag(submittedFlag);
  const isMatch = tokens.some((t) => normalizedAllowed.has(t));
  return { isMatch, canonicalToken: canonical };
}

async function startApp() {
  const app = express();
  app.use(express.json());

  // 1. Authoritative API Route: Server-side validation of OMEGA CORE (Level 15)
  app.post('/api/validate-omega-core', async (req: Request, res: Response) => {
    try {
      const { teamId, submittedFlag, operativeName } = req.body;

      if (!teamId || typeof teamId !== 'string') {
        res.status(400).json({ success: false, error: 'Missing teamId.' });
        return;
      }

      const cleanInput = (submittedFlag || '').trim();

      // STRICT 14-CHARACTER REQUIREMENT
      if (cleanInput.length !== 14) {
        res.status(200).json({
          success: false,
          isCorrect: false,
          message: `ACCESS DENIED: OMEGA CORE MASTER FLAG MUST BE EXACTLY 14 CHARACTERS (CURRENT: ${cleanInput.length}).`,
          xpDelta: -10,
        });
        return;
      }

      const teamRef = doc(db, 'teams', teamId.trim().toUpperCase());
      const teamSnap = await getDoc(teamRef);

      if (!teamSnap.exists()) {
        res.status(404).json({ success: false, error: 'Squad not found in database.' });
        return;
      }

      const teamData = teamSnap.data();
      const completed: string[] = Array.isArray(teamData.completedSectors) ? teamData.completedSectors : [];

      // Check already solved
      if (teamData.omegaCoreSolved || completed.includes('15') || completed.includes('level-15')) {
        res.status(200).json({
          success: true,
          isCorrect: true,
          alreadySolved: true,
          message: 'OMEGA CORE ALREADY SECURED BY YOUR SQUAD.',
          xpDelta: 0,
        });
        return;
      }

      // Verify all 14 previous levels are completed
      const missingLevels: string[] = [];
      for (let i = 1; i <= 14; i++) {
        const pad = String(i).padStart(2, '0');
        const isSolved = completed.some((s) => s === pad || s === `level-${pad}` || s === String(i));
        if (!isSolved) {
          missingLevels.push(pad);
        }
      }

      if (missingLevels.length > 0) {
        res.status(200).json({
          success: false,
          isCorrect: false,
          message: `ACCESS DENIED: OMEGA CORE REQUIRES ALL 14 PRECEDING SECTORS TO BE COMPLETED. (${missingLevels.length} REMAINING: ${missingLevels.join(', ')})`,
          xpDelta: 0,
        });
        return;
      }

      // Build expected master flag from team's solved flags or canonical sector tokens
      const solvedFlags: Record<string, string> = teamData.solvedFlags || {};
      let expectedMasterFlag = '';
      for (let i = 1; i <= 14; i++) {
        const pad = String(i).padStart(2, '0');
        const flagToken = solvedFlags[`level-${pad}`] || solvedFlags[pad] || CANONICAL_PRIMARY_SECTOR_TOKENS[pad];
        const keyChar = flagToken ? flagToken.charAt(0) : '';
        expectedMasterFlag += keyChar;
      }

      // Compare submitted flag against expected master flag (case-insensitive)
      const inputLower = cleanInput.toLowerCase();
      const expectedLower = expectedMasterFlag.toLowerCase();

      // Also allow accepted variants (e.g. Level 13 '4' vs 'a', Level 8 'c' vs 'p')
      const isDirectMatch = inputLower === expectedLower;
      const isCanonicalMatch = inputLower === 'dvpsmwscmip4as' || inputLower === 'dvpsmwscmipaas' || inputLower === 'dvpsmwspmip4as';

      if (!isDirectMatch && !isCanonicalMatch) {
        // Record penalty in Firestore
        const record = {
          id: `sub-core-${Date.now()}`,
          sectorId: '15',
          operativeName: operativeName || 'OPERATIVE',
          flag: cleanInput,
          isCorrect: false,
          timestamp: Date.now(),
          xpDelta: -10,
        };

        try {
          await runTransaction(db, async (txn) => {
            const freshSnap = await txn.get(teamRef);
            if (freshSnap.exists()) {
              const curScore = freshSnap.data().score || 0;
              const curPenalties = freshSnap.data().penalties || 0;
              txn.update(teamRef, {
                score: Math.max(0, curScore - 10),
                penalties: curPenalties + 10,
                submissions: arrayUnion(record),
                updatedAt: serverTimestamp(),
              });
            }
          });
        } catch (_) {}

        res.status(200).json({
          success: false,
          isCorrect: false,
          message: 'ACCESS DENIED: INCORRECT 14-CHARACTER MASTER CIPHER (-10 XP). CHECK EXTRACTION SEQUENCE (01 -> 14).',
          xpDelta: -10,
        });
        return;
      }

      // CORRECT! Atomically finalize OMEGA CORE in Firestore
      const solveTime = Date.now();
      const finalXp = 500;
      const record = {
        id: `sub-core-${solveTime}`,
        sectorId: '15',
        operativeName: operativeName || 'OPERATIVE',
        flag: cleanInput,
        isCorrect: true,
        timestamp: solveTime,
        xpDelta: finalXp,
      };

      const txResult = await runTransaction(db, async (txn) => {
        const snap = await txn.get(teamRef);
        if (!snap.exists()) throw new Error('Team document missing.');
        const data = snap.data();
        const curCompleted: string[] = Array.isArray(data.completedSectors) ? data.completedSectors : [];

        if (data.omegaCoreSolved || curCompleted.includes('15') || curCompleted.includes('level-15')) {
          return { alreadySolved: true, score: data.score || 0 };
        }

        const newScore = (data.score || 0) + finalXp;
        const updatedCompleted = Array.from(new Set([...curCompleted, '15', 'level-15']));

        txn.update(teamRef, {
          completedSectors: updatedCompleted,
          score: newScore,
          omegaCoreSolved: true,
          status: 'completed',
          completedAt: solveTime,
          lastSolvedAt: solveTime,
          submissions: arrayUnion(record),
          updatedAt: serverTimestamp(),
        });

        return { alreadySolved: false, score: newScore };
      });

      res.status(200).json({
        success: true,
        isCorrect: true,
        alreadySolved: txResult.alreadySolved,
        message: 'OMEGA CORE PURIFIED! MASTER 14-CHARACTER MATRIX ALIGNED (+500 XP). OMEGA PROTOCOL SECURED!',
        xpDelta: txResult.alreadySolved ? 0 : finalXp,
        newScore: txResult.score,
      });
    } catch (err: any) {
      console.error('validate-omega-core error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Server validation error.' });
    }
  });

  // 2. Authoritative API Route: Server-side validation of general Sector Flag (Levels 01-14)
  app.post('/api/validate-flag', async (req: Request, res: Response) => {
    try {
      const { teamId, sectorId, flag, operativeName } = req.body;
      if (!teamId || !sectorId || !flag) {
        res.status(400).json({ success: false, error: 'Missing parameters.' });
        return;
      }

      const num = sectorId.replace(/^level-/, '').padStart(2, '0');
      const { isMatch, canonicalToken } = checkSectorMatch(num, flag);

      if (!isMatch) {
        res.status(200).json({
          success: false,
          isCorrect: false,
          message: 'ACCESS DENIED: INCORRECT FLAG CIPHER (-10 XP). CHECK SPELLING & CIPHER TEXT.',
          xpDelta: -10,
        });
        return;
      }

      res.status(200).json({
        success: true,
        isCorrect: true,
        canonicalToken,
        message: 'FLAG VERIFIED! ACCESS GRANTED TO SECTOR ARTIFACTS.',
      });
    } catch (err: any) {
      console.error('validate-flag error:', err);
      res.status(500).json({ success: false, error: err?.message || 'Validation error.' });
    }
  });

  // 3. Vite middleware for frontend SPA in Dev / Static serving in Prod
  const isProd = process.env.NODE_ENV === 'production';
  const distDir = path.resolve(__dirname, 'dist');

  if (isProd && fs.existsSync(distDir)) {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  const PORT = 3000;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[SYSTEM OMEGA] Full-stack engine running at http://0.0.0.0:${PORT}`);
  });
}

startApp().catch((err) => {
  console.error('[SYSTEM OMEGA] Startup error:', err);
  process.exit(1);
});
