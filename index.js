
/**
 * ShiftSync Pro - Vanilla JS Version
 */

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
    cellBg: '#0f172a',
    borderColor: '#334155',
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

let state = {
    currentDate: new Date(),
    shifts: [],
    shiftColors: { ...DEFAULT_SHIFT_COLORS },
    uiTheme: { ...DEFAULT_UI_THEME },
    appBackground: '#000000',
    selectedDate: new Date(),
    isStampMode: false,
    activeStamp: '日勤',
    viewMode: 'calendar',
    selectedTypeInModal: '日勤'
};

// スワイプ管理用
let touchStartX = 0;
let touchStartY = 0;
let touchEndX = 0;
let touchEndY = 0;

function init() {
    loadFromStorage();
    applyTheme();
    renderWeekdays();
    renderAll();
    setupEventListeners();
    renderSettings();
    setupSwipeListeners();
}

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
            Object.assign(state, parsed);
        } catch (e) { console.error(e); }
    }
}

function getJapaneseHolidays(year, month) {
    const holidays = {};
    const add = (day, name) => {
        if (day < 1 || day > 31) return;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        holidays[dateStr] = name;
    };

    const getVernalEquinox = (y) => {
        if (y < 1900 || y > 2099) return 20;
        return Math.floor(20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    };

    const getAutumnalEquinox = (y) => {
        if (y < 1900 || y > 2099) return 23;
        return Math.floor(23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4));
    };

    const getNthMonday = (y, m, nth) => {
        const firstDay = new Date(y, m - 1, 1).getDay();
        let firstMonday = 1 + (8 - firstDay) % 7;
        if (firstDay === 1) firstMonday = 1;
        return firstMonday + (nth - 1) * 7;
    };

    if (month === 1) {
        add(1, '元日');
        add(getNthMonday(year, 1, 2), '成人の日');
    }
    if (month === 2) {
        add(11, '建国記念の日');
        add(23, '天皇誕生日');
    }
    if (month === 3) add(getVernalEquinox(year), '春分の日');
    if (month === 4) add(29, '昭和の日');
    if (month === 5) {
        add(3, '憲法記念日');
        add(4, 'みどりの日');
        add(5, 'こどもの日');
    }
    if (month === 7) add(getNthMonday(year, 7, 3), '海の日');
    if (month === 8) add(11, '山の日');
    if (month === 9) {
        add(getNthMonday(year, 9, 3), '敬老の日');
        add(getAutumnalEquinox(year), '秋分の日');
    }
    if (month === 10) add(getNthMonday(year, 10, 2), 'スポーツの日');
    if (month === 11) {
        add(3, '文化の日');
        add(23, '勤労感謝の日');
    }

    for (let d = 1; d <= 31; d++) {
        const date = new Date(year, month - 1, d);
        if (date.getMonth() !== month - 1) break;
        const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        
        if (holidays[dateStr] && date.getDay() === 0) {
            let subDay = new Date(date);
            let subDayStr = "";
            do {
                subDay.setDate(subDay.getDate() + 1);
                subDayStr = `${subDay.getFullYear()}-${String(subDay.getMonth() + 1).padStart(2, '0')}-${String(subDay.getDate()).padStart(2, '0')}`;
            } while (holidays[subDayStr]);

            if (subDay.getMonth() + 1 === month) {
                holidays[subDayStr] = '振替休日';
            }
        }
    }

    if (month === 9) {
        const respect = getNthMonday(year, 9, 3);
        const autumnal = getAutumnalEquinox(year);
        if (autumnal - respect === 2) {
            add(respect + 1, '国民の休日');
        }
    }

    return holidays;
}

function renderAll() {
    updateMonthDisplay();
    renderWeekdays(); // 曜日の色も変わる可能性があるため追加
    renderCalendar();
    renderDashboard();
    updateSelectedDayPanel();
}

