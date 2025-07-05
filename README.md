# Azure OpenAI Text Processor

A simple, clean web application for processing text content using Azure OpenAI's o3-pro model. Built by [TamerinTECH](https://www.tamerin.tech)

## live demo: [Azure OpenAI o3-pro UI](https://azure-3o-pro-helper.lovable.app/)

## What is this?

This application allows you to:
- Input text directly in a large text box
- Upload multiple .txt files for processing
- Combine all text content and send it to Azure OpenAI o3-pro model
- View the AI-generated response in a scrollable format
- Download the results as a .txt file

## Features

- **Simple Interface**: Clean, modern UI with no authentication required
- **File Upload**: Drag & drop support for multiple .txt files
- **Azure OpenAI Integration**: Uses the powerful o3-pro model via Azure OpenAI API
- **Configurable**: Set your own API endpoint, model name, and API version
- **Local Storage**: Your API credentials are saved locally in your browser
- **Export Results**: Download processed results as text files

## How to Use

### 1. Configure Azure OpenAI
First, you'll need to set up your Azure OpenAI credentials:
- **Azure OpenAI Endpoint**: Your Azure resource endpoint (e.g., `https://your-resource.openai.azure.com`)
- **API Key**: Your Azure OpenAI API key
- **Model Name**: The model deployment name (default: `o3-pro`)
- **API Version**: The API version to use (default: `preview`)

These settings are saved locally in your browser for convenience.

### 2. Add Your Content
- Type or paste text directly into the large text box
- Upload additional .txt files using the drag & drop area
- All content will be combined when processing

### 3. Process with AI
- Click "Process with Azure OpenAI" to send your content to the AI model
- Wait for the processing to complete (this may take a few moments)
- View the results in the scrollable output area

### 4. Export Results
- Download the AI response as a .txt file for later use
- Reset the interface to start a new processing session

## Technical Details

The application makes API calls to Azure OpenAI using this format:
```bash
curl -X POST https://YOUR-RESOURCE-NAME.openai.azure.com/openai/v1/responses?api-version=preview \
  -H "Content-Type: application/json" \
  -H "api-key: $AZURE_OPENAI_API_KEY" \
  -d '{
     "model": "o3-pro",
     "input": "Your combined text content"
    }'
```

## Technologies Used

This project is built with:
- **React** - Frontend framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **Vite** - Build tool

## Local Development

To run this project locally:

```bash
# Clone the repository
git clone <your-repo-url>

# Navigate to project directory
cd azure-openai-text-processor

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:8080`.

## Azure OpenAI Setup

To use this application, you'll need:

1. An Azure OpenAI resource with the o3-pro model deployed
2. The endpoint URL for your Azure OpenAI resource
3. An API key with access to your Azure OpenAI resource
4. The deployment name of your o3-pro model

## Security Notes

- API keys are stored locally in your browser only
- No data is sent to any third-party services except Azure OpenAI
- All processing happens client-side before being sent to Azure OpenAI

## Support

For issues or questions, please check your Azure OpenAI configuration and ensure your API key has the necessary permissions.

---

*Built with ❤️ by TamerinTECH*