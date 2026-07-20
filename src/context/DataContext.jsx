import { createContext, useState, useEffect, useCallback } from 'react';
import { hydrateStore, subscribeToRealtime, reloadFromSupabase } from '../utils/supabaseSync';
import { isCacheHydrated } from '../utils/dataCache';

const DataContext = createContext({ ready: false, refresh: () => {} });

export { DataContext };

export function DataProvider({ children }) {
  const [ready, setReady] = useState(isCacheHydrated());
  const [version, setVersion] = useState(0);

  const refresh = useCallback(async () => {
    await reloadFromSupabase();
    setVersion((v) => v + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    hydrateStore().then(() => {
      if (!cancelled) setReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!ready) return undefined;
    const onRefresh = () => {
      reloadFromSupabase().then(() => setVersion((v) => v + 1));
    };
    window.addEventListener('profinder-refresh', onRefresh);
    const unsub = subscribeToRealtime(onRefresh);
    return () => {
      window.removeEventListener('profinder-refresh', onRefresh);
      unsub();
    };
  }, [ready]);

  return (
    <DataContext.Provider value={{ ready, refresh, version }}>
      {children}
    </DataContext.Provider>
  );
}
