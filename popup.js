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
      
      // Check if we're on a Chrome internal page
      if (tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://') || tab.url.startsWith('about:')) {
        showChromePageMessage();
        return;
      }
      
      currentDomain = new URL(tab.url).hostname;
      
      // Analyze cookies for current domain
      await analyzeCookies();
      
    } catch (error) {
      console.error('Error initializing popup:', error);
      showError('Unable to analyze cookies');
    }
  }
  
  function showChromePageMessage() {
    loading.classList.add('hidden');
    results.classList.remove('hidden');
    statusValue.textContent = 'Chrome Page';
    statusDescription.textContent = 'Privacy Sentinel cannot analyze Chrome internal pages';
    statusValue.style.color = '#9E9E9E';
    actions.classList.add('hidden');
    cookieSummary.classList.add('hidden');
  }
  
  async function analyzeCookies() {
    try {
      console.log('Analyzing cookies for domain:', currentDomain);
      
      // Get cookies specifically for the current domain and its subdomains
      const domainCookies = await chrome.cookies.getAll({ domain: currentDomain });
      console.log('Domain cookies:', domainCookies);
      
      // Also get cookies for subdomains
      const subdomainCookies = await chrome.cookies.getAll({ domain: '.' + currentDomain });
      console.log('Subdomain cookies:', subdomainCookies);
      
      // Combine domain and subdomain cookies
      detectedCookies = [...domainCookies, ...subdomainCookies];
      
      // Remove duplicates based on name and domain
      const uniqueCookies = [];
      const seen = new Set();
      
      detectedCookies.forEach(cookie => {
        const key = `${cookie.name}-${cookie.domain}`;
        if (!seen.has(key)) {
          seen.add(key);
          uniqueCookies.push(cookie);
        }
      });
      
      detectedCookies = uniqueCookies;
      console.log('Total unique cookies detected:', detectedCookies.length);
      console.log('All detected cookies:', detectedCookies);
      
      // Analyze for tracking cookies
      trackingCookies = analyzeTrackingCookies(detectedCookies);
      console.log('Tracking cookies found:', trackingCookies.length);
      console.log('Tracking cookies:', trackingCookies);
      
      // Show results
      displayResults();
      
    } catch (error) {
      console.error('Error analyzing cookies:', error);
      showError('Failed to analyze cookies');
    }
  }
  
  function isTrackingDomain(domain) {
    const trackingDomains = [
      'google.com', 'googleadservices.com', 'doubleclick.net', 'googlesyndication.com',
      'facebook.com', 'fb.com', 'instagram.com',
      'amazon-adsystem.com', 'amazon.com',
      'bing.com', 'msn.com',
      'taboola.com', 'outbrain.com',
      'yandex.ru', 'baidu.com'
    ];
    
    return trackingDomains.some(trackingDomain => 
      domain === trackingDomain || domain.endsWith('.' + trackingDomain)
    );
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
      const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
      
      // Check for tracking patterns in name
      const hasTrackingName = trackingPatterns.some(pattern => pattern.test(name));
      
      // Check for known tracking domains
      const isKnownTrackingDomain = isTrackingDomain(domain);
      
      // Only flag as tracking if it has a tracking name OR is from a known tracking domain
      // Don't flag all third-party cookies as tracking
      return hasTrackingName || isKnownTrackingDomain;
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
      const isThirdParty = !domain.includes(currentDomain);
      const type = isThirdParty ? ' (Third-party)' : ' (First-party)';
      return `• ${cookie.name} (${domain})${type}`;
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