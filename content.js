// Privacy Sentinel Content Script
(function() {
  'use strict';
  
  let currentDomain = window.location.hostname;
  let hasShownNotification = false;
  
  // Initialize content script
  initializePrivacySentinel();
  
  async function initializePrivacySentinel() {
    try {
      // Check if we should show notification for this domain
      const shouldShow = await shouldShowPrivacyNotification();
      
      if (shouldShow) {
        // Wait a bit for page to load and cookies to be set
        setTimeout(() => {
          analyzeAndNotify();
        }, 2000);
      }
      
    } catch (error) {
      console.error('Privacy Sentinel initialization error:', error);
    }
  }
  
  async function shouldShowPrivacyNotification() {
    try {
      // Check if user has already made a decision for this domain
      const result = await chrome.storage.local.get(currentDomain);
      const userDecision = result[currentDomain];
      
      // Don't show if user has already made a decision
      if (userDecision === 'allowed' || userDecision === 'blocked') {
        return false;
      }
      
      // Check if we've already shown notification on this page
      if (hasShownNotification) {
        return false;
      }
      
      return true;
      
    } catch (error) {
      console.error('Error checking notification status:', error);
      return false;
    }
  }
  
  async function analyzeAndNotify() {
    try {
      // Get cookies for current domain
      const cookies = await chrome.cookies.getAll({ domain: currentDomain });
      
      // Analyze for tracking cookies
      const trackingCookies = analyzeTrackingCookies(cookies);
      
      // Show notification if tracking cookies found
      if (trackingCookies.length > 0) {
        showPrivacyNotification(trackingCookies);
        hasShownNotification = true;
      }
      
    } catch (error) {
      console.error('Error analyzing cookies:', error);
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
  
  function showPrivacyNotification(trackingCookies) {
    // Create notification element
    const notification = document.createElement('div');
    notification.id = 'privacy-sentinel-notification';
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 20px;
      border-radius: 12px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10000;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      animation: slideInPrivacy 0.5s ease-out;
      max-width: 350px;
      backdrop-filter: blur(10px);
    `;
    
    const trackingCount = trackingCookies.length;
    const domains = [...new Set(trackingCookies.map(c => c.domain.replace(/^\./, '')))];
    
    notification.innerHTML = `
      <div style="display: flex; align-items: flex-start; gap: 12px;">
        <div style="font-size: 20px; margin-top: 2px;">🛡️</div>
        <div style="flex: 1;">
          <div style="font-weight: 600; margin-bottom: 8px; font-size: 16px;">
            Privacy Alert
          </div>
          <div style="margin-bottom: 12px; line-height: 1.4; opacity: 0.9;">
            ${trackingCount} potential tracking ${trackingCount === 1 ? 'cookie' : 'cookies'} detected from ${domains.length} ${domains.length === 1 ? 'domain' : 'domains'}.
          </div>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            <button id="privacy-block" style="
              background: rgba(244, 67, 54, 0.9);
              border: none;
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
              transition: all 0.2s ease;
            ">Block Trackers</button>
            <button id="privacy-allow" style="
              background: rgba(255,255,255,0.2);
              border: none;
              color: white;
              padding: 8px 16px;
              border-radius: 6px;
              cursor: pointer;
              font-size: 12px;
              font-weight: 500;
              transition: all 0.2s ease;
            ">Allow All</button>
            <button id="privacy-dismiss" style="
              background: none;
              border: none;
              color: white;
              cursor: pointer;
              font-size: 18px;
              opacity: 0.7;
              transition: opacity 0.2s ease;
            ">✕</button>
          </div>
        </div>
      </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideInPrivacy {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      
      #privacy-block:hover {
        background: rgba(244, 67, 54, 1) !important;
        transform: translateY(-1px);
      }
      
      #privacy-allow:hover {
        background: rgba(255,255,255,0.3) !important;
        transform: translateY(-1px);
      }
      
      #privacy-dismiss:hover {
        opacity: 1 !important;
      }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Event listeners
    document.getElementById('privacy-block').addEventListener('click', async () => {
      await handleBlockTrackers(trackingCookies);
      notification.remove();
    });
    
    document.getElementById('privacy-allow').addEventListener('click', async () => {
      await handleAllowAll();
      notification.remove();
    });
    
    document.getElementById('privacy-dismiss').addEventListener('click', () => {
      notification.remove();
    });
    
    // Auto-remove after 10 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 10000);
  }
  
  async function handleBlockTrackers(trackingCookies) {
    try {
      // Remove tracking cookies
      const promises = trackingCookies.map(cookie => 
        chrome.cookies.remove({
          url: `https://${cookie.domain}${cookie.path}`,
          name: cookie.name,
          storeId: cookie.storeId
        })
      );
      
      await Promise.all(promises);
      
      // Store user preference
      await chrome.storage.local.set({ [currentDomain]: 'blocked' });
      
      // Show success message
      showSuccessMessage('Tracking cookies blocked successfully!');
      
    } catch (error) {
      console.error('Error blocking trackers:', error);
      showErrorMessage('Failed to block tracking cookies');
    }
  }
  
  async function handleAllowAll() {
    try {
      // Store user preference
      await chrome.storage.local.set({ [currentDomain]: 'allowed' });
      
      // Show success message
      showSuccessMessage('Cookies allowed for this site');
      
    } catch (error) {
      console.error('Error allowing cookies:', error);
      showErrorMessage('Failed to save preference');
    }
  }
  
  function showSuccessMessage(message) {
    const successMsg = document.createElement('div');
    successMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(76, 175, 80, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10001;
      animation: slideInPrivacy 0.3s ease-out;
    `;
    successMsg.textContent = message;
    
    document.body.appendChild(successMsg);
    
    setTimeout(() => {
      if (successMsg.parentElement) {
        successMsg.remove();
      }
    }, 3000);
  }
  
  function showErrorMessage(message) {
    const errorMsg = document.createElement('div');
    errorMsg.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: rgba(244, 67, 54, 0.9);
      color: white;
      padding: 12px 20px;
      border-radius: 8px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      z-index: 10001;
      animation: slideInPrivacy 0.3s ease-out;
    `;
    errorMsg.textContent = message;
    
    document.body.appendChild(errorMsg);
    
    setTimeout(() => {
      if (errorMsg.parentElement) {
        errorMsg.remove();
      }
    }, 3000);
  }
  
  console.log('Privacy Sentinel content script loaded for:', currentDomain);
})(); 