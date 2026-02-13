
import { Priority, Status, Role } from './types';

export const COLORS = {
  NEON_BLUE: '#00E5FF',
  DEEP_BLACK: '#000000',
  STARK_WHITE: '#FFFFFF',
};

export const STATUS_COLORS: Record<Status, string> = {
  [Status.OPEN]: 'bg-blue-500/20 text-blue-400 border-blue-500/50',
  [Status.IN_PROGRESS]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50',
  [Status.BLOCKED]: 'bg-red-500/20 text-red-400 border-red-500/50',
  [Status.DONE]: 'bg-green-500/20 text-green-400 border-green-500/50',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  [Priority.LOW]: 'text-gray-400',
  [Priority.MEDIUM]: 'text-blue-300',
  [Priority.HIGH]: 'text-orange-400',
  [Priority.CRITICAL]: 'text-red-500 font-bold animate-pulse',
};

export const AUTHORIZED_AGENTS = [
  'AGT-101',
  'AGT-102',
  'AGT-103',
  'AGT-104',
  'AGT-105',
  'AGT-106',
  'AGT-107',
  'AGT-108',
  'AGT-109',
  'AGT-110'
];

export const CACHE_TIME = 5 * 60 * 1000; // 5 minutes
