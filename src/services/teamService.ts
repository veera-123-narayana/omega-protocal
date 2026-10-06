import {
  TeamState,
  OperativeProfile,
  OperativeRole,
  SubmissionRecord,
  ChatMessage,
} from '../types';
import { SECTORS } from '../data/sectors';
import { validateSectorFlag, isSectorSolved, getSolvedSectorsCount } from '../utils/validation';
import {
  createTeamInFirestore,
  authenticateJoinTeam,
  listenToTeam,
  listenToEventConfig,
  saveEventConfig,
  applyEventDurationChange,
  startMissionInFirebase,
  updateTeamInFirebase,
  recordSolveInFirebase,
  resetSingleTeamInFirebase,
  resetAllTeamsInFirebase,
  deleteTeamFromFirebase,
  deleteLegacyDemoTeams,
  syncChatMessageToFirebase,
  listenToTeamChat,
  CreateTeamPayload,
  EventConfigPayload,
} from './firebaseService';
import { Unsubscribe } from 'firebase/firestore';

const STORAGE_KEY = 'system_omega_team_state_v2';
const BROADCAST_CHANNEL_NAME = 'system_omega_sync_channel';

// Clean initial empty team state (ZERO PREDEFINED TEAMS)
export function createEmptyTeamState(): TeamState {
  return {
    teamId: '',
    teamName: '',
    leader: {
      id: '',
      username: '',
      email: '',
      role: 'OPERATIVE_A',
      isLeader: true,
      isReady: false,
      isOnline: false,
      lastActive: 0,
    },
    secondOperative: null,
    secondOperativePassword: '',
    status: 'WAITING',
    missionStartedAt: null,
    missionEndAt: null,
    missionDurationMinutes: 105,
    lastSolvedAt: null,
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
    chatMessages: [],
  };
}

class TeamManager {
  private state: TeamState;
  private channel: BroadcastChannel | null = null;
  private listeners: Set<(state: TeamState) => void> = new Set();
  private currentOperativeRole: OperativeRole = 'OPERATIVE_A';
  private teamUnsubscribe: Unsubscribe | null = null;
  private chatUnsubscribe: Unsubscribe | null = null;
  private configUnsubscribe: Unsubscribe | null = null;
  private eventConfig: EventConfigPayload | null = null;

