# Extract Art - Local Demo

Live demo of the Extract Art feature that you can run locally in your browser.

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd demo-app
npm install
```

### 2. Set Up API Keys (Optional)

Copy the example env file:
```bash
cp .env.example .env
```

Then edit `.env` and add your API keys:
```env
VITE_HUGGING_FACE_API_KEY=hf_your_key_here
VITE_PHOTOROOM_API_KEY=your_key_here
```

**Note:** The app will work without API keys, but AI features (object detection and background removal) will be disabled.

### 3. Start the Development Server

```bash
npm run dev
```

The app will open at **http://localhost:3000**

## ✨ Features You Can Test

### Selection Tools (No API Keys Needed)
- ✅ Rectangle Selection
- ✅ Lasso Selection
- ✅ Circle Selection
- ✅ Brush Selection (3 types)
- ✅ Eraser Tool
- ✅ Feathering controls
- ✅ Zoom/Pan
- ✅ Asset extraction
- ✅ Download extracted images

### AI Features (Requires API Keys)
- 🔑 Object Detection (Hugging Face)
- 🔑 Text-based object removal
- 🔑 Background removal (PhotoRoom)

## 📦 What's Included

```
demo-app/
├── src/
│   ├── components/
│   │   ├── ExtractArt.tsx      - Main feature
│   │   ├── KonvaCanvas.tsx     - Canvas engine
│   │   └── ui/                 - UI components
│   ├── lib/
│   │   ├── api.ts              - API integration
│   │   └── utils.ts            - Utilities
│   ├── App.tsx                 - Main app
│   └── main.tsx                - Entry point
├── package.json                - Dependencies
└── vite.config.ts              - Build config
```

## 🧪 Testing Workflow

1. **Upload an image** - Click or drag/drop
2. **Try each selection tool** - Rectangle, Lasso, Circle, Brush
3. **Adjust settings** - Feather, brush size, opacity
4. **Extract regions** - Click tools to select and extract
5. **Zoom/Pan** - Use controls to navigate
6. **Download** - Save extracted assets

## 🔧 Available Commands

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
```

## 🌐 Browser Support

- Chrome/Edge (recommended)
- Firefox
- Safari

## 📝 Notes

- Images are processed locally in your browser
- No data is sent to servers (except for AI features when enabled)
- Extracted assets are temporary (cleared on page refresh)
- Works offline (without AI features)

## 🆘 Troubleshooting

**Port 3000 already in use?**
Edit `vite.config.ts` and change the port:
```typescript
server: {
  port: 3001, // Change to any available port
}
```

**AI features not working?**
- Check that API keys are in `.env`
- Ensure keys start with correct prefix (`hf_` for Hugging Face)
- Check browser console for error messages

**Canvas not rendering?**
- Try a different browser
- Check browser console for errors
- Ensure image is valid format (PNG/JPG)

## 🎨 Customization

You can customize the demo by editing:
- `src/App.tsx` - Main layout and header
- `src/index.css` - Color scheme and styles
- `tailwind.config.js` - Tailwind settings

---

**Enjoy testing the Extract Art feature! 🎉**