function applyTheme() {
    document.documentElement.style.setProperty('--app-bg', state.appBackground);
    document.body.style.backgroundColor = state.appBackground;
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
        const cell = document.createElement('div');
        cell.className = 'calendar-cell border-b border-r p-2 cursor-pointer relative group';
        cell.style.backgroundColor = state.uiTheme.cellBg;
        cell.style.borderColor = state.uiTheme.borderColor;
        if ((i + 1) % 7 === 0) cell.style.borderRightWidth = '0';

        if (i >= firstDay && i < firstDay + lastDate) {
            const dateNum = i - firstDay + 1;
            const dateObj = new Date(year, month, dateNum);
            const dateStr = getLocalDateString(dateObj);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedStr;
            const dow = dateObj.getDay();
            const holidayName = holidays[dateStr];
            const isHoliday = !!holidayName;

            let dateColor = state.uiTheme.dateColor;
            if (dow === 0 || isHoliday) dateColor = state.uiTheme.sunColor;
            if (dow === 6 && !isHoliday) dateColor = state.uiTheme.satColor;

            const dayShifts = state.shifts.filter(s => s.date === dateStr);
            const hasNote = dayShifts.some(s => s.note && s.note.trim() !== "");

            cell.innerHTML = `
                <div class="flex flex-col items-start relative">
                    <span class="inline-flex items-center justify-center w-8 h-8 rounded-xl text-sm font-black ${isToday ? 'bg-blue-600 text-white shadow-lg' : ''}" style="${!isToday ? 'color:' + dateColor : ''}">${dateNum}</span>
                    ${isHoliday ? `<span class="text-[8px] font-bold truncate w-full" style="color:${state.uiTheme.sunColor}">${holidayName}</span>` : ''}
                    ${hasNote ? `<div class="absolute top-0 right-0 w-1.5 h-1.5 bg-slate-400 rounded-full"></div>` : ''}
                </div>
                <div class="flex flex-col gap-0.5 mt-auto mb-1" id="shifts-${dateStr}"></div>
                <div class="absolute inset-0 border-2 rounded-[1rem] m-0.5 pointer-events-none ${isSelected ? 'border-blue-500/40 bg-blue-500/5' : 'border-transparent'}"></div>
            `;
            cell.onclick = () => handleDateClick(dateObj);

            const shiftContainer = cell.querySelector(`#shifts-${dateStr}`);
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
            cell.classList.add('opacity-20');
        }
        container.appendChild(cell);
    }
}

function renderDashboard() {
    const year = state.currentDate.getFullYear();
    const month = state.currentDate.getMonth() + 1;
    const targetYM = `${year}-${String(month).padStart(2, '0')}`;
    const monthShifts = state.shifts.filter(s => s.date.startsWith(targetYM));
    
    const statsGrid = document.getElementById('stats-grid');
    let totalCount = 0;
    const counts = {};
    
    statsGrid.innerHTML = SHIFT_TYPES.map(type => {
        const count = monthShifts.filter(s => s.type === type).length;
        counts[type] = count;
        totalCount += count;
        return `<div class="bg-black/20 border border-white/5 p-4 rounded-2xl text-center"><div class="text-[9px] font-black text-slate-500 mb-1">${type}</div><div class="text-2xl font-black" style="color:${state.shiftColors[type].text}">${count}</div></div>`;
    }).join('');
    document.getElementById('total-shifts-count').textContent = totalCount;

    const chartSvg = document.getElementById('chart-svg');
    const legend = document.getElementById('chart-legend');
    chartSvg.innerHTML = ''; legend.innerHTML = '';

    if (totalCount === 0) {
        chartSvg.innerHTML = `<circle cx="0" cy="0" r="0.9" fill="rgba(255,255,255,0.05)"/>`;
    } else {
        let cumulative = 0;
        SHIFT_TYPES.forEach(type => {
            if (counts[type] === 0) return;
            const percent = counts[type] / totalCount;
            const startX = Math.cos(2 * Math.PI * cumulative);
            const startY = Math.sin(2 * Math.PI * cumulative);
            cumulative += percent;
            const endX = Math.cos(2 * Math.PI * cumulative);
            const endY = Math.sin(2 * Math.PI * cumulative);
            const largeArc = percent > 0.5 ? 1 : 0;
            
            const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
            path.setAttribute("d", `M ${startX} ${startY} A 1 1 0 ${largeArc} 1 ${endX} ${endY} L 0 0`);
            path.setAttribute("fill", state.shiftColors[type].text);
            chartSvg.appendChild(path);

            legend.innerHTML += `<div class="flex items-center gap-2 bg-black/20 border border-white/5 px-3 py-2 rounded-xl"><div class="w-2.5 h-2.5 rounded-full" style="background-color:${state.shiftColors[type].text}"></div><span class="text-[10px] font-black text-slate-300 flex-1">${type}</span><span class="text-[10px] font-bold text-slate-500">${Math.round(percent * 100)}%</span></div>`;
        });
        chartSvg.innerHTML += `<circle cx="0" cy="0" r="0.65" fill="${state.appBackground}"/>`;
    }
}

