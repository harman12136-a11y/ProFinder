import { useEffect, useState } from 'react';
import { subscribeMessages, MESSAGES_KEY } from '../utils/storage';

export function useMessageSync() {
  const [syncKey, setSyncKey] = useState(0);

  useEffect(() => {
    const bump = () => setSyncKey((n) => n + 1);
    const unsubscribe = subscribeMessages(bump);
    const onStorage = (e) => {
      if (e.key === MESSAGES_KEY) bump();
    };
    window.addEventListener('storage', onStorage);
    return () => {
      unsubscribe();
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  return syncKey;
}
