import {
  doc,
  getDoc,
  setDoc,
  runTransaction,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { ExchangeRateConfig, Transaction, CurrencyType } from '../types';
import { INITIAL_EXCHANGE_RATE } from '../lib/seedData';

const CONFIG_DOC = 'exchangeRates/current';

export async function getExchangeRate(): Promise<ExchangeRateConfig> {
  try {
    const snap = await getDoc(doc(db, 'exchangeRates', 'current'));
    if (!snap.exists()) {
      await setDoc(doc(db, 'exchangeRates', 'current'), INITIAL_EXCHANGE_RATE);
      return INITIAL_EXCHANGE_RATE;
    }
    return snap.data() as ExchangeRateConfig;
  } catch (err) {
    console.warn('Fallback exchange rate used:', err);
    return INITIAL_EXCHANGE_RATE;
  }
}

export async function updateExchangeRate(config: Partial<ExchangeRateConfig>): Promise<void> {
  try {
    await setDoc(doc(db, 'exchangeRates', 'current'), {
      ...config,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, 'exchangeRates/current');
  }
}

export interface ExchangeCalculation {
  sourceCurrency: CurrencyType;
  targetCurrency: CurrencyType;
  sourceAmount: number;
  targetGross: number;
  feeAmount: number;
  targetNet: number;
  rateDescription: string;
}

export function calculateExchange(
  sourceCurrency: CurrencyType,
  sourceAmount: number,
  config: ExchangeRateConfig
): ExchangeCalculation {
  if (sourceAmount <= 0) {
    return {
      sourceCurrency,
      targetCurrency: sourceCurrency === 'coins' ? 'diamonds' : 'coins',
      sourceAmount: 0,
      targetGross: 0,
      feeAmount: 0,
      targetNet: 0,
      rateDescription: `1 Diamond = ${config.coinsPerDiamond.toLocaleString()} Coins`,
    };
  }

  if (sourceCurrency === 'coins') {
    // Coins -> Diamonds
    const grossDiamonds = sourceAmount / config.coinsPerDiamond;
    const feeDiamonds = (grossDiamonds * config.feePercentage) / 100;
    const netDiamonds = Math.max(0, grossDiamonds - feeDiamonds);
    return {
      sourceCurrency: 'coins',
      targetCurrency: 'diamonds',
      sourceAmount,
      targetGross: Number(grossDiamonds.toFixed(3)),
      feeAmount: Number(feeDiamonds.toFixed(3)),
      targetNet: Number(netDiamonds.toFixed(2)),
      rateDescription: `${config.coinsPerDiamond.toLocaleString()} Coins -> 1 Diamond (Fee: ${config.feePercentage}%)`,
    };
  } else {
    // Diamonds -> Coins
    const grossCoins = sourceAmount * config.coinsPerDiamond;
    const feeCoins = (grossCoins * config.feePercentage) / 100;
    const netCoins = Math.floor(Math.max(0, grossCoins - feeCoins));
    return {
      sourceCurrency: 'diamonds',
      targetCurrency: 'coins',
      sourceAmount,
      targetGross: grossCoins,
      feeAmount: feeCoins,
      targetNet: netCoins,
      rateDescription: `1 Diamond -> ${config.coinsPerDiamond.toLocaleString()} Coins (Fee: ${config.feePercentage}%)`,
    };
  }
}

/**
 * ATOMIC EXCHANGE TRANSACTION
 * Strictly validates that user has sufficient balance.
 * Authoritatively reads exchange configuration on server/transaction.
 * Updates both coin & diamond balances atomically and appends ledger record.
 */
export async function executeExchangeAtomic(
  userId: string,
  sourceCurrency: CurrencyType,
  sourceAmount: number
): Promise<{ success: boolean; newCoins: number; newDiamonds: number }> {
  if (sourceAmount <= 0) {
    throw new Error('Exchange amount must be greater than zero.');
  }

  const walletRef = doc(db, 'wallets', userId);
  const rateRef = doc(db, 'exchangeRates', 'current');

  try {
    return await runTransaction(db, async (txn) => {
      // 1. Read authoritative rate
      const rateSnap = await txn.get(rateRef);
      const config: ExchangeRateConfig = rateSnap.exists()
        ? (rateSnap.data() as ExchangeRateConfig)
        : INITIAL_EXCHANGE_RATE;

      // 2. Read authoritative user wallet
      const walletSnap = await txn.get(walletRef);
      if (!walletSnap.exists()) {
        throw new Error('Wallet not found');
      }

      const wallet = walletSnap.data();
      const currentCoins = wallet.coins || 0;
      const currentDiamonds = wallet.diamonds || 0;

      // 3. Validation
      if (sourceCurrency === 'coins') {
        if (sourceAmount < config.minExchangeCoins) {
          throw new Error(`Minimum exchange is ${config.minExchangeCoins.toLocaleString()} Coins.`);
        }
        if (currentCoins < sourceAmount) {
          throw new Error(`Insufficient Coin balance. You have ${currentCoins.toLocaleString()} Coins.`);
        }

        const calc = calculateExchange('coins', sourceAmount, config);
        const newCoins = currentCoins - sourceAmount;
        const newDiamonds = Number((currentDiamonds + calc.targetNet).toFixed(2));

        const txId = `tx_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const ledgerEntry: Transaction = {
          id: txId,
          userId,
          type: 'exchange_debit',
          currency: 'coins',
          amount: -sourceAmount,
          description: `Exchanged ${sourceAmount.toLocaleString()} Coins for ${calc.targetNet} Diamonds`,
          referenceId: txId,
          createdAt: new Date().toISOString(),
        };

        const txCreditId = `tx_ex_cr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const ledgerCredit: Transaction = {
          id: txCreditId,
          userId,
          type: 'exchange_credit',
          currency: 'diamonds',
          amount: calc.targetNet,
          description: `Received ${calc.targetNet} Diamonds from exchange`,
          referenceId: txId,
          createdAt: new Date().toISOString(),
        };

        txn.update(walletRef, {
          coins: newCoins,
          diamonds: newDiamonds,
          updatedAt: new Date().toISOString(),
        });

        txn.set(doc(db, 'transactions', txId), ledgerEntry);
        txn.set(doc(db, 'transactions', txCreditId), ledgerCredit);

        return { success: true, newCoins, newDiamonds };
      } else {
        // Diamonds -> Coins
        if (sourceAmount < config.minExchangeDiamonds) {
          throw new Error(`Minimum exchange is ${config.minExchangeDiamonds} Diamond.`);
        }
        if (currentDiamonds < sourceAmount) {
          throw new Error(`Insufficient Diamond balance. You have ${currentDiamonds} Diamonds.`);
        }

        const calc = calculateExchange('diamonds', sourceAmount, config);
        const newDiamonds = Number((currentDiamonds - sourceAmount).toFixed(2));
        const newCoins = currentCoins + calc.targetNet;

        const txId = `tx_ex_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const ledgerEntry: Transaction = {
          id: txId,
          userId,
          type: 'exchange_debit',
          currency: 'diamonds',
          amount: -sourceAmount,
          description: `Exchanged ${sourceAmount} Diamonds for ${calc.targetNet.toLocaleString()} Coins`,
          referenceId: txId,
          createdAt: new Date().toISOString(),
        };

        const txCreditId = `tx_ex_cr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        const ledgerCredit: Transaction = {
          id: txCreditId,
          userId,
          type: 'exchange_credit',
          currency: 'coins',
          amount: calc.targetNet,
          description: `Received ${calc.targetNet.toLocaleString()} Coins from exchange`,
          referenceId: txId,
          createdAt: new Date().toISOString(),
        };

        txn.update(walletRef, {
          coins: newCoins,
          diamonds: newDiamonds,
          updatedAt: new Date().toISOString(),
        });

        txn.set(doc(db, 'transactions', txId), ledgerEntry);
        txn.set(doc(db, 'transactions', txCreditId), ledgerCredit);

        return { success: true, newCoins, newDiamonds };
      }
    });
  } catch (err: any) {
    const rawMsg = String(err?.message || err || '');
    if (
      rawMsg.includes('Insufficient') ||
      rawMsg.includes('Minimum exchange') ||
      rawMsg.includes('greater than zero') ||
      rawMsg.includes('Wallet not found')
    ) {
      const cleanMsg = rawMsg.replace(/^Transaction failed:\s*(Error:\s*)?/i, '').trim();
      throw new Error(cleanMsg);
    }
    handleFirestoreError(err, OperationType.WRITE, `wallets/${userId}`);
  }
}
