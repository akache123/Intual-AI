import React from "react";
import { Input } from "@/components/ui/input";

interface DescriptionInputProps {
  value: string;
  onChange: (value: string) => void;

}

const DescriptionInput: React.FC<DescriptionInputProps> = ({ value, onChange }) => {
  return (
    <Input
      type="text"
      placeholder="Description"
      value={value}
      maxLength={100}
      onChange={(e) => onChange(e.target.value)}
      required
    />
  );
};

export default DescriptionInput;
