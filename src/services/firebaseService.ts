/**
 * SYSTEM OMEGA - Real Firebase Authentication & Firestore Service
 * Persistent Cloud Data Storage, Multi-Device Synchronization, Authoritative Timers
 */

import { initializeApp } from 'firebase/app';
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  collection,
  onSnapshot,
  serverTimestamp,
  arrayUnion,
  Unsubscribe,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { TeamState, ChatMessage, OperativeRole, SubmissionRecord } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Hash credentials client-side with SHA-256 so plaintext passwords are never stored in Firestore
export async function hashPassword(password: string): Promise<string> {
  if (!password) return '';
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + '_system_omega_salt_2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  } catch {
    // Fallback simple hash for older environments
    let hash = 0;
    const str = password + '_salt';
    for (let i = 0; i < str.length; i++) {
      hash = (hash << 5) - hash + str.charCodeAt(i);
      hash |= 0;
    }
    return 'fallback_' + Math.abs(hash).toString(16);
  }
}

export function formatReadableTimestamp(timestamp: number | null | undefined): string {
  if (!timestamp) return '—';
  try {
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return '—';
    const day = date.getDate().toString().padStart(2, '0');
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[date.getMonth()];
    const year = date.getFullYear();
    let hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const hourStr = hours.toString().padStart(2, '0');
    return `${day} ${month} ${year}, ${hourStr}:${minutes} ${ampm}`;
  } catch {
    return '—';
  }
}

export interface CreateTeamPayload {
  teamId: string;
  teamName: string;
  leaderUsername: string;
  leaderEmail: string;
  leaderPassword: string;
  operative2Username: string;
  operative2Email: string;
  operative2Password: string;
}

/**
 * Creates a brand new team in Firestore
 * Stored at teams/{teamId}
 */
export async function createTeamInFirestore(payload: CreateTeamPayload): Promise<{ success: boolean; error?: string }> {
  try {
    const leaderHash = await hashPassword(payload.leaderPassword);
    const op2Hash = await hashPassword(payload.operative2Password);

    // Try creating Firebase Auth users if email/password is valid (best effort)
    if (payload.leaderEmail && payload.leaderPassword.length >= 6) {
      try {
        await createUserWithEmailAndPassword(auth, payload.leaderEmail, payload.leaderPassword);
      } catch {
        // Ignored if user already exists or domain issue
      }
    }
    if (payload.operative2Email && payload.operative2Password.length >= 6) {
      try {
        await createUserWithEmailAndPassword(auth, payload.operative2Email, payload.operative2Password);
      } catch {
        // Ignored
      }
    }

    const teamRef = doc(db, 'teams', payload.teamId);
    const now = Date.now();

    const teamDoc = {
      teamId: payload.teamId,
      teamName: payload.teamName.trim().toUpperCase(),
      leader: {
        username: payload.leaderUsername.trim().toUpperCase(),
        email: payload.leaderEmail.trim().toLowerCase(),
        role: 'LEADER',
        isOnline: true,
        isReady: false,
        lastActive: now,
      },
      operative2: {
        username: payload.operative2Username.trim().toUpperCase(),
        email: payload.operative2Email.trim().toLowerCase(),
        role: 'OPERATIVE',
        isOnline: false,
        isReady: false,
        lastActive: now,
      },
      leaderPasswordHash: leaderHash,
      secondOperativePasswordHash: op2Hash,
      score: 0,
      completedSectors: [],
      unlockedSectors: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'],
      activeSectorId: '01',
      status: 'WAITING',
      missionStartedAt: null,
      missionEndAt: null,
      missionDurationMinutes: 105,
      lastSolvedAt: null,
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
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(teamRef, teamDoc);
    return { success: true };
  } catch (err: any) {
    console.error('Failed to create team in Firestore:', err);
    return { success: false, error: err?.message || 'Failed to initialize team in Firestore' };
  }
}

/**
 * Authenticates Operative 2 (or Leader) joining an existing team
 */
export async function authenticateJoinTeam(
  teamId: string,
  usernameOrEmail: string,
  password: string
): Promise<{ success: boolean; role?: OperativeRole; error?: string; teamData?: any }> {
  try {
    const cleanId = teamId.trim().toUpperCase();
    const teamRef = doc(db, 'teams', cleanId);
    const snap = await getDoc(teamRef);

    if (!snap.exists()) {
      return { success: false, error: `Team ID "${cleanId}" not found in database.` };
    }

    const data = snap.data();
    const enteredHash = await hashPassword(password);
    const identifier = usernameOrEmail.trim().toUpperCase();
    const identifierEmail = usernameOrEmail.trim().toLowerCase();

    // Check Operative 2 match
    const op2User = (data.operative2?.username || '').toUpperCase();
    const op2Email = (data.operative2?.email || '').toLowerCase();
    const isOp2 = identifier === op2User || identifierEmail === op2Email;

    if (isOp2) {
      if (data.secondOperativePasswordHash && data.secondOperativePasswordHash !== enteredHash) {
        return { success: false, error: 'INCORRECT PASSWORD FOR OPERATIVE 2.' };
      }
      // Update operative 2 online status
      await updateDoc(teamRef, {
        'operative2.isOnline': true,
        'operative2.lastActive': Date.now(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, role: 'OPERATIVE_B', teamData: data };
    }

    // Check Leader match
    const leaderUser = (data.leader?.username || '').toUpperCase();
    const leaderEmail = (data.leader?.email || '').toLowerCase();
    const isLeader = identifier === leaderUser || identifierEmail === leaderEmail;

    if (isLeader) {
      if (data.leaderPasswordHash && data.leaderPasswordHash !== enteredHash) {
        return { success: false, error: 'INCORRECT PASSWORD FOR SQUAD LEADER.' };
      }
      await updateDoc(teamRef, {
        'leader.isOnline': true,
        'leader.lastActive': Date.now(),
        updatedAt: serverTimestamp(),
      });
      return { success: true, role: 'OPERATIVE_A', teamData: data };
    }

    return { success: false, error: 'IDENTIFIER DOES NOT MATCH ANY SQUAD OPERATIVE.' };
  } catch (err: any) {
    console.error('Error joining team:', err);
    return { success: false, error: err?.message || 'Authentication error.' };
  }
}

/**
 * Real-time listener for a single team document
 */
export function listenToTeam(teamId: string, callback: (teamData: any) => void): Unsubscribe {
  const teamRef = doc(db, 'teams', teamId);
  return onSnapshot(
    teamRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data());
      } else {
        callback(null);
      }
    },
    (err) => {
      console.warn('listenToTeam error:', err);
    }
  );
}

