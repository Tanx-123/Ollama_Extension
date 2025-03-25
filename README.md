# Ollama Webpage Summarizer Extension
A Chrome extension that uses Ollama's LLM capabilities to generate concise summaries of web pages. The extension extracts the main content from any webpage and uses Ollama to create summaries with adjustable detail levels.

## Features
- 🚀 Quick webpage content summarization
- 📊 Three detail levels (Brief, Standard, Detailed)
- 💾 Save and download summaries
- 🔄 Automatic content extraction
- 📱 Responsive popup interface

## Prerequisites

1. Python 3.7+ for the backend server
2. Chrome browser
3. [Ollama](https://ollama.ai/) installed and running locally
4. Node.js and npm (for development)

## Installation

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd ollama_extension
```

2. Start the FastAPI backend server:
```bash
python app_fastapi.py
```

### Extension Setup

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" in the top right
3. Click "Load unpacked" and select the `ollama_extension` directory

## Usage

1. Click the extension icon on any webpage
2. Select your desired detail level (Brief, Standard, or Detailed)
3. Click "Summarize This Page"
4. View the generated summary
5. Optionally download the summary as a text file

## Project Structure

```
ollama_extension/
├── app_fastapi.py      # Backend FastAPI server
├── manifest.json       # Chrome extension manifest
├── background.js       # Extension background script
├── popup.html         # Extension popup interface
├── popup.js           # Popup logic
├── content.js         # Content script for webpage interaction
├── constants.js       # Shared constants
|── utils.js           # Utility functions
```

## API Endpoints

- `GET /` - Health check endpoint
- `POST /summarize` - Generate summary endpoint
- `GET /download/{summary_id}` - Download summary endpoint

## Configuration

The extension uses the following default configurations:

- Backend server: `http://localhost:5000`
- Ollama API: `http://localhost:11434`
- Content length limits:
  - Brief: 5000 characters
  - Standard: 7000 characters
  - Detailed: 10000 characters

## Development

### Backend Development
```bash
uvicorn app_fastapi:app --reload --port 5000
```

### Extension Development
1. Make changes to the extension files
2. Reload the extension in Chrome
3. Test changes

## Troubleshooting

1. **Extension not working?**
   - Ensure the backend server is running
   - Check if Ollama is running (`http://localhost:11434`)
   - Verify console for error messages

2. **Summary not generating?**
   - Confirm webpage has enough content
   - Check browser console for errors
   - Verify network connectivity

3. **Backend server issues?**
   - Check if port 5000 is available
   - Verify Python dependencies are installed
   - Check server logs for errors

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request
