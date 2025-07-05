import React, { useRef, useState } from 'react';
import { Upload, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface FileUploadProps {
  onFilesChange: (files: File[]) => void;
  files: File[];
}

export const FileUpload: React.FC<FileUploadProps> = ({ onFilesChange, files }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'text/plain' || file.name.endsWith('.txt')
    );
    
    onFilesChange([...files, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter(
        file => file.type === 'text/plain' || file.name.endsWith('.txt')
      );
      onFilesChange([...files, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    onFilesChange(newFiles);
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <Card
        className={`border-2 border-dashed transition-all duration-200 ${
          dragActive 
            ? 'border-primary bg-accent/50 shadow-soft' 
            : 'border-border hover:border-primary/50 bg-card'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div className="p-8 text-center">
          <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-lg font-medium text-foreground mb-2">
            Drop your .txt files here
          </p>
          <p className="text-muted-foreground mb-4">
            or click to browse your files
          </p>
          <Button onClick={openFileDialog} variant="outline">
            Select Files
          </Button>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept=".txt,text/plain"
        onChange={handleFileSelect}
        className="hidden"
      />

      {files.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-medium text-foreground">Uploaded Files:</h3>
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-secondary rounded-lg border"
            >
              <span className="text-secondary-foreground text-sm font-medium">
                {file.name}
              </span>
              <Button
                onClick={() => removeFile(index)}
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 hover:bg-destructive/10 hover:text-destructive"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};