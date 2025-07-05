import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ApiKeyInputProps {
  onApiKeySet: (apiKey: string, endpoint: string, model: string, apiVersion: string) => void;
  hasApiKey: boolean;
}

export const ApiKeyInput: React.FC<ApiKeyInputProps> = ({ onApiKeySet, hasApiKey }) => {
  const [apiKey, setApiKey] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [model, setModel] = useState('o3-pro');
  const [apiVersion, setApiVersion] = useState('preview');
  const [showInputs, setShowInputs] = useState(!hasApiKey);

  useEffect(() => {
    const savedApiKey = localStorage.getItem('azure_openai_api_key');
    const savedEndpoint = localStorage.getItem('azure_openai_endpoint');
    const savedModel = localStorage.getItem('azure_openai_model') || 'o3-pro';
    const savedApiVersion = localStorage.getItem('azure_openai_api_version') || 'preview';
    
    if (savedApiKey && savedEndpoint) {
      setApiKey(savedApiKey);
      setEndpoint(savedEndpoint);
      setModel(savedModel);
      setApiVersion(savedApiVersion);
      onApiKeySet(savedApiKey, savedEndpoint, savedModel, savedApiVersion);
    }
  }, [onApiKeySet]);

  const handleSave = () => {
    if (apiKey.trim() && endpoint.trim()) {
      localStorage.setItem('azure_openai_api_key', apiKey);
      localStorage.setItem('azure_openai_endpoint', endpoint);
      localStorage.setItem('azure_openai_model', model);
      localStorage.setItem('azure_openai_api_version', apiVersion);
      onApiKeySet(apiKey, endpoint, model, apiVersion);
      setShowInputs(false);
    }
  };

  const handleClear = () => {
    localStorage.removeItem('azure_openai_api_key');
    localStorage.removeItem('azure_openai_endpoint');
    localStorage.removeItem('azure_openai_model');
    localStorage.removeItem('azure_openai_api_version');
    setApiKey('');
    setEndpoint('');
    setModel('o3-pro');
    setApiVersion('preview');
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="model">Model Name</Label>
            <Input
              id="model"
              type="text"
              placeholder="e.g., o3-pro"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="apiVersion">API Version</Label>
            <Input
              id="apiVersion"
              type="text"
              placeholder="e.g., preview"
              value={apiVersion}
              onChange={(e) => setApiVersion(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>

        <div className="flex space-x-2">
          <Button 
            onClick={handleSave} 
            disabled={!apiKey.trim() || !endpoint.trim() || !model.trim() || !apiVersion.trim()}
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