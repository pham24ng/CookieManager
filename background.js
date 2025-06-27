// Cookie Manager Background Service Worker
console.log('=== BACKGROUND SCRIPT LOADING ===');

chrome.runtime.onInstalled.addListener(() => {
  console.log('=== EXTENSION INSTALLED ===');
  
  // Initialize storage with default settings
  chrome.storage.local.set({
    'settings': {
      'autoBlock': false,
      'showNotifications': true,
      'trackingPatterns': [
        '_ga', '_fbp', '_fbc', '_gid', '_gat', '_gac_', '_utm', '_clck', '_clsk',
        'track', 'analytics', 'pixel', 'beacon', 'monitor', 'spy', 'surveillance',
        'uid', 'user_id', 'session_id', 'visitor_id', 'client_id', 'cid', 'id_',
        'adwords', 'adsense', 'doubleclick', 'facebook', 'googleadservices',
        'amazon-adsystem', 'bing', 'yandex', 'baidu', 'taboola', 'outbrain'
      ]
    }
  }).then(() => {
    console.log('Settings initialized');
  });
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
});

// Update popup badge and title based on current page
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url && !tab.url.startsWith('chrome://')) {
      await updatePopupForTab(tab);
    }
  } catch (error) {
    console.error('Error updating popup for tab:', error);
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && !tab.url.startsWith('chrome://')) {
    updatePopupForTab(tab);
  }
});

async function updatePopupForTab(tab) {
  try {
    const domain = new URL(tab.url).hostname;
    
    // Get cookies for the domain
    const cookies = await chrome.cookies.getAll({ domain: domain });
    const trackingCookies = cookies.filter(cookie => isTrackingCookie(cookie.name));
    
    console.log('Tab update - domain:', domain, 'tracking cookies:', trackingCookies.length);
    
    // Update popup title and badge
    if (trackingCookies.length > 0) {
      chrome.action.setBadgeText({ 
        text: trackingCookies.length.toString(),
        tabId: tab.id 
      });
      chrome.action.setBadgeBackgroundColor({ 
        color: '#F44336',
        tabId: tab.id 
      });
      chrome.action.setTitle({ 
        title: `Cookie Manager - ${trackingCookies.length} tracking cookies detected`,
        tabId: tab.id 
      });
    } else {
      chrome.action.setBadgeText({ 
        text: '',
        tabId: tab.id 
      });
      chrome.action.setTitle({ 
        title: 'Cookie Manager - No tracking cookies detected',
        tabId: tab.id 
      });
    }
    
    // Store analysis result for popup
    await chrome.storage.local.set({
      [`${domain}_analysis`]: {
        timestamp: Date.now(),
        totalCookies: cookies.length,
        trackingCookies: trackingCookies.length,
        domain: domain
      }
    });
    
  } catch (error) {
    console.error('Error updating popup for tab:', error);
  }
}

// Listen for messages from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('=== MESSAGE RECEIVED:', message.action, '===');
  
  if (message.action === 'analyzeCookies') {
    // Get current tab
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs[0]) {
        const domain = new URL(tabs[0].url).hostname;
        
        try {
          // Get cookies for the domain
          const cookies = await chrome.cookies.getAll({ domain: domain });
          
          // Send response back to popup
          sendResponse({
            success: true,
            domain: domain,
            cookieCount: cookies.length,
            cookies: cookies
          });
        } catch (error) {
          console.error('Error analyzing cookies:', error);
          sendResponse({
            success: false,
            error: error.message
          });
        }
      } else {
        sendResponse({
          success: false,
          error: 'No active tab found'
        });
      }
    });
    
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'getCurrentAnalysis') {
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs[0]) {
        const domain = new URL(tabs[0].url).hostname;
        const result = await chrome.storage.local.get(`${domain}_analysis`);
        sendResponse(result[`${domain}_analysis`] || null);
      } else {
        sendResponse(null);
      }
    });
    return true;
  }
  
  if (message.action === 'blockCookies') {
    console.log('Blocking cookies for domain:', message.domain);
    blockCookiesForDomain(message.domain).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Error blocking cookies:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true; // Keep message channel open for async response
  }
  
  if (message.action === 'getDomainStatus') {
    chrome.storage.local.get(message.domain).then((result) => {
      sendResponse({ status: result[message.domain] || 'unknown' });
    });
    return true;
  }
  
  if (message.action === 'openCookieSettings') {
    console.log('Opening cookie settings...');
    chrome.tabs.create({ url: 'chrome://settings/content/cookies' }).then((tab) => {
      console.log('Cookie settings opened in tab:', tab.id);
      sendResponse({ success: true });
    }).catch((error) => {
      console.error('Error opening cookie settings:', error);
      sendResponse({ success: false, error: error.message });
    });
    return true;
  }
  
  if (message.action === 'closePopup') {
    sendResponse({ success: true });
    return true;
  }
  
  if (message.action === 'allowAllCookies') {
    console.log('=== ALLOWING ALL COOKIES ===');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs[0]) {
        const domain = new URL(tabs[0].url).hostname;
        console.log('Allowing all cookies for:', domain);
        try {
          // Store user preference to allow all cookies for this domain
          await chrome.storage.local.set({ [domain]: 'allowed' });
          
          // Clear any detection data
          await chrome.storage.local.remove(`${domain}_detected`);
          
          // Update badge to clear it
          chrome.action.setBadgeText({ 
            text: '',
            tabId: tabs[0].id 
          });
          
          console.log('Allow all cookies successful');
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error allowing cookies:', error);
          sendResponse({ success: false, error: error.message });
        }
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true;
  }
  
  if (message.action === 'blockTrackingCookies') {
    console.log('=== BLOCKING TRACKING COOKIES ===');
    chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
      if (tabs && tabs[0]) {
        const domain = new URL(tabs[0].url).hostname;
        console.log('Blocking tracking cookies for:', domain);
        try {
          // Block tracking cookies for this domain
          await blockCookiesForDomain(domain);
          
          // Store user preference to block tracking cookies for this domain
          await chrome.storage.local.set({ [domain]: 'blocked' });
          
          // Clear any detection data
          await chrome.storage.local.remove(`${domain}_detected`);
          
          // Update badge to clear it
          chrome.action.setBadgeText({ 
            text: '',
            tabId: tabs[0].id 
          });
          
          console.log('Block tracking cookies successful');
          sendResponse({ success: true });
        } catch (error) {
          console.error('Error blocking tracking cookies:', error);
          sendResponse({ success: false, error: error.message });
        }
      } else {
        sendResponse({ success: false, error: 'No active tab found' });
      }
    });
    return true;
  }
});

