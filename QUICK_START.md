# 🏀 HoopsStats AI Pro - Quick Start (2 Minutes)

## ✅ Status: READY TO USE

Your app is running at: **http://localhost:3000**

## 🚀 Start Using (3 Steps)

### 1. Open the App
- On computer: http://localhost:3000
- On phone (same WiFi): http://192.168.0.29:3000

### 2. Click "ENTER ARENA"
- No signup needed for local mode
- Data saved automatically in browser

### 3. Add Your First Game
- Tap the orange **+** button (bottom right)
- Choose **Manual** tab
- Fill in the form
- Click **SAVE PERFORMANCE**

**That's it! You're tracking stats.**

---

## 🎯 Entry Modes

### 📝 Manual (Always Works)
Best for accuracy. Fill the form with your stats.

### 📋 Paste Text (For Legacy Notes)
If you have notes like:
```
3.10. - EL - Baskonia - Partizan 86:82
23min - 10pts, 1reb, 4ast...
```
Paste in the "Paste" tab → Parse → Save

### 🎙️ AI Voice (Requires Setup)
Speak naturally: *"Played 25 minutes against Real Madrid, scored 15 points with 3 triples..."*

**To enable AI Voice:**
1. Get free API key: https://aistudio.google.com/app/apikey
2. Edit `.env.local`: `GEMINI_API_KEY=your_key_here`
3. Restart: `npm run dev`

---

## 📱 Navigation

### Bottom Bar:
- **History** - All games, filter by season/opponent
- **Insights** - Stats dashboard, AI analysis
- **Storage** - Cloud sync settings

### Top Right Icons:
- ⬆️ Import backup
- ⬇️ Export data (CSV or JSON)
- 🗑️ Reset all data

---

## 💾 Data Safety

**Local Mode (Current):**
- Data in browser
- Export JSON after each session
- Keep backups in cloud storage

**Cloud Mode (Optional, 10 min setup):**
- Auto-sync across devices
- See [SETUP_GUIDE.md](SETUP_GUIDE.md) for Supabase setup

---

## 🔥 Pro Tips

1. **Use dropdowns** - After first entry, competition/opponent auto-complete
2. **Export often** - Tap download icon → Cancel → Save JSON backup
3. **Consistent naming** - "EL" not "Euroleague" (keeps filters clean)
4. **Season format** - Use "2024/25" format
5. **Score format** - "86:82" (home:away)

---

## 🆘 Quick Fixes

**Lost data?**
- Import your last JSON backup (upload icon)

**Voice not working?**
- Add Gemini API key (see AI Voice section above)
- Use Chrome/Edge (Safari doesn't support voice)

**Can't access on phone?**
- Make sure phone is on same WiFi
- Use: http://192.168.0.29:3000

---

## 📚 Full Documentation

- [SETUP_GUIDE.md](SETUP_GUIDE.md) - Complete setup instructions
- [RECOMMENDATIONS.md](RECOMMENDATIONS.md) - Analysis & future improvements

---

**Ready to track your performance! 🚀**

Need help? Check the browser console (F12) for errors.
