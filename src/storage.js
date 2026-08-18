var Storage = {
  loadSettings: function() {
    try {
      return window.electronAPI.loadSettings();
    } catch (e) {
      return Promise.resolve({
        endDate: '', startDate: '', theme: 'dark', collegeName: 'My College'
      });
    }
  },

  saveSettings: function(settings) {
    try { return window.electronAPI.saveSettings(settings); } catch (e) { return Promise.resolve(true); }
  },

  loadEvents: function() {
    try { return window.electronAPI.loadEvents(); } catch (e) { return Promise.resolve([]); }
  },

  saveEvents: function(events) {
    try { return window.electronAPI.saveEvents(events); } catch (e) { return Promise.resolve(true); }
  },

  loadTracker: function() {
    try { return window.electronAPI.loadTracker(); } catch (e) { return Promise.resolve({ habits: [], entries: {} }); }
  },

  saveTracker: function(data) {
    try { return window.electronAPI.saveTracker(data); } catch (e) { return Promise.resolve(true); }
  },

  generateId: function() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
};
