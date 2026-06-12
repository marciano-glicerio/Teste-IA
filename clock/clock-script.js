// Get DOM elements
const timezoneInput = document.getElementById('timezoneInput');
const addBtn = document.getElementById('addBtn');
const clocksContainer = document.getElementById('clocksContainer');
const presetBtns = document.querySelectorAll('.preset-btn');

// Store active timezones
let activeTimezones = JSON.parse(localStorage.getItem('activeTimezones')) || [];

// Common timezone list for validation
const validTimezones = [
    'America/New_York',
    'America/Chicago',
    'America/Denver',
    'America/Los_Angeles',
    'America/Anchorage',
    'Pacific/Honolulu',
    'Europe/London',
    'Europe/Paris',
    'Europe/Berlin',
    'Europe/Amsterdam',
    'Europe/Moscow',
    'Asia/Dubai',
    'Asia/Kolkata',
    'Asia/Bangkok',
    'Asia/Shanghai',
    'Asia/Hong_Kong',
    'Asia/Tokyo',
    'Australia/Sydney',
    'Australia/Melbourne',
    'Australia/Brisbane',
    'Pacific/Auckland',
    'Africa/Johannesburg',
    'Africa/Cairo',
    'Brazil/São_Paulo',
    'America/Argentina/Buenos_Aires'
];

// Add timezone from input
addBtn.addEventListener('click', () => {
    const timezone = timezoneInput.value.trim();
    if (timezone) {
        addTimezone(timezone);
        timezoneInput.value = '';
    }
});

// Add timezone from preset buttons
presetBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        addTimezone(btn.dataset.timezone);
    });
});

// Allow Enter key in input
timezoneInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        addBtn.click();
    }
});

// Add timezone function
function addTimezone(timezone) {
    // Validate timezone
    try {
        new Date().toLocaleString('en-US', { timeZone: timezone });
    } catch (e) {
        showError(`Invalid timezone: ${timezone}`);
        return;
    }

    // Check if timezone already exists
    if (activeTimezones.includes(timezone)) {
        showError(`${timezone} is already added`);
        return;
    }

    // Add to list
    activeTimezones.push(timezone);
    saveTimezones();
    renderClocks();
    timezoneInput.focus();
}

// Remove timezone
function removeTimezone(timezone) {
    activeTimezones = activeTimezones.filter(tz => tz !== timezone);
    saveTimezones();
    renderClocks();
}

// Save to localStorage
function saveTimezones() {
    localStorage.setItem('activeTimezones', JSON.stringify(activeTimezones));
}

// Show error message
function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message show';
    errorDiv.textContent = message;
    
    timezoneInput.parentElement.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.remove();
    }, 3000);
}

// Get timezone offset
function getTimezoneOffset(timezone) {
    const date = new Date();
    const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    const offset = (tzDate - utcDate) / (1000 * 60 * 60);
    
    if (offset >= 0) {
        return `UTC+${offset === Math.floor(offset) ? offset : offset.toFixed(2)}`;
    } else {
        return `UTC${offset === Math.floor(offset) ? offset : offset.toFixed(2)}`;
    }
}

// Get time in specific timezone
function getTimeInTimezone(timezone) {
    const date = new Date();
    const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: timezone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    });

    const parts = formatter.formatToParts(date);
    const timeObj = {};
    
    parts.forEach(part => {
        if (part.type !== 'literal') {
            timeObj[part.type] = part.value;
        }
    });

    return {
        time: `${timeObj.hour}:${timeObj.minute}:${timeObj.second}`,
        date: `${timeObj.year}-${timeObj.month}-${timeObj.day}`,
        month: parseInt(timeObj.month),
        day: parseInt(timeObj.day),
        year: parseInt(timeObj.year)
    };
}

// Format timezone name
function formatTimezoneName(timezone) {
    return timezone.replace(/_/g, ' ').replace('/', ' - ');
}

// Get day of week
function getDayOfWeek(timezone) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const date = new Date();
    const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
    return days[tzDate.getDay()];
}

// Render all clock cards
function renderClocks() {
    clocksContainer.innerHTML = '';

    if (activeTimezones.length === 0) {
        clocksContainer.innerHTML = '<div class="empty-state"><p>👆 Add a timezone to get started</p></div>';
        return;
    }

    activeTimezones.forEach((timezone, index) => {
        const timeData = getTimeInTimezone(timezone);
        const offset = getTimezoneOffset(timezone);
        const dayOfWeek = getDayOfWeek(timezone);
        
        // Determine card theme based on local time
        const hour = parseInt(timeData.time.split(':')[0]);
        const isDaytime = hour >= 6 && hour < 18;
        const isDark = !isDaytime;

        const clockCard = document.createElement('div');
        clockCard.className = `clock-card ${isDark ? 'dark' : ''}`;
        clockCard.innerHTML = `
            <button class="remove-btn" onclick="removeTimezone('${timezone}')">×</button>
            <div class="timezone-name">${formatTimezoneName(timezone)}</div>
            <div class="digital-time">${timeData.time}</div>
            <div class="time-details">
                <div>${dayOfWeek}</div>
                <div class="date-display">${timeData.day}/${timeData.month}/${timeData.year}</div>
                <div style="font-size: 0.85em; margin-top: 8px; opacity: 0.8;">${offset}</div>
            </div>
        `;

        clocksContainer.appendChild(clockCard);
    });
}

// Update all clocks
function updateAllClocks() {
    const timeCards = document.querySelectorAll('.clock-card');
    timeCards.forEach((card, index) => {
        const timezone = activeTimezones[index];
        const timeData = getTimeInTimezone(timezone);
        const timeElement = card.querySelector('.digital-time');
        
        if (timeElement) {
            timeElement.textContent = timeData.time;
        }
    });
}

// Initialize
renderClocks();

// Update clocks every second
setInterval(updateAllClocks, 1000);

// Load timezone from URL if provided
const urlParams = new URLSearchParams(window.location.search);
const initialTimezone = urlParams.get('tz');
if (initialTimezone && activeTimezones.length === 0) {
    addTimezone(initialTimezone);
}
