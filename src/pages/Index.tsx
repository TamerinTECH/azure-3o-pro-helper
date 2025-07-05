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
  const { toast } = useToast();

  const MAX_TOKENS = 200000;

  // Calculate tokens for current input text and files
  const currentTokens = useMemo(() => {
    const combinedText = inputText + '\n' + fileContents.join('\n');
    if (!combinedText.trim()) return 0;
    try {
      return encode(combinedText).length;
    } catch (error) {
      console.error('Error counting tokens:', error);
      return 0;
    }
  }, [inputText, fileContents]);

  // Update file contents when files change
  useEffect(() => {
    const loadFileContents = async () => {
      const contents = await Promise.all(
        files.map(file => readFileAsText(file).catch(() => ''))
      );
      setFileContents(contents);
    };

    if (files.length > 0) {
      loadFileContents();
    } else {
      setFileContents([]);
    }
  }, [files]);

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
                  {files.length > 0 && (
                    <div className="text-sm text-muted-foreground">
                      {files.length} file{files.length > 1 ? 's' : ''} uploaded
                    </div>
                  )}
                </div>
              </Card>

              <div className="flex justify-center">
                <Button
                  onClick={processWithAzureOpenAI}
                  size="lg"
                  className="bg-gradient-primary hover:shadow-hover px-8 py-3 text-lg font-medium"
                  disabled={(!inputText.trim() && files.length === 0) || currentTokens > MAX_TOKENS}
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
