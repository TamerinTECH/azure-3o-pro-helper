import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/FileUpload';
import { ProcessingLoader } from '@/components/ProcessingLoader';
import { ResultDisplay } from '@/components/ResultDisplay';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { useToast } from '@/hooks/use-toast';

interface AzureResponse {
  output: Array<{
    type: string;
    content?: Array<{
      type: string;
      text: string;
    }>;
  }>;
}

const Index = () => {
  const [inputText, setInputText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [endpoint, setEndpoint] = useState<string | null>(null);
  const { toast } = useToast();

  const handleApiKeySet = (key: string, endpointUrl: string) => {
    setApiKey(key);
    setEndpoint(endpointUrl);
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  const combineTextContent = async (): Promise<string> => {
    let combinedText = inputText;
    
    for (const file of files) {
      try {
        const fileContent = await readFileAsText(file);
        combinedText += `\n\n--- Content from ${file.name} ---\n${fileContent}`;
      } catch (error) {
        console.error(`Error reading file ${file.name}:`, error);
      }
    }
    
    return combinedText;
  };

  const processWithAzureOpenAI = async () => {
    if (!apiKey || !endpoint) {
      toast({
        title: "Configuration Missing",
        description: "Please configure your Azure OpenAI credentials first.",
        variant: "destructive"
      });
      return;
    }

    if (!inputText.trim() && files.length === 0) {
      toast({
        title: "No Content",
        description: "Please enter some text or upload files to process.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      const combinedInput = await combineTextContent();
      
      const response = await fetch(`${endpoint}/openai/v1/responses?api-version=preview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          model: 'o3-pro-2',
          input: combinedInput
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: AzureResponse = await response.json();
      
      // Extract text from the response
      let extractedText = '';
      data.output.forEach(item => {
        if (item.type === 'message' && item.content) {
          item.content.forEach(content => {
            if (content.type === 'output_text') {
              extractedText += content.text + '\n';
            }
          });
        }
      });

      setResult(extractedText || 'No text content found in response');
      
      toast({
        title: "Processing Complete",
        description: "Your content has been processed successfully!"
      });

    } catch (error) {
      console.error('Error processing with Azure OpenAI:', error);
      toast({
        title: "Processing Failed",
        description: "An error occurred while processing your request. Please check your configuration and try again.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadResult = () => {
    if (!result) return;
    
    const blob = new Blob([result], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `azure-openai-result-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const resetProcessing = () => {
    setResult(null);
    setInputText('');
    setFiles([]);
  };

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Azure OpenAI Text Processor
          </h1>
          <p className="text-muted-foreground">
            Upload files and enter text to process with Azure OpenAI o3-pro model
          </p>
        </div>

        <div className="space-y-6">
          <ApiKeyInput 
            onApiKeySet={handleApiKeySet}
            hasApiKey={!!apiKey && !!endpoint}
          />

          {apiKey && endpoint && !result && !isProcessing && (
            <>
              <Card className="p-6 shadow-soft">
                <div className="space-y-4">
                  <Label htmlFor="input-text" className="text-base font-medium">
                    Input Text
                  </Label>
                  <Textarea
                    id="input-text"
                    placeholder="Enter your text here..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="min-h-[200px] resize-y"
                  />
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Upload Text Files
                  </Label>
                  <FileUpload files={files} onFilesChange={setFiles} />
                </div>
              </Card>

              <div className="flex justify-center">
                <Button
                  onClick={processWithAzureOpenAI}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-hover px-8 py-3 text-lg font-medium"
                  disabled={(!inputText.trim() && files.length === 0)}
                >
                  Process with Azure OpenAI
                </Button>
              </div>
            </>
          )}

          {isProcessing && (
            <Card className="shadow-soft">
              <ProcessingLoader />
            </Card>
          )}

          {result && (
            <ResultDisplay
              result={result}
              onDownload={downloadResult}
              onReset={resetProcessing}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;
