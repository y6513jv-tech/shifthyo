
/**
 * ShiftSync Pro - Vanilla JS Implementation
 */

// --- Constants & Defaults ---
const SHIFT_TYPES = ['早番', '日勤', '遅番', '夜勤', '休日', 'その他'];
const WEEKDAYS = ['日', '月', '火', '水', '木', '金', '土'];

const DEFAULT_SHIFT_COLORS = {
  '早番': { bg: '#fef3c7', text: '#b45309' },
  '日勤': { bg: '#dcfce7', text: '#15803d' },
  '遅番': { bg: '#dbeafe', text: '#1d4ed8' },
  '夜勤': { bg: '#e0e7ff', text: '#4338ca' },
  '休日': { bg: '#ffe4e6', text: '#be123c' },
  'その他': { bg: '#f1f5f9', text: '#334155' },
};

const DEFAULT_UI_THEME = {
  cellBg: '#0f172a66',
  borderColor: '#33415550',
  dateColor: '#94a3b8',
  satColor: '#3b82f6',
  sunColor: '#f43f5e',
  headerColor: '#64748b',
};

const BACKGROUND_PRESETS = [
  { name: 'Midnight', color: '#000000' },
  { name: 'Navy', color: '#0f172a' },
  { name: 'Deep Purple', color: '#1e1b4b' },
  { name: 'Forest', color: '#064e3b' },
  { name: 'Bordeaux', color: '#450a0a' },
];

// --- State Management ---
let state = {
  currentDate: new Date(),
  shifts: [], // { id, date, type, startTime, endTime, note }
  shiftColors: { ...DEFAULT_SHIFT_COLORS },
  uiTheme: { ...DEFAULT_UI_THEME },
  appBackground: '#000000',
  selectedDate: new Date(),
  isStampMode: false,
  activeStamp: '日勤',
  viewMode: 'calendar' // 'calendar' or 'dashboard'
};

// --- Initialization ---
function init() {
  loadFromStorage();
  applyTheme();
  renderWeekdays();
  renderCalendar();
  updateMonthDisplay();
  setupEventListeners();
  renderSettings();
  updateSelectedDayPanel();
  renderDashboard();
}

// --- Storage Logic ---
function saveToStorage() {
  localStorage.setItem('shift_sync_data', JSON.stringify({
    shifts: state.shifts,
    shiftColors: state.shiftColors,
    uiTheme: state.uiTheme,
    appBackground: state.appBackground
  }));
}

function loadFromStorage() {
  const saved = localStorage.getItem('shift_sync_data');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      state.shifts = parsed.shifts || [];
      state.shiftColors = parsed.shiftColors || { ...DEFAULT_SHIFT_COLORS };
      state.uiTheme = parsed.uiTheme || { ...DEFAULT_UI_THEME };
      state.appBackground = parsed.appBackground || '#000000';
    } catch (e) {
      console.error('Storage parse error:', e);
    }
  }
}

// --- Holiday Calculation ---
function getJapaneseHolidays(year, month) {
  const holidays = {};
  const add = (day, name) => {
    if (day < 1 || day > 31) return;
    holidays[`${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`] = name;
  };

  const getVernalEquinox = (y) => Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  const getAutumnalEquinox = (y) => Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
  const getNthMonday = (y, m, nth) => {
    const firstDay = new Date(y, m - 1, 1).getDay();
    let firstMonday = 1 + (8 - firstDay) % 7;
    if (firstDay === 1) firstMonday = 1;
    return firstMonday + (nth - 1) * 7;
  };

  if (month === 1) { add(1, '元日'); add(getNthMonday(year, 1, 2), '成人の日'); }
  if (month === 2) { add(11, '建国記念の日'); add(23, '天皇誕生日'); }
  if (month === 3) add(getVernalEquinox(year), '春分の日');
  if (month === 4) add(29, '昭和の日');
  if (month === 5) { add(3, '憲法記念日'); add(4, 'みどりの日'); add(5, 'こどもの日'); }
  if (month === 7) add(getNthMonday(year, 7, 3), '海の日');
  if (month === 8) add(11, '山の日');
  if (month === 9) { add(getNthMonday(year, 9, 3), '敬老の日'); add(getAutumnalEquinox(year), '秋分の日'); }
  if (month === 10) add(getNthMonday(year, 10, 2), 'スポーツの日');
  if (month === 11) { add(3, '文化の日'); add(23, '勤労感謝の日'); }

  return holidays;
}

