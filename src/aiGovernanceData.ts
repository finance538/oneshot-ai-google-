import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { getLegacyFirebase } from './firebase';

export type GeminiModelKey = 'gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite' | 'gemini-3.5-transcribe';

export interface RoleAiPermissions {
  role: 'admin' | 'merchant' | 'marketer' | 'loader';
  roleLabelAr: string;
  allowedModels: ('gemini-4-argon' | 'gemini-3.8-flash' | 'gemini-3.1-flash-lite')[];
  allowVoiceTranscription: boolean;
  allowSearchGrounding: boolean;
  allowMapsGrounding: boolean;
  allowCeoSuite: boolean;
  allowAiStaff: boolean;
  maxDailyPrompts: number; // -1 for unlimited
  is100PercentPower?: boolean;
}

export interface AiGovernanceMatrix {
  admin: RoleAiPermissions;
  merchant: RoleAiPermissions;
  marketer: RoleAiPermissions;
  loader: RoleAiPermissions;
  updatedAt: string;
  updatedBy: string;
}

export const defaultAiGovernance: AiGovernanceMatrix = {
  admin: {
    role: 'admin',
    roleLabelAr: 'مسؤول المنصة (Admin)',
    allowedModels: ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'],
    allowVoiceTranscription: true,
    allowSearchGrounding: true,
    allowMapsGrounding: true,
    allowCeoSuite: true,
    allowAiStaff: true,
    maxDailyPrompts: -1,
    is100PercentPower: true,
  },
  merchant: {
    role: 'merchant',
    roleLabelAr: 'التاجر / صاحب الحساب (Merchant)',
    allowedModels: ['gemini-3.8-flash', 'gemini-3.1-flash-lite', 'gemini-4-argon'],
    allowVoiceTranscription: true,
    allowSearchGrounding: true,
    allowMapsGrounding: true,
    allowCeoSuite: true,
    allowAiStaff: true,
    maxDailyPrompts: 500,
    is100PercentPower: false,
  },
  marketer: {
    role: 'marketer',
    roleLabelAr: 'المسوّق بالعمولة (Marketer)',
    allowedModels: ['gemini-3.8-flash', 'gemini-3.1-flash-lite'],
    allowVoiceTranscription: true,
    allowSearchGrounding: true,
    allowMapsGrounding: false,
    allowCeoSuite: false,
    allowAiStaff: false,
    maxDailyPrompts: 100,
    is100PercentPower: false,
  },
  loader: {
    role: 'loader',
    roleLabelAr: 'مختبر البوابات (Loader / Tester)',
    allowedModels: ['gemini-3.1-flash-lite', 'gemini-3.8-flash'],
    allowVoiceTranscription: false,
    allowSearchGrounding: false,
    allowMapsGrounding: false,
    allowCeoSuite: false,
    allowAiStaff: false,
    maxDailyPrompts: 50,
    is100PercentPower: false,
  },
  updatedAt: new Date().toISOString(),
  updatedBy: 'system',
};

const STORAGE_KEY = 'oneshot_ai_governance_matrix';

export function getStoredAiGovernance(): AiGovernanceMatrix {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultAiGovernance;
    const parsed = JSON.parse(raw) as Partial<AiGovernanceMatrix>;
    return {
      admin: { ...defaultAiGovernance.admin, ...(parsed.admin || {}), is100PercentPower: true },
      merchant: { ...defaultAiGovernance.merchant, ...(parsed.merchant || {}) },
      marketer: { ...defaultAiGovernance.marketer, ...(parsed.marketer || {}) },
      loader: { ...defaultAiGovernance.loader, ...(parsed.loader || {}) },
      updatedAt: parsed.updatedAt || defaultAiGovernance.updatedAt,
      updatedBy: parsed.updatedBy || defaultAiGovernance.updatedBy,
    };
  } catch {
    return defaultAiGovernance;
  }
}

export async function saveAiGovernance(matrix: AiGovernanceMatrix, updatedByEmail = 'admin@1shotcam.com'): Promise<void> {
  // Ensure Admin always stays at 100% full power as mandated
  const enforcedMatrix: AiGovernanceMatrix = {
    ...matrix,
    admin: {
      role: 'admin',
      roleLabelAr: 'مسؤول المنصة (Admin)',
      allowedModels: ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'],
      allowVoiceTranscription: true,
      allowSearchGrounding: true,
      allowMapsGrounding: true,
      allowCeoSuite: true,
      allowAiStaff: true,
      maxDailyPrompts: -1,
      is100PercentPower: true,
    },
    updatedAt: new Date().toISOString(),
    updatedBy: updatedByEmail,
  };

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(enforcedMatrix));
  } catch {
    // Ignore storage errors
  }

  try {
    const { db } = await getLegacyFirebase();
    const docRef = doc(db, 'ai_role_permissions', 'global_matrix');
    await setDoc(docRef, enforcedMatrix, { merge: true });
  } catch (err) {
    console.warn('Could not sync AI governance matrix to Firestore (saved locally):', err);
  }
}

export function subscribeToAiGovernance(onUpdate: (matrix: AiGovernanceMatrix) => void): () => void {
  // Initial local state
  onUpdate(getStoredAiGovernance());

  let unsub: (() => void) | undefined;
  void getLegacyFirebase().then(({ db }) => {
    const docRef = doc(db, 'ai_role_permissions', 'global_matrix');
    unsub = onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data() as Partial<AiGovernanceMatrix>;
        const merged: AiGovernanceMatrix = {
          admin: { ...defaultAiGovernance.admin, ...(data.admin || {}), is100PercentPower: true },
          merchant: { ...defaultAiGovernance.merchant, ...(data.merchant || {}) },
          marketer: { ...defaultAiGovernance.marketer, ...(data.marketer || {}) },
          loader: { ...defaultAiGovernance.loader, ...(data.loader || {}) },
          updatedAt: data.updatedAt || new Date().toISOString(),
          updatedBy: data.updatedBy || 'admin',
        };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        } catch {
          // ignore
        }
        onUpdate(merged);
      }
    }, (error) => {
      console.warn('Firestore AI governance listener fallback to local:', error);
    });
  }).catch(() => {});

  return () => {
    if (unsub) unsub();
  };
}

export function getRolePermissions(role?: string, isAdmin?: boolean): RoleAiPermissions {
  if (isAdmin || role === 'admin') {
    return {
      role: 'admin',
      roleLabelAr: 'مسؤول المنصة (Admin)',
      allowedModels: ['gemini-4-argon', 'gemini-3.8-flash', 'gemini-3.1-flash-lite'],
      allowVoiceTranscription: true,
      allowSearchGrounding: true,
      allowMapsGrounding: true,
      allowCeoSuite: true,
      allowAiStaff: true,
      maxDailyPrompts: -1,
      is100PercentPower: true,
    };
  }

  const matrix = getStoredAiGovernance();
  if (role === 'marketer') return matrix.marketer;
  if (role === 'loader') return matrix.loader;
  return matrix.merchant;
}
