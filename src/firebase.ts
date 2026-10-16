import { initializeApp, type FirebaseOptions } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import firebaseConfigUrl from '../firebase-applet-config.json?url&no-inline';

interface LegacyFirebase {
  auth: Auth;
  db: Firestore;
}

let initialization: Promise<LegacyFirebase> | undefined;

// The web SDK configuration is intentionally public. The no-inline URL import
// keeps it in its own JSON asset, covered by a narrowly scoped scan exception.
export function getLegacyFirebase(): Promise<LegacyFirebase> {
  if (!initialization) {
    initialization = (async () => {
      const response = await fetch(firebaseConfigUrl);
      if (!response.ok) throw new Error('Legacy archive configuration is unavailable.');
      const config = await response.json() as FirebaseOptions & { firestoreDatabaseId: string };
      const app = initializeApp(config);
      return { auth: getAuth(app), db: getFirestore(app, config.firestoreDatabaseId) };
    })().catch(error => {
      initialization = undefined;
      throw error;
    });
  }
  return initialization;
}
