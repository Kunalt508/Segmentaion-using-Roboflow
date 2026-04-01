# 🚀 START YOUR LOCAL DEMO

## Quick Start (3 Steps)

### Step 1: Open Terminal Here
Right-click in this folder → "Open in Terminal" or "Git Bash Here"

### Step 2: Install Dependencies (First Time Only)
```bash
npm install
```
⏱️ Takes about 30-40 seconds

### Step 3: Start the Server
```bash
npm run dev
```

### Step 4: Open Browser
The terminal will show:
```
  ➜  Local:   http://localhost:3000/
```

**Click the link or open** → http://localhost:3000

---

## 🎨 What You'll See

1. **Header** with Extract Art logo
2. **Upload Area** - Drop an image or click to browse
3. **Tools Panel** on left:
   - Rectangle
   - Lasso
   - Circle
   - Brush (3 types)
   - Eraser
   - 🪄 Hover Select (AI-powered)
4. **Canvas** in center
5. **Zoom Controls** at top
6. **Extracted Assets** at bottom

---

## ✅ Try These Features

### Without API Keys (Works Immediately)
- ✅ Upload any JPG/PNG image
- ✅ Use Rectangle/Lasso/Circle selections
- ✅ Paint with Brush tool
- ✅ Adjust brush size, opacity
- ✅ Add feathering to selections
- ✅ Zoom in/out (50%-300%)
- ✅ Extract selected regions
- ✅ Download extracted assets as PNG

### With API Keys (Advanced)
If you added API keys to `.env`:
- 🪄 **Hover Select** - Hover over objects to preview, click to extract
- 🤖 Type "remove the dragon" to detect and remove objects
- 🤖 Click "Clear BG" for automatic background removal

---

## 🛑 To Stop the Server

Press `Ctrl + C` in the terminal

---

## 📁 Quick Reference

```
Your image → Upload → Select tool → Draw/Select → Extract → Download
```

---

## 🆘 Troubleshooting

**"Port 3000 already in use"?**
- Stop other apps using port 3000
- Or edit `vite.config.ts` to use port 3001

**"Module not found" errors?**
- Run `npm install` again
- Delete `node_modules` folder and reinstall

**AI features not working?**
- They need API keys in `.env` file
- Manual selection tools work without API keys

---

**Ready? Run:** `npm run dev`

**Browser will open at:** http://localhost:3000

🎉 **Enjoy your Extract Art demo!**
