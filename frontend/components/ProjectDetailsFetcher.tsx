// components/ProjectDetailsFetcher.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useProject } from '@/context/ProjectContext';

interface ProjectDetailsContextType {
  function: string;
}

const ProjectDetailsContext = createContext<ProjectDetailsContextType | null>(null);

export const ProjectDetailsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { selectedProject } = useProject();
  const { getToken } = useAuth();
  const [projectDetails, setProjectDetails] = useState<ProjectDetailsContextType | null>(null);

  useEffect(() => {
    const fetchProjectDetails = async () => {
      if (!selectedProject) return;

      try {
        const token = await getToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        const response = await fetch(`${apiBaseUrl}/projects/${selectedProject.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        if (response.ok) {
          const data = await response.json();
          setProjectDetails(data);
        } else {
          console.error('Failed to fetch project details');
        }
      } catch (error) {
        console.error('Error fetching project details');
      }
    };

    fetchProjectDetails();
  }, [selectedProject, getToken]);

  return (
    <ProjectDetailsContext.Provider value={projectDetails}>
      {children}
    </ProjectDetailsContext.Provider>
  );
};

export const useProjectDetails = () => {
  return useContext(ProjectDetailsContext);
};
