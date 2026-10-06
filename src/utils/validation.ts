/**
 * SYSTEM OMEGA - Authoritative Flag Validation & Scoring Engine
 * Highly resilient, user-friendly flag verification supporting:
 * - OMEGA{token}, FLAG{token}, or raw token
 * - Case-insensitive input
 * - Automatic Base64 unwrap & decode
 * - Hyphen / underscore / space normalization
 * - Tolerance for quotes, "Flag: ", or trailing characters
 * - Core fragment keys as accepted fallback
 */

export const CANONICAL_SECTOR_TOKENS: Record<string, string[]> = {
  '01': [
    'dns_zone_recovered_2026',
    'T01FR0F7ZG5zX3pvbmVfcmVjb3ZlcmVkXzIwMjZ9',
    'dns-zone-recovered-2026',
    'dns zone recovered 2026',
    'NET-ALPHA-89',
  ],
  '02': [
    'v4nd4l_99_zurich_breach',
    'v4nd4l_99',
    'v4nd4l-99-zurich-breach',
    'v4nd4l99',
    'zurich_breach',
    'ID-V4ND4L-09',
  ],
  '03': [
    'protocol_bass_unbased',
    'protocol-bass-unbased',
    'protocol bass unbased',
    'protocolbassunbased',
    'CIPHER-KEY-7X',
  ],
  '04': [
    'spectral_ghost_882',
    'spectral-ghost-882',
    'spectral ghost 882',
    'spectralghost882',
    'SIGNAL-440-HZ',
  ],
  '05': [
    'model_gamma_tcp_hallucination_exposed',
    'model_gamma',
    'model-gamma',
    'model gamma',
    'gamma',
    'model_gamma_tcp_hallucination',
    'NEURAL-MAP-05',
  ],
  '06': [
    'whitespace_protocol',
    'whitespace-protocol',
    'whitespace protocol',
    'whitespaceprotocol',
    'STEGO-WS-01',
    'empty_log',
    'clean_build_zero_warnings_2026',
    'clean_build_zero_warnings',
    'KERNEL-BOOT-06',
  ],
  '07': [
    'st3g0_m4g1c_byt3s_unc0v3r3d',
    'stego_magic_bytes_uncovered',
    'st3g0_m4g1c_byt3s',
    'stego_magic_bytes',
    'MAGIC-PNG-8950',
  ],
  '08': [
    'crypto_71',
    '71',
    'crypto-71',
    'crypto 71',
    'CIPHER-MOD-71',
    'priv_escalation_jwt_bypass_901',
    'priv_escalation_jwt_bypass',
    'jwt_bypass_901',
    'priv_escalation',
    'HTTP-AUTH-08',
  ],
  '09': [
    'matrix_mod_38_65_10',
    '38_65_10',
    '38-65-10',
    '38 65 10',
    'matrix_38_65_10',
    'modular_vector_38_65_10',
    'discrete_matrix_38_65_10',
    'MATH-EIGEN-99',
    'skibidi_sigma_aura_max_999',
    'skibidi_sigma_aura',
    'aura_max_999',
    'sigma_aura_max_999',
    'AURA-SIGMA-09',
  ],
  '10': [
    'iend_trailing_stream_unlocked',
    'iend-trailing-stream-unlocked',
    'iend trailing stream unlocked',
    'iend_trailing_stream',
    'trailing_stream_unlocked',
    'after_iend_multilayer',
    'after-iend-multilayer',
    'post_iend_payload_extracted',
    'iend_multilayer',
    'STEGO-IEND-350',
    'gpio_i2c_bus_master_x7',
    'gpio_i2c_bus_master',
    'bus_master_x7',
    'UART-BUS-X7',
    'GPIO-BUS-X7',
  ],
  '11': [
    'pcap_str3am_f0ll0w_8829',
    'pcap_stream_follow_8829',
    'pcap_str3am_f0ll0w',
    'pcap-stream-follow-8829',
    'T01FR0F7cGNhcF9zdHIzYW1fZjBsbDB3Xzg4Mjl9',
    'STREAM-1042-TCP',
  ],
  '12': [
    'algo_boss_defeated_o_log_n_time',
    'algo_boss_defeated',
    'o_log_n_time',
    'algo_boss',
    'DSA-MATRIX-12',
  ],
  '13': [
    '4g3nt_chaos_purified_v3rifi3d',
    'agent_chaos_purified_verified',
    '4g3nt_chaos',
    'agent_chaos',
    'VERIFIER-RAG-01',
  ],
  '14': [
    'synthetic_reality_glitch_exposed',
    'reality_glitch_exposed',
    'synthetic_reality_glitch',
    'VISION-DIFF-14',
  ],
  '15': [
    'c0r3_unl0ck3d_syst3m_0m3g4_purif13d',
    'core_unlocked_system_omega_purified',
    'omega_core_unlocked',
    'c0r3_unl0ck3d',
    'OMEGA-PRIME-FINAL',
  ],
};

