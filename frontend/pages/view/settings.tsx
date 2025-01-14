import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { useProject } from '@/context/ProjectContext';
import DeleteProjectDialog from '@/components/dashboard/delete-project/DeleteProjectDialog';
import Layout from '@/components/sidebar/Layout';
import DescriptionInput from '@/components/dashboard/new-project-modal/DescriptionInput';
import IndustryInput from '@/components/dashboard/new-project-modal/IndustryInput';
import UseCaseInput from '@/components/dashboard/new-project-modal/UseCaseInput';
import ModelTypeInput from '@/components/dashboard/new-project-modal/ModelTypeInput';
import ProjectNameInput from "@/components/dashboard/new-project-modal/ProjectNameInput";
import FunctionCard from "@/components/dashboard/new-project-modal/FunctionInput";
import { Button } from "@/components/ui/button";
import { MdDeleteOutline } from "react-icons/md";
import { PermissionCheck, PermissionCheckComponent } from '@/components/PermissionCheck';
import ProjectUsersDropdown from '@/components/settings/ProjectUsersDropdown';

const Settings = () => {
  const { getToken } = useAuth();
  const { selectedProject } = useProject();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<any>(null);
  const [isChanged, setIsChanged] = useState(false);

  // Form state for editable fields
  const [updatedFields, setUpdatedFields] = useState({
    description: '',
    industry: '',
    use_case: '',
    model_type: '',
  });

  useEffect(() => {
    const fetchProjectDetails = async () => {
      try {
        const token = await getToken();
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

        const response = await fetch(`${apiBaseUrl}/projects/${selectedProject?.id}`, {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        const data = await response.json();
        if (response.ok) {
          setProject(data);
          setUpdatedFields({
            description: data.description || '',
            industry: data.industry || '',
            use_case: data.use_case || '',
            model_type: data.model_type || '',
          });
        } else {
          console.error('Failed to fetch project details');
        }
      } catch (error) {
        console.error('Error fetching project details:');
      } finally {
        setLoading(false);
      }
    };

    if (selectedProject) {
      fetchProjectDetails();
    }
  }, [selectedProject, getToken]);

  const handleInputChange = (name: string, value: string) => {
    setUpdatedFields((prevData) => ({ ...prevData, [name]: value }));
    setIsChanged(true); // Enable Save button when a change is detected
  };

  const handleSave = async () => {
    try {
      const token = await getToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiBaseUrl}/projects/${selectedProject?.id}`, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFields),
      });

      if (response.ok) {
        setIsChanged(false);
        window.location.reload();
      } else {
        console.error('Failed to update project');
      }
    } catch (error) {
      console.error('Error updating project:');
    }
  };

  const handleDeleteProjectSuccess = () => {
    setProject(null);
    window.location.reload();
  };

  return (
    <Layout>
      <PermissionCheck allowedPermissions={[0, 1]}>
        <div className="flex items-start justify-center min-h-screen overflow-auto">
          {loading ? (
            <p>Loading project details...</p>
          ) : project ? (
            <div>
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-semibold">Project Settings</h3>

                <ProjectUsersDropdown projectId={selectedProject?.id || ''} />
              </div>
              {/* Project Name (non-editable) */}
              <div className="mt-4">
                <h4 className="font-semibold">Project Name:</h4>
                <ProjectNameInput
                  value={project.name}
                  onChange={() => { }} // Disable change
                  disabled // Add disabled property to disable the input
                />
              </div>

              {/* Description */}
              <div className="mt-4">
                <h4 className="font-semibold">Description:</h4>
                <DescriptionInput
                  value={updatedFields.description}
                  onChange={(value) => handleInputChange("description", value)}
                />
              </div>

              {/* Industry */}
              <div className="mt-4">
                <h4 className="font-semibold">Industry:</h4>
                <IndustryInput
                  value={updatedFields.industry}
                  onChange={(value) => handleInputChange("industry", value)}
                />
              </div>

              {/* Use Case */}
              <div className="mt-4">
                <h4 className="font-semibold">Use Case:</h4>
                <UseCaseInput
                  value={updatedFields.use_case}
                  onChange={(value) => handleInputChange("use_case", value)}
                />
              </div>

              {/* Model Type */}
              <div className="mt-4">
                <h4 className="font-semibold">Model Type:</h4>
                <ModelTypeInput
                  value={updatedFields.model_type}
                  onChange={(value) => handleInputChange("model_type", value)}
                />
              </div>

              {/* Function (non-editable) */}
              <div className="mt-4">
                <h4 className="font-semibold">Function:</h4>
                <FunctionCard
                  selectedOption={project.function}
                  onSelect={() => { }}
                  disabled
                />
              </div>

              {/* Save Button */}
              {isChanged && (
                <Button
                  variant="outline"
                  className="mt-4 p-2"
                  onClick={handleSave}
                >
                  Save Changes
                </Button>
              )}

              {/* Delete Project Button */}
              <PermissionCheckComponent allowedPermissions={[0]}>
                <div className="flex justify-end mt-8">
                  <Button
                    variant="destructive"
                    onClick={() => setIsDeleteDialogOpen(true)}
                    className="flex items-center"
                  >
                    <MdDeleteOutline className="mr-2" size={20} />
                    Delete Project
                  </Button>

                  <DeleteProjectDialog
                    isOpen={isDeleteDialogOpen}
                    onOpenChange={setIsDeleteDialogOpen}
                    projectId={selectedProject?.id || ''}
                    projectName={project.name}
                    onDeleteSuccess={handleDeleteProjectSuccess}
                  />
                </div>
              </PermissionCheckComponent>
            </div>
          ) : (
            <p>No project selected or project not found</p>
          )}
        </div>
      </PermissionCheck>
    </Layout>
  );
};

export default Settings;