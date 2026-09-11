import { z } from 'zod'
import { walletBalanceTypes, walletEntryTypes } from './domain'
import type { WalletBalanceType, WalletEntryType } from './domain'

export const walletBalanceTypeSchema = z.enum(walletBalanceTypes)
export const walletEntryTypeSchema = z.enum(walletEntryTypes)

export const ledgerEntrySchema = z.object({
  balanceType:walletBalanceTypeSchema,
  entryType:walletEntryTypeSchema,
  amount:z.number().positive(),
  reason:z.string().min(3).max(200),
  bookingId:z.string().uuid().optional(),
  metadata:z.record(z.string(),z.unknown()).default({}),
})
export type LedgerEntry = z.infer<typeof ledgerEntrySchema>

export function entryDirection(entryType:WalletEntryType): 'increase' | 'decrease' {
  return entryType === 'DEBIT' ? 'decrease' : 'increase'
}

export function validateLedgerBalance(balance:number, entry:Pick<LedgerEntry,'entryType'|'amount'>) {
  if (entry.amount <= 0) throw new Error('Ledger amounts must be positive')
  const next = entryDirection(entry.entryType) === 'decrease' ? Math.round((balance - entry.amount)*100)/100 : Math.round((balance + entry.amount)*100)/100
  if (next < 0) throw new Error(`Insufficient balance for this ${entry.entryType.toLowerCase()}`)
  return next
}

export function emptyBalances(): Record<WalletBalanceType, number> {
  return { CASH:0, PROMOTIONAL:0, MEMBERSHIP_CREDIT:0, REWARD_CREDIT:0 }
}

export function summariseBalances(entries:Array<{ balanceType:WalletBalanceType; entryType:WalletEntryType; amount:string|number }>): Record<WalletBalanceType, number> {
  const summary = emptyBalances()
  for (const entry of entries) {
    const amount = Number(entry.amount)
    summary[entry.balanceType] += entryDirection(entry.entryType) === 'decrease' ? -amount : amount
  }
  return summary
}