document.addEventListener('DOMContentLoaded', function() {
  const loading = document.getElementById('loading');
  const results = document.getElementById('results');
  const noCookies = document.getElementById('no-cookies');
  const statusValue = document.getElementById('status-value');
  const statusDescription = document.getElementById('status-description');
  const cookieSummary = document.getElementById('cookie-summary');
  const cookieDetails = document.getElementById('cookie-details');
  const actions = document.getElementById('actions');
  
  const blockTrackersBtn = document.getElementById('blockTrackers');
  const allowAllBtn = document.getElementById('allowAll');
  const manageCookiesBtn = document.getElementById('manageCookies');
  const dismissBtn = document.getElementById('dismiss');
  
  let currentDomain = '';
  let detectedCookies = [];
  let trackingCookies = [];
  
  // Initialize popup
  initializePopup();
  
  async function initializePopup() {
    try {
      // Get current tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      currentDomain = new URL(tab.url).hostname;
      
      // Analyze cookies for current domain
      await analyzeCookies();
      
    } catch (error) {
      console.error('Error initializing popup:', error);
      showError('Unable to analyze cookies');
    }
  }
  
  async function analyzeCookies() {
    try {
      // Get all cookies for current domain
      const cookies = await chrome.cookies.getAll({ domain: currentDomain });
      detectedCookies = cookies;
      
      // Analyze for tracking cookies
      trackingCookies = analyzeTrackingCookies(cookies);
      
      // Show results
      displayResults();
      
    } catch (error) {
      console.error('Error analyzing cookies:', error);
      showError('Failed to analyze cookies');
    }
  }
  
  function analyzeTrackingCookies(cookies) {
    const trackingPatterns = [
      /_ga/, /_fbp/, /_fbc/, /_gid/, /_gat/, /_gac_/, /_utm/, /_clck/, /_clsk/,
      /track/, /analytics/, /pixel/, /beacon/, /monitor/, /spy/, /surveillance/,
      /uid/, /user_id/, /session_id/, /visitor_id/, /client_id/, /cid/, /id_/,
      /adwords/, /adsense/, /doubleclick/, /facebook/, /googleadservices/,
      /amazon-adsystem/, /bing/, /yandex/, /baidu/, /taboola/, /outbrain/
    ];
    
    return cookies.filter(cookie => {
      const name = cookie.name.toLowerCase();
      const domain = cookie.domain.toLowerCase();
      
      // Check for tracking patterns in name
      const hasTrackingName = trackingPatterns.some(pattern => pattern.test(name));
      
      // Check for known tracking domains
      const isTrackingDomain = domain.includes('google') || 
                              domain.includes('facebook') || 
                              domain.includes('doubleclick') ||
                              domain.includes('amazon-adsystem') ||
                              domain.includes('bing') ||
                              domain.includes('taboola');
      
      // Check for third-party cookies
      const isThirdParty = !domain.includes(currentDomain);
      
      return hasTrackingName || isTrackingDomain || isThirdParty;
    });
  }
  
  function displayResults() {
    loading.classList.add('hidden');
    
    if (detectedCookies.length === 0) {
      noCookies.classList.remove('hidden');
      return;
    }
    
    results.classList.remove('hidden');
    
    if (trackingCookies.length === 0) {
      statusValue.textContent = 'Protected';
      statusDescription.textContent = 'No tracking cookies detected';
      statusValue.style.color = '#4CAF50';
    } else {
      statusValue.textContent = 'Tracking Detected';
      statusDescription.textContent = `${trackingCookies.length} potential tracking cookies found`;
      statusValue.style.color = '#F44336';
      
      // Show cookie summary
      cookieSummary.classList.remove('hidden');
      displayCookieSummary();
      
      // Show action buttons
      actions.classList.remove('hidden');
    }
  }
  
  function displayCookieSummary() {
    const summary = trackingCookies.map(cookie => {
      const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
      return `• ${cookie.name} (${domain})`;
    }).join('<br>');
    
    cookieDetails.innerHTML = summary || 'No tracking cookies detected';
  }
  
  function showError(message) {
    loading.classList.add('hidden');
    results.classList.remove('hidden');
    statusValue.textContent = 'Error';
    statusDescription.textContent = message;
    statusValue.style.color = '#FF9800';
  }
  
  // Event listeners
  blockTrackersBtn.addEventListener('click', async () => {
    try {
      await blockTrackingCookies();
      statusValue.textContent = 'Protected';
      statusDescription.textContent = 'Tracking cookies blocked';
      statusValue.style.color = '#4CAF50';
      actions.classList.add('hidden');
      cookieSummary.classList.add('hidden');
      
      // Store user preference
      await chrome.storage.local.set({ [currentDomain]: 'blocked' });
      
    } catch (error) {
      console.error('Error blocking cookies:', error);
      showError('Failed to block cookies');
    }
  });
  
  allowAllBtn.addEventListener('click', async () => {
    try {
      statusValue.textContent = 'Allowed';
      statusDescription.textContent = 'All cookies allowed';
      statusValue.style.color = '#2196F3';
      actions.classList.add('hidden');
      
      // Store user preference
      await chrome.storage.local.set({ [currentDomain]: 'allowed' });
      
    } catch (error) {
      console.error('Error allowing cookies:', error);
      showError('Failed to save preference');
    }
  });
  
  manageCookiesBtn.addEventListener('click', () => {
    // Open detailed cookie management (future feature)
    chrome.tabs.create({ url: `chrome://settings/content/cookies` });
  });
  
  dismissBtn.addEventListener('click', () => {
    window.close();
  });
  
  async function blockTrackingCookies() {
    const promises = trackingCookies.map(cookie => 
      chrome.cookies.remove({
        url: `https://${cookie.domain}${cookie.path}`,
        name: cookie.name,
        storeId: cookie.storeId
      })
    );
    
    await Promise.all(promises);
  }
}); 