import * as React from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";

interface ModelTypeInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const modelOptions = [
  {
    value: "openai-gpt-4o-mini",
    title: "OpenAI GPT-4o-mini",
    description: "A compact model optimized for lower resource usage while maintaining core functionalities.",
  },
  {
    value: "openai-gpt-4o",
    title: "OpenAI GPT-4o",
    description: "The full GPT-4o model offering advanced capabilities and a wider range of functionalities.",
  },
];

const ModelTypeInput: React.FC<ModelTypeInputProps> = ({ value, onChange }) => {
  return (
    <div className="flex space-x-4">
      {modelOptions.map((option) => (
        <Card
          key={option.value}
          onClick={() => onChange(option.value)}
          className={`w-[200px] h-[250px] p-4 cursor-pointer ${value === option.value ? 'border-2 border-blue-500' : 'border'}`}
        >
          <CardHeader>
            <div>
              <CardTitle className="text-sm font-medium">{option.title}</CardTitle>
              <CardDescription className="text-xs text-gray-600">{option.description}</CardDescription>
            </div>
          </CardHeader>
          <CardContent>
          </CardContent>
          <CardFooter>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
};

export default ModelTypeInput;
