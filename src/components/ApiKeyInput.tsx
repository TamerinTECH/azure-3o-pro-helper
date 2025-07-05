import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string, endpoint: string) => void;
  hasApiKey: boolean;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet, hasApiKey }) => {
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [showInputs, setShowInputs] = useState(!hasApiKey);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('azure_openai_api_key');
    const savedEndpoint = localStorage.getItem('azure_openai_endpoint');
    if (savedApiKey && savedEndpoint) {
      onApiKeySet(savedApiKey, savedEndpoint);
    }
  }, [onApiKeySet]);

  const handleSave = () => {
    if (apiKey.trim() && endpoint.trim()) {
      localStorage.setItem('azure_openai_api_key', apiKey);
      localStorage.setItem('azure_openai_endpoint', endpoint);
      onApiKeySet(apiKey, endpoint);
      setShowInputs(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('azure_openai_api_key');
    localStorage.removeItem('azure_openai_endpoint');
    setApiKey('');
    setEndpoint('');
    setShowInputs(true);
  };

  if (hasApiKey && !showInputs) {
    return (
      <Card className="p-4 bg-accent/50 border-accent">
        <div className="flex items-center justify-between">
          <span className="text-sm text-accent-foreground">
            Azure OpenAI credentials configured
          </span>
          <Button 
            onClick={() => setShowInputs(true)} 
            variant="ghost" 
            size="sm"
          >
            Update
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-foreground mb-2">
          Azure OpenAI Configuration
        </h3>
        <Alert>
          <AlertDescription>
            Your API key and endpoint will be stored locally in your browser for convenience.
          </AlertDescription>
        </Alert>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="endpoint">Azure OpenAI Endpoint</Label>
          <Input
            id="endpoint"
            type="text"
            placeholder="https://YOUR-RESOURCE-NAME.openai.azure.com"
            value={endpoint}
            onChange={(e) => setEndpoint(e.target.value)}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="apiKey">API Key</Label>
          <Input
            id="apiKey"
            type="password"
            placeholder="Enter your Azure OpenAI API key"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="mt-1"
          />
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleSave} 
            disabled={!apiKey.trim() || !endpoint.trim()}
            className="bg-gradient-primary hover:shadow-hover"
          >
            Save Configuration
          </Button>
          {hasApiKey && (
            <Button onClick={handleClear} variant="outline">
              Clear
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};