  constructor() {
    this.state = this.loadState();

    // BroadcastChannel for cross-tab local communication
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        this.channel = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
        this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'STATE_SYNC') {
            this.state = event.data.state;
            this.notify();
          }
        };
      } catch (e) {
        console.warn('BroadcastChannel unavailable', e);
      }
    }

    // Attach global event config listener
    this.configUnsubscribe = listenToEventConfig((cfg) => {
      if (cfg && typeof cfg.durationMinutes === 'number') {
        this.eventConfig = cfg;
        const prevDuration = this.state.missionDurationMinutes;
        const delta = cfg.durationMinutes - prevDuration;
        this.state.missionDurationMinutes = cfg.durationMinutes;

        if (cfg.eventEndAt) {
          this.state.missionEndAt = cfg.eventEndAt;
        } else if (this.state.missionEndAt && delta !== 0) {
          this.state.missionEndAt += delta * 60 * 1000;
        } else if (this.state.missionStartedAt && delta !== 0) {
          this.state.missionEndAt = this.state.missionStartedAt + cfg.durationMinutes * 60 * 1000;
        }

        if (cfg.eventStartedAt && !this.state.missionStartedAt) {
          this.state.missionStartedAt = cfg.eventStartedAt;
        }

        this.saveToStorage(false);
        this.notify();
      }
    });

    // If a registered team was restored from storage, attach Firebase listeners immediately
    if (this.state.teamId) {
      this.bindFirebaseTeam(this.state.teamId);
    }
  }

  private loadState(): TeamState {
    if (typeof window === 'undefined') return createEmptyTeamState();
    try {
      // Clear legacy storage keys containing demo teams
      localStorage.removeItem('system_omega_team_state');

      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure no legacy demo team is retained
        const demoTeamIds = ['OMEGA-017', 'OMEGA-031', 'OMEGA-092', 'OMEGA-044', 'OMEGA-009', 'OMEGA-056', 'OMEGA-112', 'squad-1', 'squad-2', 'squad-3'];
        const demoNames = ['CYBER VANGUARD', 'CYBER PIONEERS', 'QUANTUM VANGUARD', 'ZERO DAY SYNDICATE', 'NULL_POINTER_ELITE'];

        if (
          parsed &&
          parsed.teamId &&
          !demoTeamIds.includes(parsed.teamId.toUpperCase()) &&
          !demoNames.includes((parsed.teamName || '').toUpperCase())
        ) {
          if (!parsed.unlockedSectors || parsed.unlockedSectors.length === 0) {
            parsed.unlockedSectors = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];
          }
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return createEmptyTeamState();
  }

  private saveToStorage(broadcast: boolean = true) {
    if (typeof window === 'undefined') return;
    try {
      if (!this.state.teamId) {
        localStorage.removeItem(STORAGE_KEY);
      } else {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
      }
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

  private bindFirebaseTeam(teamId: string) {
    if (this.teamUnsubscribe) {
      this.teamUnsubscribe();
      this.teamUnsubscribe = null;
    }
    if (this.chatUnsubscribe) {
      this.chatUnsubscribe();
      this.chatUnsubscribe = null;
    }

    // Real-time Firestore sync
    this.teamUnsubscribe = listenToTeam(teamId, (teamDoc) => {
      if (!teamDoc) {
        // Team was deleted remotely
        if (this.state.teamId === teamId) {
          this.state = createEmptyTeamState();
          this.saveToStorage();
          this.notify();
        }
        return;
      }

      // Merge authoritative Firestore state into local state
      const prevActiveSector = this.state.activeSectorId;
      this.state.teamName = teamDoc.teamName || this.state.teamName;
      this.state.score = typeof teamDoc.score === 'number' ? teamDoc.score : this.state.score;
      this.state.status = teamDoc.status || this.state.status;
      if (typeof teamDoc.missionDurationMinutes === 'number') {
        this.state.missionDurationMinutes = teamDoc.missionDurationMinutes;
      }
      this.state.missionStartedAt = teamDoc.missionStartedAt ?? null;
      this.state.missionEndAt = teamDoc.missionEndAt ?? null;
      this.state.lastSolvedAt = teamDoc.lastSolvedAt ?? null;
      this.state.completedSectors = Array.isArray(teamDoc.completedSectors) ? teamDoc.completedSectors : [];
      this.state.unlockedSectors = Array.isArray(teamDoc.unlockedSectors) && teamDoc.unlockedSectors.length > 0
        ? teamDoc.unlockedSectors
        : ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'];
      this.state.hintsUsed = teamDoc.hintsUsed || {};
      this.state.penalties = teamDoc.penalties || 0;
      this.state.speedBonus = teamDoc.speedBonus || 0;
      this.state.firstBloodBonus = teamDoc.firstBloodBonus || 0;
      this.state.submissions = Array.isArray(teamDoc.submissions) ? teamDoc.submissions : this.state.submissions;
      this.state.activeSectorId = prevActiveSector || '01';

      if (teamDoc.leader) {
        this.state.leader = {
          ...this.state.leader,
          username: teamDoc.leader.username || this.state.leader.username,
          email: teamDoc.leader.email || this.state.leader.email,
          isOnline: teamDoc.leader.isOnline ?? true,
          isReady: teamDoc.leader.isReady ?? false,
        };
      }

      if (teamDoc.operative2) {
        this.state.secondOperative = {
          id: `op-b-${teamDoc.teamId}`,
          username: teamDoc.operative2.username || '',
          email: teamDoc.operative2.email || '',
          role: 'OPERATIVE_B',
          isLeader: false,
          isOnline: teamDoc.operative2.isOnline ?? false,
          isReady: teamDoc.operative2.isReady ?? false,
          lastActive: teamDoc.operative2.lastActive || 0,
        };
      }

      this.saveToStorage(false);
      this.notify();
    });

    // Real-time Chat sync
    this.chatUnsubscribe = listenToTeamChat(teamId, (msgs) => {
      this.state.chatMessages = msgs;
      this.notify();
    });
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

  public hasTeam(): boolean {
    return Boolean(this.state.teamId && this.state.teamName);
  }

  public getCurrentRole(): OperativeRole {
    return this.currentOperativeRole;
  }

  public setCurrentRole(role: OperativeRole) {
    this.currentOperativeRole = role;
    this.notify();
  }

  /**
   * Register a new squad in Firebase Firestore
   */
  public async registerTeam(payload: CreateTeamPayload): Promise<{ success: boolean; error?: string }> {
    const res = await createTeamInFirestore(payload);
    if (!res.success) {
      return res;
    }

    const leader: OperativeProfile = {
      id: `op-a-${Date.now()}`,
      username: payload.leaderUsername.trim().toUpperCase(),
      email: payload.leaderEmail.trim().toLowerCase(),
      role: 'OPERATIVE_A',
      isLeader: true,
      isReady: false,
      isOnline: true,
      lastActive: Date.now(),
    };

    const second: OperativeProfile = {
      id: `op-b-${Date.now()}`,
      username: payload.operative2Username.trim().toUpperCase(),
      email: payload.operative2Email.trim().toLowerCase(),
      role: 'OPERATIVE_B',
      isLeader: false,
      isReady: false,
      isOnline: false,
      lastActive: Date.now(),
    };

    this.state = {
      ...createEmptyTeamState(),
      teamId: payload.teamId,
      teamName: payload.teamName.trim().toUpperCase(),
      leader,
      secondOperative: second,
      secondOperativePassword: payload.operative2Password,
      status: 'WAITING',
    };

    this.currentOperativeRole = 'OPERATIVE_A';
    this.saveToStorage();
    this.notify();
    this.bindFirebaseTeam(payload.teamId);

    return { success: true };
  }

  /**
   * Join an existing team in Firebase
   */
  public async joinTeam(
    teamId: string,
    usernameOrEmail: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> {
    const res = await authenticateJoinTeam(teamId, usernameOrEmail, password);
    if (!res.success || !res.teamData) {
      return { success: false, error: res.error || 'Failed to authenticate team.' };
    }

    const docData = res.teamData;
    const assignedRole = res.role || 'OPERATIVE_B';
    this.currentOperativeRole = assignedRole;

    const leader: OperativeProfile = {
      id: `op-a-${docData.teamId}`,
      username: docData.leader?.username || '',
      email: docData.leader?.email || '',
      role: 'OPERATIVE_A',
      isLeader: true,
      isReady: docData.leader?.isReady || false,
      isOnline: docData.leader?.isOnline || true,
      lastActive: docData.leader?.lastActive || Date.now(),
    };

    const second: OperativeProfile | null = docData.operative2
      ? {
          id: `op-b-${docData.teamId}`,
          username: docData.operative2?.username || '',
          email: docData.operative2?.email || '',
          role: 'OPERATIVE_B',
          isLeader: false,
          isReady: docData.operative2?.isReady || false,
          isOnline: true,
          lastActive: Date.now(),
        }
      : null;

    this.state = {
      ...createEmptyTeamState(),
      teamId: docData.teamId,
      teamName: docData.teamName,
      leader,
      secondOperative: second,
      status: docData.status || 'WAITING',
      score: docData.score || 0,
      completedSectors: docData.completedSectors || [],
      unlockedSectors: docData.unlockedSectors || ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'],
      missionStartedAt: docData.missionStartedAt || null,
      missionEndAt: docData.missionEndAt || null,
      missionDurationMinutes: docData.missionDurationMinutes || 105,
      lastSolvedAt: docData.lastSolvedAt || null,
      hintsUsed: docData.hintsUsed || {},
      penalties: docData.penalties || 0,
      submissions: docData.submissions || [],
    };

    this.saveToStorage();
    this.notify();
    this.bindFirebaseTeam(docData.teamId);

    return { success: true };
  }

  /**
   * Toggle operative ready state (synced to Firebase)
   */
  public async toggleOperativeReady(role: OperativeRole) {
    if (!this.state.teamId) return;

    if (role === 'OPERATIVE_A') {
      const next = !this.state.leader.isReady;
      this.state.leader.isReady = next;
      await updateTeamInFirebase(this.state.teamId, { 'leader.isReady': next });
    } else if (this.state.secondOperative) {
      const next = !this.state.secondOperative.isReady;
      this.state.secondOperative.isReady = next;
      await updateTeamInFirebase(this.state.teamId, { 'operative2.isReady': next });
    }

    const isReadyA = this.state.leader.isReady;
    const isReadyB = this.state.secondOperative ? this.state.secondOperative.isReady : false;

    if (isReadyA && isReadyB && (this.state.status === 'WAITING' || this.state.status === 'lobby')) {
      this.state.status = 'countdown';
      await updateTeamInFirebase(this.state.teamId, { status: 'countdown' });
    } else if (this.state.status === 'countdown' && (!isReadyA || !isReadyB)) {
      this.state.status = 'WAITING';
      await updateTeamInFirebase(this.state.teamId, { status: 'WAITING' });
    }

    this.saveToStorage();
    this.notify();
  }

  /**
   * Authoritative Mission Timer: Activated in Firebase
   * Sets missionStartedAt and missionEndAt
   */
  public async activateMissionTimer() {
    if (!this.state.teamId) return;
    if (this.state.missionStartedAt === null) {
      await startMissionInFirebase(this.state.teamId, this.state.missionDurationMinutes);
      const now = Date.now();
      this.state.missionStartedAt = now;
      this.state.missionEndAt = now + this.state.missionDurationMinutes * 60 * 1000;
      this.state.status = 'active';
      this.saveToStorage();
      this.notify();
    }
  }

  /**
   * Calculates remaining time authoritative against Firebase timestamps
   * remainingTime = missionEndAt - currentTime
   * Both the Admin Panel and User Panel evaluate using the exact same authoritative Firebase clock
   */
  public getRemainingSeconds(): number {
    const now = Date.now();
    // 1. Authoritative end timestamp from global eventConfig (synced across all screens)
    if (this.eventConfig?.eventEndAt) {
      return Math.max(0, Math.floor((this.eventConfig.eventEndAt - now) / 1000));
    }
    // 2. Team-specific authoritative end timestamp from Firestore
    if (this.state.missionEndAt) {
      return Math.max(0, Math.floor((this.state.missionEndAt - now) / 1000));
    }
    // 3. Fallback calculation if startedAt is set
    if (this.state.missionStartedAt) {
      const end = this.state.missionStartedAt + this.state.missionDurationMinutes * 60 * 1000;
      return Math.max(0, Math.floor((end - now) / 1000));
    }
    // 4. Default duration in minutes when waiting/standby
    const durationMins = this.eventConfig?.durationMinutes || this.state.missionDurationMinutes || 105;
    return durationMins * 60;
  }

  public setActiveSector(sectorId: string) {
    if (this.state.unlockedSectors.includes(sectorId)) {
      this.state.activeSectorId = sectorId;
      this.saveToStorage();
      this.notify();
    }
  }

  public async useHint(sectorId: string, hintIndex: number, cost: number): Promise<boolean> {
    const currentHints = this.state.hintsUsed[sectorId] || 0;
    if (hintIndex === currentHints + 1) {
      const updatedHints = { ...this.state.hintsUsed, [sectorId]: hintIndex };
      const newScore = Math.max(0, this.state.score - cost);
      const newPenalties = this.state.penalties + cost;

      this.state.hintsUsed = updatedHints;
      this.state.score = newScore;
      this.state.penalties = newPenalties;
      this.saveToStorage();
      this.notify();

      if (this.state.teamId) {
        await updateTeamInFirebase(this.state.teamId, {
          hintsUsed: updatedHints,
          score: newScore,
          penalties: newPenalties,
        });
      }
      return true;
    }
    return false;
  }

  public async submitFlag(
    sectorId: string,
    flag: string,
    operativeName: string
  ): Promise<{ success: boolean; message: string; xpDelta: number }> {
    if (isSectorSolved(this.state.completedSectors, sectorId)) {
      return { success: false, message: 'SECTOR ALREADY COMPLETED BY SQUAD.', xpDelta: 0 };
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
      xpDelta: validation.isCorrect ? baseXp + validation.xpDelta : validation.xpDelta,
    };

    this.state.submissions.unshift(record);

    if (validation.isCorrect) {
      const solveTime = Date.now();
      const num = sectorId.replace(/^level-/, '');
      const padded = num.padStart(2, '0');
      const levelPadded = `level-${padded}`;
      const gained = baseXp + validation.xpDelta;
      const newScore = this.state.score + gained;
      const newSpeed = this.state.speedBonus + validation.speedBonusAwarded;
      const newFirstBlood = validation.firstBloodAwarded ? this.state.firstBloodBonus + 25 : this.state.firstBloodBonus;

      const updatedCompleted = Array.from(new Set([...this.state.completedSectors, padded, levelPadded]));

      // Unlocked sectors calculation
      const updatedUnlocked = [...this.state.unlockedSectors];
      SECTORS.forEach((sec) => {
        if (!updatedUnlocked.includes(sec.id)) {
          const allPrereqsMet = sec.prerequisites.every((req) => isSectorSolved(updatedCompleted, req));
          if (allPrereqsMet) {
            updatedUnlocked.push(sec.id);
          }
        }
      });

      this.state.completedSectors = updatedCompleted;
      this.state.unlockedSectors = updatedUnlocked;
      this.state.score = newScore;
      this.state.speedBonus = newSpeed;
      this.state.firstBloodBonus = newFirstBlood;
      this.state.lastSolvedAt = solveTime;

      if (padded === '15') {
        this.state.status = 'completed';
        this.state.completedAt = solveTime;
      }

      this.saveToStorage();
      this.notify();

      if (this.state.teamId) {
        const firestoreRes = await recordSolveInFirebase(
          this.state.teamId,
          sectorId,
          baseXp,
          validation.xpDelta,
          solveTime,
          updatedUnlocked,
          validation.speedBonusAwarded,
          validation.firstBloodAwarded ? 25 : 0,
          record
        );

        if (firestoreRes.alreadySolved) {
          return {
            success: true,
            message: 'SECTOR ALREADY SECURED BY YOUR SQUAD OPERATIVE.',
            xpDelta: 0,
          };
        }
      }

      return { success: true, message: validation.message, xpDelta: gained };
    } else {
      const newScore = Math.max(0, this.state.score - 10);
      const newPenalties = this.state.penalties + 10;
      this.state.score = newScore;
      this.state.penalties = newPenalties;
      this.saveToStorage();
      this.notify();

      if (this.state.teamId) {
        await updateTeamInFirebase(this.state.teamId, {
          score: newScore,
          penalties: newPenalties,
          submissions: arrayUnion(record),
        });
      }

      return { success: false, message: validation.message, xpDelta: -10 };
    }
  }

  public async recordAiPenalty(sectorId: string) {
    const penaltyTiers = [25, 50, 75, 100];
    const penalty = penaltyTiers[Math.min(this.state.aiViolations, penaltyTiers.length - 1)];
    this.state.aiViolations += 1;
    this.state.score = Math.max(0, this.state.score - penalty);
    this.state.penalties += penalty;
    this.saveToStorage();
    this.notify();

    if (this.state.teamId) {
      await updateTeamInFirebase(this.state.teamId, {
        aiViolations: this.state.aiViolations,
        score: this.state.score,
        penalties: this.state.penalties,
      });
    }
    return penalty;
  }

  public async claimBonus(bonusType: 'hiddenQr' | 'easterEgg' | 'speedChallenge'): Promise<number> {
    if (this.state.bonusMissions[bonusType]) return 0;
    this.state.bonusMissions[bonusType] = true;
    const bonusMap = { hiddenQr: 50, easterEgg: 75, speedChallenge: 100 };
    const xp = bonusMap[bonusType];
    this.state.score += xp;
    this.saveToStorage();
    this.notify();

    if (this.state.teamId) {
      await updateTeamInFirebase(this.state.teamId, {
        bonusMissions: this.state.bonusMissions,
        score: this.state.score,
      });
    }
    return xp;
  }

  public async sendChatMessage(text: string, isTacticalAlert: boolean = false) {
    if (!text.trim() || !this.state.teamId) return;
    const currentRole = this.currentOperativeRole;
    const senderName =
      currentRole === 'OPERATIVE_A'
        ? this.state.leader.username
        : this.state.secondOperative?.username || 'OPERATIVE_B';

    const newMsg: ChatMessage = {
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

    await syncChatMessageToFirebase(this.state.teamId, newMsg);
  }

  public clearChat() {
    this.state.chatMessages = [];
    this.saveToStorage();
    this.notify();
  }

  // ================= ADMIN CONTROLS =================

  /**
   * Admin: Reset a single team (or current team)
   * Keeps registration information, resets score, sectors, timer, status
   */
  public async adminResetTeam(targetTeamId?: string) {
    const tid = targetTeamId || this.state.teamId;
    if (!tid) return;
    await resetSingleTeamInFirebase(tid);
  }

  /**
   * Admin: Reset ALL teams
   */
  public async adminResetAllTeams(): Promise<number> {
    return await resetAllTeamsInFirebase();
  }

  /**
   * Admin: Delete team completely from Firestore
   */
  public async adminDeleteTeam(teamId: string): Promise<boolean> {
    const ok = await deleteTeamFromFirebase(teamId);
    if (ok && this.state.teamId === teamId) {
      this.state = createEmptyTeamState();
      this.saveToStorage();
      this.notify();
    }
    return ok;
  }

  /**
   * Admin: Purge legacy/demo teams from Firestore
   */
  public async adminPurgeLegacyDemos(): Promise<number> {
    return await deleteLegacyDemoTeams();
  }

  /**
   * Admin: Add/Remove minutes from timer (synchronized globally across Firestore)
   */
  public async adminAddMinutes(mins: number) {
    const newDuration = Math.max(5, this.state.missionDurationMinutes + mins);
    this.state.missionDurationMinutes = newDuration;
    if (this.state.missionEndAt) {
      this.state.missionEndAt += mins * 60 * 1000;
    } else if (this.state.missionStartedAt) {
      this.state.missionEndAt = this.state.missionStartedAt + newDuration * 60 * 1000;
    }
    this.saveToStorage(true);
    this.notify();

    await applyEventDurationChange(newDuration, mins);
  }

  /**
   * Admin: Save custom mission duration to Firebase eventConfig/main & all squads
   */
  public async adminSetCustomDuration(minutes: number): Promise<boolean> {
    const newDuration = Math.max(5, Math.min(600, minutes));
    const delta = newDuration - this.state.missionDurationMinutes;
    this.state.missionDurationMinutes = newDuration;
    if (this.state.missionEndAt) {
      this.state.missionEndAt += delta * 60 * 1000;
    } else if (this.state.missionStartedAt) {
      this.state.missionEndAt = this.state.missionStartedAt + newDuration * 60 * 1000;
    }
    this.saveToStorage(true);
    this.notify();

    return await applyEventDurationChange(newDuration, delta);
  }

  public async adminAdjustScore(delta: number) {
    this.state.score = Math.max(0, this.state.score + delta);
    this.saveToStorage();
    this.notify();

    if (this.state.teamId) {
      await updateTeamInFirebase(this.state.teamId, { score: this.state.score });
    }
  }

  public async adminUnlockAllSectors() {
    this.state.unlockedSectors = SECTORS.map((s) => s.id);
    this.saveToStorage();
    this.notify();

    if (this.state.teamId) {
      await updateTeamInFirebase(this.state.teamId, { unlockedSectors: this.state.unlockedSectors });
    }
  }
}

export const teamManager = new TeamManager();
