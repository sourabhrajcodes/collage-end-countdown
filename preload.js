const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('window-minimize'),
  close: () => ipcRenderer.send('window-close'),
  toggleMaximize: () => ipcRenderer.send('window-toggle-maximize'),

  loadSettings: () => ipcRenderer.invoke('load-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),

  loadEvents: () => ipcRenderer.invoke('load-events'),
  saveEvents: (events) => ipcRenderer.invoke('save-events', events),

  loadTracker: () => ipcRenderer.invoke('load-tracker'),
  saveTracker: (data) => ipcRenderer.invoke('save-tracker', data),

  showNotification: (title, body) => ipcRenderer.send('show-notification', { title, body }),
});
