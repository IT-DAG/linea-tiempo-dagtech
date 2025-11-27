// ============================================
// DATA STRUCTURE & INITIAL DATA
// ============================================

let INITIAL_DATA = '';

// Icon mapping based on content keywords
const ICON_MAP = {
    'desy': '🖥️',
    'linux': '🐧',
    'servidor': '🌐',
    'web': '🌐',
    'aplicación': '💻',
    'erp': '📊',
    'directorio': '📁',
    'cofi': '💰',
    'sima': '⚙️',
    'footprints': '🎫',
    'blackberry': '📱',
    'aida': '🏢',
    'cpd': '🏗️',
    'nube': '☁️',
    'cloud': '☁️',
    'azure': '☁️',
    'google': '🔍',
    'ax': '📊',
    'pok': '🖥️',
    'kiosk': '🖥️',
    'movilidad': '🚗',
    'dto': '🔄',
    'transformación': '🔄',
    'rms': '🚗',
    'mobility': '🚗',
    'moto': '🏍️',
    'dato': '📊',
    'data': '📊',
    'crm': '👥',
    'salesforce': '👥',
    'hyrenting': '🚙',
    'avis': '🚗',
    'ots': '🔒',
    'seguridad': '🔒',
    'autostore': '🤖',
    'robot': '🤖',
    'automatización': '🤖',
    'opensource': '🔓',
    'certificación': '✅',
    'iso': '✅',
    'compras': '🛒',
    'dait': '🏢',
    'contingencia': '🛡️'
};

// State
let milestones = [];
let filteredCategory = 'all';
let showOnlyImportant = false;

// ============================================
// UTILITY FUNCTIONS
// ============================================

function getIconForMilestone(title, description) {
    const text = (title + ' ' + description).toLowerCase();
    for (const [keyword, icon] of Object.entries(ICON_MAP)) {
        if (text.includes(keyword)) {
            return icon;
        }
    }
    return '📌'; // Default icon
}

