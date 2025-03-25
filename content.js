// Set up a flag to indicate that the content script is ready
console.log("Content script loaded and ready");

// Function to extract main content from page
function extractMainContent() {
  // Get all paragraph text
  let paragraphs = Array.from(document.querySelectorAll('p, h1, h2, h3, h4, h5, article'));
  
  // Filter out very short paragraphs and ads
  let content = paragraphs
    .filter(p => p.textContent.trim().length > 40)
    .map(p => p.textContent.trim())
    .join('\n\n');
  
  // If we couldn't get much content, just use the body text
  if (content.length < 100) {
    content = document.body.innerText;
  }
  // Limit content length to avoid overwhelming the model
  const maxLength = 10000;
  if (content.length > maxLength) {
    content = content.substring(0, maxLength) + "...";
  }
  return content;
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  console.log("Message received in content script:", request);
  
  if (request.action === "getContent") {
    // Extract main content from page
    const content = extractMainContent();
    console.log("Content extracted, length:", content.length);
    sendResponse({ content: content });
  }
  return true;
});