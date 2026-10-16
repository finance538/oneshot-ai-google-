import type { UserSignupEvent } from '@netlify/functions';
import { ensureWallet } from '../lib/wallet.js';

export default {
  async userSignup(event: UserSignupEvent) {
    await ensureWallet(event.user.id);
  },
};
