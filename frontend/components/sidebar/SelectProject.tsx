import React, { useEffect, useState, useCallback } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CreateNewProjectModal from '@/components/dashboard/CreateNewProjectModal';
import { useAuth } from '@clerk/nextjs';

interface Project {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  use_case?: string;
  model_type?: string;
  function?: string;
}

const MAX_PROJECTS = 150;

const SelectProject = ({ onProjectSelect }: { onProjectSelect: (project: Project) => void }) => {
  const { getToken } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch projects and set initial selection
  const fetchProjects = useCallback(async () => {
    try {
      const token = await getToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiBaseUrl}/projects/`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      const data: Project[] | null = await response.json();

      if (response.ok && data && data.length > 0) {
        setProjects(data);

        // Check if a previously selected project exists in localStorage
        const savedProjectId = localStorage.getItem('selectedProject');
        if (savedProjectId && data.find((project) => project.id === savedProjectId)) {
          setSelectedValue(savedProjectId);
          onProjectSelect(data.find((project) => project.id === savedProjectId)!); // Pass selected project to parent
        } else {
          const lastProject = data[data.length - 1];
          setSelectedValue(lastProject.id);
          localStorage.setItem('selectedProject', lastProject.id);
          onProjectSelect(lastProject); // Pass last project to parent
        }
      } else {
        setProjects([]);
        setIsModalOpen(true);
      }

      setLoading(false); // Finish loading
    } catch (error) {
      console.error('Failed to fetch projects');
      setLoading(false);
      setIsModalOpen(true); // Open modal in case of fetch failure and no projects
    }
  }, [getToken, onProjectSelect]);

  // Now including fetchProjects in the dependency array to avoid eslint warning
  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]); // Adding fetchProjects as a dependency

  const handleSelect = (value: string) => {
    if (value === 'new-project') {
      setIsModalOpen(true);
    } else {
      setSelectedValue(value);
      localStorage.setItem('selectedProject', value);
      const selectedProject = projects.find((project) => project.id === value);
      if (selectedProject) {
        onProjectSelect(selectedProject); // Pass selected project to parent
      }
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  const handleProjectCreated = (newProject: Project) => {
    setProjects((prevProjects) => {
      const updatedProjects = [...prevProjects, newProject];
      const lastProject = updatedProjects[updatedProjects.length - 1];
      setSelectedValue(lastProject.id);
      localStorage.setItem('selectedProject', lastProject.id);
      onProjectSelect(lastProject); // Pass newly created project to parent
      return updatedProjects;
    });
    setIsModalOpen(false);
  };

  return (
    <div>
      <h2 className="text-lg font-semibold">Your Projects</h2>
      {!loading && projects.length > 0 ? (
        <Select value={selectedValue || ''} onValueChange={handleSelect}>
          <SelectTrigger className="select-trigger w-40 text-sm py-1">
            <SelectValue placeholder="Select a project" />
          </SelectTrigger>
          <SelectContent className="select-content text-sm">
            <SelectGroup>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id} className="select-item py-1 px-2">
                  <span>{project.name}</span>
                </SelectItem>
              ))}
              {projects.length < MAX_PROJECTS ? (
                <SelectItem value="new-project" className="select-item py-1 px-2">
                  <span>+ New Project</span>
                </SelectItem>
              ) : (
                <div className="text-xs text-red-500 p-2">
                  Max 10 project limit reached. Please delete one to create a new project.
                </div>
              )}
            </SelectGroup>
          </SelectContent>
        </Select>
      ) : (
        <p>Loading projects...</p>
      )}

      <CreateNewProjectModal
        isOpen={isModalOpen}
        onOpenChange={handleModalClose}
        onProjectCreated={handleProjectCreated}
      />
    </div>
  );
};

export default SelectProject;