/**
 * Real-time listener for all teams (for Leaderboard and Admin Monitoring)
 */
export function listenToAllTeams(callback: (teams: any[]) => void): Unsubscribe {
  const teamsCol = collection(db, 'teams');
  return onSnapshot(
    teamsCol,
    (snapshot) => {
      const teams: any[] = [];
      snapshot.forEach((d) => {
        teams.push(d.data());
      });
      callback(teams);
    },
    (err) => {
      console.warn('listenToAllTeams error:', err);
      callback([]);
    }
  );
}

/**
 * Real-time listener for global event config (mission duration, etc.)
 */
export function listenToEventConfig(callback: (config: { durationMinutes: number; updatedAt?: any } | null) => void): Unsubscribe {
  const configRef = doc(db, 'eventConfig', 'main');
  return onSnapshot(
    configRef,
    (snap) => {
      if (snap.exists()) {
        callback(snap.data() as any);
      } else {
        callback({ durationMinutes: 105 });
      }
    },
    (err) => {
      console.warn('listenToEventConfig error:', err);
      callback({ durationMinutes: 105 });
    }
  );
}

/**
 * Save event configuration in Firebase: eventConfig/main
 */
export async function saveEventConfig(durationMinutes: number): Promise<boolean> {
  try {
    const configRef = doc(db, 'eventConfig', 'main');
    await setDoc(
      configRef,
      {
        durationMinutes,
        updatedAt: serverTimestamp(),
        updatedBy: 'ADMIN',
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.error('Failed to save event config:', e);
    return false;
  }
}

/**
 * Start mission timer for a team in Firebase
 * Sets authoritative missionStartedAt and missionEndAt
 */
export async function startMissionInFirebase(teamId: string, durationMinutes: number): Promise<boolean> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    const now = Date.now();
    const endAt = now + durationMinutes * 60 * 1000;
    await updateDoc(teamRef, {
      missionStartedAt: now,
      missionEndAt: endAt,
      status: 'active',
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('Failed to start mission timer:', e);
    return false;
  }
}

/**
 * Updates team state in Firebase
 */
export async function updateTeamInFirebase(teamId: string, updates: Record<string, any>): Promise<boolean> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      ...updates,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('updateTeamInFirebase failed:', e);
    return false;
  }
}

/**
 * Records sector solve with updated score, completedSectors, and lastSolvedAt timestamp
 */
export async function recordSolveInFirebase(
  teamId: string,
  sectorId: string,
  newScore: number,
  solveTimestamp: number,
  unlockedSectors: string[],
  speedBonusDelta: number,
  firstBloodBonusDelta: number,
  submission: SubmissionRecord
): Promise<boolean> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    const isCompletedOmega = sectorId === '15';

    await updateDoc(teamRef, {
      completedSectors: arrayUnion(sectorId),
      unlockedSectors,
      score: newScore,
      lastSolvedAt: solveTimestamp,
      status: isCompletedOmega ? 'completed' : 'active',
      completedAt: isCompletedOmega ? solveTimestamp : null,
      submissions: arrayUnion(submission),
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('recordSolveInFirebase failed:', e);
    return false;
  }
}

