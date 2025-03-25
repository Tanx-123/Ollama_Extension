from fastapi import FastAPI, Request, Response, HTTPException, Depends
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import requests
import re
import io
import datetime

app = FastAPI(title="Ollama Webpage Summarizer")

# Enable CORS for all routes
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods
    allow_headers=["*"],  # Allows all headers
)

# Ollama API endpoint
OLLAMA_API = "http://localhost:11434/api/generate"

# Store summaries in memory for download feature
summary_cache = {}

# Pydantic model for summarize request
class SummarizeRequest(BaseModel):
    url: str = Field(default="")
    title: str = Field(default="")
    content: str
    detail_level: str = Field(default="standard")

# Pydantic model for summarize response
class SummarizeResponse(BaseModel):
    summary: str
    summary_id: str

@app.post("/summarize", response_model=SummarizeResponse)
async def summarize(request_data: SummarizeRequest):
    try:
        # Clean content (remove extra whitespace, etc.)
        content = re.sub(r'\s+', ' ', request_data.content).strip()
        
        # Adjust content length based on detail level
        content_length = 5000 if request_data.detail_level == 'brief' else 7000 if request_data.detail_level == 'standard' else 10000
        
        # Create prompt for Ollama based on detail level
        if request_data.detail_level == 'brief':
            instruction = "Provide a brief summary capturing only the most essential information.Don't add this prompt in the summary."
        elif request_data.detail_level == 'standard':
            instruction = "Provide a comprehensive summary with main points and key information."
        else: # detailed
            instruction = "Provide a detailed summary covering all important aspects of the content. Include main arguments, supporting evidence, and conclusions. Structure with headings and points for readability."
        
        prompt = f"""You are a helpful assistant that summarizes web content.
        {instruction} Give human-like readable response and avoid using special characters like "*,#,etc.".
        Webpage: {request_data.title}
        URL: {request_data.url}
        Content: {content[:content_length]}
        Your summary:"""
        
        # Call Ollama API
        response = requests.post(
            OLLAMA_API,
            json={
                "model": "llama3",  # Or any other model you have loaded in Ollama
                "prompt": prompt,
                "stream": False
            }
        )
        
        if response.status_code == 200:
            result = response.json()
            summary = result.get('response', '').strip()
            # Generate a unique ID for this summary and store it in cache
            timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
            summary_id = f"{timestamp}_{hash(request_data.url) % 10000}"
            summary_cache[summary_id] = {
                'summary': summary,
                'title': request_data.title,
                'url': request_data.url,
                'timestamp': timestamp
            }
            
            return SummarizeResponse(summary=summary, summary_id=summary_id)
        else:
            raise HTTPException(status_code=500, detail=f"Ollama API error: {response.status_code}")
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/download/{summary_id}")
async def download_summary(summary_id: str):
    try:
        if summary_id not in summary_cache:
            raise HTTPException(status_code=404, detail="Summary not found")
            
        summary_data = summary_cache[summary_id]
        summary = summary_data['summary']
        title = summary_data['title']
        url = summary_data['url']
        timestamp = summary_data['timestamp']
        # Create a formatted text file
        content = f"""SUMMARY OF: {title}\nURL: {url}\n
        \n{summary}\n"""
        
        # Create an in-memory file-like object
        buffer = io.BytesIO()
        buffer.write(content.encode('utf-8'))
        buffer.seek(0)
        
        # Generate a filename based on the page title
        safe_title = re.sub(r'[^\w\s-]', '', title).strip().replace(' ', '_')[:50]
        filename = f"{safe_title}_summary.txt"
        
        # Return a streaming response with the file
        return StreamingResponse(
            buffer,
            media_type="text/plain",
            headers={
                "Content-Disposition": f"attachment; filename={filename}"
            }
        )
        
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Add a simple root endpoint for health check
@app.get("/")
async def root():
    return {"status": "ok", "message": "Ollama Webpage Summarizer API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)