# College Countdown

A desktop application built with **Electron** that helps you track your college semester with a beautiful hourglass countdown, habit tracker, events manager, and statistics.

![Dark Theme](https://img.shields.io/badge/theme-dark-1a1a1a) ![Electron](https://img.shields.io/badge/electron-31.x-blue) ![License](https://img.shields.io/badge/license-MIT-green)

## Features

### Hourglass Countdown
- Real-time countdown to your semester end date
- Canvas-rendered hourglass with flowing sand animation
- Progress bar showing semester completion
- Days, hours, minutes, and seconds remaining

### Habit Tracker
- GitHub-style heatmap grid for daily habit tracking
- Add custom habits with color coding
- Click cells to log habits for any day
- Tracks current streak, monthly progress, and best streak
- Color-coded cells based on daily completion percentage

### Events Manager
- Add, edit, and delete events (exams, assignments, holidays)
- Color-coded event types
- Upcoming events on the main dashboard
- Events sorted by date

### Statistics
- Days passed vs days left
- Semester completion percentage
- GPA/CGPA calculator with course credits

### Customization
- 4 built-in themes: **Dark**, **Light**, **Ocean**, **Sunset**
- Customizable college name
- Custom semester start and end dates

## Screenshots

| Countdown | Tracker | Events |
|-----------|---------|--------|
| Hourglass animation with live countdown | Heatmap grid for habit tracking | Manage exams and assignments |

## Installation

### Prerequisites
- [Node.js](https://nodejs.org/) v18 or higher
- npm (comes with Node.js)

### Setup

```bash
# Clone the repository
git clone https://github.com/sourabhrajcodes/collage-end-countdown.git

# Navigate to the project
cd collage-end-countdown

# Install dependencies
npm install

# Start the application
npm start
```

## Usage

1. **Set your dates** - Click the gear icon (top right) to set your semester start and end dates
2. **Track habits** - Go to the Tracker tab, add habits, and click grid cells to log daily progress
3. **Add events** - Go to the Events tab to add exams, assignments, and important dates
4. **View statistics** - Check the Statistics tab for your GPA and semester progress
5. **Switch themes** - Choose from Dark, Light, Ocean, or Sunset themes in Settings

## Project Structure

```
college-countdown/
├── main.js              # Electron main process & IPC handlers
├── preload.js           # Secure bridge between main & renderer
├── package.json         # Project dependencies & scripts
├── assets/
│   └── icon.png         # Application icon
├── src/
│   ├── index.html       # Main UI layout
│   ├── styles.css       # All styling & themes
│   ├── app.js           # Core application logic
│   ├── hourglass.js     # Canvas hourglass animation
│   ├── storage.js       # Data persistence layer
│   └── tracker.js       # Habit tracker & heatmap grid
└── data/                # Local data storage (auto-created)
    ├── settings.json    # User preferences
    ├── events.json      # Saved events
    └── tracker.json     # Habit data & entries
```

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Desktop Framework | Electron 31 |
| Frontend | HTML5, CSS3, Vanilla JavaScript |
| Rendering | Canvas API (hourglass) |
| Data Storage | Local JSON files |
| Styling | CSS Grid, CSS Variables, Flexbox |

## Scripts

| Command | Description |
|---------|-------------|
| `npm start` | Launch the application |
| `npm test` | Run tests (not configured) |

## Data Storage

All data is stored locally in the `data/` directory as JSON files:
- **settings.json** - College name, semester dates, theme preference
- **events.json** - All saved events with dates and colors
- **tracker.json** - Habit definitions and daily completion entries

## License

MIT License - feel free to use and modify this project.

## Author

[sourabhrajcodes](https://github.com/sourabhrajcodes)
