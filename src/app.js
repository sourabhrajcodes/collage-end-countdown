const App = {
  settings: { endDate: '', startDate: '', theme: 'dark', collegeName: 'My College' },
  events: [],
  hourglass: null,
  countdownInterval: null,

  init() {
    this.bindEvents();

    const hourglassScene = document.getElementById('hourglass-scene');
    if (hourglassScene) {
      hourglassScene.addEventListener('click', () => {
        if (this.hourglass) this.hourglass.pulse();
      });
    }

    this.loadData().then(() => {
      this.hourglass = new Hourglass();
      this.populateSettings();
      this.applyTheme(this.settings.theme);
      this.startCountdown();
      this.renderEvents();
      this.updateStats();
      Tracker.init();
    });
  },

  async loadData() {
    try {
      this.settings = await Storage.loadSettings();
      this.events = await Storage.loadEvents();
    } catch (err) {
      console.error('Load error:', err);
    }
  },

  bindEvents() {
    document.querySelectorAll('.nav-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
    });

    document.getElementById('btn-settings-open').addEventListener('click', () => {
      const panel = document.getElementById('settings-panel');
      if (panel) {
        panel.classList.remove('hidden');
        this.populateSettings();
      }
    });

    document.getElementById('btn-settings-close').addEventListener('click', () => {
      document.getElementById('settings-panel').classList.add('hidden');
    });

    document.getElementById('settings-backdrop').addEventListener('click', () => {
      document.getElementById('settings-panel').classList.add('hidden');
    });

    document.getElementById('btn-add-event').addEventListener('click', () => {
      this.openEventModal();
    });

    document.getElementById('btn-cancel-event').addEventListener('click', () => {
      this.closeEventModal();
    });

    document.getElementById('modal-backdrop').addEventListener('click', () => {
      this.closeEventModal();
    });

    document.getElementById('event-form').addEventListener('submit', (e) => {
      this.saveEvent(e);
    });

    document.getElementById('btn-add-course').addEventListener('click', () => {
      this.addGPARow();
    });

    document.getElementById('btn-save-settings').addEventListener('click', () => {
      this.saveSettings();
    });

    document.querySelectorAll('.theme-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.theme-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    document.getElementById('gpa-inputs').addEventListener('input', () => {
      this.calculateGPA();
    });

    document.getElementById('gpa-inputs').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-remove')) {
        const row = e.target.closest('.gpa-row');
        if (row && !row.classList.contains('gpa-header')) {
          row.remove();
          this.calculateGPA();
        }
      }
    });
  },

  switchTab(tabName) {
    document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(c => c.classList.remove('active'));
    const tab = document.querySelector('.nav-tab[data-tab="' + tabName + '"]');
    const panel = document.getElementById('tab-' + tabName);
    if (tab) tab.classList.add('active');
    if (panel) panel.classList.add('active');
    if (tabName === 'stats') this.updateStats();
    if (tabName === 'tracker') Tracker.render();
  },

  startCountdown() {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.updateCountdown();
    this.countdownInterval = setInterval(() => this.updateCountdown(), 1000);
  },

  updateCountdown() {
    if (!this.settings.endDate) {
      var subtitle = document.getElementById('hero-subtitle');
      if (subtitle) subtitle.innerHTML = 'Click the <strong>gear icon</strong> to set your semester dates and start the countdown.';
      if (this.hourglass) this.hourglass.update(0);
      this.updateUpcoming();
      return;
    }

    var now = new Date();
    var end = new Date(this.settings.endDate + 'T23:59:59');
    var start = this.settings.startDate
      ? new Date(this.settings.startDate)
      : new Date(now.getFullYear(), 0, 1);

    var totalMs = end - start;
    var elapsedMs = now - start;
    var remainingMs = end - now;

    var days = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60 * 24)));
    var hours = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
    var minutes = Math.max(0, Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60)));
    var seconds = Math.max(0, Math.floor((remainingMs % (1000 * 60)) / 1000));
    var totalHours = Math.max(0, Math.floor(remainingMs / (1000 * 60 * 60)));

    var cdDaysNum = document.querySelector('#cd-days .cd-num');
    var cdHoursNum = document.querySelector('#cd-hours .cd-num');
    var cdMinutesNum = document.querySelector('#cd-minutes .cd-num');
    var cdSecondsNum = document.querySelector('#cd-seconds .cd-num');

    if (cdDaysNum) cdDaysNum.textContent = days;
    if (cdHoursNum) cdHoursNum.textContent = hours;
    if (cdMinutesNum) cdMinutesNum.textContent = String(minutes).padStart(2, '0');
    if (cdSecondsNum) cdSecondsNum.textContent = String(seconds).padStart(2, '0');

    var totalHoursEl = document.getElementById('total-hours-left');
    if (totalHoursEl) totalHoursEl.textContent = totalHours.toLocaleString();

    var deadlineEl = document.getElementById('deadline-text');
    if (deadlineEl) {
      var pctRemaining = totalMs > 0 ? ((remainingMs / totalMs) * 100).toFixed(1) : '0';
      deadlineEl.textContent = 'Deadline: ' + end.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) + ' \u00B7 ' + pctRemaining + '% of your time remains';
    }

    var progress = totalMs > 0 ? Math.min(1, Math.max(0, elapsedMs / totalMs)) : 0;
    var progressFill = document.getElementById('progress-fill');
    if (progressFill) progressFill.style.width = (progress * 100) + '%';

    if (this.hourglass) this.hourglass.update(progress);

    var daysPassed = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
    var totalDays = Math.ceil(totalMs / (1000 * 60 * 60 * 24));
    var pct = totalDays > 0 ? Math.round((daysPassed / totalDays) * 100) : 0;

    var statDaysPassed = document.getElementById('stat-days-passed');
    if (statDaysPassed) statDaysPassed.textContent = daysPassed;

    var statDaysLeft = document.getElementById('stat-days-left');
    if (statDaysLeft) statDaysLeft.textContent = days;

    var statPercent = document.getElementById('stat-percent');
    if (statPercent) statPercent.textContent = pct + '%';

    var statEventsCount = document.getElementById('stat-events-count');
    if (statEventsCount) {
      var upcoming = this.events.filter(function(e) { return new Date(e.date) > now; });
      statEventsCount.textContent = upcoming.length;
    }

    var statSub1 = document.getElementById('stat-days-passed-sub');
    if (statSub1) statSub1.textContent = pct + '% of your semester';

    var statSub2 = document.getElementById('stat-days-left-sub');
    if (statSub2) statSub2.textContent = days + ' days remaining';

    this.updateUpcoming();
  },

  updateUpcoming() {
    var container = document.getElementById('upcoming-list');
    if (!container) return;

    var now = new Date();
    var upcoming = this.events
      .filter(function(e) { return new Date(e.date) > now; })
      .sort(function(a, b) { return new Date(a.date) - new Date(b.date); })
      .slice(0, 4);

    if (upcoming.length === 0) {
      container.innerHTML = '<div class="upcoming-item" style="justify-content:center;color:var(--text-muted);border-left-color:var(--border)">No upcoming events</div>';
      return;
    }

    var html = '';
    for (var i = 0; i < upcoming.length; i++) {
      var e = upcoming[i];
      var diff = Math.ceil((new Date(e.date) - now) / (1000 * 60 * 60 * 24));
      var dayText = diff === 1 ? '1 day' : diff + ' days';
      html += '<div class="upcoming-item" style="border-left-color:' + e.color + '">' +
        '<span>' + e.name + '</span>' +
        '<span class="days-until">' + dayText + '</span>' +
        '</div>';
    }
    container.innerHTML = html;
  },

  renderEvents() {
    var list = document.getElementById('events-list');
    if (!list) return;
    var now = new Date();

    if (this.events.length === 0) {
      list.innerHTML = '<div class="events-empty">No events yet. Click "+ Add Event" to start tracking exams, assignments, and important dates.</div>';
      return;
    }

    var sorted = this.events.slice().sort(function(a, b) { return new Date(a.date) - new Date(b.date); });
    var self = this;
    var html = '';
    for (var i = 0; i < sorted.length; i++) {
      var e = sorted[i];
      var date = new Date(e.date);
      var isPast = date < now;
      html += '<div class="event-card" style="opacity:' + (isPast ? '0.5' : '1') + '">' +
        '<div class="event-color-dot" style="background:' + e.color + '"></div>' +
        '<div class="event-info">' +
          '<div class="event-name">' + e.name + '</div>' +
          '<div class="event-date">' + date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }) + '</div>' +
        '</div>' +
        '<span class="event-type-badge">' + e.type + '</span>' +
        '<div class="event-actions">' +
          '<button class="edit-btn" data-id="' + e.id + '" title="Edit">&#9998;</button>' +
          '<button class="delete" data-id="' + e.id + '" title="Delete">&#128465;</button>' +
        '</div>' +
      '</div>';
    }
    list.innerHTML = html;

    list.querySelectorAll('.edit-btn').forEach(function(btn) {
      btn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        self.editEvent(btn.dataset.id);
      });
    });

    list.querySelectorAll('.delete').forEach(function(btn) {
      btn.addEventListener('click', function(ev) {
        ev.stopPropagation();
        self.deleteEvent(btn.dataset.id);
      });
    });
  },

  openEventModal(event) {
    var modal = document.getElementById('event-modal');
    if (!modal) return;
    modal.classList.remove('hidden');

    var eyebrow = document.getElementById('modal-eyebrow');
    var title = document.getElementById('modal-title');
    if (eyebrow) eyebrow.textContent = event ? 'EDIT EVENT' : 'NEW EVENT';
    if (title) title.textContent = event ? 'Edit this event' : "What's happening?";

    if (event) {
      document.getElementById('event-id').value = event.id;
      document.getElementById('event-name').value = event.name;
      document.getElementById('event-date').value = event.date;
      document.getElementById('event-type').value = event.type;
      document.getElementById('event-color').value = event.color;
    } else {
      document.getElementById('event-form').reset();
      document.getElementById('event-id').value = '';
      document.getElementById('event-color').value = '#e74c3c';
      document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
    }
  },

  closeEventModal() {
    var modal = document.getElementById('event-modal');
    if (modal) modal.classList.add('hidden');
  },

  saveEvent(e) {
    e.preventDefault();
    var id = document.getElementById('event-id').value;
    var eventData = {
      id: id || Storage.generateId(),
      name: document.getElementById('event-name').value.trim(),
      date: document.getElementById('event-date').value,
      type: document.getElementById('event-type').value,
      color: document.getElementById('event-color').value,
    };

    if (!eventData.name || !eventData.date) return;

    if (id) {
      for (var i = 0; i < this.events.length; i++) {
        if (this.events[i].id === id) {
          this.events[i] = eventData;
          break;
        }
      }
    } else {
      this.events.push(eventData);
    }

    Storage.saveEvents(this.events);
    this.closeEventModal();
    this.renderEvents();
    this.updateUpcoming();
  },

  editEvent(id) {
    for (var i = 0; i < this.events.length; i++) {
      if (this.events[i].id === id) {
        this.openEventModal(this.events[i]);
        break;
      }
    }
  },

  deleteEvent(id) {
    this.events = this.events.filter(function(e) { return e.id !== id; });
    Storage.saveEvents(this.events);
    this.renderEvents();
    this.updateUpcoming();
  },

  updateStats() {
    var s = this.settings;
    if (!s.endDate || !s.startDate) return;

    var now = new Date();
    var start = new Date(s.startDate);
    var end = new Date(s.endDate);

    var totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    var daysPassed = Math.max(0, Math.floor((now - start) / (1000 * 60 * 60 * 24)));
    var daysLeft = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
    var percent = totalDays > 0 ? Math.round((daysPassed / totalDays) * 100) : 0;

    var el2 = function(id) { return document.getElementById(id); };
    if (el2('stat-days-passed-2')) el2('stat-days-passed-2').textContent = daysPassed;
    if (el2('stat-days-left-2')) el2('stat-days-left-2').textContent = daysLeft;
    if (el2('stat-percent-2')) el2('stat-percent-2').textContent = percent + '%';
    if (el2('stat-total-days-2')) el2('stat-total-days-2').textContent = totalDays;
  },

  addGPARow() {
    var container = document.getElementById('gpa-inputs');
    if (!container) return;
    var row = document.createElement('div');
    row.className = 'gpa-row';
    row.innerHTML =
      '<input type="text" placeholder="Course name" class="gpa-course">' +
      '<input type="number" min="0" max="4" step="0.1" placeholder="0.0" class="gpa-grade">' +
      '<input type="number" min="1" max="6" placeholder="3" class="gpa-credits">' +
      '<button class="btn-remove" type="button">&times;</button>';
    container.appendChild(row);
  },

  calculateGPA() {
    var rows = document.querySelectorAll('#gpa-inputs .gpa-row:not(.gpa-header)');
    var totalPoints = 0;
    var totalCredits = 0;

    rows.forEach(function(row) {
      var gpaInput = row.querySelector('.gpa-grade');
      var creditsInput = row.querySelector('.gpa-credits');
      var gpa = gpaInput ? parseFloat(gpaInput.value) : NaN;
      var credits = creditsInput ? parseInt(creditsInput.value) : NaN;
      if (!isNaN(gpa) && !isNaN(credits) && credits > 0) {
        totalPoints += gpa * credits;
        totalCredits += credits;
      }
    });

    var cgpa = totalCredits > 0 ? (totalPoints / totalCredits).toFixed(2) : '0.00';
    var gpaValue = document.getElementById('gpa-value');
    if (gpaValue) gpaValue.textContent = cgpa;
  },

  populateSettings() {
    var cn = document.getElementById('setting-college-name');
    var sd = document.getElementById('setting-start-date');
    var ed = document.getElementById('setting-end-date');
    if (cn) cn.value = this.settings.collegeName || '';
    if (sd) sd.value = this.settings.startDate || '';
    if (ed) ed.value = this.settings.endDate || '';

    document.querySelectorAll('.theme-btn').forEach(function(btn) {
      btn.classList.toggle('active', btn.dataset.theme === App.settings.theme);
    });
  },

  saveSettings() {
    var cn = document.getElementById('setting-college-name');
    var sd = document.getElementById('setting-start-date');
    var ed = document.getElementById('setting-end-date');

    this.settings.collegeName = cn ? cn.value.trim() : '';
    this.settings.startDate = sd ? sd.value : '';
    this.settings.endDate = ed ? ed.value : '';

    var activeTheme = document.querySelector('.theme-btn.active');
    if (activeTheme) this.settings.theme = activeTheme.dataset.theme;

    Storage.saveSettings(this.settings);
    this.applyTheme(this.settings.theme);
    this.startCountdown();
    this.updateStats();

    document.getElementById('settings-panel').classList.add('hidden');
  },

  applyTheme(theme) {
    document.body.className = theme || 'dark';
  },
};

document.addEventListener('DOMContentLoaded', function() { App.init(); });
