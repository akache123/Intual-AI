// /pages/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { useUser } from '@clerk/clerk-react';

export default function Home() {
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  return (
    <h2>
      Landing Page
    </h2>
  );
}
