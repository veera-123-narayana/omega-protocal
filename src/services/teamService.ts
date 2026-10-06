import { TeamState, OperativeProfile, OperativeRole, SubmissionRecord, LeaderboardEntry } from '../types';
import { SECTORS } from '../data/sectors';
import { validateSectorFlag } from '../utils/validation';

const STORAGE_KEY = 'system_omega_team_state';
const BROADCAST_CHANNEL_NAME = 'system_omega_sync_channel';

// Default initial team state
export function createInitialTeamState(teamId: string = 'OMEGA-017', teamName: string = 'CYBER VANGUARD', leaderUsername: string = 'KAI_ZERO'): TeamState {
  const leader: OperativeProfile = {
    id: `op-a-${Date.now()}`,
    username: leaderUsername,
    role: 'OPERATIVE_A',
    isLeader: true,
    isReady: false,
    isOnline: true,
    lastActive: Date.now(),
  };

  return {
    teamId,
    teamName,
    leader,
    secondOperative: null,
    secondOperativePassword: '',
    status: 'lobby',
    missionStartedAt: null,
    missionDurationMinutes: 105,
    score: 0,
    completedSectors: [],
    unlockedSectors: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'],
    activeSectorId: '01',
    hintsUsed: {},
    penalties: 0,
    speedBonus: 0,
    firstBloodBonus: 0,
    submissions: [],
    bonusMissions: {
      hiddenQr: false,
      easterEgg: false,
      speedChallenge: false,
    },
    aiViolations: 0,
    completedAt: null,
    chatMessages: [
      {
        id: 'msg-init-1',
        senderRole: 'OPERATIVE_A',
        senderName: 'SYSTEM',
        text: 'SECURE TACTICAL CHANNEL ESTABLISHED. All 15 sectors accessible.',
        timestamp: Date.now() - 60000,
        isTacticalAlert: true,
      },
    ],
  };
}

class TeamManager {
  private state: TeamState;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(state: TeamState) => void> = new Set();
  private currentOperativeRole: OperativeRole = 'OPERATIVE_A';

