console.log('=== POPUP.JS LOADING ===');

// Privacy Sentinel Popup Script
document.addEventListener('DOMContentLoaded', function() {
  console.log('Popup loaded, setting up buttons...');
  
  // Add click handlers for buttons
  document.querySelectorAll('[data-action]').forEach(button => {
    button.addEventListener('click', function() {
      const action = this.getAttribute('data-action');
      console.log('=== BUTTON CLICKED:', action, '===');
      
      if (action === 'open-settings') {
        chrome.runtime.sendMessage({action: 'openCookieSettings'}, function(response) {
          console.log('Settings opened:', response);
        });
      } else if (action === 'allow-all') {
        chrome.runtime.sendMessage({action: 'allowAllCookies'}, function(response) {
          console.log('Allow all result:', response);
          if (response && response.success) {
            updateUI({ trackingCookies: [] });
          }
        });
      } else if (action === 'block-trackers') {
        chrome.runtime.sendMessage({action: 'blockTrackingCookies'}, function(response) {
          console.log('Block trackers result:', response);
          if (response && response.success) {
            // Show success message
            showSuccessMessage('Tracking cookies blocked successfully!');
            // Refresh the analysis to show updated results
            setTimeout(() => {
              analyzeCurrentTab();
            }, 500);
          } else {
            showErrorMessage('Failed to block tracking cookies');
          }
        });
      }
    });
  });
  
  console.log('Starting cookie analysis...');
  analyzeCurrentTab();
});

async function analyzeCurrentTab() {
  console.log('=== ANALYZING COOKIES ===');
  try {
    const tabs = await chrome.tabs.query({active: true, currentWindow: true});
    if (!tabs[0]) {
      console.error('No active tab found');
      return;
    }
    
    const tab = tabs[0];
    const url = tab.url;
    const domain = new URL(url).hostname;
    
    console.log('Analyzing domain:', domain);
    
    // Get cookies for the domain and subdomains
    const domainCookies = await chrome.cookies.getAll({ domain: domain });
    const subdomainCookies = await chrome.cookies.getAll({ domain: '.' + domain });
    
    // Combine and remove duplicates
    const allCookies = [...domainCookies, ...subdomainCookies];
    const uniqueCookies = [];
    const seen = new Set();
    
    allCookies.forEach(cookie => {
      const key = `${cookie.name}-${cookie.domain}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueCookies.push(cookie);
      }
    });
    
    console.log('Total cookies found:', uniqueCookies.length);
    
    // Analyze for tracking cookies
    const trackingCookies = analyzeTrackingCookies(uniqueCookies);
    
    console.log('=== ANALYSIS COMPLETE ===');
    console.log('Tracking cookies:', trackingCookies.length);
    
    // Update UI with results
    updateUI({
      totalCookies: uniqueCookies.length,
      trackingCookies: trackingCookies,
      domain: domain
    });
    
  } catch (error) {
    console.error('=== ANALYSIS ERROR ===');
    console.error('Error:', error.message);
    updateUI({
      totalCookies: 0,
      trackingCookies: [],
      error: error.message
    });
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
  
  const trackingDomains = [
    'google.com', 'googleadservices.com', 'doubleclick.net', 'googlesyndication.com',
    'facebook.com', 'fb.com', 'instagram.com',
    'amazon-adsystem.com', 'amazon.com',
    'bing.com', 'msn.com',
    'taboola.com', 'outbrain.com',
    'yandex.ru', 'baidu.com'
  ];
  
  const trackingCookies = cookies.filter(cookie => {
    const name = cookie.name.toLowerCase();
    const domain = cookie.domain.startsWith('.') ? cookie.domain.slice(1) : cookie.domain;
    
    // Check for tracking patterns in name
    const hasTrackingName = trackingPatterns.some(pattern => pattern.test(name));
    
    // Check for known tracking domains
    const isKnownTrackingDomain = trackingDomains.some(trackingDomain => 
      domain === trackingDomain || domain.endsWith('.' + trackingDomain)
    );
    
    const isTracking = hasTrackingName || isKnownTrackingDomain;
    if (isTracking) {
      console.log('Tracking cookie detected:', cookie.name, 'from', domain);
    }
    
    return isTracking;
  });
  
  return trackingCookies;
}

function updateUI(data) {
  const violationCount = document.getElementById('violation-count');
  const cookieDetails = document.getElementById('cookie-details');
  const cookieList = document.getElementById('cookie-list');
  
  if (data.error) {
    violationCount.textContent = '?';
    cookieDetails.textContent = 'Error analyzing cookies: ' + data.error;
    cookieList.style.display = 'none';
    return;
  }
  
  const trackingCount = data.trackingCookies.length;
  const totalCount = data.totalCookies || 0;
  
  // Update violation count
  violationCount.textContent = trackingCount;
  
  // Update cookie details
  if (trackingCount === 0) {
    cookieDetails.textContent = 'No tracking cookies detected';
    cookieList.style.display = 'none';
  } else {
    cookieDetails.textContent = `${trackingCount} tracking ${trackingCount === 1 ? 'cookie' : 'cookies'} detected out of ${totalCount} total cookies`;
    
    // Show cookie list
    cookieList.style.display = 'block';
    cookieList.innerHTML = '';
    
    data.trackingCookies.forEach(cookie => {
      const cookieItem = document.createElement('div');
      cookieItem.className = 'cookie-item';
      cookieItem.textContent = `${cookie.name} (${cookie.domain})`;
      cookieList.appendChild(cookieItem);
    });
  }
  
  console.log('UI updated - violations:', trackingCount);
}

function showSuccessMessage(message) {
  console.log('Showing success message:', message);
  
  // Create success notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(76, 175, 80, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 1000;
    animation: slideDown 0.3s ease-out;
  `;
  notification.textContent = message;
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from {
        transform: translateX(-50%) translateY(-100%);
        opacity: 0;
      }
      to {
        transform: translateX(-50%) translateY(0);
        opacity: 1;
      }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 3000);
}

function showErrorMessage(message) {
  console.log('Showing error message:', message);
  
  // Create error notification
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(244, 67, 54, 0.9);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 12px;
    z-index: 1000;
    animation: slideDown 0.3s ease-out;
  `;
  notification.textContent = message;
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    if (notification.parentElement) {
      notification.remove();
    }
  }, 3000);
} 