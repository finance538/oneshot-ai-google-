import { and, eq } from 'drizzle-orm';
import { database } from '../../db/index.js';
import { savedCards } from '../../db/schema.js';
import { readSavedCard, type NgeniusSavedCard } from './ngenius.js';
import { decryptToken, encryptToken } from './platform.js';

// Card on File (tokenisation). A settled payment hands the card the gateway tokenised back to us as
// a savedCard block: the token that charges it, the holder's name, the expiry and a masked tail of
// the number. The block — never the number itself and never the CSC, neither of which this
// application sees — is encrypted at rest with PAYMENT_TOKEN_ENCRYPTION_KEY, exactly like the
// subscription tokens, and is only ever offered back to the same merchant for the same paying email.
export async function rememberSavedCard(input: { merchantId: string; email?: string; gateway: string; card?: NgeniusSavedCard }) {
  const email = (input.email || '').trim().toLowerCase();
  const card = readSavedCard(input.card);
  if (!card || !email) return false;
  try {
    const encryptedToken = encryptToken(JSON.stringify(card));
    const now = new Date();
    await database().insert(savedCards)
      .values({ merchantId: input.merchantId, email, gateway: input.gateway, encryptedToken, updatedAt: now })
      .onConflictDoUpdate({ target: [savedCards.merchantId, savedCards.email, savedCards.gateway], set: { encryptedToken, updatedAt: now } });
    return true;
  } catch {
    // A card we failed to remember is not a failed payment: the customer pays again and it is stored then.
    return false;
  }
}

export async function savedCardFor(merchantId: string, gateway: string, email?: string): Promise<NgeniusSavedCard | undefined> {
  const address = (email || '').trim().toLowerCase();
  if (!address) return undefined;
  try {
    const [row] = await database().select().from(savedCards)
      .where(and(eq(savedCards.merchantId, merchantId), eq(savedCards.email, address), eq(savedCards.gateway, gateway)));
    if (!row) return undefined;
    // Stored as JSON under encryption; anything that does not decrypt back into a usable card is
    // treated as no card at all, so a corrupted row can never break a checkout.
    try { return readSavedCard(JSON.parse(decryptToken(row.encryptedToken))); } catch { return undefined; }
  } catch {
    // No stored token, or encryption not configured: pay with a fresh card instead of failing the sale.
    return undefined;
  }
}
