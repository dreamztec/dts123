import type { User } from '@netlify/identity'
import type { UserRole } from './domain'

export function hasRole(user:User | null,allowed:UserRole[]) { return Boolean(user && allowed.some((role) => user.roles?.includes(role))) }
export function requireRole(user:User | null,allowed:UserRole[]) { if (!hasRole(user,allowed)) throw new Error('Insufficient permissions'); return user as User }
