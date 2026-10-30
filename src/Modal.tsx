import { useEffect, useRef, type ReactNode } from 'react';
import { Icon } from './Icons';

export function Modal({ title, children, onClose, className = '' }: { title: string; children: ReactNode; onClose: () => void; className?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const dialog = ref.current!;
    const trigger = document.activeElement as HTMLElement | null;
    dialog.showModal();
    const cancel = (event: Event) => { event.preventDefault(); closeRef.current(); };
    const trapFocus = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;
      const controls = [...dialog.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), [tabindex="0"]')].filter(el => el.getClientRects().length > 0);
      const first = controls[0], last = controls[controls.length - 1];
      if (!first) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || !dialog.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || !dialog.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
    };
    dialog.addEventListener('cancel', cancel);
    dialog.addEventListener('keydown', trapFocus);
    return () => { dialog.removeEventListener('cancel', cancel); dialog.removeEventListener('keydown', trapFocus); dialog.close(); if (trigger?.isConnected) trigger.focus(); };
  }, []);
  return <dialog ref={ref} className={`modal ${className}`} aria-labelledby="modal-title" onClick={e => { if (e.target === e.currentTarget) { const r = e.currentTarget.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) onClose(); } }}>
    <div className="modal-heading"><h2 id="modal-title">{title}</h2><button type="button" className="icon-button" aria-label={`Close ${title}`} onClick={onClose}><Icon name="close"/></button></div>
    {children}
  </dialog>;
}