// Monitor web requests for cookie setting
chrome.webRequest.onHeadersReceived.addListener(
  (details) => {
    // Check if this is a response that might set cookies
    if (details.type === 'main_frame' || details.type === 'sub_frame') {
      const setCookieHeaders = details.responseHeaders?.filter(
        header => header.name.toLowerCase() === 'set-cookie'
      );
      
      if (setCookieHeaders && setCookieHeaders.length > 0) {
        console.log('Cookies detected in response:', details.url);
        
        // Analyze cookies for tracking patterns
        analyzeCookiesInHeaders(setCookieHeaders, details.url);
      }
    }
  },
  { urls: ["<all_urls>"] },
  ["responseHeaders"]
);

// Function to analyze cookies in response headers
async function analyzeCookiesInHeaders(setCookieHeaders, url) {
  try {
    const domain = new URL(url).hostname;
    const trackingCookies = [];
    
    for (const header of setCookieHeaders) {
      const cookieValue = header.value;
      const cookieName = cookieValue.split('=')[0];
      
      // Check if cookie name matches tracking patterns
      if (isTrackingCookie(cookieName)) {
        trackingCookies.push({
          name: cookieName,
          domain: domain,
          url: url
        });
      }
    }
    
    if (trackingCookies.length > 0) {
      console.log('Tracking cookies detected:', trackingCookies);
      
      // Check if user has already made a decision for this domain
      const result = await chrome.storage.local.get(domain);
      const userDecision = result[domain];
      
      if (!userDecision) {
        // Store detection for potential notification
        await chrome.storage.local.set({
          [`${domain}_detected`]: {
            timestamp: Date.now(),
            cookies: trackingCookies
          }
        });
      }
    }
    
  } catch (error) {
    console.error('Error analyzing cookies in headers:', error);
  }
}

// Function to check if a cookie name matches tracking patterns
function isTrackingCookie(cookieName) {
  const trackingPatterns = [
    /_ga/, /_fbp/, /_fbc/, /_gid/, /_gat/, /_gac_/, /_utm/, /_clck/, /_clsk/,
    /track/, /analytics/, /pixel/, /beacon/, /monitor/, /spy/, /surveillance/,
    /uid/, /user_id/, /session_id/, /visitor_id/, /client_id/, /cid/, /id_/,
    /adwords/, /adsense/, /doubleclick/, /facebook/, /googleadservices/,
    /amazon-adsystem/, /bing/, /yandex/, /baidu/, /taboola/, /outbrain/
  ];
  
  return trackingPatterns.some(pattern => pattern.test(cookieName.toLowerCase()));
}

// Function to check domain privacy status
async function checkDomainPrivacyStatus(domain, tabId) {
  try {
    // Get user's stored decision for this domain
    const result = await chrome.storage.local.get(domain);
    const userDecision = result[domain];
    
    if (userDecision === 'blocked') {
      // Auto-block cookies for this domain
      await blockCookiesForDomain(domain);
    }
    
    // Check for recent cookie detections
    const detectionResult = await chrome.storage.local.get(`${domain}_detected`);
    const detection = detectionResult[`${domain}_detected`];
    
    if (detection && !userDecision) {
      // Show notification in content script
      chrome.tabs.sendMessage(tabId, {
        action: 'showPrivacyNotification',
        data: detection
      }).catch(() => {
        // Content script might not be ready yet, ignore error
      });
    }
    
  } catch (error) {
    console.error('Error checking domain privacy status:', error);
  }
}

// Function to block cookies for a specific domain
async function blockCookiesForDomain(domain) {
  console.log('=== BLOCKING COOKIES FOR DOMAIN ===');
  console.log('Domain:', domain);
  
  try {
    // Get all cookies for the domain
    const cookies = await chrome.cookies.getAll({ domain: domain });
    console.log('Total cookies found for domain:', cookies.length);
    
    // Filter for tracking cookies
    const trackingCookies = cookies.filter(cookie => 
      isTrackingCookie(cookie.name)
    );
    
    console.log('Tracking cookies to remove:', trackingCookies.length);
    trackingCookies.forEach(cookie => {
      console.log('  - Removing:', cookie.name, 'from', cookie.domain);
    });
    
    // Remove tracking cookies
    const promises = trackingCookies.map(cookie => 
      chrome.cookies.remove({
        url: `https://${cookie.domain}${cookie.path}`,
        name: cookie.name,
        storeId: cookie.storeId
      })
    );
    
    const results = await Promise.all(promises);
    console.log('Cookie removal results:', results);
    
    console.log(`Successfully blocked ${trackingCookies.length} tracking cookies for ${domain}`);
    
  } catch (error) {
    console.error('Error blocking cookies for domain:', error);
    throw error;
  }
} 