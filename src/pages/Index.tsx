import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { FileUpload } from '@/components/FileUpload';
import { ProcessingLoader } from '@/components/ProcessingLoader';
import { ResultDisplay } from '@/components/ResultDisplay';
import { ApiKeyInput } from '@/components/ApiKeyInput';
import { useToast } from '@/hooks/use-toast';
import { encode } from 'gpt-tokenizer';

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
  const [model, setModel] = useState<string>('o3-pro');
  const [apiVersion, setApiVersion] = useState<string>('preview');
  const [fileContents, setFileContents] = useState<string[]>([]);
  const [isLoadingFiles, setIsLoadingFiles] = useState(false);
  const { toast } = useToast();

  const MAX_TOKENS = 200000;

  // Calculate tokens for current input text and files (matching API format)
  const currentTokens = useMemo(() => {
    let combinedText = inputText;
    
    // Add file contents in the same format as combineTextContent function
    fileContents.forEach((content, index) => {
      if (content.trim()) {
        const fileName = files[index]?.name || `file-${index + 1}`;
        combinedText += `\n\n--- Content from ${fileName} ---\n${content}`;
      }
    });
    
    if (!combinedText.trim()) return 0;
    try {
      return encode(combinedText).length;
    } catch (error) {
      console.error('Error counting tokens:', error);
      return 0;
    }
  }, [inputText, fileContents, files]);

  // Update file contents when files change
  useEffect(() => {
    const loadFileContents = async () => {
      if (files.length === 0) {
        setFileContents([]);
        return;
      }

      setIsLoadingFiles(true);
      try {
        const contents = await Promise.all(
          files.map(async (file) => {
            try {
              const content = await readFileAsText(file);
              return content;
            } catch (error) {
              console.error(`Error reading file ${file.name}:`, error);
              toast({
                title: "File Reading Error",
                description: `Could not read file: ${file.name}`,
                variant: "destructive"
              });
              return '';
            }
          })
        );
        setFileContents(contents);

        // Check if total tokens exceed limit after loading files
        const testText = inputText + '\n' + contents.join('\n');
        const tokenCount = testText.trim() ? encode(testText).length : 0;
        
        if (tokenCount > MAX_TOKENS) {
          toast({
            title: "Token Limit Exceeded",
            description: `Files exceed token limit. Current: ${tokenCount.toLocaleString()} / ${MAX_TOKENS.toLocaleString()}`,
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Error loading file contents:', error);
        toast({
          title: "Error",
          description: "Failed to process uploaded files",
          variant: "destructive"
        });
      } finally {
        setIsLoadingFiles(false);
      }
    };

    loadFileContents();
  }, [files, inputText, toast]);

  const handleApiKeySet = (key: string, endpointUrl: string, modelName: string, version: string) => {
    setApiKey(key);
    setEndpoint(endpointUrl);
    setModel(modelName);
    setApiVersion(version);
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

  const handleTextChange = (value: string) => {
    // Calculate tokens for the new text combined with file contents
    const testText = value + '\n' + fileContents.join('\n');
    const tokenCount = testText.trim() ? encode(testText).length : 0;
    
    if (tokenCount > MAX_TOKENS) {
      toast({
        title: "Token Limit Exceeded",
        description: `Maximum ${MAX_TOKENS.toLocaleString()} tokens allowed. Current: ${tokenCount.toLocaleString()}`,
        variant: "destructive"
      });
      return;
    }
    
    setInputText(value);
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
      
      const response = await fetch(`${endpoint}/openai/v1/responses?api-version=${apiVersion}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        },
        body: JSON.stringify({
          model: model,
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="input-text" className="text-base font-medium">
                      Input Text
                    </Label>
                    <div className="text-sm text-muted-foreground">
                      <span className={currentTokens > MAX_TOKENS * 0.9 ? 'text-destructive font-medium' : ''}>
                        {currentTokens.toLocaleString()} / {MAX_TOKENS.toLocaleString()} tokens
                      </span>
                    </div>
                  </div>
                  <Textarea
                    id="input-text"
                    placeholder="Enter your text here..."
                    value={inputText}
                    onChange={(e) => handleTextChange(e.target.value)}
                    className="min-h-[200px] resize-y"
                  />
                  {currentTokens > MAX_TOKENS * 0.8 && (
                    <div className="text-sm text-muted-foreground">
                      <span className={currentTokens > MAX_TOKENS * 0.9 ? 'text-destructive' : 'text-warning'}>
                        Warning: You're approaching the token limit
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <Card className="p-6 shadow-soft">
                <div className="space-y-4">
                  <Label className="text-base font-medium">
                    Upload Text Files
                  </Label>
                  <FileUpload files={files} onFilesChange={setFiles} />
                  {isLoadingFiles && (
                    <div className="text-sm text-muted-foreground flex items-center gap-2">
                      <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full"></div>
                      Reading files and calculating tokens...
                    </div>
                  )}
                  {files.length > 0 && !isLoadingFiles && (
                    <div className="text-sm text-muted-foreground">
                      {files.length} file{files.length > 1 ? 's' : ''} uploaded
                      {fileContents.some(content => content.trim()) && (
                        <span className="ml-2">
                          ({fileContents.filter(content => content.trim()).length} processed)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex justify-center">
                <Button
                  onClick={processWithAzureOpenAI}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-hover px-8 py-3 text-lg font-medium"
                  disabled={(!inputText.trim() && files.length === 0) || currentTokens > MAX_TOKENS || isLoadingFiles}
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
        
        {/* Disclaimer Footer */}
        <div className="mt-12 pt-8 border-t border-border">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Created by{' '}
              <a 
                href="https://www.tamerin.tech" 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-primary hover:text-primary-hover underline"
              >
                TamerinTECH
              </a>
            </p>
            <p className="text-xs text-muted-foreground">
              This is not a production ready application, for testing purposes only. Use at your own risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
