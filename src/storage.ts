import type { Address, Hex } from 'viem';
import { capsules } from './data';

export type Stamp = {
  version: 1;
  collection: 'wheel-archive-exhibition';
  capsuleId: number;
  address: Address;
  chainId: number;
  createdAt: string;
  message: string;
  signature: Hex;
};
export const SAVED_KEY = 'wheel-archive:saved:v1';
export const STAMPS_KEY = 'wheel-archive:stamps:v1';

export function readSaved(): number[] {
  try { const data: unknown = JSON.parse(localStorage.getItem(SAVED_KEY) ?? '[]'); return Array.isArray(data) ? data.filter((id): id is number => typeof id === 'number' && capsules.some(c => c.id === id)) : []; } catch { return []; }
}
export function readStamps(): Stamp[] {
  try {
    const data: unknown = JSON.parse(localStorage.getItem(STAMPS_KEY) ?? '[]');
    if (!Array.isArray(data)) return [];
    return data.filter((s): s is Stamp => s && s.version === 1 && s.collection === 'wheel-archive-exhibition' && capsules.some(c => c.id === s.capsuleId) && /^0x[\da-f]{40}$/i.test(s.address) && /^0x[\da-f]+$/i.test(s.signature) && typeof s.message === 'string' && typeof s.chainId === 'number' && typeof s.createdAt === 'string' && !Number.isNaN(Date.parse(s.createdAt)));
  } catch { return []; }
}
export function persist(key: string, value: unknown): boolean {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; } catch { return false; }
}
export function downloadJson(value: unknown, filename: string) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value, null, 2) + '\n'], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = filename; document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
