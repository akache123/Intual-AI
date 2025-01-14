import React, { useState, useEffect } from 'react';
import Sidebar from '@/components/sidebar/Sidebar';
import SelectProject from '@/components/sidebar/SelectProject';
import { useProject } from '@/context/ProjectContext';
import { IoMenu } from 'react-icons/io5';
import { Sheet, SheetTrigger, SheetContent, SheetClose } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { setSelectedProject } = useProject();
  const [isMobile, setIsMobile] = useState(false);

  // Detect if the screen is mobile-sized
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    handleResize(); // Call on mount
    window.addEventListener('resize', handleResize); // Listen to resize events

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="flex h-screen">
      {/* Sidebar for larger screens */}
      {!isMobile ? (
        <div className="w-64 bg-card text-card-foreground flex flex-col sidebar-border top-border">
          <div className="p-4">
            <SelectProject onProjectSelect={setSelectedProject} />
          </div>
          <div className="flex-1 overflow-y-auto">
            <Sidebar />
          </div>
        </div>
      ) : (
        // Sliding menu for mobile screens
        <div className="p-4">
          <Sheet>
            <SheetTrigger asChild>
              <button
                className="p-2 fixed top-12 left-1"
              >
                <IoMenu size={20} />
              </button>
            </SheetTrigger>
            <SheetContent side="left">
              <div className="p-4">
                <SelectProject onProjectSelect={setSelectedProject} />
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}

      {/* Main Content */}
      <div className="flex flex-col flex-1 top-border">
        <div className="mt-4 p-4">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Layout;
