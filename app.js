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
let milestonePositions = {}; // Store custom vertical offsets by milestone ID (year-title)

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
    localStorage.setItem('dagtech_milestones', JSON.stringify(milestones));
    localStorage.setItem('dagtech_milestone_positions', JSON.stringify(milestonePositions));
}

function loadFromLocalStorage() {
    const storedPositions = localStorage.getItem('dagtech_milestone_positions');
    if (storedPositions) {
        try {
            milestonePositions = JSON.parse(storedPositions);
        } catch (e) {
            console.error('Error loading positions from localStorage:', e);
        }
    }

    const stored = localStorage.getItem('dagtech_milestones');
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

    renderYears(years);
    renderMilestones(years);
    updateStats();
}

function renderYears(years) {
    const yearsContainer = document.getElementById('timelineYears');
    yearsContainer.innerHTML = '';

    years.forEach(year => {
        const yearMarker = document.createElement('div');
        yearMarker.className = 'year-marker';
        yearMarker.innerHTML = `
            <div class="year-dot"></div>
            <div class="year-label">${year}</div>
        `;
        yearsContainer.appendChild(yearMarker);
    });
}

function renderMilestones(years) {
    const milestonesContainer = document.getElementById('timelineMilestones');
    milestonesContainer.innerHTML = '';

    const yearCount = years.length;
    const timelineWidth = 8000; // Match CSS width
    const padding = 100; // Padding on edges
    const usableWidth = timelineWidth - (padding * 2);

    // 1. Calculate horizontal positions for all milestones first
    const positionedMilestones = [];

    milestones.forEach((milestone, index) => {
        const yearIndex = years.indexOf(milestone.year);
        if (yearIndex === -1) return;

        const yearPixelPos = padding + (yearIndex / (yearCount - 1)) * usableWidth;
        const milestonesInYear = milestones.filter(m => m.year === milestone.year);
        const indexInYear = milestonesInYear.indexOf(milestone);
        const totalInYear = milestonesInYear.length;

        const spreadRange = 400; // Increased range for better spacing to the right
        let offsetX = 0;

        if (totalInYear === 1) {
            offsetX = 50; // Single event: small offset to the right
        } else {
            // Multiple events: distribute them to the right of the year marker
            const step = spreadRange / totalInYear;
            offsetX = 30 + step * indexInYear; // Start at 30px to the right, then space out
        }

        const leftPx = yearPixelPos + offsetX;

        // Determine approximate width based on importance
        // Normal: ~180px width (160px min-width + padding)
        // Important: ~220px width
        const approxWidth = milestone.important ? 240 : 180;

        positionedMilestones.push({
            data: milestone,
            index: index,
            left: leftPx,
            width: approxWidth,
            right: leftPx + approxWidth / 2, // Assume centered
            leftEdge: leftPx - approxWidth / 2
        });
    });

    // 2. Assign tracks (vertical levels) to avoid collision

    // Track systems
    const normalTrackEnds = [];
    const importantTrackEnds = [];

    // Configuration
    const baseConnectorHeight = 60;
    const trackHeightStep = 110;

    // Important milestones configuration
    // We define 3 high-altitude tracks to stagger important milestones
    const availableHeight = window.innerHeight - 100;
    const importantBaseHeight = Math.min(availableHeight * 0.75, 650);
    const importantStep = 120; // Vertical distance between overlapping important cards

    // Sort by position to process left-to-right
    positionedMilestones.sort((a, b) => a.left - b.left);

    positionedMilestones.forEach(pm => {
        // Check visibility filters
        const shouldHide = (filteredCategory !== 'all' && filteredCategory !== pm.data.category) ||
            (showOnlyImportant && !pm.data.important);

        if (shouldHide) {
            renderMilestoneElement(pm, 0, true);
            return;
        }

        let connectorHeight;
        const cardGap = 20; // Minimum gap between cards

        if (pm.data.important) {
            // Important milestones: Use high-altitude tracks
            // We try to place it at the highest track (0), then go down if occupied
            // But visually, track 0 should be the *highest* point? 
            // Let's say track 0 is the base high level. Track 1 is slightly lower.

            let trackIndex = 0;
            let placed = false;

            while (!placed) {
                if (importantTrackEnds[trackIndex] === undefined) {
                    importantTrackEnds[trackIndex] = -Infinity;
                }

                if (pm.leftEdge > importantTrackEnds[trackIndex] + cardGap) {
                    importantTrackEnds[trackIndex] = pm.right;
                    placed = true;
                } else {
                    trackIndex++;
                }
            }

            // Calculate height: Base high level - (track * step)
            // This means if they overlap, the next one appears slightly LOWER than the main high line
            connectorHeight = importantBaseHeight - (trackIndex * importantStep);

        } else {
            // Normal milestones: Standard bottom-up tracks
            let trackIndex = 0;
            let placed = false;

            while (!placed) {
                if (normalTrackEnds[trackIndex] === undefined) {
                    normalTrackEnds[trackIndex] = -Infinity;
                }

                if (pm.leftEdge > normalTrackEnds[trackIndex] + cardGap) {
                    normalTrackEnds[trackIndex] = pm.right;
                    placed = true;
                } else {
                    trackIndex++;
                }
            }

            // Calculate height based on track
            connectorHeight = baseConnectorHeight + (trackIndex * trackHeightStep);
        }

        renderMilestoneElement(pm, connectorHeight, false);
    });

    function renderMilestoneElement(pm, height, hidden) {
        const milestone = pm.data;
        const index = pm.index;

        const milestoneId = `${milestone.year}-${milestone.title.replace(/\s+/g, '-').toLowerCase()}`;
        const customOffset = milestonePositions[milestoneId] || 0;
        const finalHeight = Math.max(20, height + customOffset); // Minimum height 20px

        const milestoneEl = document.createElement('div');
        milestoneEl.className = `milestone ${milestone.important ? 'important' : ''}`;
        if (hidden) milestoneEl.classList.add('hidden');

        milestoneEl.setAttribute('data-category', milestone.category);
        milestoneEl.setAttribute('data-id', milestoneId);
        milestoneEl.style.cssText = `
            left: ${pm.left}px;
            z-index: ${milestone.important ? 100 : 10 + Math.floor(finalHeight / 10)}; /* Important always on top */
        `;

        milestoneEl.innerHTML = `
            <div class="milestone-connector" style="height: ${finalHeight}px;"></div>
            <div class="milestone-card">
                <div class="milestone-row">
                    <span class="milestone-icon">${milestone.icon}</span>
                    <span class="milestone-title">${milestone.title}</span>
                    <span class="milestone-star ${milestone.important ? 'active' : ''}" data-index="${index}">⭐</span>
                </div>
            </div>
        `;

        // Add hover tooltip
        milestoneEl.addEventListener('mouseenter', (e) => showTooltip(e, milestone));
        milestoneEl.addEventListener('mouseleave', hideTooltip);

        // Add star click handler
        const star = milestoneEl.querySelector('.milestone-star');
        star.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleImportant(index);
        });

        // Drag & Drop functionality
        const card = milestoneEl.querySelector('.milestone-card');
        card.addEventListener('mousedown', (e) => dragStart(e, milestoneEl, milestoneId, height));

        milestonesContainer.appendChild(milestoneEl);
    }
}

