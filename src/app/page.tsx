'use client';

import { useEffect, useState } from 'react';
import type { AppId } from './config';
import { OsShell } from './OsShell';

export default function Home() {
  const [initialAppId, setInitialAppId] = useState<AppId>();

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('open') === 'fortune') {
      setInitialAppId('fortune');
    }
  }, []);

  return <OsShell initialAppId={initialAppId} />;
}
