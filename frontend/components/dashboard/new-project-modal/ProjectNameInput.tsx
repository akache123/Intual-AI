import React from "react";
import { Input } from "@/components/ui/input";

interface ProjectNameInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

const ProjectNameInput: React.FC<ProjectNameInputProps> = ({ value, onChange, disabled }) => {
  return (
    <Input
      type="text"
      placeholder="Project Name"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      maxLength={25}
      required
      disabled={disabled}
    />
  );
};

export default ProjectNameInput;