  constructor() {
    this.state = this.loadState();

    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'STATE_SYNC') {
            this.state = event.data.state;
            this.saveToStorage(false);
            this.notify();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel unavailable', e);
      }
    }
  }

  private loadState(): TeamState {
    if (typeof window === 'undefined') return createInitialTeamState();
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && parsed.teamId) {
          if (!parsed.chatMessages) parsed.chatMessages = [];
          // Ensure all 15 sectors accessible at any time
          parsed.unlockedSectors = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];
          return parsed;
        }
      }
    } catch {
      // Fall through to initial
    }
    return createInitialTeamState();
  }

  private saveToStorage(broadcast: boolean = true) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      if (broadcast && this.channel) {
        this.channel.postMessage({ type: 'STATE_SYNC', state: this.state });
      }
    } catch (e) {
      console.error('Failed to save team state', e);
    }
  }

  private notify() {
    this.listeners.forEach((listener) => listener(this.state));
  }

  public subscribe(listener: (state: TeamState) => void): () => void {
    this.listeners.add(listener);
    listener(this.state);
    return () => {
      this.listeners.delete(listener);
    };
  }

  public getState(): TeamState {
    return this.state;
  }

  public getCurrentRole(): OperativeRole {
    return this.currentOperativeRole;
  }

  public setCurrentRole(role: OperativeRole) {
    this.currentOperativeRole = role;
    this.notify();
  }

  public initializeTeam(teamName: string, leaderUsername: string): string {
    const randomNum = Math.floor(10 + Math.random() * 90);
    const teamId = `OMEGA-0${randomNum}`;
    this.state = createInitialTeamState(teamId, teamName.toUpperCase(), leaderUsername.toUpperCase());
    this.currentOperativeRole = 'OPERATIVE_A';
    this.saveToStorage();
    this.notify();
    return teamId;
  }

  public createSecondOperative(username: string, password: string) {
    const second: OperativeProfile = {
      id: `op-b-${Date.now()}`,
      username: username.toUpperCase(),
      role: 'OPERATIVE_B',
      isLeader: false,
      isReady: false,
      isOnline: true,
      lastActive: Date.now(),
    };
    this.state.secondOperative = second;
    this.state.secondOperativePassword = password;
    this.saveToStorage();
    this.notify();
  }

  public joinAsSecondOperative(teamId: string, username: string, password: string): boolean {
    if (this.state.teamId.toUpperCase() !== teamId.toUpperCase()) {
      return false;
    }
    if (this.state.secondOperativePassword && this.state.secondOperativePassword !== password) {
      return false;
    }
    if (!this.state.secondOperative) {
      this.createSecondOperative(username, password);
    } else {
      this.state.secondOperative.isOnline = true;
      this.state.secondOperative.lastActive = Date.now();
    }
    this.currentOperativeRole = 'OPERATIVE_B';
    this.saveToStorage();
    this.notify();
    return true;
  }

  public toggleOperativeReady(role: OperativeRole) {
    if (role === 'OPERATIVE_A') {
      this.state.leader.isReady = !this.state.leader.isReady;
    } else if (this.state.secondOperative) {
      this.state.secondOperative.isReady = !this.state.secondOperative.isReady;
    }

    // Check if both ready
    const isReadyA = this.state.leader.isReady;
    const isReadyB = this.state.secondOperative ? this.state.secondOperative.isReady : false;

    if (isReadyA && isReadyB && this.state.status === 'lobby') {
      this.state.status = 'countdown';
    } else if (this.state.status === 'countdown' && (!isReadyA || !isReadyB)) {
      this.state.status = 'lobby';
    }

    this.saveToStorage();
    this.notify();
  }

  public activateMissionTimer() {
    if (this.state.missionStartedAt === null) {
      this.state.missionStartedAt = Date.now();
      this.state.status = 'active';
      this.saveToStorage();
      this.notify();
    }
  }

  public getRemainingSeconds(): number {
    if (!this.state.missionStartedAt) {
      return this.state.missionDurationMinutes * 60;
    }
    const elapsedSec = Math.floor((Date.now() - this.state.missionStartedAt) / 1000);
    const totalSec = this.state.missionDurationMinutes * 60;
    return Math.max(0, totalSec - elapsedSec);
  }

  public setActiveSector(sectorId: string) {
    if (this.state.unlockedSectors.includes(sectorId)) {
      this.state.activeSectorId = sectorId;
      this.saveToStorage();
      this.notify();
    }
  }

  public useHint(sectorId: string, hintIndex: number, cost: number): boolean {
    const currentHints = this.state.hintsUsed[sectorId] || 0;
    if (hintIndex === currentHints + 1) {
      this.state.hintsUsed[sectorId] = hintIndex;
      this.state.score = Math.max(0, this.state.score - cost);
      this.state.penalties += cost;
      this.saveToStorage();
      this.notify();
      return true;
    }
    return false;
  }

  public async submitFlag(sectorId: string, flag: string, operativeName: string): Promise<{ success: boolean; message: string; xpDelta: number }> {
    if (this.state.completedSectors.includes(sectorId)) {
      return { success: false, message: 'SECTOR ALREADY COMPLETED BY OPERATIVE.', xpDelta: 0 };
    }

    const elapsedMin = this.state.missionStartedAt 
      ? Math.floor((Date.now() - this.state.missionStartedAt) / 60000)
      : 0;

    const sector = SECTORS.find((s) => s.id === sectorId);
    const baseXp = sector ? sector.baseXp : 100;

    const validation = await validateSectorFlag(sectorId, flag, elapsedMin, this.state.completedSectors.length === 0);

    const record: SubmissionRecord = {
      id: `sub-${Date.now()}`,
      sectorId,
      operativeName,
      flag,
      isCorrect: validation.isCorrect,
      timestamp: Date.now(),
      xpDelta: validation.isCorrect ? (baseXp + validation.xpDelta) : validation.xpDelta,
    };

    this.state.submissions.unshift(record);

    if (validation.isCorrect) {
      this.state.completedSectors.push(sectorId);
      const gained = baseXp + validation.xpDelta;
      this.state.score += gained;
      this.state.speedBonus += validation.speedBonusAwarded;
      if (validation.firstBloodAwarded) {
        this.state.firstBloodBonus += 25;
      }

      // Check unlock prerequisites for other sectors
      SECTORS.forEach((sec) => {
        if (!this.state.unlockedSectors.includes(sec.id)) {
          const allPrereqsMet = sec.prerequisites.every((req) => this.state.completedSectors.includes(req));
          if (allPrereqsMet) {
            this.state.unlockedSectors.push(sec.id);
          }
        }
      });

      // Check if Sector 15 Omega Core completed
      if (sectorId === '15') {
        this.state.status = 'completed';
        this.state.completedAt = Date.now();
      }

      this.saveToStorage();
      this.notify();
      return { success: true, message: validation.message, xpDelta: gained };
    } else {
      this.state.score = Math.max(0, this.state.score - 10);
      this.state.penalties += 10;
      this.saveToStorage();
      this.notify();
      return { success: false, message: validation.message, xpDelta: -10 };
    }
  }

  public recordAiPenalty(sectorId: string) {
    const penaltyTiers = [25, 50, 75, 100];
    const penalty = penaltyTiers[Math.min(this.state.aiViolations, penaltyTiers.length - 1)];
    this.state.aiViolations += 1;
    this.state.score = Math.max(0, this.state.score - penalty);
    this.state.penalties += penalty;
    this.saveToStorage();
    this.notify();
    return penalty;
  }

  public claimBonus(bonusType: 'hiddenQr' | 'easterEgg' | 'speedChallenge'): number {
    if (this.state.bonusMissions[bonusType]) return 0;
    this.state.bonusMissions[bonusType] = true;
    const bonusMap = { hiddenQr: 50, easterEgg: 75, speedChallenge: 100 };
    const xp = bonusMap[bonusType];
    this.state.score += xp;
    this.saveToStorage();
    this.notify();
    return xp;
  }

  public sendChatMessage(text: string, isTacticalAlert: boolean = false) {
    if (!text.trim()) return;
    const currentRole = this.currentOperativeRole;
    const senderName = currentRole === 'OPERATIVE_A'
      ? this.state.leader.username
      : this.state.secondOperative?.username || 'OPERATIVE_B';

    const newMsg = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      senderRole: currentRole,
      senderName,
      text: text.trim(),
      timestamp: Date.now(),
      isTacticalAlert,
    };

    if (!this.state.chatMessages) {
      this.state.chatMessages = [];
    }
    this.state.chatMessages.push(newMsg);
    this.saveToStorage();
    this.notify();
  }

  public clearChat() {
    this.state.chatMessages = [];
    this.saveToStorage();
    this.notify();
  }

  // Admin controls
  public adminResetTeam() {
    this.state = createInitialTeamState();
    this.saveToStorage();
    this.notify();
  }

  public adminAddMinutes(mins: number) {
    this.state.missionDurationMinutes += mins;
    this.saveToStorage();
    this.notify();
  }

  public adminAdjustScore(delta: number) {
    this.state.score = Math.max(0, this.state.score + delta);
    this.saveToStorage();
    this.notify();
  }

  public adminUnlockAllSectors() {
    this.state.unlockedSectors = SECTORS.map((s) => s.id);
    this.saveToStorage();
    this.notify();
  }
}

