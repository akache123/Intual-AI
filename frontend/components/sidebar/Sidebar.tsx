// components/Sidebar.tsx
import React, { useState, useEffect } from 'react';
import { CiSettings, CiCreditCard1, CiSearch } from 'react-icons/ci';
import { LuLayoutDashboard } from "react-icons/lu";
import { IoChatbubbleOutline, IoGitNetworkOutline } from 'react-icons/io5';
import { LuFiles } from 'react-icons/lu';
import { LiaKeySolid } from 'react-icons/lia';
import { useRouter } from 'next/router';
import { useProject } from '@/context/ProjectContext';
import { PermissionCheck } from '@/components/PermissionCheck';
import { useProjectDetails } from '@/components/ProjectDetailsFetcher';

type TabType = 'dashboard' | 'settings' | 'chat' | 'files' | 'jobs' | 'apiKeys' | 'costAndUsage' | 'configure' | 'search';

const TabButton: React.FC<{
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
  return (
    <button
      className={`p-2 text-left rounded-md transition-colors duration-200 flex items-center ${isActive
        ? 'bg-primary text-primary-foreground'
        : 'text-secondary-foreground hover:bg-muted hover:text-muted-foreground'
        }`}
      onClick={onClick}
    >
      {icon}
      {label}
    </button>
  );
};

const Sidebar: React.FC = () => {
  const { selectedProject } = useProject();
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const router = useRouter();

  const projectDetails = useProjectDetails();
  const projectFunction = projectDetails?.function;

  useEffect(() => {
    if (router.pathname.includes('/view/settings')) {
      setActiveTab('settings');
    } else if (router.pathname.includes('/dashboard')) {
      setActiveTab('dashboard');
    }
  }, [router.pathname]);

  if (!selectedProject || !projectFunction) {
    return null;
  }

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    const routeMap: Record<TabType, string> = {
      dashboard: '/dashboard',
      settings: '/view/settings',
      chat: '/view/chat',
      files: '/view/files',
      jobs: '/view/jobs',
      apiKeys: '/view/api-keys',
      costAndUsage: '/view/cost-and-usage',
      configure: '/view/configure',
      search: '/view/search',
    };
    if (routeMap[tab]) {
      router.push(routeMap[tab]);
    }
  };

  const renderTab = (tab: TabType, label: string, icon: React.ReactNode, permissionCheck: number[] = []) => {
    if (permissionCheck.length > 0) {
      return (
        <PermissionCheck allowedPermissions={permissionCheck}>
          <TabButton
            icon={icon}
            label={label}
            isActive={activeTab === tab}
            onClick={() => handleTabChange(tab)}
          />
        </PermissionCheck>
      );
    }

    return (
      <TabButton
        icon={icon}
        label={label}
        isActive={activeTab === tab}
        onClick={() => handleTabChange(tab)}
      />
    );
  };

  const renderFunctionSpecificTabs = (projectFunction: string) => {
    switch (projectFunction) {
      case 'search-and-chat':
        return (
          <>
            {renderTab('search', 'Search', <CiSearch size={20} className="mr-2" />)}
            {renderTab('chat', 'Chat', <IoChatbubbleOutline size={20} className="mr-2" />)}
            {renderTab('files', 'Files', <LuFiles size={20} className="mr-2" />)}
            {renderTab('jobs', 'Jobs', <IoGitNetworkOutline size={20} className="mr-2" />)}
            {renderTab('apiKeys', 'API Keys', <LiaKeySolid size={20} className="mr-2" />, [0, 1])}
          </>
        );
      case 'application-ai':
        return (
          <>
            {renderTab('configure', 'Configure', <CiSettings size={20} className="mr-2" />)}
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-64 h-full p-4 flex flex-col justify-between bg-card text-card-foreground">
      <div className="flex-1">
        <div className="flex flex-col space-y-2">
          {renderTab('dashboard', 'Dashboard', <LuLayoutDashboard size={20} className="mr-2" />)}
          {renderFunctionSpecificTabs(projectFunction)}
          {renderTab('costAndUsage', 'Cost and Usage', <CiCreditCard1 size={20} className="mr-2" />, [0, 1])}
          {renderTab('settings', 'Settings', <CiSettings size={20} className="mr-2" />, [0, 1])}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
