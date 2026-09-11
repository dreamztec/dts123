import assert from 'node:assert/strict'
import test from 'node:test'
import { validateLedgerBalance, emptyBalances, summariseBalances, ledgerEntrySchema } from '../src/lib/wallet.ts'
import type { WalletBalanceType, WalletEntryType } from '../src/lib/domain.ts'

test('ledger credits increase and debits decrease the balance', () => {
  assert.equal(validateLedgerBalance(1000,{ entryType:'CREDIT', amount:500 }), 1500)
  assert.equal(validateLedgerBalance(1000,{ entryType:'REFUND', amount:250 }), 1250)
  assert.equal(validateLedgerBalance(1000,{ entryType:'DEBIT', amount:400 }), 600)
})

test('ledger adjustments move a balance to an exact corrected value', () => {
  assert.equal(validateLedgerBalance(1000,{ entryType:'ADJUSTMENT', amount:1500 }), 2500)
  assert.equal(validateLedgerBalance(1000,{ entryType:'ADJUSTMENT', amount:800 }), 1800)
})

test('ledger rejects debits that would overdraw a balance', () => {
  assert.throws(() => validateLedgerBalance(500,{ entryType:'DEBIT', amount:600 }), /Insufficient balance/i)
  assert.throws(() => validateLedgerBalance(0,{ entryType:'DEBIT', amount:1 }), /Insufficient balance/i)
})

test('ledger amounts must be positive', () => {
  assert.throws(() => validateLedgerBalance(500,{ entryType:'DEBIT', amount:0 }), /positive/i)
  assert.throws(() => validateLedgerBalance(500,{ entryType:'CREDIT', amount:-100 }), /positive/i)
  assert.throws(() => ledgerEntrySchema.parse({ balanceType:'CASH', entryType:'DEBIT', amount:0, reason:'zero amount' }), /expected number to be >0/i)
})

test('balances start at zero until real transactions exist', () => {
  const balances = emptyBalances()
  assert.deepEqual(balances,{ CASH:0, PROMOTIONAL:0, MEMBERSHIP_CREDIT:0, REWARD_CREDIT:0 })
})

test('balance summary folds entry direction into per-bucket totals', () => {
  const entries:Array<{ balanceType:WalletBalanceType; entryType:WalletEntryType; amount:string|number }> = [
    { balanceType:'CASH', entryType:'CREDIT', amount:'5000' },
    { balanceType:'CASH', entryType:'DEBIT', amount:'1500.50' },
    { balanceType:'REWARD_CREDIT', entryType:'CREDIT', amount:200 },
  ]
  const summary = summariseBalances(entries)
  assert.equal(summary.CASH,3499.50)
  assert.equal(summary.REWARD_CREDIT,200)
  assert.equal(summary.PROMOTIONAL,0)
})

test('ledger entries require a reason', () => {
  assert.throws(() => ledgerEntrySchema.parse({ balanceType:'CASH', entryType:'CREDIT', amount:100, reason:'' }), /at least 3|too small/i)
})