import { useEffect, useState, type Dispatch, type SetStateAction } from 'react';
import { fetchAPI, readStatus, readEconomy, readSettlements, type Archive, type Range, type WheelStatus } from '../public/archive-core.js';
type Snapshot<T> = { data: T | null; updated: Date | null; unavailable: boolean };
const empty = <T,>(): Snapshot<T> => ({ data: null, updated: null, unavailable: false });
export function useFeed(range: Range) {
  const [status, setStatus] = useState(empty<WheelStatus>), [supply, setSupply] = useState(empty<string>);
  const [archive, setArchive] = useState(empty<Archive & { range: Range }>);
  const [refreshing, setRefreshing] = useState(true), [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    async function update<T>(path: string, parse: (payload: unknown) => T, set: Dispatch<SetStateAction<Snapshot<T>>>) {
      const request = new AbortController(), timeout = setTimeout(() => request.abort(), 12000);
      const abort = () => request.abort();
      controller.signal.addEventListener('abort', abort, { once: true });
      try {
        const data = parse(await fetchAPI(path, request.signal));
        if (!controller.signal.aborted) set({ data, updated: new Date(), unavailable: false });
      } catch { if (!controller.signal.aborted) set(previous => ({ ...previous, unavailable: true })); }
      finally { clearTimeout(timeout); controller.signal.removeEventListener('abort', abort); }
    }
    async function refresh() {
      setRefreshing(true);
      await Promise.all([update('/status', readStatus, setStatus), update('/economy/state', readEconomy, setSupply), update(`/settlements?range=${range}`, payload => ({ ...readSettlements(payload), range }), setArchive)]);
      if (!controller.signal.aborted) { setRefreshing(false); timer = setTimeout(refresh, 15000); }
    }
    void refresh();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [range, revision]);
  return { status, supply, archive, refreshing, refresh: () => setRevision(value => value + 1) };
}