// --- Dashboard & Chart Logic ---
function renderDashboard() {
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth() + 1;
  const targetYM = `${year}-${String(month).padStart(2, '0')}`;
  
  const monthShifts = state.shifts.filter(s => s.date.startsWith(targetYM));
  
  // Stats counters
  const statsGrid = document.getElementById('stats-grid');
  let totalCount = 0;
  const counts = {};
  
  statsGrid.innerHTML = SHIFT_TYPES.map(type => {
    const count = monthShifts.filter(s => s.type === type).length;
    counts[type] = count;
    totalCount += count;
    const colors = state.shiftColors[type];
    return `
      <div class="bg-black/20 border border-white/5 p-4 rounded-2xl text-center">
        <div class="text-[9px] font-black text-slate-500 mb-1 truncate">${type}</div>
        <div class="text-2xl font-black" style="color:${colors.text}">${count}</div>
      </div>
    `;
  }).join('');

  document.getElementById('total-shifts-count').textContent = totalCount;

  // Pie Chart
  const chartSvg = document.getElementById('chart-svg');
  const legend = document.getElementById('chart-legend');
  chartSvg.innerHTML = '';
  legend.innerHTML = '';

  if (totalCount === 0) {
    chartSvg.innerHTML = `<circle cx="0" cy="0" r="0.9" fill="rgba(255,255,255,0.05)"/>`;
  } else {
    let cumulative = 0;
    const slices = SHIFT_TYPES.filter(type => counts[type] > 0).map(type => {
      const percent = counts[type] / totalCount;
      const startX = Math.cos(2 * Math.PI * cumulative);
      const startY = Math.sin(2 * Math.PI * cumulative);
      cumulative += percent;
      const endX = Math.cos(2 * Math.PI * cumulative);
      const endY = Math.sin(2 * Math.PI * cumulative);
      const largeArc = percent > 0.5 ? 1 : 0;
      
      const colors = state.shiftColors[type];
      
      // Add Legend
      const legendItem = document.createElement('div');
      legendItem.className = 'flex items-center gap-2 bg-black/20 border border-white/5 px-3 py-2 rounded-xl';
      legendItem.innerHTML = `
        <div class="w-2.5 h-2.5 rounded-full" style="background-color:${colors.text}"></div>
        <span class="text-[10px] font-black text-slate-300 flex-1">${type}</span>
        <span class="text-[10px] font-bold text-slate-500">${Math.round(percent * 100)}%</span>
      `;
      legend.appendChild(legendItem);

      return `<path d="M ${startX} ${startY} A 1 1 0 ${largeArc} 1 ${endX} ${endY} L 0 0" fill="${colors.text}"/>`;
    });
    chartSvg.innerHTML = slices.join('') + `<circle cx="0" cy="0" r="0.65" fill="${state.appBackground}"/>`;
  }

  // Reality Cards (Today/Tomorrow)
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);

  const realityContainer = document.getElementById('reality-cards-container');
  realityContainer.innerHTML = '';
  [
    { date: today, label: 'Today' },
    { date: tomorrow, label: 'Tomorrow' }
  ].forEach(item => {
    const dateStr = getLocalDateString(item.date);
    const shift = state.shifts.find(s => s.date === dateStr);
    const colors = shift ? state.shiftColors[shift.type] : null;

    const card = document.createElement('div');
    card.className = 'flex-1 glass border border-white/5 rounded-[2rem] p-5 md:p-6 transition-all hover:bg-white/5 cursor-pointer active:scale-95';
    card.innerHTML = `
      <div class="flex justify-between items-center mb-4">
        <span class="text-[10px] font-black uppercase tracking-widest text-slate-500">${item.label}</span>
        <span class="text-[10px] font-bold text-slate-500">${item.date.getMonth()+1}/${item.date.getDate()} (${WEEKDAYS[item.date.getDay()]})</span>
      </div>
      ${shift ? `
        <div class="inline-block px-2.5 py-0.5 rounded-lg text-[10px] font-black mb-2" style="background-color:${colors.bg}; color:${colors.text}">${shift.type}</div>
        <div class="text-2xl font-black text-white tracking-tighter">${shift.startTime || '--:--'} <span class="text-slate-600 mx-1">-</span> ${shift.endTime || '--:--'}</div>
        ${shift.note ? `<p class="mt-2 text-[10px] text-slate-500 italic truncate">${shift.note}</p>` : ''}
      ` : `
        <div class="h-16 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-2xl">
          <span class="text-xs font-bold text-slate-600 tracking-wider">予定なし</span>
        </div>
      `}
    `;
    card.onclick = () => {
      state.selectedDate = item.date;
      openShiftModal(item.date);
    };
    realityContainer.appendChild(card);
  });
}

