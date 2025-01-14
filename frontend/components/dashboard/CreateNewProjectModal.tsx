import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/nextjs";
import ProjectNameInput from "@/components/dashboard/new-project-modal/ProjectNameInput";
import DescriptionInput from "@/components/dashboard/new-project-modal/DescriptionInput";
import IndustryInput from "@/components/dashboard/new-project-modal/IndustryInput";
import UseCaseInput from "@/components/dashboard/new-project-modal/UseCaseInput";
import ModelTypeInput from "@/components/dashboard/new-project-modal/ModelTypeInput";
import FunctionCard from "@/components/dashboard/new-project-modal/FunctionInput";

interface Project {
  id: string;
  name: string;
  description?: string;
  industry?: string;
  use_case?: string;
  model_type?: string;
  function?: string;
}


interface CreateNewProjectModalProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  onProjectCreated: (project: Project) => void;

}

const CreateNewProjectModal: React.FC<CreateNewProjectModalProps> = ({ isOpen, onOpenChange, onProjectCreated }) => {
  const { getToken } = useAuth(); // Use Clerk's getToken to get JWT token
  const [formData, setFormData] = React.useState({
    name: "",
    description: "",
    industry: "",
    use_case: "",
    model_type: "",
    function: ""
  });
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleInputChange = (name: string, value: string) => {
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  const handleFunctionSelect = (value: string) => {
    handleInputChange("function", value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const isFormValid = Object.values(formData).every((value) => value.trim() !== "");
    if (!isFormValid) {
      setError("Please fill in all fields.");
      setLoading(false);
      return;
    }

    try {
      const token = await getToken();
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL;

      const response = await fetch(`${apiBaseUrl}/projects/`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to create project");
      }

      const newProject = await response.json();

      onProjectCreated(newProject);

      onOpenChange(false);

      window.location.reload();
    } catch (error) {
      setError(error instanceof Error ? error.message : "An unknown error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[80vw] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>Fill out the details to create a new project.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <ProjectNameInput value={formData.name} onChange={(value) => handleInputChange("name", value)} />
          <DescriptionInput value={formData.description} onChange={(value) => handleInputChange("description", value)} />
          <IndustryInput value={formData.industry} onChange={(value) => handleInputChange("industry", value)} />
          <UseCaseInput value={formData.use_case} onChange={(value) => handleInputChange("use_case", value)} />
          <div className="flex justify-center items-center">
            <div className="space-y-2">
              <h2 className="text-lg font-semibold">Model Type</h2>
              <ModelTypeInput value={formData.model_type} onChange={(value) => handleInputChange("model_type", value)} />
            </div>
          </div>
          <div className="flex justify-center items-center">
            <div className="space-y-2 mt-4">
              <h2 className="text-lg font-semibold">Function</h2>
              <FunctionCard selectedOption={formData.function} onSelect={handleFunctionSelect} />
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <Button type="button" onClick={() => onOpenChange(false)} variant="outline">
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create Project"}
            </Button>
          </div>
          {error && <p className="text-red-500 text-center">{error}</p>}
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CreateNewProjectModal;
