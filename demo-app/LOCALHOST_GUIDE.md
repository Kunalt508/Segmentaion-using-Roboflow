# 🎉 Your Extract Art Demo is LIVE!

## ✅ Server is Running

Your local website is now accessible at:

```
🌐 http://localhost:3001
```

**Copy this URL and paste it in your web browser!**

---

## 🖥️ How to View

1. **Open your browser** (Chrome, Firefox, Edge, Safari)
2. **Go to:** `http://localhost:3001`
3. **You should see:**
   - Header with "Extract Art" title
   - Upload area in the center
   - Professional UI with tools

---

## 🎨 What to Try

### 1. Upload an Image
- Click the upload area OR
- Drag and drop an image file
- Supported: PNG, JPG, GIF

### 2. Use Selection Tools (Left Sidebar)
- **Rectangle** - Click and drag
- **Lasso** - Draw freehand
- **Circle** - Create circular selections
- **Brush** - Paint selection mask (3 types available)
- **Eraser** - Remove parts of selection

### 3. Adjust Settings
- **Feathering** - Soft edges (0-100 pixels)
- **Brush Size** - 1-100 pixels
- **Opacity** - Transparency control
- **Hardness** - For soft brush
- **Spacing** - For stroke brush

### 4. Extract Regions
- After making a selection, click "Extract"
- Selected area appears in "Extracted Assets" section
- Download individual assets as PNG

### 5. AI Features (With API Keys)
- Type description: "remove the dragon"
- Click "Remove Objects"
- Or use "Clear BG" for full background removal

---

## 🔧 Server Control

### To Stop the Server
Press `Ctrl + C` in your terminal

### To Restart
```bash
npm run dev
```

### To Change Port
Edit `vite.config.ts`:
```typescript
server: {
  port: 3002, // Change to any port
}
```

---

## 📱 Access from Other Devices

### On the Same Network

1. Find your computer's IP address:
   ```bash
   # Windows
   ipconfig

   # Mac/Linux
   ifconfig
   ```

2. Look for IPv4 Address (e.g., `192.168.1.100`)

3. On another device (phone/tablet), open:
   ```
   http://YOUR_IP:3001
   ```
   Example: `http://192.168.1.100:3001`

4. Start server with `--host`:
   ```bash
   npm run dev -- --host
   ```

---

## 🎬 Demo Workflow

**Complete Example:**

1. **Upload** a photo with a person and background
2. **Select Brush** tool
3. **Paint over** the person
4. **Adjust** brush size to 30px
5. **Set** opacity to 95%
6. **Click** "Extract Brushed Area"
7. **See** person extracted with transparent background
8. **Download** the extracted asset

---

## 🌟 Features Status

### ✅ Working Without API Keys
- All 5 selection tools
- Feathering controls
- Brush settings
- Zoom/Pan (50%-300%)
- Asset extraction
- Download as PNG
- Multiple extractions
- Delete assets

### 🔑 Requires API Keys (Optional)
- Object detection
- Text-based removal
- Background removal

---

## 🐛 Troubleshooting

### Can't Access http://localhost:3001?
- Check terminal - is server running?
- Try http://127.0.0.1:3001
- Check if another app is using the port

### Page is Blank?
- Open browser Developer Tools (F12)
- Check Console for errors
- Refresh page (Ctrl+R or Cmd+R)

### Upload Not Working?
- Check file is valid image (PNG/JPG)
- Try a different image
- Check browser console for errors

### Canvas Not Rendering?
- Try different browser (Chrome recommended)
- Clear browser cache
- Restart server

---

## 📊 Performance Tips

- **Images auto-scale** to fit canvas (800x600)
- **Use smaller images** for better performance
- **Chrome/Edge** recommended for best performance
- **Clear extracted assets** if too many accumulated

---

## 🎓 Learning Resources

### Keyboard Shortcuts (Future)
Currently using mouse/touch controls only

### Pro Tips
- Use **Rectangle** for quick boxy selections
- Use **Lasso** for irregular shapes
- Use **Brush** for detailed masks
- **Feathering** creates professional soft edges
- **Zoom** for precision work

---

## 📝 Current Status

```
✅ Server: Running
🌐 URL: http://localhost:3001
📦 Dependencies: Installed
🔧 Features: All manual tools working
🔑 AI Features: Available with API keys
```

---

## 🚀 Next Steps

1. **Open browser** → http://localhost:3001
2. **Upload image** → Test the tools
3. **Experiment** with settings
4. **Extract assets** → Download them
5. **Share feedback** with your team

---

## 🆘 Need Help?

**Server won't start?**
- Run `npm install` again
- Delete `node_modules` and reinstall
- Check for port conflicts

**Build errors?**
- Update Node.js to v16+
- Clear npm cache: `npm cache clean --force`
- Reinstall: `rm -rf node_modules && npm install`

**Other issues?**
- Check `README.md` in this folder
- Review browser console (F12)
- Check terminal for error messages

---

**🎉 Enjoy Your Extract Art Demo!**

**Currently running at:** http://localhost:3001

**To stop:** Press `Ctrl + C` in terminal
