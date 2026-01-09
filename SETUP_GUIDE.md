# HoopsStats AI Pro - Quick Start Guide

## Prerequisites Completed
- Dependencies installed
- Project structure verified

## Step 1: Configure AI Features (Optional but Recommended)

The app has AI-powered features for voice entry and performance analysis. To enable them:

1. Get a free Google Gemini API key:
   - Visit: https://aistudio.google.com/app/apikey
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the key

2. Open `.env.local` file in the project root

3. Replace `PLACEHOLDER_API_KEY` with your actual key:
   ```
   GEMINI_API_KEY=your_actual_api_key_here
   ```

**Note:** The app works WITHOUT an API key, but you'll only have Manual and Paste entry modes (no AI Voice).

## Step 2: Start the Application

Open a terminal in the project folder and run:

```bash
npm run dev
```

The app will open at: http://localhost:3000

## Step 3: First Launch Setup

When you first open the app, you'll see the "HOOPS AI" splash screen:

1. Click **"ENTER ARENA"** to start using the app
2. You'll start in **Local-Only Mode** (no cloud sync needed)

### Storage Options:

**Local-Only Mode (Recommended for Quick Start):**
- All data stored in your browser
- Works instantly, no signup required
- Data persists across sessions
- Export/Import for backups

**Cloud Mode (Optional):**
- Sync across multiple devices
- Requires Supabase setup (see Advanced Setup below)
- Best for multi-device usage

## Step 4: Adding Your First Game

### Option A: Manual Entry (Always Available)
1. Tap the orange **+** button (bottom right)
2. Select the **"Manual"** tab
3. Fill in:
   - Date (auto-filled with today)
   - Competition (e.g., "EL" for EuroLeague, "ABA", "KLS")
   - Opponent team name
   - Final score (e.g., "86:82")
   - Win/Loss
   - Your stats (minutes, points, rebounds, etc.)
4. Click **"SAVE PERFORMANCE"**

### Option B: Paste Text (Legacy Format)
If you have game notes in this format:
```
3.10. - EL - Baskonia - Partizan 86:82 (0-1)
23min - 10pts, 1reb, 4ast, 2to, 1stl, 0blk, 2fls
2/4dva, 2/4tri, 0/0ft
Index 8
```

1. Tap the **+** button
2. Select **"Paste"** tab
3. Paste your text
4. Click **"PARSE RAW DATA"**
5. Review and save

### Option C: AI Voice Entry (Requires API Key)
1. Tap the **+** button
2. Select **"AI Voice"** tab
3. Tap the microphone button
4. Speak naturally: *"I played 25 minutes against Real Madrid, scored 15 points with 3 triples, 5 rebounds and 2 steals. We won 88 to 82."*
5. AI will extract stats automatically
6. Review and save

## Features Overview

### Navigation Bar (Bottom)
- **History**: View all your games, filter by season/competition
- **Insights**: See your averages, shooting percentages, AI coaching analysis
- **Storage**: Configure cloud sync or export data

### Top Bar Features
- **Cloud Status Indicator**: Shows if you're synced
- **Import**: Upload a previously exported JSON backup
- **Export**: Download your data (CSV for Excel, or JSON backup)
- **Reset**: Clear all data (use with caution)

## Data Management

### Export Your Data
1. Tap the **download icon** (top right)
2. Choose:
   - **OK** = Export to CSV (open in Excel)
   - **Cancel** = Export to JSON (full backup)

### Import Data
1. Tap the **upload icon** (top right)
2. Select your JSON backup file
3. Confirm to restore

### Reset Everything
- Tap the **trash icon** (top right)
- Confirm to wipe all data

## Using Filters (History View)

- **Season Filter**: See games from specific seasons (e.g., "2024/25")
- **Competition Filter**: Filter by league (EL, ABA, KLS, etc.)
- **Opponent Filter**: See all games vs specific teams
- **Best Games**: View top 10 performances by index rating

## Tips for Best Experience

1. **Consistent Data Entry**: Fill in competition and opponent names consistently (use dropdowns after first entry)

2. **Season Format**: Use format like "2024/25" for seasons

3. **Score Format**: Use "home:away" format (e.g., "86:82")

4. **Regular Backups**: Export your data occasionally as JSON

5. **PIR Index**: This is the Performance Index Rating - calculate it based on your league's formula, or use the formula:
   ```
   PIR = (Points + Rebounds + Assists + Steals + Blocks + Fouls Drawn)
         - (Missed FG + Missed FT + Turnovers + Shots Rejected + Fouls Committed)
   ```

## Advanced: Cloud Sync Setup

If you want to sync across devices:

1. Create a Supabase account (free): https://supabase.com
2. Create a new project
3. Run this SQL in the SQL Editor:
   ```sql
   CREATE TABLE games (
     id TEXT PRIMARY KEY,
     user_id UUID REFERENCES auth.users(id) NOT NULL,
     payload JSONB NOT NULL,
     created_at TIMESTAMPTZ DEFAULT NOW()
   );

   ALTER TABLE games ENABLE ROW LEVEL SECURITY;

   CREATE POLICY "Users can manage their own games" ON games
   FOR ALL TO authenticated USING (auth.uid() = user_id);
   ```
4. Get your Project URL and anon key from Settings > API
5. In the app, go to **Storage** (bottom nav)
6. Click **"Configure Supabase"**
7. Enter your URL and anon key
8. Sign up with email/password
9. Your data will now sync automatically

## Troubleshooting

**AI Voice not working?**
- Check if you added the Gemini API key to `.env.local`
- Restart the dev server (`npm run dev`)
- Make sure you're using Chrome/Edge (Safari doesn't support voice recognition)

**Data disappeared?**
- Check if you switched between Local and Cloud modes
- Import your last JSON backup

**Can't see recent changes?**
- Try refreshing the browser
- Check the cloud sync status indicator

## Support

For issues or questions, open an issue at the project repository or check the browser console for errors.

---

**Ready to track your performance like a pro!** 🏀
