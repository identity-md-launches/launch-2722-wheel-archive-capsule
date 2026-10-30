import type { CSSProperties } from 'react';
export function Icon({ name, size = 20, style }: { name: string; size?: number; style?: CSSProperties }) {
  const paths: Record<string, React.ReactNode> = {
    archive: <><rect x="4" y="9" width="16" height="11" rx="2"/><path d="M3 4h18v5H3zM9 13h6"/></>,
    stamp: <><path d="M9 4a3 3 0 0 1 6 0c0 2-1 3-1 5v2l4 3v3H6v-3l4-3V9c0-2-1-3-1-5ZM5 21h14"/></>,
    bookmark: <path d="M6 4h12v17l-6-4-6 4z"/>,
    arrow: <path d="M5 12h14m-6-6 6 6-6 6"/>,
    diagonal: <path d="M6 18 18 6M6 6h12v12"/>,
    search: <><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/></>,
    down: <path d="m7 10 5 5 5-5"/>,
    close: <path d="m6 6 12 12M6 18 18 6"/>,
    check: <path d="m5 12 4 4L19 6"/>,
    info: <><circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v1"/></>,
    wallet: <><path d="M20 8V5H5a2 2 0 0 0-2 2v12h18V8H5a2 2 0 0 1 0-4"/><path d="M21 12h-6v4h6"/></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5"/></>,
    copy: <><rect x="8" y="8" width="12" height="13" rx="2"/><path d="M16 8V3H3v13h5"/></>,
    sun: <><circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/></>,
    back: <path d="M19 12H5m6-6-6 6 6 6"/>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" style={style}>{paths[name] ?? paths.archive}</svg>;
}

export function WheelMark({ size = 34 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 40 40" fill="none" aria-hidden="true"><g stroke="currentColor" strokeWidth="1.5"><circle cx="20" cy="20" r="17"/><circle cx="20" cy="20" r="7"/>{Array.from({ length: 12 }, (_, i) => <path key={i} d="M20 3v10" transform={`rotate(${i * 30} 20 20)`}/>)}</g></svg>;
}