// --- Render Logic (Calendar) ---
function applyTheme() {
  document.documentElement.style.setProperty('--app-bg', state.appBackground);
  document.body.style.backgroundColor = state.appBackground;
  // Dashboard SVG hole needs sync
  const hole = document.querySelector('#chart-svg circle[fill^="#"]');
  if (hole) hole.setAttribute('fill', state.appBackground);
}

function updateMonthDisplay() {
  document.getElementById('display-year').textContent = `${state.currentDate.getFullYear()}年`;
  document.getElementById('display-month').textContent = `${state.currentDate.getMonth() + 1}月`;
}

function renderWeekdays() {
  const container = document.getElementById('calendar-weekdays');
  container.innerHTML = WEEKDAYS.map((day, idx) => {
    let color = state.uiTheme.headerColor;
    if (idx === 0) color = state.uiTheme.sunColor;
    if (idx === 6) color = state.uiTheme.satColor;
    return `<div style="color: ${color}">${day}</div>`;
  }).join('');
}

function renderCalendar() {
  const container = document.getElementById('calendar-days');
  container.innerHTML = '';
  
  const year = state.currentDate.getFullYear();
  const month = state.currentDate.getMonth();
  const holidays = getJapaneseHolidays(year, month + 1);

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();
  const totalCells = Math.ceil((firstDay + lastDate) / 7) * 7;

  const todayStr = getLocalDateString(new Date());
  const selectedStr = getLocalDateString(state.selectedDate);

  for (let i = 0; i < totalCells; i++) {
    const dayElement = document.createElement('div');
    dayElement.className = 'calendar-cell border-b border-r p-2 cursor-pointer relative group flex flex-col';
    dayElement.style.backgroundColor = state.uiTheme.cellBg;
    dayElement.style.borderColor = state.uiTheme.borderColor;
    if ((i + 1) % 7 === 0) dayElement.style.borderRightWidth = '0';

    if (i >= firstDay && i < firstDay + lastDate) {
      const dateNum = i - firstDay + 1;
      const dateObj = new Date(year, month, dateNum);
      const dateStr = getLocalDateString(dateObj);
      const isHoliday = !!holidays[dateStr];
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedStr;
      const dow = dateObj.getDay();

      let dateColor = state.uiTheme.dateColor;
      if (dow === 0 || isHoliday) dateColor = state.uiTheme.sunColor;
      if (dow === 6 && !isHoliday) dateColor = state.uiTheme.satColor;

      dayElement.innerHTML = `
        <div class="flex flex-col items-start mb-1">
          <span class="inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black ${isToday ? 'bg-blue-600 text-white shadow-lg' : ''}" style="${!isToday ? 'color:' + dateColor : ''}">${dateNum}</span>
          ${isHoliday ? `<span class="text-[8px] font-bold truncate w-full" style="color:${state.uiTheme.sunColor}">${holidays[dateStr]}</span>` : ''}
        </div>
        <div class="flex-grow flex flex-col gap-0.5 mt-auto" id="shifts-${dateStr}"></div>
        <div class="absolute inset-0 border-2 rounded-[1rem] m-0.5 pointer-events-none transition-all ${isSelected ? 'border-blue-500/40 bg-blue-500/5' : 'border-transparent group-hover:bg-white/5'}"></div>
      `;

      dayElement.addEventListener('click', () => handleDateClick(dateObj));
      
      const dayShifts = state.shifts.filter(s => s.date === dateStr);
      const shiftContainer = dayElement.querySelector(`#shifts-${dateStr}`);
      dayShifts.forEach(s => {
        const colors = state.shiftColors[s.type];
        const tag = document.createElement('div');
        tag.className = 'shift-tag';
        tag.textContent = s.type;
        tag.style.backgroundColor = colors.bg;
        tag.style.color = colors.text;
        shiftContainer.appendChild(tag);
      });
    } else {
      dayElement.className += ' bg-black/10';
    }
    container.appendChild(dayElement);
  }
}

