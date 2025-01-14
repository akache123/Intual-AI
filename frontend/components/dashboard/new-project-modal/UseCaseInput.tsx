import React, { useState } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { IoMdArrowDropdown } from "react-icons/io";

interface UseCaseInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const UseCaseInput: React.FC<UseCaseInputProps> = ({ value, onChange }) => {
  const [selectedUseCase, setSelectedUseCase] = useState(value);

  const handleSelect = (useCase: string) => {
    setSelectedUseCase(useCase);
    onChange(useCase);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-between w-full py-2 px-3 border rounded">
        <span>{selectedUseCase || "Select Use Case"}</span>
        <IoMdArrowDropdown />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleSelect("Research")}>Research</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("Teaching")}>Teaching</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("Production")}>Production</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("Licensing")}>Licensing</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UseCaseInput;
