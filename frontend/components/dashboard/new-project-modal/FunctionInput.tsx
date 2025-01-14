import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface FunctionCardProps {
  selectedOption: string;
  onSelect: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
}

const options = [
  {
    value: "search-and-chat",
    title: "Search and Chat",
    description: "Utilize search functionality along with chat capabilities for enhanced interactions.",
  },
  {
    value: "application-ai",
    title: "ApplicationAI",
    description: "Integrate AI into your applications for things like onboarding!",
  },
];

const FunctionCard: React.FC<FunctionCardProps> = ({ selectedOption, onSelect, disabled }) => {
  return (
    <div className="flex space-x-4">
      {options.map((option) => (
        <Card
          key={option.value}
          onClick={() => {
            if (!disabled) {
              onSelect(option.value);
            }
          }}
          className={`w-[200px] h-[250px] p-4 cursor-pointer ${selectedOption === option.value ? 'border-2 border-blue-500' : 'border'} ${disabled ? 'opacity-50 cursor-not-allowed' : ''
            }`}
        >
          <CardHeader>
            <div>
              <CardTitle className="text-sm">{option.title}</CardTitle>
              <CardDescription className="text-xs">{option.description}</CardDescription>
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
};

export default FunctionCard;
