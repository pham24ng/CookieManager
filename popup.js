document.addEventListener('DOMContentLoaded', function() {
  const showAlertButton = document.getElementById('showAlert');
  
  showAlertButton.addEventListener('click', function() {
    alert('Hello from your Chrome extension! 🎉');
  });
  
  // Log when popup is opened
  console.log('Popup opened!');
}); 