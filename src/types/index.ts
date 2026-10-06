export type OperativeRole = 'OPERATIVE_A' | 'OPERATIVE_B';

export interface OperativeProfile {
  id: string;
  username: string;
  email?: string;
  role: OperativeRole;
  isLeader: boolean;
  isReady: boolean;
  isOnline: boolean;
  lastActive: number;
}

export type MissionStatus = 'idle' | 'lobby' | 'countdown' | 'active' | 'completed' | 'failed' | 'WAITING';

export interface SubmissionRecord {
  id: string;
  sectorId: string;
  operativeName: string;
  flag: string;
  isCorrect: boolean;
  timestamp: number;
  xpDelta: number;
}

export interface ChatMessage {
  id: string;
  senderRole: OperativeRole;
  senderName: string;
  text: string;
  timestamp: number;
  isTacticalAlert?: boolean;
}

export interface TeamState {
  teamId: string;
  teamName: string;
  leader: OperativeProfile;
  secondOperative: OperativeProfile | null;
  secondOperativePassword?: string;
  leaderPasswordHash?: string;
  secondOperativePasswordHash?: string;
  status: MissionStatus;
  missionStartedAt: number | null;
  missionEndAt: number | null;
  missionDurationMinutes: number; // 105
  lastSolvedAt: number | null;
  createdAt?: number;
  updatedAt?: number;
  score: number;
  completedSectors: string[]; // ['01', '02', ...]
  unlockedSectors: string[];
  activeSectorId: string;
  hintsUsed: Record<string, number>; // sectorId -> count (1, 2, 3)
  penalties: number;
  speedBonus: number;
  firstBloodBonus: number;
  submissions: SubmissionRecord[];
  bonusMissions: {
    hiddenQr: boolean;
    easterEgg: boolean;
    speedChallenge: boolean;
  };
  aiViolations: number;
  completedAt: number | null;
  chatMessages: ChatMessage[];
  solvedFlags?: Record<string, string>;
  omegaCoreSolved?: boolean;
}

export type SectorCategory = 
  | 'Networking'
  | 'OSINT'
  | 'Cryptography'
  | 'Audio / Signal Analysis'
  | 'AI Reasoning'
  | 'Programming / Debugging'
  | 'Digital Forensics'
  | 'Forensics / Steganography'
  | 'Web Security / Cybersecurity'
  | 'Meme / Logic / Internet Culture'
  | 'Cryptographic Mathematics'
  | 'Discrete Mathematics'
  | 'Hardware / IoT'
  | 'Network Forensics / PCAP'
  | 'DSA / Algorithms'
  | 'AI Agents'
  | 'Multimodal AI / Verification'
  | 'Final Combined CTF';

export type AiPolicy = 'ALLOWED' | 'DISCOURAGED' | 'AI-FREE' | 'REQUIRED';

export interface SectorHint {
  level: number;
  cost: number;
  text: string;
}

export interface SectorDefinition {
  id: string;
  number: string;
  title: string;
  environment: string;
  category: SectorCategory;
  difficulty: 'Beginner' | 'Beginner / Intermediate' | 'Intermediate' | 'Advanced' | 'Advanced / Expert' | 'Expert' | 'Expert / Final' | 'Fun / Intermediate';
  baseXp: number;
  aiPolicy: AiPolicy;
  prerequisites: string[]; // ids of sectors required to unlock
  scenario: string;
  objective: string;
  systemMessage?: string;
  hints: [SectorHint, SectorHint, SectorHint];
  // CTF fragment awarded for Sector 15 Omega Core
  coreFragment?: {
    type: string;
    code: string;
    description: string;
  };
}

export interface LeaderboardEntry {
  rank: number;
  teamId: string;
  teamName: string;
  xp: number;
  sectorsCount: number;
  status: 'ACTIVE' | 'COMPLETED' | 'STANDBY' | 'WAITING';
  lastSolvedAt?: number | null;
  lastSolvedTime: string;
  isCurrentTeam?: boolean;
}