function updateSelectedDayPanel() {
  const panel = document.getElementById('selected-day-panel');
  const dateStr = getLocalDateString(state.selectedDate);
  const shift = state.shifts.find(s => s.date === dateStr);

  panel.classList.remove('hidden');
  const options = { month: 'numeric', day: 'numeric', weekday: 'short' };
  document.getElementById('selected-date-text').textContent = state.selectedDate.toLocaleDateString('ja-JP', options);

  const tag = document.getElementById('selected-shift-tag');
  const timeBox = document.getElementById('selected-time-box');
  const noteBox = document.getElementById('selected-note-box');

  if (shift) {
    tag.classList.remove('hidden');
    tag.textContent = shift.type;
    tag.className = 'px-3 py-1 rounded-lg text-xs font-black';
    tag.style.backgroundColor = state.shiftColors[shift.type].bg;
    tag.style.color = state.shiftColors[shift.type].text;

    if (shift.startTime || shift.endTime) {
      timeBox.classList.remove('hidden');
      document.getElementById('selected-start-time').textContent = shift.startTime || '--:--';
      document.getElementById('selected-end-time').textContent = shift.endTime || '--:--';
    } else {
      timeBox.classList.add('hidden');
    }

    noteBox.textContent = shift.note || 'メモはありません';
    noteBox.classList.remove('italic', 'text-slate-600');
  } else {
    tag.classList.add('hidden');
    timeBox.classList.add('hidden');
    noteBox.textContent = '予定はありません';
    noteBox.classList.add('italic', 'text-slate-600');
  }
}

// --- Event Handlers ---
function switchView(mode) {
  state.viewMode = mode;
  const calContainer = document.getElementById('view-container-calendar');
  const dashContainer = document.getElementById('view-container-dashboard');
  const calBtn = document.getElementById('view-calendar');
  const dashBtn = document.getElementById('view-dashboard');

  if (mode === 'calendar') {
    calContainer.classList.remove('hidden');
    dashContainer.classList.add('hidden');
    calBtn.classList.add('view-btn-active');
    calBtn.classList.remove('text-slate-500');
    dashBtn.classList.remove('view-btn-active');
    dashBtn.classList.add('text-slate-500');
    renderCalendar();
  } else {
    calContainer.classList.add('hidden');
    dashContainer.classList.remove('hidden');
    dashBtn.classList.add('view-btn-active');
    dashBtn.classList.remove('text-slate-500');
    calBtn.classList.remove('view-btn-active');
    calBtn.classList.add('text-slate-500');
    renderDashboard();
  }
}

function handleDateClick(date) {
  state.selectedDate = date;
  if (state.isStampMode) {
    applyStamp(date);
  } else {
    updateSelectedDayPanel();
    renderCalendar();
  }
}

function applyStamp(date) {
  const dateStr = getLocalDateString(date);
  const existingIdx = state.shifts.findIndex(s => s.date === dateStr);
  if (existingIdx > -1) {
    state.shifts[existingIdx].type = state.activeStamp;
  } else {
    state.shifts.push({ id: crypto.randomUUID(), date: dateStr, type: state.activeStamp, startTime: '', endTime: '', note: '' });
  }
  saveToStorage();
  renderCalendar();
  updateSelectedDayPanel();
}

