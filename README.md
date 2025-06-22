# Hello Chrome Extension

A simple Chrome extension that shows a "Hello" popup message whenever you open a new window or navigate to a new page.

## Features

- 🎉 Shows a beautiful animated "Hello" notification when you visit any webpage
- 👆 Click the extension icon to open a popup with additional functionality
- 🎨 Modern gradient design with smooth animations
- ⏰ Auto-dismissing notifications (5 seconds)
- 🔄 Works on all websites

## Installation

### For Development/Testing:

1. **Download or clone this repository**
   ```bash
   git clone https://github.com/pham24ng/CookiesManager.git
   cd CookiesManager
   ```

2. **Open Chrome and go to Extensions**
   - Open Chrome browser
   - Navigate to `chrome://extensions/`
   - Or go to Menu → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner

4. **Load the Extension**
   - Click "Load unpacked"
   - Select the folder containing your extension files
   - The extension should now appear in your extensions list

5. **Test the Extension**
   - Open any website
   - You should see a "Hello" notification appear in the top-right corner
   - Click the extension icon in the toolbar to see the popup

## Files Structure

```
├── manifest.json      # Extension configuration
├── popup.html         # Popup interface
├── popup.js           # Popup functionality
├── content.js         # Content script (runs on web pages)
├── background.js      # Background service worker
└── README.md          # This file
```

## How It Works

- **manifest.json**: Defines the extension's properties, permissions, and structure
- **popup.html/js**: Creates the popup that appears when clicking the extension icon
- **content.js**: Runs on every webpage and shows the "Hello" notification
- **background.js**: Handles background tasks and extension lifecycle

## Customization

You can easily customize the extension by:

- Modifying the message in `content.js`
- Changing the styling in `popup.html` or `content.js`
- Adding new features to the popup
- Adjusting the notification timing

## Permissions

This extension uses minimal permissions:
- `activeTab`: Allows the extension to interact with the current tab

## Development

To make changes:
1. Edit the files as needed
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the changes

## License

This project is licensed under the MIT License. 