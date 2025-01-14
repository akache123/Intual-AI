// pages/_app.tsx
import '@/styles/globals.css';
import type { AppProps } from "next/app";
import { ClerkProvider } from '@clerk/clerk-react';
import ProfileAvatar from '@/components/ProfileAvatar';
import { ThemeProvider } from 'next-themes';
import { useEffect, useState } from 'react';
import { ModeToggle } from '@/components/ModeToggle';
import { ProjectProvider } from '@/context/ProjectContext';
import { ProjectDetailsProvider } from '@/components/ProjectDetailsFetcher';

function MyApp({ Component, pageProps }: AppProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <ProjectProvider>

      <ThemeProvider attribute="class" defaultTheme="system" enableSystem={true} disableTransitionOnChange>
        <ClerkProvider {...pageProps} publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}>

          <ProjectDetailsProvider>

            <div className="fixed top-0 right-0 z-10 p-4">
              <ProfileAvatar />
            </div>
            <h1>
              IntualAI
            </h1>
            <div className="fixed bottom-0 right-0 z-10 p-4">
              <ModeToggle />
            </div>
            <Component {...pageProps} />

          </ProjectDetailsProvider>

        </ClerkProvider>
      </ThemeProvider>

    </ProjectProvider>

  );
}

export default MyApp;