function openShiftModal(date = state.selectedDate) {
  const dateStr = getLocalDateString(date);
  const shift = state.shifts.find(s => s.date === dateStr);
  document.getElementById('modal-title').textContent = `${date.toLocaleDateString('ja-JP')} のシフト`;
  document.getElementById('form-date').value = dateStr;
  document.getElementById('form-start').value = shift?.startTime || '';
  document.getElementById('form-end').value = shift?.endTime || '';
  document.getElementById('form-note').value = shift?.note || '';
  const deleteBtn = document.getElementById('delete-shift-btn');
  if (shift) deleteBtn.classList.remove('hidden'); else deleteBtn.classList.add('hidden');
  renderShiftTypeButtons(shift?.type || '日勤');
  document.getElementById('shift-modal').classList.remove('hidden');
}

function renderShiftTypeButtons(activeType) {
  const grid = document.getElementById('shift-type-grid');
  grid.innerHTML = SHIFT_TYPES.map(type => {
    const colors = state.shiftColors[type];
    const isActive = type === activeType;
    return `<button type="button" class="shift-type-choice py-3 rounded-xl border-2 text-xs font-black transition-all" data-type="${type}" style="background-color: ${isActive ? colors.bg : '#00000033'}; color: ${isActive ? colors.text : '#555'}; border-color: ${isActive ? colors.text : '#1e293b'}">${type}</button>`;
  }).join('');
  document.querySelectorAll('.shift-type-choice').forEach(btn => btn.onclick = (e) => renderShiftTypeButtons(e.target.dataset.type));
}

function renderSettings() {
  const colorGrid = document.getElementById('settings-colors-grid');
  colorGrid.innerHTML = SHIFT_TYPES.map(type => `
    <div class="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
      <div class="flex items-center justify-between"><span class="px-3 py-1 rounded-lg text-xs font-black" style="background-color:${state.shiftColors[type].bg}; color:${state.shiftColors[type].text}">${type}</span></div>
      <div class="grid grid-cols-2 gap-2">
        <input type="color" class="w-full h-10 rounded bg-transparent cursor-pointer color-setting-bg" data-type="${type}" value="${state.shiftColors[type].bg}">
        <input type="color" class="w-full h-10 rounded bg-transparent cursor-pointer color-setting-text" data-type="${type}" value="${state.shiftColors[type].text}">
      </div>
    </div>
  `).join('');

  const uiGrid = document.getElementById('settings-ui-grid');
  const uiItems = [{ label: 'セルの背景', key: 'cellBg' }, { label: '枠線の色', key: 'borderColor' }, { label: '日付文字', key: 'dateColor' }, { label: '土曜日', key: 'satColor' }, { label: '日曜日/祝日', key: 'sunColor' }, { label: 'ヘッダー文字', key: 'headerColor' }];
  uiGrid.innerHTML = uiItems.map(item => `<div class="bg-black/20 p-3 rounded-2xl border border-white/5"><label class="block text-[10px] font-bold text-slate-500 mb-2 truncate">${item.label}</label><input type="color" class="w-full h-8 bg-transparent cursor-pointer ui-setting" data-key="${item.key}" value="${state.uiTheme[item.key].substring(0, 7)}"></div>`).join('');

  const presetContainer = document.getElementById('background-presets');
  presetContainer.innerHTML = BACKGROUND_PRESETS.map(p => `<button class="bg-preset w-12 h-12 rounded-xl border-2 transition-all ${state.appBackground === p.color ? 'border-white scale-110' : 'border-transparent'}" style="background-color:${p.color}" data-color="${p.color}"></button>`).join('') + `<input type="color" id="custom-bg-picker" class="w-12 h-12 bg-transparent cursor-pointer" value="${state.appBackground}">`;
  attachSettingsEvents();
}

function attachSettingsEvents() {
  const updateAll = () => { saveToStorage(); renderCalendar(); renderDashboard(); renderSettings(); updateSelectedDayPanel(); updateStampToolbar(); };
  document.querySelectorAll('.color-setting-bg').forEach(el => el.oninput = (e) => { state.shiftColors[e.target.dataset.type].bg = e.target.value; updateAll(); });
  document.querySelectorAll('.color-setting-text').forEach(el => el.oninput = (e) => { state.shiftColors[e.target.dataset.type].text = e.target.value; updateAll(); });
  document.querySelectorAll('.ui-setting').forEach(el => el.oninput = (e) => { state.uiTheme[e.target.dataset.key] = e.target.value; saveToStorage(); renderCalendar(); renderWeekdays(); renderSettings(); });
  document.querySelectorAll('.bg-preset').forEach(el => el.onclick = (e) => { state.appBackground = e.target.dataset.color; saveToStorage(); applyTheme(); renderSettings(); });
  document.getElementById('custom-bg-picker').oninput = (e) => { state.appBackground = e.target.value; saveToStorage(); applyTheme(); };
}

