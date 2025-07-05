import React from 'react';
import { Loader } from 'lucide-react';

export const ProcessingLoader: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-6">
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-gradient-primary opacity-20 animate-pulse-soft"></div>
        <div className="relative bg-primary/10 rounded-full p-6">
          <Loader className="h-8 w-8 text-primary animate-spin" />
        </div>
      </div>
      
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">
          Processing with Azure OpenAI
        </h3>
        <p className="text-muted-foreground">
          This may take a few moments...
        </p>
      </div>
      
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 bg-primary rounded-full animate-pulse"
            style={{
              animationDelay: `${i * 0.3}s`,
              animationDuration: '1.4s'
            }}
          />
        ))}
      </div>
    </div>
  );
};