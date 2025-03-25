import { API_CONFIG } from './constants.js';

export const uiHelper = {
    showLoading: (element) => {
        element.innerHTML = '<div class="loading">Generating summary</div>';
    },
    showError: (element, message) => {
        element.innerHTML = `<p class="error">Error: ${message}</p>`;
        console.error('Error:', message);
    },
    toggleButtons: (downloadBtn, clearBtn, show) => {
        const display = show ? 'inline-block' : 'none';
        downloadBtn.style.display = display;
        clearBtn.style.display = display;
    },
    formatSummary: (text) => {
        if (!text) return '<p>No summary available.</p>';
        
        text = text.trim().replace(/\s{3,}/g, '\n\n');
        const paragraphs = text.split(/\n{2,}/);
        
        return paragraphs
            .map(para => {
                para = para.trim();
                if (!para) return '';
                
                // Heading detection
                if (/^[A-Z][^\n]+:$/.test(para) || /^[A-Z][A-Z\s]+$/.test(para)) {
                    return `<h3>${para}</h3>`;
                }
                
                // List detection
                if (/^[-•*]\s+/.test(para) || /^\d+\.\s+/.test(para)) {
                    const items = para.split('\n')
                        .map(line => {
                            line = line.replace(/^[-•*]\s+|^\d+\.\s+/, '');
                            return `<li>${line}</li>`;
                        })
                        .join('');
                    return `<ul>${items}</ul>`;
                }
                
                // Regular paragraph
                return `<p>${para}</p>`;
            })
            .filter(Boolean)
            .join('');
    },
    typeText: async (element, html, speed = 10) => {
        element.innerHTML = '';
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = html;
        
        const textNodes = [];
        const walk = document.createTreeWalker(tempDiv, NodeFilter.SHOW_TEXT);
        let node;
        while (node = walk.nextNode()) {
            textNodes.push({ text: node.textContent, parent: node.parentElement });
        }
        
        for (const { text, parent } of textNodes) {
            const newElement = parent.cloneNode(false);
            element.appendChild(newElement);
            
            for (let char of text) {
                await new Promise(resolve => setTimeout(resolve, speed));
                newElement.textContent += char;
            }
        }
    }
};

export const storageHelper = {
    saveToLocal: async (key, data) => {
        return new Promise((resolve) => {
            chrome.storage.local.set({ [key]: data }, resolve);
        });
    },
    getFromLocal: async (key) => {
        return new Promise((resolve) => {
            chrome.storage.local.get([key], (result) => resolve(result[key]));
        });
    },
    removeFromLocal: async (key) => {
        return new Promise((resolve) => {
            chrome.storage.local.remove([key], resolve);
        });
    }
};

export const apiHelper = {
    generateSummary: async (content, tab, detailLevel) => {
        const response = await fetch(`${API_CONFIG.BASE_URL}/summarize`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: tab.url,
                title: tab.title,
                content,
                detail_level: detailLevel
            })
        });
        
        if (!response.ok) {
            const error = await response.text();
            throw new Error(error || 'Failed to generate summary');
        }
        
        return response.json();
    },
    downloadSummary: (summaryId) => {
        return `${API_CONFIG.BASE_URL}/download/${summaryId}`;
    }
};