function updateStampToolbar() {
  const container = document.getElementById('stamp-list');
  container.innerHTML = SHIFT_TYPES.map(type => {
    const colors = state.shiftColors[type];
    const isActive = state.activeStamp === type;
    return `<button class="stamp-choice px-6 py-2 rounded-xl text-xs font-black border-2 transition-all ${isActive ? 'stamp-active' : ''}" data-type="${type}" style="background-color: ${isActive ? colors.bg : colors.bg + '44'}; color: ${isActive ? colors.text : colors.text + '88'}; border-color: ${isActive ? colors.text : 'transparent'}">${type}</button>`;
  }).join('');
  document.querySelectorAll('.stamp-choice').forEach(btn => btn.onclick = (e) => { state.activeStamp = e.target.dataset.type; updateStampToolbar(); });
}

function getLocalDateString(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function setupEventListeners() {
  document.getElementById('view-calendar').onclick = () => switchView('calendar');
  document.getElementById('view-dashboard').onclick = () => switchView('dashboard');
  document.getElementById('prev-month').onclick = () => { state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() - 1, 1); updateMonthDisplay(); renderCalendar(); renderDashboard(); };
  document.getElementById('next-month').onclick = () => { state.currentDate = new Date(state.currentDate.getFullYear(), state.currentDate.getMonth() + 1, 1); updateMonthDisplay(); renderCalendar(); renderDashboard(); };
  document.getElementById('open-settings').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
  document.querySelectorAll('.close-settings').forEach(el => el.onclick = () => document.getElementById('settings-modal').classList.add('hidden'));
  document.querySelectorAll('.close-modal').forEach(el => el.onclick = () => document.getElementById('shift-modal').classList.add('hidden'));
  document.getElementById('fab-add').onclick = () => openShiftModal();
  document.getElementById('edit-selected-btn').onclick = () => openShiftModal();
  document.getElementById('toggle-stamp-mode').onclick = (e) => { state.isStampMode = !state.isStampMode; const toolbar = document.getElementById('stamp-toolbar'); if (state.isStampMode) { e.currentTarget.classList.add('bg-blue-600', 'text-white'); toolbar.classList.remove('hidden'); updateStampToolbar(); } else { e.currentTarget.classList.remove('bg-blue-600', 'text-white'); toolbar.classList.add('hidden'); } };
  document.getElementById('shift-form').onsubmit = (e) => {
    e.preventDefault();
    const dateStr = document.getElementById('form-date').value;
    const type = document.querySelector('.shift-type-choice[style*="background-color: rgb"]').dataset.type;
    const newShift = { id: crypto.randomUUID(), date: dateStr, type, startTime: document.getElementById('form-start').value, endTime: document.getElementById('form-end').value, note: document.getElementById('form-note').value };
    const existingIdx = state.shifts.findIndex(s => s.date === dateStr);
    if (existingIdx > -1) state.shifts[existingIdx] = newShift; else state.shifts.push(newShift);
    saveToStorage(); document.getElementById('shift-modal').classList.add('hidden'); renderCalendar(); renderDashboard(); updateSelectedDayPanel();
  };
  document.getElementById('delete-shift-btn').onclick = () => { const dateStr = document.getElementById('form-date').value; state.shifts = state.shifts.filter(s => s.date !== dateStr); saveToStorage(); document.getElementById('shift-modal').classList.add('hidden'); renderCalendar(); renderDashboard(); updateSelectedDayPanel(); };
  document.getElementById('reset-settings').onclick = () => { if (confirm('初期化しますか？')) { state.shiftColors = { ...DEFAULT_SHIFT_COLORS }; state.uiTheme = { ...DEFAULT_UI_THEME }; state.appBackground = '#000000'; saveToStorage(); location.reload(); } };
}

init();
