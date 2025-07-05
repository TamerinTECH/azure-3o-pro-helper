import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

interface ResultDisplayProps {
  result: string;
  onDownload: () => void;
  onReset: () => void;
}

export const ResultDisplay: React.FC<ResultDisplayProps> = ({ 
  result, 
  onDownload, 
  onReset 
}) => {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-foreground">
          Processing Result
        </h2>
        <div className="flex space-x-2">
          <Button onClick={onDownload} variant="outline">
            Download as TXT
          </Button>
          <Button onClick={onReset} variant="secondary">
            Process Another
          </Button>
        </div>
      </div>
      
      <Card className="bg-card shadow-soft">
        <ScrollArea className="h-96 w-full">
          <div className="p-6">
            <pre className="whitespace-pre-wrap text-sm text-card-foreground font-mono leading-relaxed">
              {result}
            </pre>
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};