// ============================================
// DRAG & DROP LOGIC
// ============================================

let isDragging = false;
let currentDragItem = null;
let dragStartY = 0;
let initialHeight = 0;
let currentMilestoneId = null;
let baseHeight = 0;

function dragStart(e, element, id, originalBaseHeight) {
    if (e.target.classList.contains('milestone-star')) return; // Don't drag when clicking star

    isDragging = true;
    currentDragItem = element;
    currentMilestoneId = id;
    baseHeight = originalBaseHeight;
    dragStartY = e.clientY;

    // Get current height
    const connector = element.querySelector('.milestone-connector');
    initialHeight = parseInt(connector.style.height || baseHeight);

    element.querySelector('.milestone-card').classList.add('dragging');
    document.body.style.cursor = 'grabbing';

    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);
}

function drag(e) {
    if (!isDragging) return;
    e.preventDefault();

    const deltaY = dragStartY - e.clientY; // Moving up increases height
    const newHeight = Math.max(20, initialHeight + deltaY); // Min height 20px

    const connector = currentDragItem.querySelector('.milestone-connector');
    connector.style.height = `${newHeight}px`;

    // Update z-index based on new height
    currentDragItem.style.zIndex = 10 + Math.floor(newHeight / 10);
}

function dragEnd(e) {
    if (!isDragging) return;

    isDragging = false;
    document.body.style.cursor = 'default';
    currentDragItem.querySelector('.milestone-card').classList.remove('dragging');

    const connector = currentDragItem.querySelector('.milestone-connector');
    const finalHeight = parseInt(connector.style.height);

    // Calculate offset from base height
    const offset = finalHeight - baseHeight;

    if (offset !== 0) {
        milestonePositions[currentMilestoneId] = offset;
    } else {
        delete milestonePositions[currentMilestoneId];
    }

    saveToLocalStorage();

    document.removeEventListener('mousemove', drag);
    document.removeEventListener('mouseup', dragEnd);
    currentDragItem = null;
}

