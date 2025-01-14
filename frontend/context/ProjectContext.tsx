// context/ProjectContext.tsx
import React, { createContext, useState, useContext, ReactNode } from 'react';

interface Project {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  use_case?: string;
  model_type?: string;
  function?: string;
}

interface ProjectContextProps {
  selectedProject: Project | null;
  setSelectedProject: (project: Project) => void;
}

const ProjectContext = createContext<ProjectContextProps | undefined>(undefined);

export const useProject = () => {
  const context = useContext(ProjectContext);
  if (!context) {
    throw new Error('useProject must be used within a ProjectProvider');
  }
  return context;
};

interface ProjectProviderProps {
  children: ReactNode;
}

export const ProjectProvider: React.FC<ProjectProviderProps> = ({ children }) => {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  return (
    <ProjectContext.Provider value={{ selectedProject, setSelectedProject }}>
      {children}
    </ProjectContext.Provider>
  );
};
