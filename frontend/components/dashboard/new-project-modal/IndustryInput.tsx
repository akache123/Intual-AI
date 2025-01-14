import React, { useState } from "react";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { IoMdArrowDropdown } from "react-icons/io";

interface IndustryInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const IndustryInput: React.FC<IndustryInputProps> = ({ value, onChange }) => {
  const [selectedIndustry, setSelectedIndustry] = useState(value);

  const handleSelect = (industry: string) => {
    setSelectedIndustry(industry);
    onChange(industry);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center justify-between w-full py-2 px-3 border rounded">
        <span>{selectedIndustry || "Select Industry"}</span>
        <IoMdArrowDropdown />
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => handleSelect("Education")}>Education</DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleSelect("Entrepreneurial")}>Entrepreneurial</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default IndustryInput;
