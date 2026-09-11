import type { Config } from '@netlify/functions'
import { desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../../db/index.js'
import { walletLedgerEntries, walletTransactions, wallets } from '../../db/schema.js'
import { appUserForIdentity, audit, badRequest, json, methodGuard, readJson, requireAuthenticated, serverError, unauthorised } from './_lib/api.mts'
import { ledgerEntrySchema, entryDirection, summariseBalances } from '../../src/lib/wallet'
import type { WalletBalanceType, WalletEntryType } from '../../src/lib/domain'

const submitSchema = ledgerEntrySchema

export default async (request:Request) => {
  const guard = methodGuard(request,['GET','POST'])
  if (guard) return guard
  const auth = await requireAuthenticated(request)
  if ('error' in auth) return auth.error
  try {
    const appUser = await appUserForIdentity(auth.auth.identityId)
    if (!appUser) return unauthorised('Account record not provisioned yet')
    let [wallet] = await db.select().from(wallets).where(eq(wallets.userId,appUser.id)).limit(1)
    if (!wallet) {
      [wallet] = await db.insert(wallets).values({ userId:appUser.id }).returning()
    }
    if (request.method === 'GET') {
      const entries = await db.select().from(walletLedgerEntries).where(eq(walletLedgerEntries.walletId,wallet.id)).orderBy(desc(walletLedgerEntries.recordedAt)).limit(100)
      const summary = summariseBalances(entries.map((entry) => ({ balanceType:entry.balanceType as WalletBalanceType, entryType:entry.entryType as WalletEntryType, amount:entry.amount })))
      return json({ wallet:{ cashBalance:summary.CASH, promotionalBalance:summary.PROMOTIONAL, membershipCreditBalance:summary.MEMBERSHIP_CREDIT, rewardCreditBalance:summary.REWARD_CREDIT, currency:wallet.currency }, ledger:entries, note:'Balances are computed from the immutable ledger. Payment-provider top-ups activate once a provider is connected.' })
    }
    const parsed = await readJson(request,submitSchema.safeParse)
    if ('error' in parsed) return parsed.error
    if (!parsed.ok.success) return badRequest(parsed.ok.error.issues.map((issue) => issue.message).join(', '))
    const entry = parsed.ok.data
    const existing = await db.select({ balanceType:walletLedgerEntries.balanceType, entryType:walletLedgerEntries.entryType, amount:walletLedgerEntries.amount }).from(walletLedgerEntries).where(eq(walletLedgerEntries.walletId,wallet.id))
    const balances = summariseBalances(existing.map((row) => ({ balanceType:row.balanceType as WalletBalanceType, entryType:row.entryType as WalletEntryType, amount:row.amount })))
    const current = balances[entry.balanceType as WalletBalanceType] ?? 0
    const direction = entryDirection(entry.entryType)
    const next = entryDirection(entry.entryType) === 'decrease' ? Math.round((current - entry.amount)*100)/100 : Math.round((current + entry.amount)*100)/100
    if (next < 0) return badRequest(`Insufficient balance for this ${entry.entryType.toLowerCase()}`)
    const reference = `WLT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2,6).toUpperCase()}`
    const [ledgerEntry] = await db.insert(walletLedgerEntries).values({ walletId:wallet.id, balanceType:entry.balanceType, entryType:entry.entryType, amount:entry.amount.toFixed(2), runningBalance:next.toFixed(2), reason:entry.reason, bookingId:entry.bookingId ?? null, metadata:entry.metadata }).returning()
    await db.insert(walletTransactions).values({ walletId:wallet.id, balanceType:entry.balanceType, transactionType:entry.entryType, amount:entry.amount.toFixed(2), reference, status:'COMPLETED', metadata:entry.metadata })
    await audit({ actorId:appUser.id, action:'wallet.ledger.append', targetType:'wallet', targetId:wallet.id, after:{ balanceType:entry.balanceType, entryType:entry.entryType, amount:entry.amount, reason:entry.reason }, request })
    return json({ entry:ledgerEntry, reference },{ status:201 })
  } catch (error) { return serverError('wallet',error) }
}

export const config:Config = { path:'/api/wallet' }