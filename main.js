const { app, BrowserWindow, ipcMain, Notification, Tray, Menu } = require('electron');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'settings.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const TRACKER_FILE = path.join(DATA_DIR, 'tracker.json');

let mainWindow;
let tray;

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 650,
    minWidth: 700,
    minHeight: 550,
    frame: false,
    transparent: false,
    backgroundColor: '#0f0f23',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
  });

  mainWindow.loadFile(path.join(__dirname, 'src', 'index.html'));

  mainWindow.on('minimize', (e) => {
    e.preventDefault();
    mainWindow.hide();
  });

  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  tray = new Tray(path.join(__dirname, 'assets', 'icon.png'));
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Open', click: () => mainWindow.show() },
    { label: 'Quit', click: () => { app.isQuitting = true; app.quit(); } },
  ]);
  tray.setToolTip('College Countdown');
  tray.setContextMenu(contextMenu);
  tray.on('click', () => mainWindow.show());
}

function loadData(file, defaultVal) {
  ensureDataDir();
  if (fs.existsSync(file)) {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  }
  return defaultVal;
}

function saveData(file, data) {
  ensureDataDir();
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

app.whenReady().then(() => {
  ensureDataDir();

  const now = new Date();
  const fiveMonthsLater = new Date(now);
  fiveMonthsLater.setMonth(fiveMonthsLater.getMonth() + 5);

  if (!fs.existsSync(SETTINGS_FILE)) {
    saveData(SETTINGS_FILE, {
      endDate: fiveMonthsLater.toISOString().split('T')[0],
      startDate: now.toISOString().split('T')[0],
      theme: 'dark',
      collegeName: 'My College',
    });
  }
  if (!fs.existsSync(EVENTS_FILE)) {
    saveData(EVENTS_FILE, []);
  }
  if (!fs.existsSync(TRACKER_FILE)) {
    saveData(TRACKER_FILE, { habits: [], entries: {} });
  }

  createWindow();
  createTray();

  ipcMain.on('window-minimize', () => { if (mainWindow) mainWindow.minimize(); });
  ipcMain.on('window-close', () => { if (mainWindow) mainWindow.close(); });
  ipcMain.on('window-toggle-maximize', () => {
    if (mainWindow) mainWindow.isMaximized() ? mainWindow.unmaximize() : mainWindow.maximize();
  });

  ipcMain.handle('load-settings', () => {
    const defaults = {
      endDate: fiveMonthsLater.toISOString().split('T')[0],
      startDate: now.toISOString().split('T')[0],
      theme: 'dark',
      collegeName: 'My College',
    };
    return loadData(SETTINGS_FILE, defaults);
  });

  ipcMain.handle('save-settings', (e, settings) => {
    saveData(SETTINGS_FILE, settings);
    return true;
  });

  ipcMain.handle('load-events', () => loadData(EVENTS_FILE, []));
  ipcMain.handle('save-events', (e, events) => {
    saveData(EVENTS_FILE, events);
    return true;
  });

  ipcMain.handle('load-tracker', () => loadData(TRACKER_FILE, { habits: [], entries: {} }));
  ipcMain.handle('save-tracker', (e, data) => {
    saveData(TRACKER_FILE, data);
    return true;
  });

  ipcMain.on('show-notification', (e, { title, body }) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show();
    }
  });

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