function parseMarkdown(markdown) {
    const lines = markdown.trim().split('\n');
    const parsed = [];
    let currentMilestone = null;

    for (let line of lines) {
        line = line.trim();

        // Parse header: ## Year | category | ⭐
        if (line.startsWith('##')) {
            if (currentMilestone) {
                currentMilestone.description = currentMilestone.description.trim();
                parsed.push(currentMilestone);
            }

            const headerMatch = line.match(/##\s*(\d{4})\s*\|\s*(\w+)\s*(\|\s*⭐)?/);
            if (headerMatch) {
                currentMilestone = {
                    year: parseInt(headerMatch[1]),
                    category: headerMatch[2].toLowerCase(),
                    important: !!headerMatch[3],
                    title: '',
                    description: '',
                    icon: '📌'
                };
            }
        }
        // Parse title: **Title**
        else if (line.startsWith('**') && line.endsWith('**') && currentMilestone && !currentMilestone.title) {
            currentMilestone.title = line.slice(2, -2);
        }
        // Parse description
        else if (line && currentMilestone && currentMilestone.title) {
            currentMilestone.description += line + ' ';
        }
    }

    // Add last milestone
    if (currentMilestone) {
        currentMilestone.description = currentMilestone.description.trim();
        parsed.push(currentMilestone);
    }

    // Assign icons
    parsed.forEach(m => {
        m.icon = getIconForMilestone(m.title, m.description);
    });

    return parsed;
}

function exportToMarkdown(milestones) {
    let markdown = '';

    milestones.forEach(m => {
        const important = m.important ? ' | ⭐' : '';
        markdown += `## ${m.year} | ${m.category}${important}\n`;
        markdown += `**${m.title}**\n`;
        markdown += `${m.description}\n\n`;
    });

    return markdown.trim();
}

function saveToLocalStorage() {
    localStorage.setItem('dagtech_milestones_alt', JSON.stringify(milestones));
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem('dagtech_milestones_alt');
    if (stored) {
        try {
            milestones = JSON.parse(stored);
            return true;
        } catch (e) {
            console.error('Error loading from localStorage:', e);
        }
    }
    return false;
}

// ============================================
// RENDERING FUNCTIONS
// ============================================

function getYearRange() {
    if (milestones.length === 0) return { min: 2000, max: 2025 };

    const years = milestones.map(m => m.year);
    return {
        min: Math.min(...years),
        max: Math.max(...years)
    };
}

function renderTimeline() {
    const yearRange = getYearRange();
    const years = [];

    for (let year = yearRange.min; year <= yearRange.max; year++) {
        years.push(year);
    }

    // renderYears(years); // Disabled as per user request
    renderEvents(years);
    updateStats();
}

/*
function renderYears(years) {
    const yearsContainer = document.getElementById('timelineYears');
    const wrapper = document.getElementById('timelineWrapper');
    const containerWidth = wrapper.offsetWidth;
    const padding = 100;
    const usableWidth = containerWidth - (padding * 2);
    const yearCount = years.length;

    yearsContainer.innerHTML = '';

    years.forEach((year, index) => {
        const yearMarker = document.createElement('div');
        yearMarker.className = 'year-marker';
        
        // Calculate position
        const leftPercent = (index / (yearCount - 1)) * 100;
        yearMarker.style.left = `calc(${padding}px + ${leftPercent}% * (100% - ${padding * 2}px) / 100%)`;
        
        yearMarker.innerHTML = `
            <div class="year-dot"></div>
            <div class="year-label">${year}</div>
        `;
        yearsContainer.appendChild(yearMarker);
    });
}
*/

function renderEvents(years) {
    const eventsContainer = document.getElementById('timelineEvents');
    const wrapper = document.getElementById('timelineWrapper');
    eventsContainer.innerHTML = '';

    const containerWidth = wrapper.offsetWidth;
    const padding = 80; // Reduced padding
    const usableWidth = containerWidth - (padding * 2);
    const yearCount = years.length;

    // Filter milestones based on current filters
    const visibleMilestones = milestones.filter(m => {
        const categoryMatch = filteredCategory === 'all' || filteredCategory === m.category;
        const importantMatch = !showOnlyImportant || m.important;
        return categoryMatch && importantMatch;
    });

    // Group by year
    const eventsByYear = {};
    visibleMilestones.forEach(m => {
        if (!eventsByYear[m.year]) eventsByYear[m.year] = [];
        eventsByYear[m.year].push(m);
    });

    // Render events with vertical stacking
    years.forEach((year, yearIndex) => {
        const yearEvents = eventsByYear[year];
        if (!yearEvents || yearEvents.length === 0) return;

        // Calculate base horizontal position for the year
        const leftPercent = (yearIndex / (yearCount - 1)) * 100;
        const baseX = padding + (usableWidth * leftPercent / 100);

        // Determine base direction for this year (alternate to avoid year-to-year collisions)
        // Year 2000: Above, 2001: Below, etc.
        const baseDirection = yearIndex % 2 === 0 ? 'above' : 'below';

        yearEvents.forEach((milestone, eventIndex) => {
            // Stack events vertically within the same year
            // If year has multiple events, we can alternate them or stack them
            // Let's stack them to save horizontal space

            // Logic: 
            // Event 0: Base height
            // Event 1: Higher
            // Event 2: Even higher

            // To optimize further, we can alternate direction WITHIN the year if there are many events
            // But user asked to play with heights.

            // Let's try alternating direction for every event to maximize spread?
            // No, that might be messy. Let's stick to year-based direction but stack heights.

            // However, if we have MANY events (e.g. 4), stacking all 4 might get too tall.
            // So let's split them: first half above, second half below?
            // Or just alternate: Up, Down, Up (higher), Down (lower)

            const isEven = eventIndex % 2 === 0;
            let position = baseDirection;

            // If there are more than 2 events, force alternating to balance
            if (yearEvents.length > 2) {
                position = isEven ? 'above' : 'below';
            } else {
                // Keep year consistency for small numbers
                position = baseDirection;
            }

            // Calculate height level (0, 1, 2...)
            // If we alternate, we need to group by direction to calculate height
            // But simple index based math works too:
            // Index 0 (Above): Level 0
            // Index 1 (Below): Level 0
            // Index 2 (Above): Level 1
            // Index 3 (Below): Level 1

            let level = 0;
            if (yearEvents.length > 2) {
                level = Math.floor(eventIndex / 2);
            } else {
                // If same direction, stack
                level = eventIndex;
            }

            const baseHeight = 60;
            const stepHeight = 110; // Height increment per level
            let connectorHeight = baseHeight + (level * stepHeight);
            let horizontalPosition = baseX;

            // Apply saved custom position if exists
            const dragId = `${year}-${eventIndex}`;
            if (milestonePositions[dragId]) {
                // Support both old format (number) and new format (object)
                if (typeof milestonePositions[dragId] === 'number') {
                    connectorHeight = milestonePositions[dragId];
                } else {
                    connectorHeight = milestonePositions[dragId].height || connectorHeight;
                    horizontalPosition = milestonePositions[dragId].left || horizontalPosition;
                }
            }

            const eventEl = document.createElement('div');
            eventEl.className = `timeline-event ${position} ${milestone.important ? 'important' : ''}`;
            eventEl.setAttribute('data-category', milestone.category);
            eventEl.style.left = `${horizontalPosition}px`;

            // Z-index: lower levels should be in front? or back?
            // Higher connectors (level 2) should be behind level 0 cards to avoid drawing over them
            // So higher level = lower z-index
            eventEl.style.zIndex = 50 - level;

            // Store drag ID on element
            eventEl.dataset.dragId = dragId;

            eventEl.innerHTML = `
                <div class="event-connector" style="height: ${connectorHeight}px;"></div>
                <div class="event-card">
                    <div class="event-row">
                        <span class="event-icon">${milestone.icon}</span>
                        <span class="event-title">${milestone.title}</span>
                        <span class="event-star ${milestone.important ? 'active' : ''}" data-index="${milestones.indexOf(milestone)}">⭐</span>
                    </div>
                    <div class="event-year">${milestone.year}</div>
                </div>
            `;

            // Add hover tooltip
            eventEl.addEventListener('mouseenter', (e) => showTooltip(e, milestone));
            eventEl.addEventListener('mouseleave', hideTooltip);

            // Add star click handler
            const star = eventEl.querySelector('.event-star');
            star.addEventListener('click', (e) => {
                e.stopPropagation();
                toggleImportant(milestones.indexOf(milestone));
            });

            // Add drag start listener
            const card = eventEl.querySelector('.event-card');
            card.addEventListener('mousedown', (e) => dragStart(e, eventEl, milestones.indexOf(milestone), connectorHeight, year, eventIndex));

            eventsContainer.appendChild(eventEl);
        });
    });
}

// ============================================
// TOOLTIP
// ============================================

function showTooltip(event, milestone) {
    if (isEditMode) return;
    const tooltip = document.getElementById('tooltip');
    const tooltipContent = tooltip.querySelector('.tooltip-content');

    tooltipContent.innerHTML = `
        <strong style="font-size: 1.1rem; display: block; margin-bottom: 0.5rem;">${milestone.title}</strong>
        <div style="color: var(--text-secondary); margin-bottom: 0.75rem;">${milestone.year} · ${getCategoryName(milestone.category)}</div>
        <div>${milestone.description}</div>
    `;

    tooltip.classList.add('visible');
    positionTooltip(event, tooltip);
}

function positionTooltip(event, tooltip) {
    const x = event.clientX;
    const y = event.clientY;
    const offset = 20;

    tooltip.style.left = `${x + offset}px`;
    tooltip.style.top = `${y + offset}px`;
}

function hideTooltip() {
    const tooltip = document.getElementById('tooltip');
    tooltip.classList.remove('visible');
}

function getCategoryName(category) {
    const names = {
        'aida': 'AIDA',
        'dto': 'DTO',
        'negocio': 'Negocio'
    };
    return names[category] || category;
}

// ============================================
// ACTIONS
// ============================================

function toggleImportant(index) {
    milestones[index].important = !milestones[index].important;
    saveToLocalStorage();
    renderTimeline();
}

function applyFilters() {
    renderTimeline();
}

function importFromMarkdown() {
    const textarea = document.getElementById('markdownInput');
    const markdown = textarea.value.trim();

    if (!markdown) {
        alert('Por favor, introduce datos en formato markdown');
        return;
    }

    try {
        const parsed = parseMarkdown(markdown);
        if (parsed.length === 0) {
            alert('No se encontraron hitos válidos en el markdown');
            return;
        }

        milestones = parsed;
        saveToLocalStorage();
        renderTimeline();
        closeEditor();
        alert(`✅ Se importaron ${parsed.length} hitos correctamente`);
    } catch (e) {
        alert('Error al parsear el markdown: ' + e.message);
        console.error(e);
    }
}

function exportMarkdownToTextarea() {
    const textarea = document.getElementById('markdownInput');
    const markdown = exportToMarkdown(milestones);
    textarea.value = markdown;

    // Copy to clipboard
    textarea.select();
    document.execCommand('copy');
    alert('✅ Markdown exportado y copiado al portapapeles');
}

async function resetToInitialData() {
    if (confirm('¿Estás seguro de restaurar los datos iniciales? Se perderán los cambios actuales.')) {
        if (!INITIAL_DATA) {
            try {
                const response = await fetch('data.md');
                if (response.ok) {
                    INITIAL_DATA = await response.text();
                } else {
                    alert('Error al cargar data.md');
                    return;
                }
            } catch (e) {
                alert('Error de conexión al cargar data.md');
                return;
            }
        }

        milestones = parseMarkdown(INITIAL_DATA);
        saveToLocalStorage();
        renderTimeline();
        alert('✅ Datos restaurados a la versión inicial');
    }
}

function clearAllData() {
    if (confirm('⚠️ ¿Estás seguro de eliminar TODOS los hitos? Esta acción no se puede deshacer.')) {
        milestones = [];
        saveToLocalStorage();
        renderTimeline();
        alert('✅ Todos los datos han sido eliminados');
    }
}

function updateStats() {
    const total = milestones.length;
    const important = milestones.filter(m => m.important).length;
    const yearRange = getYearRange();

    // Update in nav menu
    document.getElementById('totalMilestones').textContent = total;
    document.getElementById('importantMilestones').textContent = important;
    document.getElementById('yearRange').textContent = `${yearRange.min}-${yearRange.max}`;

    // Update in editor panel
    document.getElementById('statTotal').textContent = total;
    document.getElementById('statImportant').textContent = important;
    document.getElementById('statYears').textContent = `${yearRange.min}-${yearRange.max}`;
}

// ============================================
// EDITOR PANEL
// ============================================

function openEditor() {
    document.getElementById('editorPanel').classList.add('open');
    document.getElementById('overlay').classList.add('visible');
}

function closeEditor() {
    document.getElementById('editorPanel').classList.remove('open');
    document.getElementById('overlay').classList.remove('visible');
}

function exportToJPG() {
    const element = document.getElementById('timelineWrapper');
    const btn = document.getElementById('exportJpgBtn');
    const originalText = btn.innerHTML;

    btn.innerHTML = '<span class="icon">⏳</span> Generando...';
    btn.disabled = true;

    // Use html2canvas to capture the element
    html2canvas(element, {
        scale: 2, // Higher quality
        backgroundColor: '#0a0a0a', // Dark background
        logging: false,
        useCORS: true,
        width: element.scrollWidth,
        height: element.scrollHeight
    }).then(canvas => {
        // Create download link
        const link = document.createElement('a');
        link.download = 'linea-tiempo-dagtech-alternada.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.95);
        link.click();

        btn.innerHTML = originalText;
        btn.disabled = false;
        alert('✅ Imagen exportada correctamente');
    }).catch(err => {
        console.error('Error exportando imagen:', err);
        btn.innerHTML = originalText;
        btn.disabled = false;
        alert('❌ Error al exportar la imagen');
    });
}

// ============================================
// DRAG & DROP LOGIC
// ============================================

let isEditMode = false;
let isDragging = false;
let currentDragItem = null;
let dragStartY = 0;
let dragStartX = 0;
let initialHeight = 0;
let initialLeft = 0;
let currentMilestoneIndex = -1;
let milestonePositions = {}; // Store custom heights and positions by milestone ID (year-index)

function loadPositionsFromLocalStorage() {
    const stored = localStorage.getItem('dagtech_milestone_positions_alt');
    if (stored) {
        try {
            milestonePositions = JSON.parse(stored);
        } catch (e) {
            console.error('Error loading positions:', e);
        }
    }
}

function savePositionsToLocalStorage() {
    localStorage.setItem('dagtech_milestone_positions_alt', JSON.stringify(milestonePositions));
}

function toggleEditMode() {
    isEditMode = !isEditMode;
    const btn = document.getElementById('toggleEditModeBtn');

    if (isEditMode) {
        btn.classList.add('active');
        btn.innerHTML = '<span class="icon">✏️</span> Salir de Edición';
        document.body.classList.add('edit-mode');
        hideTooltip();
    } else {
        btn.classList.remove('active');
        btn.innerHTML = '<span class="icon">✏️</span> Modo Edición';
        document.body.classList.remove('edit-mode');
    }
}

function dragStart(e, element, index, originalHeight, year, eventIndexInYear) {
    if (!isEditMode) return;
    if (e.target.classList.contains('event-star')) return;

    isDragging = true;
    currentDragItem = element;
    dragStartY = e.clientY;
    dragStartX = e.clientX;

    // Get current height from style or use original
    const connector = element.querySelector('.event-connector');
    initialHeight = parseInt(connector.style.height);

    // Get current left position
    initialLeft = parseInt(element.style.left) || 0;

    // Store ID for saving
    currentDragItem.dataset.dragId = `${year}-${eventIndexInYear}`;

    element.querySelector('.event-card').classList.add('dragging');
    document.body.style.cursor = 'grabbing';

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    e.preventDefault(); // Prevent text selection
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    const deltaY = dragStartY - e.clientY;
    const deltaX = e.clientX - dragStartX;
    const isAbove = currentDragItem.classList.contains('above');

    // Vertical movement (height adjustment)
    let heightChange = 0;
    if (isAbove) {
        heightChange = deltaY; // Drag up = positive deltaY = increase height
    } else {
        heightChange = -deltaY; // Drag down = negative deltaY = increase height
    }

    const newHeight = Math.max(20, initialHeight + heightChange); // Min height 20px

    const connector = currentDragItem.querySelector('.event-connector');
    connector.style.height = `${newHeight}px`;

    // Horizontal movement
    const newLeft = initialLeft + deltaX;
    currentDragItem.style.left = `${newLeft}px`;
}

function dragEnd(e) {
    if (!isDragging) return;

    isDragging = false;
    document.body.style.cursor = 'default';
    currentDragItem.querySelector('.event-card').classList.remove('dragging');

    const connector = currentDragItem.querySelector('.event-connector');
    const finalHeight = parseInt(connector.style.height);
    const finalLeft = parseInt(currentDragItem.style.left);
    const dragId = currentDragItem.dataset.dragId;

    // Save both height and horizontal position
    milestonePositions[dragId] = {
        height: finalHeight,
        left: finalLeft
    };
    savePositionsToLocalStorage();

    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);
    currentDragItem = null;
}

