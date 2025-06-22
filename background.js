// Background service worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Hello Extension installed!');
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
});

// Optional: Listen for tab updates to show hello message on new tabs
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('New tab loaded:', tab.url);
  }
}); 