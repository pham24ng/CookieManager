# Cookie Manager Chrome Extension

A privacy-focused Chrome extension that enhances user privacy by providing transparency and control over website cookies. The extension proactively analyzes cookies on newly visited websites, identifies those with potential tracking capabilities, and empowers users to make informed decisions about their acceptance.

## 🛡️ Features

- **🔍 Cookie Detection & Analysis**: Automatically detects and analyzes cookies on every website you visit
- **🎯 Tracking Cookie Identification**: Uses pattern matching and known tracker databases to identify potential tracking cookies
- **🚫 Smart Blocking**: Allows you to block tracking cookies while preserving essential functionality
- **📊 Privacy Status Dashboard**: Real-time privacy status and cookie summary in the extension popup
- **💾 Persistent Preferences**: Remembers your decisions for each website to avoid repeated prompts
- **🎨 Non-Intrusive Design**: Beautiful, modern interface that doesn't disrupt your browsing experience
- **⚡ Performance Optimized**: Minimal impact on browser performance and page loading times

## 🚀 Installation

### For End Users:

1. **Download the Extension**
   - Click the green "Code" button on this GitHub page
   - Select "Download ZIP"
   - Extract the ZIP file to a folder on your computer

2. **Open Chrome and go to Extensions**
   - Open Google Chrome browser
   - Type `chrome://extensions/` in the address bar and press Enter
   - Or go to Chrome Menu (⋮) → More Tools → Extensions

3. **Enable Developer Mode**
   - Toggle the "Developer mode" switch in the top right corner of the extensions page

4. **Load the Extension**
   - Click "Load unpacked" button
   - Navigate to and select the folder you extracted from the ZIP file
   - Click "Select Folder"

5. **Start Using Cookie Manager**
   - The extension icon should now appear in your Chrome toolbar
   - Visit any website to see it in action
   - Click the icon to open the privacy dashboard

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
   - Visit any website with tracking cookies (e.g., news sites, e-commerce sites)
   - You should see a privacy notification if tracking cookies are detected
   - Click the extension icon to see detailed cookie analysis

## 📁 Files Structure

```
├── manifest.json      # Extension configuration (Manifest V3)
├── popup.html         # Privacy dashboard popup interface
├── popup.js           # Popup functionality and cookie analysis
├── content.js         # Content script for page-level privacy notifications
├── background.js      # Background service worker for cookie monitoring
├── icons/             # Extension icons (placeholders)
│   ├── icon16.png
│   ├── icon48.png
│   └── icon128.png
└── README.md          # This file
```

## 🔧 How It Works

### Cookie Detection
- **Pattern Matching**: Identifies tracking cookies using regex patterns for common tracking cookie names
- **Domain Analysis**: Recognizes known tracking domains (Google, Facebook, etc.)
- **Third-Party Detection**: Flags cookies from external domains as potential trackers

### Privacy Protection
- **Real-time Monitoring**: Analyzes cookies as they're being set
- **User Control**: Provides clear options to block or allow cookies
- **Persistent Decisions**: Remembers your choices to avoid repeated prompts
- **Smart Blocking**: Removes tracking cookies while preserving essential site functionality

### User Interface
- **Privacy Dashboard**: Extension popup shows current privacy status and cookie summary
- **In-page Notifications**: Non-intrusive alerts when tracking cookies are detected
- **Action Buttons**: Clear options to block trackers, allow all, or manage cookies

## 🎯 Tracking Cookie Patterns

The extension detects tracking cookies based on:

### Common Tracking Cookie Names:
- Google Analytics: `_ga`, `_gid`, `_gat`, `_gac_`
- Facebook Pixel: `_fbp`, `_fbc`
- Google Ads: `_utm`, `_clck`, `_clsk`
- General tracking: `track`, `analytics`, `pixel`, `beacon`
- User identification: `uid`, `user_id`, `session_id`, `visitor_id`

### Known Tracking Domains:
- Google services (analytics, ads, etc.)
- Facebook and Instagram
- Amazon advertising
- Bing and other search engines
- Taboola, Outbrain, and other content networks

## 🔒 Privacy & Security

- **Local Processing**: All cookie analysis happens locally in your browser
- **No Data Collection**: The extension doesn't collect or transmit any personal data
- **Minimal Permissions**: Only requests necessary permissions for cookie management
- **Transparent Operation**: Clear explanations of what cookies are detected and why

## 🛠️ Development

### Making Changes:
1. Edit the files as needed
2. Go to `chrome://extensions/`
3. Click the refresh icon on your extension
4. Test the changes

### Key Components:
- **`manifest.json`**: Defines permissions, background scripts, and content scripts
- **`popup.html/js`**: Creates the privacy dashboard interface
- **`content.js`**: Handles in-page privacy notifications
- **`background.js`**: Manages cookie monitoring and web request analysis

## 📋 Permissions

This extension uses the following permissions:
- `cookies`: To read, analyze, and remove cookies
- `webRequest`: To monitor web requests for cookie setting
- `storage`: To save user preferences and decisions
- `activeTab`: To interact with the current tab
- `scripting`: For content script injection

## 🎨 Customization

You can easily customize the extension by:
- Modifying tracking patterns in `background.js`
- Adjusting the UI styling in `popup.html` and `content.js`
- Adding new privacy features
- Changing notification timing and behavior

## 🔮 Future Features

Planned enhancements for future versions:
- Integration with DuckDuckGo Tracker Radar database
- More granular cookie categorization
- Advanced cookie management interface
- Privacy score for websites
- Integration with privacy policy databases

## 📄 License

This project is licensed under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit issues and pull requests to improve the extension.

---

**Cookie Manager** - Managing your cookies, protecting your privacy! 🛡️ 