/**
 * Admin: Reset a single team's game progress
 * Keeps registration info (teamId, teamName, leader, operative2, credentials)
 */
export async function resetSingleTeamInFirebase(teamId: string): Promise<boolean> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await updateDoc(teamRef, {
      score: 0,
      completedSectors: [],
      unlockedSectors: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'],
      activeSectorId: '01',
      hintsUsed: {},
      penalties: 0,
      speedBonus: 0,
      firstBloodBonus: 0,
      submissions: [],
      missionStartedAt: null,
      missionEndAt: null,
      lastSolvedAt: null,
      status: 'WAITING',
      'leader.isReady': false,
      'operative2.isReady': false,
      bonusMissions: {
        hiddenQr: false,
        easterEgg: false,
        speedChallenge: false,
      },
      aiViolations: 0,
      completedAt: null,
      updatedAt: serverTimestamp(),
    });
    return true;
  } catch (e) {
    console.error('resetSingleTeamInFirebase failed:', e);
    return false;
  }
}

/**
 * Admin: Reset ALL teams' game progress
 */
export async function resetAllTeamsInFirebase(): Promise<number> {
  try {
    const snap = await getDocs(collection(db, 'teams'));
    let count = 0;
    const promises = snap.docs.map(async (docSnap) => {
      await updateDoc(docSnap.ref, {
        score: 0,
        completedSectors: [],
        unlockedSectors: ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15'],
        activeSectorId: '01',
        hintsUsed: {},
        penalties: 0,
        speedBonus: 0,
        firstBloodBonus: 0,
        submissions: [],
        missionStartedAt: null,
        missionEndAt: null,
        lastSolvedAt: null,
        status: 'WAITING',
        'leader.isReady': false,
        'operative2.isReady': false,
        bonusMissions: {
          hiddenQr: false,
          easterEgg: false,
          speedChallenge: false,
        },
        aiViolations: 0,
        completedAt: null,
        updatedAt: serverTimestamp(),
      });
      count++;
    });
    await Promise.all(promises);
    return count;
  } catch (e) {
    console.error('resetAllTeamsInFirebase failed:', e);
    return 0;
  }
}

/**
 * Admin: Completely remove a team from Firestore
 */
export async function deleteTeamFromFirebase(teamId: string): Promise<boolean> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    await deleteDoc(teamRef);
    return true;
  } catch (e) {
    console.error('deleteTeamFromFirebase failed:', e);
    return false;
  }
}

/**
 * Admin: Safely purge legacy demo/mock squads if any exist in Firestore
 */
export async function deleteLegacyDemoTeams(): Promise<number> {
  try {
    const demoTeamIds = [
      'OMEGA-017',
      'OMEGA-031',
      'OMEGA-092',
      'OMEGA-044',
      'OMEGA-009',
      'OMEGA-056',
      'OMEGA-112',
      'squad-1',
      'squad-2',
      'squad-3',
    ];
    const demoNames = [
      'CYBER VANGUARD',
      'NULL_POINTER_ELITE',
      'SYN_ACK_CHADS',
      'QUANTUM_OVERFLOW',
      'RED_TEAM_SHADOWS',
      'BYTE_FORCE_ZERO',
      'KERNEL_PANIC_SQUAD',
      'CYBER PIONEERS',
      'QUANTUM VANGUARD',
      'ZERO DAY SYNDICATE',
    ];

    const snap = await getDocs(collection(db, 'teams'));
    let deleted = 0;
    for (const d of snap.docs) {
      const data = d.data();
      if (
        demoTeamIds.includes(d.id.toUpperCase()) ||
        demoNames.includes((data.teamName || '').toUpperCase())
      ) {
        await deleteDoc(d.ref);
        deleted++;
      }
    }
    return deleted;
  } catch (e) {
    console.error('deleteLegacyDemoTeams error:', e);
    return 0;
  }
}

export async function syncChatMessageToFirebase(teamId: string, message: ChatMessage): Promise<boolean> {
  if (!db || !teamId) return false;
  try {
    const msgRef = doc(db, 'teams', teamId, 'messages', message.id);
    await setDoc(msgRef, message);
    return true;
  } catch {
    return false;
  }
}

export function listenToTeamChat(teamId: string, callback: (messages: ChatMessage[]) => void): Unsubscribe {
  const colRef = collection(db, 'teams', teamId, 'messages');
  return onSnapshot(
    colRef,
    (snap) => {
      const msgs: ChatMessage[] = [];
      snap.forEach((d) => {
        msgs.push(d.data() as ChatMessage);
      });
      msgs.sort((a, b) => a.timestamp - b.timestamp);
      callback(msgs);
    },
    () => {
      callback([]);
    }
  );
}
