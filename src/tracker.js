var Tracker = {
  data: { habits: [], entries: {} },
  startDate: null,
  endDate: null,

  async init() {
    this.data = await Storage.loadTracker();
    if (!this.data.habits) this.data.habits = [];
    if (!this.data.entries) this.data.entries = {};
    this.bindEvents();
    this.render();
  },

  bindEvents() {
    document.getElementById('btn-add-habit').addEventListener('click', function() {
      Tracker.openHabitModal();
    });

    document.getElementById('habit-form').addEventListener('submit', function(e) {
      e.preventDefault();
      Tracker.saveHabit();
    });

    document.getElementById('btn-cancel-habit').addEventListener('click', function() {
      Tracker.closeHabitModal();
    });

    document.getElementById('habit-modal-backdrop').addEventListener('click', function() {
      Tracker.closeHabitModal();
    });

    document.getElementById('cell-popup-backdrop').addEventListener('click', function() {
      Tracker.closeCellPopup();
    });

    document.getElementById('btn-save-cell').addEventListener('click', function() {
      Tracker.saveCell();
    });

    document.getElementById('btn-delete-habit').addEventListener('click', function() {
      Tracker.deleteHabit();
    });
  },

  render() {
    this.setDateRange();
    this.renderKey();
    this.renderGrid();
    this.renderStats();
  },

  setDateRange() {
    var settings = App.settings;
    if (settings.startDate) {
      this.startDate = new Date(settings.startDate);
    } else {
      this.startDate = new Date();
      this.startDate.setMonth(this.startDate.getMonth() - 2);
    }

    this.endDate = new Date();
    this.endDate.setDate(this.endDate.getDate() + 14);

    var dayOfWeek = this.startDate.getDay();
    var offset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    this.startDate.setDate(this.startDate.getDate() - offset);
  },

  renderKey() {
    var keyEl = document.getElementById('tracker-key');
    var html = '';
    for (var i = 0; i < this.data.habits.length; i++) {
      var h = this.data.habits[i];
      html += '<div class="key-item" data-id="' + h.id + '">' +
        '<span class="key-dot" style="background:' + h.color + '"></span>' +
        '<span class="key-name">' + h.name + '</span>' +
        '</div>';
    }
    keyEl.innerHTML = html;

    var self = this;
    keyEl.querySelectorAll('.key-item').forEach(function(item) {
      item.addEventListener('click', function() {
        self.editHabit(item.dataset.id);
      });
    });
  },

  renderGrid() {
    var gridEl = document.getElementById('heatmap-grid');
    var monthsEl = document.getElementById('heatmap-months');
    if (!gridEl) return;

    var weeks = this.getWeeks();
    var dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    var today = new Date().toISOString().split('T')[0];

    var monthHtml = '';
    var currentMonth = -1;
    for (var w = 0; w < weeks.length; w++) {
      var firstDay = weeks[w][0];
      var d = new Date(firstDay);
      var m = d.getMonth();
      if (m !== currentMonth) {
        currentMonth = m;
        monthHtml += '<span class="month-label" style="grid-column:' + (w + 1) + '">' + monthNames[m] + ' ' + d.getFullYear() + '</span>';
      }
    }
    monthsEl.innerHTML = monthHtml;
    monthsEl.style.gridTemplateColumns = 'repeat(' + weeks.length + ', 14px)';

    var gridHtml = '';
    for (var day = 0; day < 7; day++) {
      for (var w = 0; w < weeks.length; w++) {
        var dateStr = weeks[w][day];
        if (!dateStr) {
          gridHtml += '<div class="heat-cell heat-cell-empty"></div>';
          continue;
        }

        var pct = this.getDatePct(dateStr);
        var color = this.getCellColor(pct);
        var isToday = dateStr === today;
        var cls = 'heat-cell' + (isToday ? ' heat-cell-today' : '');

        gridHtml += '<div class="' + cls + '" data-date="' + dateStr + '" data-pct="' + pct + '" style="background:' + color + '"></div>';
      }
    }
    gridEl.innerHTML = gridHtml;
    gridEl.style.gridTemplateColumns = 'repeat(' + weeks.length + ', 14px)';

    var self = this;
    gridEl.querySelectorAll('.heat-cell:not(.heat-cell-empty)').forEach(function(cell) {
      cell.addEventListener('click', function(e) {
        e.stopPropagation();
        self.openCellPopup(cell.dataset.date, e);
      });

      cell.addEventListener('mouseenter', function(e) {
        self.showTooltip(cell.dataset.date, cell.dataset.pct, e);
      });

      cell.addEventListener('mouseleave', function() {
        self.hideTooltip();
      });
    });
  },

  getWeeks() {
    var weeks = [];
    var current = new Date(this.startDate);
    var end = new Date(this.endDate);

    while (current <= end) {
      var week = [];
      for (var d = 0; d < 7; d++) {
        if (current <= end) {
          week.push(current.toISOString().split('T')[0]);
        } else {
          week.push(null);
        }
        current.setDate(current.getDate() + 1);
      }
      weeks.push(week);
    }
    return weeks;
  },

  getDatePct(dateStr) {
    var done = this.data.entries[dateStr] || [];
    if (done.length === 0 || this.data.habits.length === 0) return 0;
    return Math.round((done.length / this.data.habits.length) * 100);
  },

  getCellColor(pct) {
    if (pct === 0) return 'var(--heatmap-empty)';
    if (pct <= 33) return '#0e3d22';
    if (pct <= 66) return '#1a5c35';
    if (pct < 100) return '#267d42';
    return '#39d353';
  },

  showTooltip(dateStr, pct, e) {
    var tip = document.getElementById('heatmap-tooltip');
    var done = this.data.entries[dateStr] || [];
    var d = new Date(dateStr + 'T12:00:00');
    var dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    var label = dayNames[d.getDay()] + ', ' + monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();
    var habitNames = [];
    for (var i = 0; i < done.length; i++) {
      for (var j = 0; j < this.data.habits.length; j++) {
        if (this.data.habits[j].id === done[i]) {
          habitNames.push(this.data.habits[j].name);
          break;
        }
      }
    }

    var text = label + '\n' + pct + '% completed';
    if (habitNames.length > 0) {
      text += '\n' + habitNames.join(', ');
    }

    tip.textContent = text;
    tip.classList.add('visible');
    tip.style.left = e.clientX + 12 + 'px';
    tip.style.top = e.clientY - 10 + 'px';
  },

  hideTooltip() {
    document.getElementById('heatmap-tooltip').classList.remove('visible');
  },

  openCellPopup(dateStr, e) {
    var popup = document.getElementById('cell-popup');
    var backdrop = document.getElementById('cell-popup-backdrop');
    var checkboxes = document.getElementById('cell-habit-checkboxes');

    popup.dataset.date = dateStr;
    var done = this.data.entries[dateStr] || [];
    var d = new Date(dateStr + 'T12:00:00');
    var monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    document.getElementById('cell-popup-date').textContent = monthNames[d.getMonth()] + ' ' + d.getDate() + ', ' + d.getFullYear();

    var html = '';
    for (var i = 0; i < this.data.habits.length; i++) {
      var h = this.data.habits[i];
      var checked = done.indexOf(h.id) !== -1 ? 'checked' : '';
      html += '<label class="popup-checkbox">' +
        '<input type="checkbox" value="' + h.id + '" ' + checked + '>' +
        '<span class="popup-check-dot" style="background:' + h.color + '"></span>' +
        '<span>' + h.name + '</span>' +
        '</label>';
    }
    if (this.data.habits.length === 0) {
      html = '<p style="color:var(--text-muted);font-size:13px;">No habits yet. Add one first!</p>';
    }
    checkboxes.innerHTML = html;

    backdrop.classList.add('visible');
    popup.classList.add('visible');

    var popupRect = popup.getBoundingClientRect();
    popup.style.left = Math.min(e.clientX + 10, window.innerWidth - popupRect.width - 20) + 'px';
    popup.style.top = Math.min(e.clientY - 20, window.innerHeight - popupRect.height - 20) + 'px';
  },

  closeCellPopup() {
    document.getElementById('cell-popup').classList.remove('visible');
    document.getElementById('cell-popup-backdrop').classList.remove('visible');
  },

  saveCell() {
    var popup = document.getElementById('cell-popup');
    var dateStr = popup.dataset.date;
    var checkboxes = popup.querySelectorAll('input[type="checkbox"]');
    var selected = [];

    checkboxes.forEach(function(cb) {
      if (cb.checked) selected.push(cb.value);
    });

    if (selected.length === 0) {
      delete this.data.entries[dateStr];
    } else {
      this.data.entries[dateStr] = selected;
    }

    Storage.saveTracker(this.data);
    this.closeCellPopup();
    this.renderGrid();
    this.renderStats();
  },

  openHabitModal(habit) {
    var modal = document.getElementById('habit-modal');
    var backdrop = document.getElementById('habit-modal-backdrop');
    var title = document.getElementById('habit-modal-title');
    var nameInput = document.getElementById('habit-name');
    var colorInput = document.getElementById('habit-color');
    var deleteBtn = document.getElementById('btn-delete-habit');

    if (habit) {
      title.textContent = 'Edit Habit';
      nameInput.value = habit.name;
      colorInput.value = habit.color;
      modal.dataset.editId = habit.id;
      deleteBtn.style.display = 'block';
    } else {
      title.textContent = 'Add Habit';
      nameInput.value = '';
      colorInput.value = '#39d353';
      modal.dataset.editId = '';
      deleteBtn.style.display = 'none';
    }

    modal.classList.remove('hidden');
    backdrop.classList.add('visible');
    modal.classList.add('visible');
  },

  closeHabitModal() {
    document.getElementById('habit-modal').classList.remove('visible');
    document.getElementById('habit-modal').classList.add('hidden');
    document.getElementById('habit-modal-backdrop').classList.remove('visible');
  },

  saveHabit() {
    var name = document.getElementById('habit-name').value.trim();
    var color = document.getElementById('habit-color').value;
    var editId = document.getElementById('habit-modal').dataset.editId;

    if (!name) return;

    if (editId) {
      for (var i = 0; i < this.data.habits.length; i++) {
        if (this.data.habits[i].id === editId) {
          this.data.habits[i].name = name;
          this.data.habits[i].color = color;
          break;
        }
      }
    } else {
      this.data.habits.push({
        id: Storage.generateId(),
        name: name,
        color: color
      });
    }

    Storage.saveTracker(this.data);
    this.closeHabitModal();
    this.render();
  },

  editHabit(id) {
    for (var i = 0; i < this.data.habits.length; i++) {
      if (this.data.habits[i].id === id) {
        this.openHabitModal(this.data.habits[i]);
        break;
      }
    }
  },

  deleteHabit() {
    var editId = document.getElementById('habit-modal').dataset.editId;
    if (!editId) return;

    this.data.habits = this.data.habits.filter(function(h) { return h.id !== editId; });

    for (var date in this.data.entries) {
      this.data.entries[date] = this.data.entries[date].filter(function(id) { return id !== editId; });
      if (this.data.entries[date].length === 0) {
        delete this.data.entries[date];
      }
    }

    Storage.saveTracker(this.data);
    this.closeHabitModal();
    this.render();
  },

  renderStats() {
    var today = new Date();
    var todayStr = today.toISOString().split('T')[0];

    var streak = 0;
    var checkDate = new Date(today);
    while (true) {
      var ds = checkDate.toISOString().split('T')[0];
      var done = this.data.entries[ds] || [];
      if (done.length === 0) break;
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    }

    var monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    var daysInMonth = 0;
    var daysCompleted = 0;
    var check = new Date(monthStart);
    while (check <= today) {
      daysInMonth++;
      var ds2 = check.toISOString().split('T')[0];
      var done2 = this.data.entries[ds2] || [];
      if (done2.length > 0) daysCompleted++;
      check.setDate(check.getDate() + 1);
    }

    var bestStreak = 0;
    var tempStreak = 0;
    var allDates = Object.keys(this.data.entries).sort();
    for (var i = 0; i < allDates.length; i++) {
      if (this.data.entries[allDates[i]].length > 0) {
        if (i === 0) {
          tempStreak = 1;
        } else {
          var prev = new Date(allDates[i - 1] + 'T12:00:00');
          var curr = new Date(allDates[i] + 'T12:00:00');
          var diffDays = Math.round((curr - prev) / (1000 * 60 * 60 * 24));
          if (diffDays === 1) {
            tempStreak++;
          } else {
            tempStreak = 1;
          }
        }
        if (tempStreak > bestStreak) bestStreak = tempStreak;
      }
    }

    document.getElementById('tracker-streak').textContent = streak;
    document.getElementById('tracker-month').textContent = daysCompleted + '/' + daysInMonth;
    document.getElementById('tracker-best').textContent = bestStreak;
  }
};
