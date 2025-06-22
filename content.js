// Content script that runs on every page
(function() {
  'use strict';
  
  // Function to show hello message
  function showHelloMessage() {
    // Create a notification element
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      font-family: Arial, sans-serif;
      font-size: 16px;
      z-index: 10000;
      box-shadow: 0 4px 15px rgba(0,0,0,0.2);
      animation: slideIn 0.5s ease-out;
      max-width: 300px;
    `;
    
    notification.innerHTML = `
      <div style="display: flex; align-items: center; gap: 10px;">
        <span style="font-size: 20px;">👋</span>
        <div>
          <div style="font-weight: bold; margin-bottom: 5px;">Hello!</div>
          <div style="font-size: 14px; opacity: 0.9;">Welcome to this page!</div>
        </div>
        <button onclick="this.parentElement.parentElement.remove()" 
                style="background: none; border: none; color: white; cursor: pointer; font-size: 18px; margin-left: 10px;">
          ✕
        </button>
      </div>
    `;
    
    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Add to page
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentElement) {
        notification.remove();
      }
    }, 5000);
  }
  
  // Show message when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', showHelloMessage);
  } else {
    showHelloMessage();
  }
  
  // Also show message when window gains focus (new window/tab)
  window.addEventListener('focus', function() {
    // Add a small delay to avoid showing multiple messages
    setTimeout(showHelloMessage, 100);
  });
  
  console.log('Hello Extension content script loaded!');
})(); 