function updateSelectedDayPanel() {
    const panel = document.getElementById('selected-day-panel');
    const dateStr = getLocalDateString(state.selectedDate);
    const s = state.shifts.find(x => x.date === dateStr);
    panel.classList.remove('hidden');
    document.getElementById('selected-date-text').textContent = state.selectedDate.toLocaleDateString('ja-JP', { month: 'numeric', day: 'numeric', weekday: 'short' });
    const tag = document.getElementById('selected-shift-tag');
    const nBox = document.getElementById('selected-note-box');
    if (s) {
        tag.classList.remove('hidden'); tag.textContent = s.type;
        tag.style.backgroundColor = state.shiftColors[s.type].bg; tag.style.color = state.shiftColors[s.type].text;
        nBox.textContent = s.note || 'メモなし';
    } else {
        tag.classList.add('hidden'); nBox.textContent = '予定なし';
    }
}

function handleDateClick(date) {
    state.selectedDate = date;
    if (state.isStampMode) {
        const dStr = getLocalDateString(date);
        const idx = state.shifts.findIndex(x => x.date === dStr);
        if (idx > -1) {
            state.shifts[idx].type = state.activeStamp;
        } else {
            state.shifts.push({ 
                id: Math.random().toString(36).substr(2, 9), 
                date: dStr, 
                type: state.activeStamp, 
                startTime: '', 
                endTime: '', 
                note: '' 
            });
        }
        saveToStorage(); 
        renderAll();
    } else { 
        renderAll(); 
    }
}

function openShiftModal() {
    const dStr = getLocalDateString(state.selectedDate);
    const s = state.shifts.find(x => x.date === dStr);
    document.getElementById('modal-title').textContent = `${dStr} のシフト`;
    document.getElementById('form-date').value = dStr;
    document.getElementById('form-start').value = s?.startTime || '';
    document.getElementById('form-end').value = s?.endTime || '';
    document.getElementById('form-note').value = s?.note || '';
    const delBtn = document.getElementById('delete-shift-btn');
    if (s) delBtn.classList.remove('hidden'); else delBtn.classList.add('hidden');
    
    state.selectedTypeInModal = s?.type || '日勤';
    renderShiftTypeButtons(state.selectedTypeInModal);
    document.getElementById('shift-modal').classList.remove('hidden');
}

function renderShiftTypeButtons(active) {
    const grid = document.getElementById('shift-type-grid');
    grid.innerHTML = SHIFT_TYPES.map(t => {
        const isActive = t === active;
        const activeStyle = isActive 
            ? `background-color:${state.shiftColors[t].bg}; color:${state.shiftColors[t].text}; border-color:${state.shiftColors[t].text}` 
            : 'background-color:#00000033; color:#555; border-color:#1e293b';
        const activeClass = isActive ? 'active-type' : '';
        return `<button type="button" class="shift-type-choice py-3 rounded-xl border-2 text-xs font-black ${activeClass}" data-type="${t}" style="${activeStyle}">${t}</button>`;
    }).join('');
    
    grid.querySelectorAll('button').forEach(b => {
        b.onclick = () => {
            state.selectedTypeInModal = b.dataset.type;
            renderShiftTypeButtons(state.selectedTypeInModal);
        };
    });
}

function getLocalDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function setupEventListeners() {
    document.getElementById('prev-month').onclick = () => { state.currentDate.setMonth(state.currentDate.getMonth() - 1); renderAll(); };
    document.getElementById('next-month').onclick = () => { state.currentDate.setMonth(state.currentDate.getMonth() + 1); renderAll(); };
    document.getElementById('view-calendar').onclick = () => { state.viewMode = 'calendar'; switchView(); };
    document.getElementById('view-dashboard').onclick = () => { state.viewMode = 'dashboard'; switchView(); };
    document.getElementById('fab-add').onclick = () => openShiftModal();
    document.getElementById('edit-selected-btn').onclick = () => openShiftModal();
    document.querySelector('.close-modal').onclick = () => document.getElementById('shift-modal').classList.add('hidden');
    
    document.getElementById('toggle-stamp-mode').onclick = (e) => {
        state.isStampMode = !state.isStampMode;
        const bar = document.getElementById('stamp-toolbar');
        if (state.isStampMode) { 
            e.currentTarget.classList.add('bg-blue-600', 'text-white'); 
            bar.classList.remove('hidden'); 
            updateStampToolbar(); 
        } else { 
            e.currentTarget.classList.remove('bg-blue-600', 'text-white'); 
            bar.classList.add('hidden'); 
        }
    };

    document.getElementById('shift-form').onsubmit = (e) => {
        e.preventDefault();
        const dStr = document.getElementById('form-date').value;
        const type = state.selectedTypeInModal;
        const note = document.getElementById('form-note').value;
        const startTime = document.getElementById('form-start').value;
        const endTime = document.getElementById('form-end').value;

        const newS = { 
            id: Math.random().toString(36).substr(2, 9), 
            date: dStr, 
            type, 
            startTime, 
            endTime, 
            note 
        };

        const idx = state.shifts.findIndex(x => x.date === dStr);
        if (idx > -1) {
            state.shifts[idx] = newS;
        } else {
            state.shifts.push(newS);
        }
        
        saveToStorage(); 
        document.getElementById('shift-modal').classList.add('hidden'); 
        renderAll();
    };

    document.getElementById('delete-shift-btn').onclick = () => {
        const dStr = document.getElementById('form-date').value;
        state.shifts = state.shifts.filter(x => x.date !== dStr);
        saveToStorage(); 
        document.getElementById('shift-modal').classList.add('hidden'); 
        renderAll();
    };

    document.getElementById('open-settings').onclick = () => document.getElementById('settings-modal').classList.remove('hidden');
    document.querySelectorAll('.close-settings').forEach(b => b.onclick = () => document.getElementById('settings-modal').classList.add('hidden'));
    
    // カラーピッカーのイベントリスナー
    const uiThemeKeys = ['date-color', 'header-color', 'sat-color', 'sun-color', 'cell-bg', 'border-color'];
    uiThemeKeys.forEach(k => {
        const id = `${k}-picker`;
        const stateKey = k.replace(/-([a-z])/g, (g) => g[1].toUpperCase()); // kebab to camel
        document.getElementById(id).oninput = (e) => {
            state.uiTheme[stateKey] = e.target.value;
            saveToStorage();
            renderAll();
        };
    });
    
    document.getElementById('reset-settings').onclick = () => { if(confirm('初期化しますか？')){ localStorage.clear(); location.reload(); } };
}

