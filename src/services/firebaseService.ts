/**
 * SYSTEM OMEGA - Firebase Authentication & Firestore Service
 * Authoritative cloud data storage & real-time sync for squad profiles and tactical messages
 */

import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { TeamState, ChatMessage } from '../types';

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Connection test on boot as required by skill
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('[SYSTEM OMEGA] Firestore client is operating in cached/offline mode.');
    }
  }
}
testConnection();

export async function syncTeamMemberToFirebase(teamState: TeamState): Promise<boolean> {
  if (!db) return false;

  try {
    const teamRef = doc(db, 'teams', teamState.teamId);
    await setDoc(
      teamRef,
      {
        teamId: teamState.teamId,
        teamName: teamState.teamName,
        leader: {
          username: teamState.leader.username,
          role: teamState.leader.role,
          isOnline: teamState.leader.isOnline,
        },
        secondOperative: teamState.secondOperative
          ? {
              username: teamState.secondOperative.username,
              role: teamState.secondOperative.role,
              isOnline: teamState.secondOperative.isOnline,
            }
          : null,
        score: teamState.score,
        status: teamState.status,
        completedSectors: teamState.completedSectors,
        missionStartedAt: teamState.missionStartedAt,
        updatedAt: Date.now(),
      },
      { merge: true }
    );
    return true;
  } catch (e) {
    console.warn('[SYSTEM OMEGA] Firebase team sync:', e);
    return false;
  }
}

export async function syncChatMessageToFirebase(teamId: string, message: ChatMessage): Promise<boolean> {
  if (!db) return false;

  try {
    const msgRef = doc(db, 'teams', teamId, 'messages', message.id);
    await setDoc(msgRef, message);
    return true;
  } catch (e) {
    return false;
  }
}
