import { useEffect, useState } from 'react'

/** Tracks browser online state and announces reconnects via `tongpin:reconnected`. */
export function useOnlineStatus() {
  const [online, setOnline] = useState(() => navigator.onLine)
  useEffect(() => {
    const up = () => {
      setOnline(true)
      // Data listeners elsewhere (auth sync, feed) resync on this event.
      window.dispatchEvent(new CustomEvent('tongpin:reconnected'))
    }
    const down = () => setOnline(false)
    addEventListener('online', up)
    addEventListener('offline', down)
    return () => { removeEventListener('online', up); removeEventListener('offline', down) }
  }, [])
  return online
}
