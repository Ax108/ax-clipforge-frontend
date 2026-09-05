import {useCallback, useRef, useState} from 'react';
import type {ToastMessage} from '../types';

export function useToasts() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id));
  }, []);

  const toast = useCallback(
    (text: string, kind: ToastMessage['kind'] = 'info') => {
      const id = ++idRef.current;
      setToasts(t => [...t, {id, text, kind}]);
      setTimeout(() => dismiss(id), 2800);
    },
    [dismiss],
  );

  return {toasts, toast, dismiss};
}
