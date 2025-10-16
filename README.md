# Nuuko - HTML Version ✨

A stunning, lightweight version of Nuuko built with pure HTML, CSS, and vanilla JavaScript. This version captures the cozy, storybook aesthetic with beautiful animations and a paper-like journaling experience.

## Features 🌟

- **Cozy Storybook Design**: Warm colors, serif typography, and paper-like textures
- **Paper-like Writing Experience**: Notebook lines, left margin, and encouraging prompts  
- **Mood Tracking**: Beautiful gradient spectrum with gentle interactions
- **Library View**: Book-spine styled entry cards with hover animations
- **Patterns/Insights**: Warm stats display with encouraging language
- **Local Storage**: All data saved locally, no sign-up required
- **Responsive Design**: Works beautifully on all devices
- **Accessibility**: Keyboard navigation and screen reader friendly

## Getting Started 🚀

1. **Open the website**:
   ```bash
   # Option 1: Simple Python server
   npm run start
   # or
   python3 -m http.server 3000
   
   # Option 2: Just open index.html in your browser
   open index.html
   ```

2. **Visit**: http://localhost:3000

## File Structure 📁

```
html-version/
├── index.html      # Cozy homepage with library and calendar
├── write.html      # Paper-like journaling experience  
├── insights.html   # Warm patterns and stats
├── styles.css      # Beautiful cozy design system
├── script.js       # Vanilla JS functionality
└── README.md       # This file
```

## Design Highlights 🎨

### Color Palette
- **Green** (#6B8F71): Growth, encouragement
- **Clay** (#9A6B51): Warmth, highlights  
- **Espresso** (#3D342C): Text, anchors
- **Cream** (#F3EFE5): Background, paper feel
- **Stone** (#8D877E): Muted text, borders

### Typography
- **Inter**: Clean, modern body text
- **Crimson Pro**: Elegant serif for headers and warmth

### Voice & Tone
- "hi name!" instead of "Welcome back, Alex"
- "tap to reflect" instead of "Start writing"
- "no notes yet — today's a fresh page" 
- "your library" instead of "Recent entries"
- "patterns" instead of "Analytics"

## Key Features 🛠️

### Writing Experience
- **Auto-resizing textarea** with paper texture
- **Mood spectrum** with 7 gentle mood states
- **Word count & reading time** tracking
- **Auto-save drafts** every 30 seconds
- **Keyboard shortcuts** (⌘+S to save)

### Data Storage
- **LocalStorage based** - works offline
- **Entry persistence** with mood and metadata
- **Stats calculation** (streaks, word counts, etc.)
- **Privacy first** - all data stays local

### Animations
- **Gentle fade-ins** on page load
- **Floating feather** in navigation
- **Hover effects** on cards and buttons
- **Smooth transitions** throughout

## Browser Support 🌐

Works in all modern browsers:
- Chrome 60+
- Firefox 55+ 
- Safari 12+
- Edge 79+

## Why HTML/CSS/JS? 💭

This version offers several advantages:

1. **Performance**: Loads instantly, no framework overhead
2. **Simplicity**: Easy to understand and modify
3. **Accessibility**: Native HTML semantics work better with screen readers
4. **Offline**: Works completely offline once cached
5. **Lightweight**: Only ~50KB total (CSS + JS)
6. **Universal**: Runs anywhere HTML works

## Demo Data 🎭

To test with sample entries, open the browser console and run:
```javascript
addDemoData()
```
Then refresh the page to see the library and insights populated.

## Customization 🎨

The design system is built with CSS custom properties, making it easy to customize:

```css
:root {
  --nuuko-green: #6B8F71;    /* Change primary color */
  --nuuko-clay: #9A6B51;     /* Change accent color */
  --font-serif: 'Your Font'; /* Change header font */
}
```

## License 📄

MIT License - feel free to use this design system for your own projects!

---

*crafted with care for mindful journaling* ✨