export interface PredefinedSquad {
  id: string;
  teamName: string;
  leaderUsername: string;
  secondUsername: string;
  secondPassword: string;
  tagline: string;
}

export const PREDEFINED_SQUADS: PredefinedSquad[] = [
  {
    id: 'squad-1',
    teamName: 'CYBER PIONEERS',
    leaderUsername: 'NEXUS_ALPHA',
    secondUsername: 'CIPHER_GHOST',
    secondPassword: 'vault_protocol_99',
    tagline: 'Elite penetration & cryptographic reconnaissance squad',
  },
  {
    id: 'squad-2',
    teamName: 'QUANTUM VANGUARD',
    leaderUsername: 'KAI_ZERO',
    secondUsername: 'NOVA_PRIME',
    secondPassword: 'nexus_alpha_2026',
    tagline: 'Specialized in signal intelligence & kernel reverse engineering',
  },
  {
    id: 'squad-3',
    teamName: 'ZERO DAY SYNDICATE',
    leaderUsername: 'V4ND4L_ROOT',
    secondUsername: 'SPECTRE_88',
    secondPassword: 'matrix_core_77',
    tagline: 'Defensive algorithm & network traffic exploitation unit',
  },
];

export const teamManager = new TeamManager();

// Mock Leaderboard data
export const MOCK_LEADERBOARD: LeaderboardEntry[] = [
  { rank: 1, teamId: 'OMEGA-031', teamName: 'NULL_POINTER_ELITE', xp: 2340, sectorsCount: 14, status: 'ACTIVE', lastSolvedTime: '12m ago' },
  { rank: 2, teamId: 'OMEGA-017', teamName: 'CYBER VANGUARD', xp: 2115, sectorsCount: 13, status: 'ACTIVE', lastSolvedTime: '2m ago' },
  { rank: 3, teamId: 'OMEGA-092', teamName: 'SYN_ACK_CHADS', xp: 2020, sectorsCount: 12, status: 'ACTIVE', lastSolvedTime: '18m ago' },
  { rank: 4, teamId: 'OMEGA-044', teamName: 'QUANTUM_OVERFLOW', xp: 1950, sectorsCount: 12, status: 'ACTIVE', lastSolvedTime: '24m ago' },
  { rank: 5, teamId: 'OMEGA-009', teamName: 'RED_TEAM_SHADOWS', xp: 1810, sectorsCount: 11, status: 'ACTIVE', lastSolvedTime: '31m ago' },
  { rank: 6, teamId: 'OMEGA-056', teamName: 'BYTE_FORCE_ZERO', xp: 1640, sectorsCount: 10, status: 'ACTIVE', lastSolvedTime: '45m ago' },
  { rank: 7, teamId: 'OMEGA-112', teamName: 'KERNEL_PANIC_SQUAD', xp: 1420, sectorsCount: 9, status: 'ACTIVE', lastSolvedTime: '52m ago' },
];