function setupSwipeListeners() {
    const calendarContainer = document.getElementById('calendar-container');
    
    calendarContainer.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        touchStartY = e.changedTouches[0].screenY;
    }, { passive: true });

    calendarContainer.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        touchEndY = e.changedTouches[0].screenY;
        handleSwipe();
    }, { passive: true });
}

function handleSwipe() {
    const deltaX = touchEndX - touchStartX;
    const deltaY = touchEndY - touchStartY;
    const threshold = 50; 

    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > threshold) {
        if (deltaX > 0) {
            state.currentDate.setMonth(state.currentDate.getMonth() - 1);
        } else {
            state.currentDate.setMonth(state.currentDate.getMonth() + 1);
        }
        renderAll();
    }
}

function switchView() {
    const cal = document.getElementById('view-container-calendar');
    const dash = document.getElementById('view-container-dashboard');
    const bCal = document.getElementById('view-calendar');
    const bDash = document.getElementById('view-dashboard');
    if (state.viewMode === 'calendar') {
        cal.classList.remove('hidden'); dash.classList.add('hidden');
        bCal.classList.add('view-btn-active'); bDash.classList.remove('view-btn-active');
    } else {
        cal.classList.add('hidden'); dash.classList.remove('hidden');
        bDash.classList.add('view-btn-active'); bCal.classList.remove('view-btn-active');
        renderDashboard();
    }
}

function updateStampToolbar() {
    const list = document.getElementById('stamp-list');
    list.innerHTML = SHIFT_TYPES.map(t => {
        const active = state.activeStamp === t ? 'stamp-active' : '';
        const c = state.shiftColors[t];
        return `<button class="stamp-choice px-6 py-2 rounded-xl text-xs font-black border-2 ${active}" data-type="${t}" style="background-color:${c.bg}; color:${c.text}; border-color:${state.activeStamp === t ? c.text : 'transparent'}">${t}</button>`;
    }).join('');
    list.querySelectorAll('button').forEach(b => b.onclick = () => { state.activeStamp = b.dataset.type; updateStampToolbar(); });
}

function renderSettings() {
    const grid = document.getElementById('settings-colors-grid');
    grid.innerHTML = SHIFT_TYPES.map(t => `
        <div class="bg-black/20 p-4 rounded-2xl border border-white/5 flex flex-col gap-3">
            <span class="px-3 py-1 rounded-lg text-xs font-black self-start" style="background-color:${state.shiftColors[t].bg}; color:${state.shiftColors[t].text}">${t}</span>
            <div class="grid grid-cols-2 gap-2">
                <input type="color" class="w-full h-8 bg-transparent" value="${state.shiftColors[t].bg}" oninput="updateColor('${t}','bg',this.value)">
                <input type="color" class="w-full h-8 bg-transparent" value="${state.shiftColors[t].text}" oninput="updateColor('${t}','text',this.value)">
            </div>
        </div>`).join('');
    
    // UIテーマピッカーの初期値をセット
    document.getElementById('date-color-picker').value = state.uiTheme.dateColor;
    document.getElementById('header-color-picker').value = state.uiTheme.headerColor;
    document.getElementById('sat-color-picker').value = state.uiTheme.satColor;
    document.getElementById('sun-color-picker').value = state.uiTheme.sunColor;
    document.getElementById('cell-bg-picker').value = state.uiTheme.cellBg;
    document.getElementById('border-color-picker').value = state.uiTheme.borderColor;

    const presets = document.getElementById('background-presets');
    presets.innerHTML = BACKGROUND_PRESETS.map(p => `<button class="w-10 h-10 rounded-lg border-2" style="background-color:${p.color}" onclick="updateBg('${p.color}')"></button>`).join('') + `<input type="color" class="w-10 h-10 bg-transparent" oninput="updateBg(this.value)">`;
}

window.updateColor = (t, k, v) => { state.shiftColors[t][k] = v; saveToStorage(); renderAll(); renderSettings(); };
window.updateBg = (v) => { state.appBackground = v; applyTheme(); saveToStorage(); renderAll(); };

init();
