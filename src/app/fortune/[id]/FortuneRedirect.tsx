'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function FortuneRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/?open=fortune');
  }, [router]);

  return null;
}