// Double click on background to toggle edit mode
document.addEventListener('dblclick', (e) => {
    // Ignore if clicking on a card or interactive element
    if (e.target.closest('.event-card') ||
        e.target.closest('.nav-menu') ||
        e.target.closest('.editor-panel') ||
        e.target.closest('button')) {
        return;
    }
    toggleEditMode();
});

// ============================================
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    loadPositionsFromLocalStorage();

    // ... (rest of existing code) ...
    let loadedFromFetch = false;
    try {
        const response = await fetch('data.md');
        if (response.ok) {
            const text = await response.text();
            if (text) {
                INITIAL_DATA = text;
                milestones = parseMarkdown(INITIAL_DATA);
                saveToLocalStorage();
                loadedFromFetch = true;
                console.log('Datos cargados exitosamente desde data.md');
            }
        } else {
            console.error('Error loading data.md');
        }
    } catch (e) {
        console.error('Error fetching data:', e);
    }

    // Fallback to local storage if fetch failed
    if (!loadedFromFetch) {
        if (!loadFromLocalStorage()) {
            if (INITIAL_DATA) {
                milestones = parseMarkdown(INITIAL_DATA);
                saveToLocalStorage();
            }
        } else {
            console.log('Datos cargados desde localStorage');
        }
    }

    // Initial render
    renderTimeline();

    // Re-render on window resize to adjust positions
    window.addEventListener('resize', () => {
        renderTimeline();
    });

    // Menu functionality
    const navMenu = document.getElementById('navMenu');
    const menuBtn = document.getElementById('menuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');

    function toggleMenu() {
        navMenu.classList.toggle('open');
    }

    menuBtn.addEventListener('click', toggleMenu);
    closeMenuBtn.addEventListener('click', toggleMenu);

    navMenu.addEventListener('click', (e) => {
        if (e.target === navMenu) {
            toggleMenu();
        }
    });

    // Editor panel
    document.getElementById('openEditorBtn').addEventListener('click', openEditor);
    document.getElementById('closeEditorBtn').addEventListener('click', closeEditor);
    document.getElementById('overlay').addEventListener('click', closeEditor);

    // Toggle important filter
    document.getElementById('toggleImportantBtn').addEventListener('click', (e) => {
        showOnlyImportant = !showOnlyImportant;
        e.target.classList.toggle('active');
        applyFilters();
    });

    // Category filters
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            filteredCategory = e.target.getAttribute('data-category');
            applyFilters();
        });
    });

    // Editor actions
    document.getElementById('importMarkdownBtn').addEventListener('click', importFromMarkdown);
    document.getElementById('exportMarkdownBtn').addEventListener('click', exportMarkdownToTextarea);
    document.getElementById('resetDataBtn').addEventListener('click', resetToInitialData);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
    document.getElementById('exportJpgBtn').addEventListener('click', exportToJPG);
    document.getElementById('toggleEditModeBtn').addEventListener('click', toggleEditMode);

    // Version switcher
    document.getElementById('switchVersionBtn').addEventListener('click', () => {
        window.location.href = 'index.html';
    });
});