/**
 * Computes SHA-256 in hex string
 */
export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message.trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export interface ValidationResult {
  isCorrect: boolean;
  message: string;
  xpDelta: number;
  speedBonusAwarded: number;
  firstBloodAwarded: boolean;
}

/**
 * Extracts and normalizes tokens from user input
 */
function extractTokens(rawInput: string): string[] {
  let cleaned = rawInput.trim();

  // Strip wrapping quotes or backticks
  cleaned = cleaned.replace(/^["'`]+|["'`]+$/g, '').trim();

  // Strip common prompt prefixes (e.g., "flag:", "Flag = ", "key: ")
  cleaned = cleaned.replace(/^(flag|omega|key|token|payload)\s*[:=]\s*/i, '').trim();

  const candidates: string[] = [cleaned];

  // If input contains { and }, extract inner content
  if (cleaned.includes('{') && cleaned.includes('}')) {
    const start = cleaned.indexOf('{') + 1;
    const end = cleaned.lastIndexOf('}');
    const inner = cleaned.substring(start, end).trim();
    if (inner) candidates.push(inner);
  }

  // Check if cleaned or inner might be Base64
  for (const c of [...candidates]) {
    if (/^[A-Za-z0-9+/=]{16,}$/.test(c)) {
      try {
        const decoded = atob(c);
        candidates.push(decoded);
        if (decoded.includes('{') && decoded.includes('}')) {
          const s = decoded.indexOf('{') + 1;
          const e = decoded.lastIndexOf('}');
          candidates.push(decoded.substring(s, e).trim());
        }
      } catch {}
    }
  }

  // Normalize all candidates (strip underscores vs hyphens vs spaces)
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

/**
 * Authoritative verification logic - resilient against wrapper variations, casing, spaces, and base64
 */
export async function validateSectorFlag(
  sectorId: string,
  submittedFlag: string,
  elapsedMinutes: number,
  isFirstBlood: boolean = false
): Promise<ValidationResult> {
  const clean = submittedFlag.trim();

  if (!clean) {
    return {
      isCorrect: false,
      message: 'EMPTY SUBMISSION DETECTED.',
      xpDelta: 0,
      speedBonusAwarded: 0,
      firstBloodAwarded: false,
    };
  }

  const validTargets = CANONICAL_SECTOR_TOKENS[sectorId] || [];
  const normalizedTargets = new Set<string>();

  for (const t of validTargets) {
    const lower = t.toLowerCase();
    normalizedTargets.add(lower);
    normalizedTargets.add(lower.replace(/[-_\s]+/g, '_'));
    normalizedTargets.add(lower.replace(/[-_\s]+/g, ''));
    normalizedTargets.add(lower.replace(/[-_\s]+/g, '-'));
  }

  const userTokens = extractTokens(clean);

  // Check direct matches
  let isMatch = userTokens.some((tok) => normalizedTargets.has(tok));

  // If not matched, try sha256 of formatted standard flag OMEGA{token}
  if (!isMatch) {
    for (const tok of userTokens) {
      const hash1 = await sha256(`OMEGA{${tok}}`);
      const hash2 = await sha256(`OMEGA{${tok.toUpperCase()}}`);
      const hash3 = await sha256(tok);
      // If matches any target's computed hash
      for (const t of validTargets) {
        const targetHash = await sha256(`OMEGA{${t}}`);
        if (hash1 === targetHash || hash2 === targetHash || hash3 === targetHash) {
          isMatch = true;
          break;
        }
      }
      if (isMatch) break;
    }
  }

  if (!isMatch) {
    return {
      isCorrect: false,
      message: 'ACCESS DENIED: INCORRECT FLAG CIPHER (-10 XP). CHECK SPELLING & CIPHER TEXT.',
      xpDelta: -10,
      speedBonusAwarded: 0,
      firstBloodAwarded: false,
    };
  }

  // Speed Bonus calculation:
  // Very Fast (< 15m): +50 XP
  // Fast (< 35m): +30 XP
  // Normal (< 70m): +15 XP
  // Slow: 0 XP
  let speedBonus = 0;
  if (elapsedMinutes < 15) {
    speedBonus = 50;
  } else if (elapsedMinutes < 35) {
    speedBonus = 30;
  } else if (elapsedMinutes < 70) {
    speedBonus = 15;
  }

  const firstBloodBonus = isFirstBlood ? 25 : 0;

  return {
    isCorrect: true,
    message: 'FLAG VERIFIED! ACCESS GRANTED TO SECTOR ARTIFACTS.',
    xpDelta: speedBonus + firstBloodBonus,
    speedBonusAwarded: speedBonus,
    firstBloodAwarded: isFirstBlood,
  };
}
