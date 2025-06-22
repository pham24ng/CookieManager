// Privacy Sentinel Background Service Worker
chrome.runtime.onInstalled.addListener(() => {
  console.log('Privacy Sentinel installed!');
  
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
  });
});

// Listen for extension icon clicks
chrome.action.onClicked.addListener((tab) => {
  console.log('Privacy Sentinel icon clicked on tab:', tab.id);
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

// Monitor tab updates for new page loads
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab completed loading:', tab.url);
    
    // Check if this is a new domain visit
    const domain = new URL(tab.url).hostname;
    checkDomainPrivacyStatus(domain, tabId);
  }
});

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
  try {
    // Get all cookies for the domain
    const cookies = await chrome.cookies.getAll({ domain: domain });
    
    // Filter for tracking cookies
    const trackingCookies = cookies.filter(cookie => 
      isTrackingCookie(cookie.name)
    );
    
    // Remove tracking cookies
    const promises = trackingCookies.map(cookie => 
      chrome.cookies.remove({
        url: `https://${cookie.domain}${cookie.path}`,
        name: cookie.name,
        storeId: cookie.storeId
      })
    );
    
    await Promise.all(promises);
    console.log(`Blocked ${trackingCookies.length} tracking cookies for ${domain}`);
    
  } catch (error) {
    console.error('Error blocking cookies for domain:', error);
  }
}

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'blockCookies') {
    blockCookiesForDomain(message.domain).then(() => {
      sendResponse({ success: true });
    }).catch((error) => {
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
}); 