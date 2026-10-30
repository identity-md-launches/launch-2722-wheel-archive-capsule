declare module '*archive-core.js' {
  export const API: string;
  export const RANGES: readonly ['24h', '7d', '30d'];
  export const TX_EXPLORER: string;
  export type Range = '24h' | '7d' | '30d';
  export type Capsule = { round: string; block: string; work: number; blocks: number; tx: string };
  export type WheelStatus = { coreStatus: string | null; rpmMilli: number | null; cumulativeWorkUnits: number | null; blockHeight: string | null; blockProgress: number | null; workPerThousandBlocks: number | null; settledThroughRound: string | null };
  export type Archive = { capsules: Capsule[]; summary: Record<string, unknown> };
  export function fetchAPI(path: string, signal?: AbortSignal): Promise<unknown>;
  export function readStatus(payload: unknown): WheelStatus;
  export function readEconomy(payload: unknown): string;
  export function readSettlements(payload: unknown): Archive;
  export function forming(status: WheelStatus | null): { progress: number | null; remaining: number | null; state: 'Running' | 'Asleep' | 'Unknown' };
  export function hashBytes(transactionHash: string): number[];
  export function sealSVG(capsule: Capsule): string;
  export function capsuleLine(capsule: Capsule): string;
  export function summaryLine(summary: Record<string, unknown>): string;
  export function formatNumber(value: number | string | null | undefined): string;
}