function randomBetween(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

// ============================================
// TOOLTIP
// ============================================

function showTooltip(event, milestone) {
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

function resetPositions() {
    if (confirm('¿Estás seguro de resetear todas las posiciones personalizadas?')) {
        milestonePositions = {};
        saveToLocalStorage();
        renderTimeline();
        alert('✅ Posiciones reseteadas');
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

    document.getElementById('totalMilestones').textContent = total;
    document.getElementById('importantMilestones').textContent = important;
    document.getElementById('yearRange').textContent = `${yearRange.min}-${yearRange.max}`;
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
        backgroundColor: '#111111', // Ensure dark background
        logging: false,
        useCORS: true
    }).then(canvas => {
        // Create download link
        const link = document.createElement('a');
        link.download = 'linea-tiempo-dagtech.jpg';
        link.href = canvas.toDataURL('image/jpeg', 0.9);
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
// EVENT LISTENERS
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Load data
    let loadedFromFetch = false;
    try {
        const response = await fetch('data.md');
        if (response.ok) {
            const text = await response.text();
            if (text) {
                INITIAL_DATA = text;
                milestones = parseMarkdown(INITIAL_DATA);
                saveToLocalStorage(); // Update local storage with fresh data
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
            console.log('Datos cargados desde localStorage (offline o error de fetch)');
        }
    }

    // Initial render
    renderTimeline();

    // Header buttons
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

    // Menu functionality
    const navMenu = document.getElementById('navMenu');
    const menuBtn = document.getElementById('menuBtn');
    const closeMenuBtn = document.getElementById('closeMenuBtn');

    function toggleMenu() {
        navMenu.classList.toggle('open');
    }

    menuBtn.addEventListener('click', toggleMenu);
    closeMenuBtn.addEventListener('click', toggleMenu);

    // Close menu when clicking outside content
    navMenu.addEventListener('click', (e) => {
        if (e.target === navMenu) {
            toggleMenu();
        }
    });

    // Editor actions
    document.getElementById('importMarkdownBtn').addEventListener('click', importFromMarkdown);
    document.getElementById('exportMarkdownBtn').addEventListener('click', exportMarkdownToTextarea);
    document.getElementById('resetDataBtn').addEventListener('click', resetToInitialData);
    document.getElementById('resetPositionsBtn').addEventListener('click', resetPositions);
    document.getElementById('clearDataBtn').addEventListener('click', clearAllData);
    document.getElementById('exportJpgBtn').addEventListener('click', exportToJPG);

    // Version switcher
    document.getElementById('switchVersionBtn').addEventListener('click', () => {
        window.location.href = 'index-compact.html';
    });
});
