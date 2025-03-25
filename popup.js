import { uiHelper, storageHelper, apiHelper } from './utils.js';
import { CONTENT_LIMITS } from './constants.js';

document.addEventListener('DOMContentLoaded', async function() {
  const summarizeBtn = document.getElementById('summarizeBtn');
  const downloadBtn = document.getElementById('downloadBtn');
  const summaryDiv = document.getElementById('summary');
  const detailLevelSelect = document.getElementById('detailLevel');

  //Clear button
  const clearBtn = document.createElement('button');
  clearBtn.id = 'clearBtn';
  clearBtn.textContent = 'Clear Summary';
  clearBtn.style.display = 'none';
  document.querySelector('div[style="text-align: right; margin-top: 10px;"]').appendChild(clearBtn);
  
  class SummaryManager {
    constructor() {
      this.currentSummaryId = null;
      this.currentUrl = '';
      this.setupEventListeners();
      this.loadSavedSummary();
    }

    setupEventListeners() {
      summarizeBtn.addEventListener('click', () => this.handleSummarize());
      downloadBtn.addEventListener('click', () => this.handleDownload());
      clearBtn.addEventListener('click', () => this.handleClear());
    }

    async loadSavedSummary() {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentUrl = tabs[0].url;
      const savedSummary = await storageHelper.getFromLocal('savedSummary');
      
      if (savedSummary?.url === this.currentUrl) {
        this.displaySummary(savedSummary);
      }
    }

    async handleSummarize() {
      try {
        uiHelper.showLoading(summaryDiv);
        const tab = await this.getActiveTab();
        const content = await this.getPageContent(tab);
        const summary = await apiHelper.generateSummary(
          content, 
          tab, 
          detailLevelSelect.value
        );
        this.displayAndStoreSummary(summary, tab);
      } catch (error) {
        uiHelper.showError(summaryDiv, error.message);
      }
    }

    async getActiveTab() {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      return tab;
    }

    async getPageContent(tab) {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ['content.js']
      });
      return new Promise((resolve, reject) => {
        chrome.tabs.sendMessage(tab.id, { action: "getContent" }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.content) {
            resolve(response.content);
          } else {
            reject(new Error('Could not extract content from page.'));
          }
        });
      });
    }

    displayAndStoreSummary(summary, tab) {
      const formattedSummary = uiHelper.formatSummary(summary.summary);
      // Use typeText only for the first time
      uiHelper.typeText(summaryDiv, formattedSummary, 5);
      this.currentSummaryId = summary.summary_id;
      downloadBtn.style.display = 'inline-block';
      clearBtn.style.display = 'inline-block';
      storageHelper.saveToLocal('savedSummary', {
        summaryHtml: formattedSummary,
        summaryId: summary.summary_id,
        url: tab.url,
        title: tab.title,
        timestamp: new Date().toISOString()
      });
    }

    async handleDownload() {
      if (!this.currentSummaryId) {
        console.error('No summary available to download');
        return;
      }
      try {
        const downloadUrl = `http://localhost:5000/download/${this.currentSummaryId}`;
        chrome.tabs.create({ url: downloadUrl });
      } catch (error) {
        console.error('Error downloading summary:', error);
      }
    }

    handleClear() {
      summaryDiv.innerHTML = '<p>Click the button to summarize the current webpage.</p>';
      downloadBtn.style.display = 'none';
      clearBtn.style.display = 'none';
      this.currentSummaryId = null;
      storageHelper.removeFromLocal('savedSummary');
    }

    displaySummary(savedSummary) {
      // Display saved summary instantly without typing effect
      summaryDiv.innerHTML = savedSummary.summaryHtml;
      this.currentSummaryId = savedSummary.summaryId;
      downloadBtn.style.display = 'inline-block';
      clearBtn.style.display = 'inline-block';
    }
  }

  // Initialize
  new SummaryManager();
});