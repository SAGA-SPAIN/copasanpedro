// 78 Copa San Pedro 2026 - Tournament Management & Scheduler Engine

// --- 1. BASE DATABASE & INITIAL STATE ---
const INITIAL_TEAMS = [
    // Capital (Grupos A-D)
    { id: 'C1', name: 'CF BARRIO SAN GABRIEL', zone: 'capital', group: 'B' },
    { id: 'C2', name: 'VIASPORT MARISTAS', zone: 'capital', group: 'A' },
    { id: 'C3', name: 'ALICANTE FOOTBALL ACADEMY', zone: 'capital', group: 'D' },
    { id: 'C4', name: 'MEDITERRÁNEO-PEÑA EL BOTIJO', zone: 'capital', group: 'A' },
    { id: 'C5', name: 'CD VILLAFRANQUEZA', zone: 'capital', group: 'C' },
    { id: 'C6', name: 'ATLETICO SAN BLAS', zone: 'capital', group: 'D' },
    { id: 'C7', name: 'SCD SAN BLAS', zone: 'capital', group: 'A' },
    { id: 'C8', name: 'C.A. EL PRINCIPIO', zone: 'capital', group: 'C' },
    { id: 'C9', name: 'INTER LEUKA-DUAL LINK', zone: 'capital', group: 'B' },
    { id: 'C10', name: 'SALESIANOS BY DICKENS', zone: 'capital', group: 'C' },
    { id: 'C11', name: 'ALICANTE SPORT ACADEMY', zone: 'capital', group: 'B' },
    { id: 'C12', name: 'LACROSS BABEL', zone: 'capital', group: 'D' },
    { id: 'C13', name: 'BETIS FLORIDA', zone: 'capital', group: 'D' },
    { id: 'C14', name: 'CD CAMPELLO- CASA SALVI', zone: 'capital', group: 'B' },
    { id: 'C15', name: 'PLAYAS ALICANTE', zone: 'capital', group: 'A' },
    { id: 'C16', name: 'ALICANTE CITY FC ACADEMY', zone: 'capital', group: 'C' },

    // Provincia (Grupos E-F)
    { id: 'P1', name: 'MONNEGRE MUCHAMIEL', zone: 'provincia', group: 'F' },
    { id: 'P2', name: 'FUNDACIÓN CD CAMPELLO', zone: 'provincia', group: 'F' },
    { id: 'P3', name: 'JOVE ESPAÑOL SANT VICENT', zone: 'provincia', group: 'E' },
    { id: 'P4', name: 'VILLAJOYOSA CF', zone: 'provincia', group: 'F' },
    { id: 'P5', name: 'ALTET CF', zone: 'provincia', group: 'E' },
    { id: 'P6', name: 'AC TORRELANO', zone: 'provincia', group: 'E' },
    { id: 'P7', name: 'GIMNÀSTIC SANT VICENT', zone: 'provincia', group: 'E' },
    { id: 'P8', name: 'MUTXAMEL CF', zone: 'provincia', group: 'F' }
];

// Default Blocked Dates
const DEFAULT_BLOCKED_DATES = [
    "2026-06-15", // Mundial
    "2026-06-27", // Mundial
    "2026-06-20", // Hogueras
    "2026-06-21", // Hogueras
    "2026-06-22", // Hogueras
    "2026-06-23", // Hogueras
    "2026-06-24"  // Hogueras
];

const VENUES = {
    capital: ["Sede Capital 1 - Campo de la Vía", "Sede Capital 2 - Campo del Cabo"],
    provincia: ["Sede Provincia 1 - Municipal El Vincle", "Sede Provincia 2 - Polideportivo Municipal"]
};

const FALLBACK_ENROLLED_TEAMS = {
    capital: [
        "INTER LEUKA-DUAL LINK",
        "SCD SAN BLAS",
        "ALICANTE FOOTBALL ACADEMY",
        "SALESIANOS BY DICKENS",
        "CD CAMPELLO- CASA SALVI",
        "CF BARRIO SAN GABRIEL",
        "CD VILLAFRANQUEZA",
        "BETIS FLORIDA",
        "C.A. EL PRINCIPIO",
        "VIASPORT MARISTAS",
        "LACROSS BABEL",
        "PLAYAS ALICANTE",
        "MEDITERRÁNEO-PEÑA EL BOTIJO",
        "ALICANTE SPORT ACADEMY",
        "ATLETICO SAN BLAS",
        "PENDIENTE/VACANTE"
    ],
    provincia: [
        "JOVE ESPAÑOL SANT VICENT",
        "GIMNÀSTIC SANT VICENT",
        "MONNEGRE MUCHAMIEL",
        "MUTXAMEL CF",
        "AC TORRELANO",
        "VILLAJOYOSA CF",
        "FUNDACIÓN CD CAMPELLO",
        "ALTET CF"
    ]
};
let isAdmin = false;
let enrolledTeams = JSON.parse(JSON.stringify(FALLBACK_ENROLLED_TEAMS));

// Global App State
let state = {
    teams: [],
    matches: [],
    settings: {
        allowWeekends: false,
        useMultisede: true,
        maxMatchesPerDay: 2,
        minRestDays: 2,
        blockedDates: []
    },
    activeTab: 'presentation',
    currentSlide: 0,
    currentCalendarMonth: 5, // June (0-indexed calendar is 5)
    currentCalendarYear: 2026,
    calendarViewMode: 'list', // 'list' or 'grid'
    selectedBracketTab: 'capital', // 'capital', 'provincia', 'final'
    selectedMatchToEdit: null,
    selectedDrawTeam: null, // Currently highlighted real team for assignment
    groupFilters: {
        stage: 'all',
        group: 'all',
        team: 'all',
        status: 'all'
    }
};

// --- 2. INITIALIZATION & STORAGE ---
async function initApp() {
    await checkAuthStatus();
    await loadState();
    await loadEnrolledTeams();
    bindEvents();
    renderAll();
    
    // Warn if accessed via local file protocol instead of web server
    if (window.location.protocol === 'file:') {
        showToast("Advertencia: Acceso local (file://). Para que el inicio de sesión y la sincronización funcionen, debe abrir la aplicación mediante el servidor (ej. http://localhost:3000 o la URL de su servidor remoto).", "warning", 15000);
    }
    
    // Start periodic polling for state updates (pollState checks isAdmin internally)
    if (typeof fetch !== 'undefined') {
        setInterval(pollState, 3000);
    }
}

async function loadEnrolledTeams() {
    try {
        const response = await fetch('equipos-inscritos.json');
        if (!response.ok) throw new Error("Respuesta de red no válida");
        const data = await response.json();
        if (data.participantes && data.participantes.capital && data.participantes.provincia) {
            enrolledTeams = data.participantes;
            console.log("Equipos inscritos cargados correctamente desde el JSON.");
        }
    } catch (e) {
        console.warn("No se pudo cargar equipos-inscritos.json, usando listado predeterminado:", e.message);
        enrolledTeams = JSON.parse(JSON.stringify(FALLBACK_ENROLLED_TEAMS));
    }
}

async function loadState() {
    // 1. Try to load from server
    if (typeof fetch !== 'undefined') {
        try {
            const response = await fetch('/api/state');
            if (response.ok) {
                const serverState = await response.json();
                if (serverState && serverState.teams && serverState.matches) {
                    state = serverState;
                    console.log("State loaded successfully from server.");
                    return;
                }
            }
        } catch (e) {
            console.warn("Failed to load state from server, falling back to localStorage:", e.message);
        }
    }

    // 2. Fallback to localStorage
    const saved = localStorage.getItem('copa_san_pedro_2026_state');
    if (saved) {
        try {
            state = JSON.parse(saved);
            if (state.currentSlide === undefined) state.currentSlide = 0;
        } catch (e) {
            console.error("Error loading state, resetting", e);
            resetToDefaultState();
        }
    } else {
        resetToDefaultState();
    }
}

async function saveState() {
    // Add client-side timestamp
    state.lastUpdated = Date.now();
    
    // Always save to localStorage as local backup
    localStorage.setItem('copa_san_pedro_2026_state', JSON.stringify(state));
    
    // Save to server if admin
    if (isAdmin && typeof fetch !== 'undefined') {
        try {
            const response = await fetch('/api/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(state)
            });
            if (!response.ok) {
                console.error("Failed to save state to server.");
                showToast("Error al guardar estado en el servidor", "danger");
            }
        } catch (e) {
            console.error("Error saving state to server:", e);
            showToast("Error de conexión al guardar en el servidor", "danger");
        }
    }
}

// --- ADMIN & AUTH SYNC HELPER FUNCTIONS ---
async function checkAuthStatus() {
    if (typeof fetch !== 'undefined') {
        try {
            const response = await fetch('/api/auth-status');
            if (response.ok) {
                const data = await response.json();
                isAdmin = !!data.isAdmin;
                updateAdminUI();
            }
        } catch (e) {
            console.warn("Could not retrieve auth status from server:", e.message);
            isAdmin = false;
            updateAdminUI();
        }
    } else {
        isAdmin = false;
    }
}

function updateAdminUI() {
    const loginText = document.getElementById('login-text');
    const loginIcon = document.getElementById('login-icon');
    const loginTrigger = document.getElementById('btn-login-trigger');
    
    if (isAdmin) {
        document.body.classList.add('is-admin');
        if (loginText) loginText.innerText = 'Cerrar Sesión';
        if (loginTrigger) loginTrigger.classList.add('logged-in');
        if (loginIcon) {
            loginIcon.innerHTML = `<path d="M12 17c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm6-9h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6h1.9c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm0 12H6V10h12v10z"/>`;
        }
    } else {
        document.body.classList.remove('is-admin');
        if (loginText) loginText.innerText = 'Acceso Admin';
        if (loginTrigger) loginTrigger.classList.remove('logged-in');
        if (loginIcon) {
            loginIcon.innerHTML = `<path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>`;
        }
    }
}

async function pollState() {
    if (isAdmin || typeof fetch === 'undefined') return;
    try {
        const response = await fetch('/api/state');
        if (response.ok) {
            const serverState = await response.json();
            if (serverState && serverState.lastUpdated && serverState.lastUpdated !== state.lastUpdated) {
                console.log("Server state updated. Merging...");
                state.teams = serverState.teams;
                state.matches = serverState.matches;
                state.settings = serverState.settings;
                state.lastUpdated = serverState.lastUpdated;
                renderAll();
            }
        }
    } catch (e) {
        console.warn("Error polling state:", e);
    }
}

function openLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.add('active');
        document.getElementById('login-username').value = '';
        document.getElementById('login-password').value = '';
        document.getElementById('login-error-msg').style.display = 'none';
        document.getElementById('login-username').focus();
    }
}

function closeLoginModal() {
    const modal = document.getElementById('login-modal');
    if (modal) {
        modal.classList.remove('active');
    }
}

async function handleLoginSubmit(e) {
    e.preventDefault();
    const u = document.getElementById('login-username').value;
    const p = document.getElementById('login-password').value;
    const errorMsg = document.getElementById('login-error-msg');
    
    if (typeof fetch !== 'undefined') {
        try {
            const response = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: u, password: p })
            });
            
            let data = {};
            try {
                data = await response.json();
            } catch (jsonErr) {
                console.warn("Failed to parse server response as JSON:", jsonErr);
            }
            
            if (response.ok && data.success) {
                isAdmin = true;
                updateAdminUI();
                closeLoginModal();
                showToast("Acceso de administrador concedido", "success");
                await loadState();
                renderAll();
            } else {
                const errMsg = data.message || "Usuario o contraseña incorrectos.";
                if (errorMsg) {
                    errorMsg.innerText = errMsg;
                    errorMsg.style.display = 'block';
                }
                showToast(errMsg, "danger");
            }
        } catch (err) {
            console.error("Login request error:", err);
            showToast("Error de conexión con el servidor. Verifique si el servidor Node está en ejecución.", "danger");
        }
    }
}

async function handleLogout() {
    if (confirm("¿Seguro que deseas cerrar la sesión de administrador?")) {
        if (typeof fetch !== 'undefined') {
            try {
                const response = await fetch('/api/logout', { method: 'POST' });
                if (response.ok) {
                    isAdmin = false;
                    updateAdminUI();
                    showToast("Sesión cerrada", "info");
                    if (state.activeTab === 'draw' || state.activeTab === 'config') {
                        switchTab('dashboard');
                    }
                    renderAll();
                    // Polling will automatically resume as isAdmin is false
                }
            } catch (err) {
                console.error("Logout request error:", err);
                showToast("Error de conexión al cerrar sesión", "danger");
            }
        } else {
            isAdmin = false;
            updateAdminUI();
        }
    }
}

function resetToDefaultState() {
    state.teams = JSON.parse(JSON.stringify(INITIAL_TEAMS));
    state.settings = {
        allowWeekends: false,
        useMultisede: true,
        maxMatchesPerDay: 2,
        minRestDays: 2,
        blockedDates: [...DEFAULT_BLOCKED_DATES]
    };
    state.matches = [];
    state.selectedDrawTeam = null;
    state.currentSlide = 0;
    generateInitialSchedule();
    saveState();
}

// --- 3. AUTOMATIC SCHEDULER ENGINE ---
// --- 3. AUTOMATIC SCHEDULER ENGINE ---
const TEAM_VENUES = {
    "C1": "Pol. J.A. Samarach",
    "C2": "Polideportivo Tombola",
    "C3": "Ciudad Deportiva Antonio Valls",
    "C4": "CF Sandra Paños",
    "C5": "Campo de Futbol Antonio Solana",
    "C6": "Pol. San Blas",
    "C7": "polideportivo San Blas",
    "C8": "Pol Pla Garbinet",
    "C9": "Ciudad Deportiva Antonio Valls",
    "C10": "C.F Florida Babel",
    "C11": "Pol. J.A. Samarach",
    "C12": "Polideportivo Tombola",
    "C13": "CF Florida Babel",
    "C14": "Pol. Pla Garbinet",
    "C15": "Campo de Futbol Sandra Paños",
    "C16": "Pol. Via Parque",
    "P1": "Polideportivo El Oms Mutxamel",
    "P2": "Polideportivo \"El Vincle\"",
    "P3": "Polideportivo San Vicente del Raspeig",
    "P4": "Estadio Municipal Nou Pla",
    "P5": "Polideportivo Municipal El Altet",
    "P6": "POLIDEPORTIVO TORRELLANO - ISABEL FERNANDEZ",
    "P7": "Polideportivo San Vicente del Raspeig",
    "P8": "Polideportivo El Oms Mutxamel"
};

function getMatchVenue(match) {
    if (match.venue && match.venue.trim() !== '') {
        return match.venue;
    }
    if (match.id === 'Final-C') {
        return 'Ciudad Deportiva Antonio Valls de Alicante';
    }
    if (match.id === 'Final-P') {
        return 'Ciudad Deportiva Camilo Cano de La Nucía';
    }
    if (match.id === 'Gran-Final') {
        return 'Estadio José Rico Pérez de Alicante';
    }
    return TEAM_VENUES[match.homeTeam] || `Campo de ${getTeamFullName(match.homeTeam)}`;
}

function generateInitialSchedule() {
    state.matches = [];
    
    // Group stage matchups definition for 4 teams {0, 1, 2, 3}
    // Round 1: 0 vs 1, 2 vs 3
    // Round 2: 0 vs 2, 1 vs 3
    // Round 3: 0 vs 3, 1 vs 2
    
    const groups = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    // We will generate the match objects
    const matchesToSchedule = [];
    
    groups.forEach(gId => {
        const gTeams = state.teams.filter(t => t.group === gId);
        // Sort teams to ensure deterministic match pairings based on the master doc
        
        // Let's order them exactly as defined in the document
        const orderMap = {
            'A': ['C7', 'C2', 'C15', 'C4'],
            'B': ['C9', 'C11', 'C1', 'C14'],
            'C': ['C5', 'C16', 'C8', 'C10'],
            'D': ['C3', 'C12', 'C6', 'C13'],
            'E': ['P3', 'P5', 'P6', 'P7'],
            'F': ['P1', 'P2', 'P4', 'P8']
        };
        
        const sortedTeams = orderMap[gId].map(id => gTeams.find(t => t.id === id));
        
        // Define matchups for rounds 1, 2, 3
        const roundPairs = [
            [[0, 1], [2, 3]], // J1: 0 vs 1, 2 vs 3 (H: 0, 2; A: 1, 3)
            [[3, 0], [1, 2]], // J2: 3 vs 0, 1 vs 2 (H: 3, 1; A: 0, 2)
            [[0, 2], [3, 1]]  // J3: 0 vs 2, 3 vs 1 (H: 0, 3; A: 2, 1)
        ];
        
        roundPairs.forEach((round, roundIdx) => {
            const roundNum = roundIdx + 1;
            round.forEach((pair, pairIdx) => {
                matchesToSchedule.push({
                    id: `${gId}-R${roundNum}-${sortedTeams[pair[0]].id}v${sortedTeams[pair[1]].id}`,
                    stage: 'group',
                    group: gId,
                    round: roundNum,
                    homeTeam: sortedTeams[pair[0]].id,
                    awayTeam: sortedTeams[pair[1]].id,
                    homeScore: null,
                    awayScore: null,
                    date: '',
                    time: '20:00',
                    venue: '',
                    status: 'pending',
                    zone: gId <= 'D' ? 'capital' : 'provincia',
                    pairIdx: pairIdx // Temporary helper property
                });
            });
        });
    });
    
    // Apply home/away and id swaps for the matches that deviate from standard template
    const swaps = {
        'B-R3-C9vC1': { newId: 'B-R3-C1vC9', home: 'C1', away: 'C9' },
        'B-R3-C14vC11': { newId: 'B-R3-C11vC14', home: 'C11', away: 'C14' },
        'C-R3-C5vC8': { newId: 'C-R3-C8vC5', home: 'C8', away: 'C5' },
        'C-R3-C10vC16': { newId: 'C-R3-C16vC10', home: 'C16', away: 'C10' }
    };
    
    matchesToSchedule.forEach(m => {
        if (swaps[m.id]) {
            const s = swaps[m.id];
            m.id = s.newId;
            m.homeTeam = s.home;
            m.awayTeam = s.away;
        }
    });

    // Deterministic Date mapping for each group stage round (no two matches of same group/round on the same day)
    const matchDateAssignments = {
        'A': {
            1: { 0: '2026-06-01', 1: '2026-06-03' },
            2: { 0: '2026-06-08', 1: '2026-06-10' },
            3: { 0: '2026-06-17', 1: '2026-06-19' }
        },
        'B': {
            1: { 0: '2026-06-01', 1: '2026-06-03' },
            2: { 0: '2026-06-08', 1: '2026-06-10' },
            3: { 0: '2026-06-17', 1: '2026-06-19' }
        },
        'C': {
            1: { 0: '2026-06-01', 1: '2026-06-05' },
            2: { 0: '2026-06-08', 1: '2026-06-12' },
            3: { 0: '2026-06-17', 1: '2026-06-26' }
        },
        'D': {
            1: { 0: '2026-06-03', 1: '2026-06-05' },
            2: { 0: '2026-06-10', 1: '2026-06-12' },
            3: { 0: '2026-06-19', 1: '2026-06-26' }
        },
        'E': {
            1: { 0: '2026-06-09', 1: '2026-06-11' },
            2: { 0: '2026-06-16', 1: '2026-06-18' },
            3: { 0: '2026-06-30', 1: '2026-07-02' }
        },
        'F': {
            1: { 0: '2026-06-09', 1: '2026-06-11' },
            2: { 0: '2026-06-16', 1: '2026-06-18' },
            3: { 0: '2026-06-30', 1: '2026-07-02' }
        }
    };
    
    matchesToSchedule.forEach(match => {
        const g = match.group;
        const r = match.round;
        const pIdx = match.pairIdx;
        
        match.date = matchDateAssignments[g][r][pIdx];
        match.time = match.zone === 'capital' ? '20:30' : '20:00';
        match.venue = ''; // Empty string, resolved dynamically by getMatchVenue
        
        delete match.pairIdx; // clean up temporary property
    });
    
    state.matches = matchesToSchedule;
    
    // Generate empty playoffs matches
    generatePlayoffsSkeleton();
}

function generatePlayoffsSkeleton() {
    // Generate Capital Playoffs Skeleton
    // Cuartos de Final (CF1, CF2, CF3, CF4) - 29 Jun and 1 Jul
    // Semifinales (SF-C1, SF-C2) - 6 Jul and 8 Jul
    // Final Capital - 10 Jul
    
    const capitalPlayoffs = [
        { id: 'CF1', stage: 'playoffs', zone: 'capital', round: 'CF', homeTeam: '1º Grupo A', awayTeam: '2º Grupo C', homeScore: null, awayScore: null, date: '2026-06-29', time: '20:30', venue: '', status: 'pending' },
        { id: 'CF2', stage: 'playoffs', zone: 'capital', round: 'CF', homeTeam: '1º Grupo B', awayTeam: '2º Grupo D', homeScore: null, awayScore: null, date: '2026-06-29', time: '20:30', venue: '', status: 'pending' },
        { id: 'CF3', stage: 'playoffs', zone: 'capital', round: 'CF', homeTeam: '1º Grupo C', awayTeam: '2º Grupo A', homeScore: null, awayScore: null, date: '2026-07-01', time: '20:30', venue: '', status: 'pending' },
        { id: 'CF4', stage: 'playoffs', zone: 'capital', round: 'CF', homeTeam: '1º Grupo D', awayTeam: '2º Grupo B', homeScore: null, awayScore: null, date: '2026-07-01', time: '20:30', venue: '', status: 'pending' },
        
        { id: 'SF-C1', stage: 'playoffs', zone: 'capital', round: 'SF', homeTeam: 'Ganador CF1', awayTeam: 'Ganador CF2', homeScore: null, awayScore: null, date: '2026-07-06', time: '20:30', venue: '', status: 'pending' },
        { id: 'SF-C2', stage: 'playoffs', zone: 'capital', round: 'SF', homeTeam: 'Ganador CF3', awayTeam: 'Ganador CF4', homeScore: null, awayScore: null, date: '2026-07-08', time: '20:30', venue: '', status: 'pending' },
        
        { id: 'Final-C', stage: 'playoffs', zone: 'capital', round: 'F', homeTeam: 'Ganador SF-C1', awayTeam: 'Ganador SF-C2', homeScore: null, awayScore: null, date: '2026-07-10', time: '20:30', venue: '', status: 'pending' }
    ];

    // Provincia Playoffs Skeleton
    // Semifinales (SF-P1, SF-P2) - 30 Jun, 2 Jul
    // Final Provincia - 9 Jul
    const provinciaPlayoffs = [
        { id: 'SF-P1', stage: 'playoffs', zone: 'provincia', round: 'SF', homeTeam: '1º Grupo E', awayTeam: '2º Grupo F', homeScore: null, awayScore: null, date: '2026-06-30', time: '20:00', venue: '', status: 'pending' },
        { id: 'SF-P2', stage: 'playoffs', zone: 'provincia', round: 'SF', homeTeam: '1º Grupo F', awayTeam: '2º Grupo E', homeScore: null, awayScore: null, date: '2026-07-02', time: '20:00', venue: '', status: 'pending' },
        
        { id: 'Final-P', stage: 'playoffs', zone: 'provincia', round: 'F', homeTeam: 'Ganador SF-P1', awayTeam: 'Ganador SF-P2', homeScore: null, awayScore: null, date: '2026-07-09', time: '20:00', venue: '', status: 'pending' }
    ];

    // Gran Final Absoluta - 17 Jul
    const grandFinal = [
        { id: 'Gran-Final', stage: 'playoffs', zone: 'final', round: 'GF', homeTeam: 'Campeón Capital', awayTeam: 'Campeón Provincia', homeScore: null, awayScore: null, date: '2026-07-17', time: '20:00', venue: '', status: 'pending' }
    ];

    state.matches.push(...capitalPlayoffs, ...provinciaPlayoffs, ...grandFinal);
}

// --- 4. STANDINGS & CALCULATIONS ---
function calculateGroupStandings(groupId) {
    const gTeams = state.teams.filter(t => t.group === groupId);
    const standings = gTeams.map(t => ({
        id: t.id,
        name: t.name,
        pj: 0, g: 0, e: 0, p: 0, gf: 0, gc: 0, dg: 0, pts: 0
    }));
    
    // Fetch completed matches in this group
    const groupMatches = state.matches.filter(m => m.stage === 'group' && m.group === groupId && m.status === 'completed');
    
    groupMatches.forEach(m => {
        const home = standings.find(t => t.id === m.homeTeam);
        const away = standings.find(t => t.id === m.awayTeam);
        if (!home || !away) return;
        
        home.pj++;
        away.pj++;
        home.gf += m.homeScore;
        home.gc += m.awayScore;
        away.gf += m.awayScore;
        away.gc += m.homeScore;
        
        if (m.homeScore > m.awayScore) {
            home.g++;
            home.pts += 3;
            away.p++;
        } else if (m.homeScore < m.awayScore) {
            away.g++;
            away.pts += 3;
            home.p++;
        } else {
            home.e++;
            home.pts += 1;
            away.e++;
            away.pts += 1;
        }
    });
    
    standings.forEach(t => {
        t.dg = t.gf - t.gc;
    });
    
    // Sort: 1. Points, 2. Goal Difference, 3. Goals For, 4. Code alphabetical
    standings.sort((a, b) => {
        if (b.pts !== a.pts) return b.pts - a.pts;
        if (b.dg !== a.dg) return b.dg - a.dg;
        if (b.gf !== a.gf) return b.gf - a.gf;
        return a.id.localeCompare(b.id);
    });
    
    return standings;
}

function updatePlayoffsTeams() {
    // Top 2 of Groups A-D qualify for Capital playoffs
    // Top 2 of Groups E-F qualify for Provincia playoffs
    const standings = {};
    ['A', 'B', 'C', 'D', 'E', 'F'].forEach(g => {
        standings[g] = calculateGroupStandings(g);
    });
    
    const isGroupStageFinished = (zone) => {
        const groups = zone === 'capital' ? ['A', 'B', 'C', 'D'] : ['E', 'F'];
        const groupMatches = state.matches.filter(m => m.stage === 'group' && groups.includes(m.group));
        return groupMatches.every(m => m.status === 'completed');
    };
    
    const isGroupFinished = (groupId) => {
        const groupMatches = state.matches.filter(m => m.stage === 'group' && m.group === groupId);
        return groupMatches.every(m => m.status === 'completed');
    };
    
    // 1. Capital Cuartos de Final updates
    const cfMatches = state.matches.filter(m => m.id.startsWith('CF'));
    cfMatches.forEach(m => {
        if (m.status === 'completed') return; // Don't overwrite completed playoff matches
        
        if (m.id === 'CF1') {
            m.homeTeam = isGroupFinished('A') ? standings['A'][0].id : '1º Grupo A';
            m.awayTeam = isGroupFinished('C') ? standings['C'][1].id : '2º Grupo C';
        } else if (m.id === 'CF2') {
            m.homeTeam = isGroupFinished('B') ? standings['B'][0].id : '1º Grupo B';
            m.awayTeam = isGroupFinished('D') ? standings['D'][1].id : '2º Grupo D';
        } else if (m.id === 'CF3') {
            m.homeTeam = isGroupFinished('C') ? standings['C'][0].id : '1º Grupo C';
            m.awayTeam = isGroupFinished('A') ? standings['A'][1].id : '2º Grupo A';
        } else if (m.id === 'CF4') {
            m.homeTeam = isGroupFinished('D') ? standings['D'][0].id : '1º Grupo D';
            m.awayTeam = isGroupFinished('B') ? standings['B'][1].id : '2º Grupo B';
        }
    });

    // 2. Provincia Semifinales updates
    const provSfMatches = state.matches.filter(m => m.id.startsWith('SF-P'));
    provSfMatches.forEach(m => {
        if (m.status === 'completed') return;
        
        if (m.id === 'SF-P1') {
            m.homeTeam = isGroupFinished('E') ? standings['E'][0].id : '1º Grupo E';
            m.awayTeam = isGroupFinished('F') ? standings['F'][1].id : '2º Grupo F';
        } else if (m.id === 'SF-P2') {
            m.homeTeam = isGroupFinished('F') ? standings['F'][0].id : '1º Grupo F';
            m.awayTeam = isGroupFinished('E') ? standings['E'][1].id : '2º Grupo E';
        }
    });

    // 3. Advance Winner CF -> SF Capital
    const getWinnerId = (matchId) => {
        const m = state.matches.find(x => x.id === matchId);
        if (!m || m.status !== 'completed') return null;
        return m.homeScore > m.awayScore ? m.homeTeam : m.awayTeam;
    };
    
    const sfCapitalMatches = state.matches.filter(m => m.id.startsWith('SF-C'));
    sfCapitalMatches.forEach(m => {
        if (m.status === 'completed') return;
        
        if (m.id === 'SF-C1') {
            m.homeTeam = getWinnerId('CF1') || 'Ganador CF1';
            m.awayTeam = getWinnerId('CF2') || 'Ganador CF2';
        } else if (m.id === 'SF-C2') {
            m.homeTeam = getWinnerId('CF3') || 'Ganador CF3';
            m.awayTeam = getWinnerId('CF4') || 'Ganador CF4';
        }
    });

    // 4. Advance Winner SF -> Final Capital
    const finalCapital = state.matches.find(m => m.id === 'Final-C');
    if (finalCapital && finalCapital.status !== 'completed') {
        finalCapital.homeTeam = getWinnerId('SF-C1') || 'Ganador SF-C1';
        finalCapital.awayTeam = getWinnerId('SF-C2') || 'Ganador SF-C2';
    }

    // 5. Advance Winner SF -> Final Provincia
    const finalProvincia = state.matches.find(m => m.id === 'Final-P');
    if (finalProvincia && finalProvincia.status !== 'completed') {
        finalProvincia.homeTeam = getWinnerId('SF-P1') || 'Ganador SF-P1';
        finalProvincia.awayTeam = getWinnerId('SF-P2') || 'Ganador SF-P2';
    }

    // 6. Advance Winner Finals -> Gran Final Absoluta
    const grandFinal = state.matches.find(m => m.id === 'Gran-Final');
    if (grandFinal && grandFinal.status !== 'completed') {
        grandFinal.homeTeam = getWinnerId('Final-C') || 'Campeón Capital';
        grandFinal.awayTeam = getWinnerId('Final-P') || 'Campeón Provincia';
    }
}

// --- 5. CONSTRAINT VALIDATOR ENGINE ---
// Validates a single match and returns a list of constraint violations
function validateMatch(match, allMatches = state.matches) {
    const violations = [];
    if (!match.date) return violations;
    
    const targetDateStr = match.date;
    const targetDate = new Date(targetDateStr);
    
    // Constraint 1: Blocked Dates
    if (state.settings.blockedDates.includes(targetDateStr)) {
        violations.push({
            type: 'blocked',
            message: `Fecha bloqueada oficial (Mundial / Hogueras): ${formatDateFriendly(targetDateStr)}`
        });
    }
    
    // Constraint 2: Rest Days (minRestDays)
    const minRest = state.settings.minRestDays;
    if (minRest > 0 && match.stage === 'group') {
        const homeId = match.homeTeam;
        const awayId = match.awayTeam;
        
        // Find other group matches involving homeTeam or awayTeam
        const otherMatches = allMatches.filter(m => 
            m.date && 
            m.stage === 'group' &&
            m.id !== match.id && 
            (m.homeTeam === homeId || m.awayTeam === homeId || m.homeTeam === awayId || m.awayTeam === awayId)
        );
        
        otherMatches.forEach(om => {
            const oDate = new Date(om.date);
            const diffTime = Math.abs(targetDate - oDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            if (diffDays < minRest) {
                const involvedTeamId = (om.homeTeam === homeId || om.awayTeam === homeId) ? homeId : awayId;
                const involvedTeam = state.teams.find(t => t.id === involvedTeamId);
                violations.push({
                    type: 'rest',
                    message: `El equipo ${involvedTeam ? involvedTeam.name : involvedTeamId} (${involvedTeamId}) juega el ${formatDateFriendly(om.date)}. Descanso inferior a ${minRest} días.`
                });
            }
        });
    }
    
    // Constraint 3: Zone Weekday Distribution
    const dayOfWeek = targetDate.getDay(); // 0 = Sun, 1 = Mon, etc.
    if (match.stage === 'group') {
        if (match.zone === 'capital') {
            // Mon (1), Wed (3), Fri (5)
            let isAllowed = (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 5);
            if (state.settings.allowWeekends) {
                isAllowed = isAllowed || (dayOfWeek === 0 || dayOfWeek === 6);
            }
            if (!isAllowed) {
                violations.push({
                    type: 'wrongday',
                    message: `Fase Capital debe jugarse Lunes, Miércoles o Viernes (juega ${getDayName(dayOfWeek)}).`
                });
            }
        } else if (match.zone === 'provincia') {
            // Tue (2), Thu (4)
            if (dayOfWeek !== 2 && dayOfWeek !== 4) {
                violations.push({
                    type: 'wrongday',
                    message: `Fase Provincia debe jugarse Martes o Jueves (juega ${getDayName(dayOfWeek)}).`
                });
            }
        }
    }
    
    // Constraint 4: Daily Load Limit
    const maxLoad = state.settings.maxMatchesPerDay;
    if (state.settings.useMultisede) {
        // Limit per venue
        const currentVenue = getMatchVenue(match);
        const matchesOnDateInVenue = allMatches.filter(m => m.date === targetDateStr && getMatchVenue(m) === currentVenue && m.id !== match.id).length;
        if (matchesOnDateInVenue >= maxLoad) {
            violations.push({
                type: 'load',
                message: `La sede '${currentVenue}' excede el límite de ${maxLoad} partidos diarios (${matchesOnDateInVenue + 1} programados).`
            });
        }
    } else {
        // Overall daily limit (across all matches in the same zone)
        const matchesOnDateInZone = allMatches.filter(m => m.date === targetDateStr && m.zone === match.zone && m.id !== match.id).length;
        if (matchesOnDateInZone >= maxLoad) {
            violations.push({
                type: 'load',
                message: `La zona '${match.zone}' excede el límite total de ${maxLoad} partidos diarios (${matchesOnDateInZone + 1} programados).`
            });
        }
    }

    // Constraint 5: Same Group, Same Day
    if (match.stage === 'group') {
        const sameGroupSameDay = allMatches.some(m => 
            m.id !== match.id && 
            m.stage === 'group' && 
            m.group === match.group && 
            m.date === targetDateStr
        );
        if (sameGroupSameDay) {
            violations.push({
                type: 'samegroupday',
                message: `El Grupo ${match.group} tiene más de un partido programado el día ${formatDateFriendly(targetDateStr)}.`
            });
        }
    }
    
    return violations;
}

// Runs check on all matches and returns rule list summaries for the dashboard
function evaluateGlobalConstraints() {
    const results = {
        blockedPassed: true,
        restPassed: true,
        distributionPassed: true,
        loadPassed: true,
        sameGroupDayPassed: true,
        totalViolations: 0
    };
    
    state.matches.forEach(m => {
        const violations = validateMatch(m);
        violations.forEach(v => {
            results.totalViolations++;
            if (v.type === 'blocked') results.blockedPassed = false;
            if (v.type === 'rest') results.restPassed = false;
            if (v.type === 'wrongday') results.distributionPassed = false;
            if (v.type === 'load') results.loadPassed = false;
            if (v.type === 'samegroupday') results.sameGroupDayPassed = false;
        });
    });
    
    return results;
}

// --- 6. SIMULATOR FUNCTIONS ---
function simulateRandomScores() {
    if (!isAdmin) return;
    state.matches.forEach(m => {
        // Only simulate pending matches (both group stage and playoffs)
        // Wait, playoffs can only be simulated if teams are assigned!
        const homeIsPlaceholder = m.homeTeam.includes('Grupo') || m.homeTeam.includes('Ganador') || m.homeTeam.includes('Campeón');
        const awayIsPlaceholder = m.awayTeam.includes('Grupo') || m.awayTeam.includes('Ganador') || m.awayTeam.includes('Campeón');
        
        if (m.status === 'pending' && !homeIsPlaceholder && !awayIsPlaceholder) {
            // Generate realistic-ish scores
            m.homeScore = Math.floor(Math.random() * 4);
            m.awayScore = Math.floor(Math.random() * 4);
            
            // Playoff matches cannot end in a draw. If draw, play extra time (add 1 goal)
            if (m.stage === 'playoffs' && m.homeScore === m.awayScore) {
                if (Math.random() > 0.5) m.homeScore++;
                else m.awayScore++;
            }
            
            m.status = 'completed';
        }
    });
    
    // We update standings and playoffs cascadingly
    updatePlayoffsTeams();
    saveState();
    renderAll();
    showToast('Resultados simulados con éxito.', 'success');
}

// --- 7. EVENT BINDING & ROUTING ---
function bindEvents() {
    // Navigation Tabs
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
            closeMobileNav();
        });
    });

    // Mobile Hamburger Menu
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mainNav = document.getElementById('main-nav');
    const navOverlay = document.getElementById('nav-overlay');
    
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', () => {
            hamburgerBtn.classList.toggle('active');
            mainNav.classList.toggle('open');
            navOverlay.classList.toggle('active');
        });
    }
    if (navOverlay) {
        navOverlay.addEventListener('click', closeMobileNav);
    }
    
    // Group sub-tabs
    document.querySelectorAll('.group-tabs-selector .tab-pill').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.group-tabs-selector .tab-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterType = btn.getAttribute('data-group-type');
            renderGroups(filterType);
        });
    });

    // Bracket sub-tabs
    document.getElementById('btn-bracket-capital').addEventListener('click', () => switchBracketTab('capital'));
    document.getElementById('btn-bracket-provincia').addEventListener('click', () => switchBracketTab('provincia'));
    document.getElementById('btn-bracket-final').addEventListener('click', () => switchBracketTab('final'));

    // Calendar View mode toggles
    document.getElementById('view-mode-list').addEventListener('click', () => switchCalendarViewMode('list'));
    document.getElementById('view-mode-calendar').addEventListener('click', () => switchCalendarViewMode('grid'));
    
    // Calendar Month Nav
    document.getElementById('btn-prev-month').addEventListener('click', () => adjustCalendarMonth(-1));
    document.getElementById('btn-next-month').addEventListener('click', () => adjustCalendarMonth(1));

    // Calendar Filters
    document.getElementById('filter-stage').addEventListener('change', handleFiltersChange);
    document.getElementById('filter-group').addEventListener('change', handleFiltersChange);
    document.getElementById('filter-team').addEventListener('change', handleFiltersChange);
    document.getElementById('filter-status').addEventListener('change', handleFiltersChange);

    // Calendar Grouping & PDF Download
    const groupingSelect = document.getElementById('calendar-grouping-mode');
    if (groupingSelect) {
        groupingSelect.addEventListener('change', () => {
            renderMatchesList();
        });
    }
    
    const downloadPdfBtn = document.getElementById('btn-download-pdf');
    if (downloadPdfBtn) {
        downloadPdfBtn.addEventListener('click', () => {
            const stageVal = document.getElementById('filter-stage').options[document.getElementById('filter-stage').selectedIndex].text;
            const groupVal = document.getElementById('filter-group').options[document.getElementById('filter-group').selectedIndex].text;
            const teamVal = document.getElementById('filter-team').options[document.getElementById('filter-team').selectedIndex].text;
            const statusVal = document.getElementById('filter-status').options[document.getElementById('filter-status').selectedIndex].text;
            const groupingSelectEl = document.getElementById('calendar-grouping-mode');
            const groupingVal = groupingSelectEl ? groupingSelectEl.options[groupingSelectEl.selectedIndex].text : 'Fecha';
            
            document.getElementById('print-subtitle').innerText = `Filtros: ${stageVal} | ${groupVal} | ${teamVal} | ${statusVal} (Agrupado por: ${groupingVal})`;
            
            window.print();
        });
    }

    // Quick Simulation Button
    document.getElementById('btn-quick-simulate').addEventListener('click', simulateRandomScores);

    // Settings overrides
    document.getElementById('cfg-allow-weekends').addEventListener('change', (e) => {
        if (!isAdmin) return;
        state.settings.allowWeekends = e.target.checked;
        saveState();
        renderAll();
    });
    document.getElementById('cfg-use-multisede').addEventListener('change', (e) => {
        if (!isAdmin) return;
        state.settings.useMultisede = e.target.checked;
        saveState();
        renderAll();
    });
    document.getElementById('cfg-max-matches').addEventListener('input', (e) => {
        if (!isAdmin) return;
        state.settings.maxMatchesPerDay = parseInt(e.target.value) || 2;
        saveState();
        renderAll();
    });
    document.getElementById('cfg-min-rest').addEventListener('input', (e) => {
        if (!isAdmin) return;
        state.settings.minRestDays = parseInt(e.target.value) || 2;
        saveState();
        renderAll();
    });

    // Management buttons
    document.getElementById('btn-regenerate-calendar').addEventListener('click', () => {
        if (!isAdmin) return;
        if (confirm('¿Seguro que quieres regenerar el calendario? Se perderán todos los marcadores actuales.')) {
            generateInitialSchedule();
            saveState();
            renderAll();
            showToast('Calendario regenerado.', 'success');
        }
    });
    document.getElementById('btn-clear-scores').addEventListener('click', () => {
        if (!isAdmin) return;
        if (confirm('¿Seguro que quieres limpiar todos los marcadores?')) {
            state.matches.forEach(m => {
                m.homeScore = null;
                m.awayScore = null;
                m.status = 'pending';
            });
            updatePlayoffsTeams();
            saveState();
            renderAll();
            showToast('Marcadores limpiados.', 'success');
        }
    });
    document.getElementById('btn-reset-app').addEventListener('click', () => {
        if (!isAdmin) return;
        if (confirm('¿Seguro que quieres restablecer toda la aplicación a los valores predeterminados?')) {
            resetToDefaultState();
            renderAll();
            showToast('Aplicación restablecida por completo.', 'danger');
        }
    });

    // Add blocked date
    document.getElementById('btn-add-blocked-date').addEventListener('click', () => {
        if (!isAdmin) return;
        const dateInput = document.getElementById('add-blocked-date-input').value;
        if (dateInput) {
            if (!state.settings.blockedDates.includes(dateInput)) {
                state.settings.blockedDates.push(dateInput);
                state.settings.blockedDates.sort();
                saveState();
                renderAll();
                showToast(`Fecha ${formatDateFriendly(dateInput)} bloqueada.`, 'warning');
            } else {
                showToast('Esa fecha ya está bloqueada.', 'warning');
            }
        }
    });

    // Draw actions
    document.getElementById('btn-draw-randomize').addEventListener('click', randomizeDraw);
    document.getElementById('btn-draw-reset').addEventListener('click', resetDraw);

    // Modal Events
    document.getElementById('btn-close-modal').addEventListener('click', closeModal);
    document.getElementById('btn-cancel-modal').addEventListener('click', closeModal);
    document.getElementById('btn-save-modal').addEventListener('click', saveModalChanges);
    
    // Live modal feedback when values change
    document.getElementById('modal-date').addEventListener('change', validateModalMatchInput);
    document.getElementById('modal-venue').addEventListener('change', validateModalMatchInput);

    // Slide Controls
    const prevSlideBtn = document.getElementById('btn-prev-slide');
    const nextSlideBtn = document.getElementById('btn-next-slide');
    if (prevSlideBtn) prevSlideBtn.addEventListener('click', prevSlide);
    if (nextSlideBtn) nextSlideBtn.addEventListener('click', nextSlide);

    // Login triggers & form binding
    const loginTriggerBtn = document.getElementById('btn-login-trigger');
    if (loginTriggerBtn) {
        loginTriggerBtn.addEventListener('click', () => {
            if (isAdmin) {
                handleLogout();
            } else {
                openLoginModal();
            }
        });
    }

    const btnCloseLogin = document.getElementById('btn-close-login-modal');
    if (btnCloseLogin) btnCloseLogin.addEventListener('click', closeLoginModal);
    
    const btnCancelLogin = document.getElementById('btn-cancel-login-modal');
    if (btnCancelLogin) btnCancelLogin.addEventListener('click', closeLoginModal);

    const loginForm = document.getElementById('login-form');
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }

    // Keyboard navigation for Presentation tab
    window.addEventListener('keydown', (e) => {
        if (state.activeTab === 'presentation') {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault(); // Prevent page scroll
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            }
        }
    });
}

function closeMobileNav() {
    const hamburgerBtn = document.getElementById('hamburger-btn');
    const mainNav = document.getElementById('main-nav');
    const navOverlay = document.getElementById('nav-overlay');
    if (hamburgerBtn) hamburgerBtn.classList.remove('active');
    if (mainNav) mainNav.classList.remove('open');
    if (navOverlay) navOverlay.classList.remove('active');
}

function switchTab(tabId) {
    if (!isAdmin && (tabId === 'draw' || tabId === 'config')) {
        tabId = 'dashboard';
    }
    state.activeTab = tabId;
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.toggle('active', btn.getAttribute('data-tab') === tabId);
    });
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.toggle('active', pane.getAttribute('id') === `tab-${tabId}`);
    });
    if (tabId === 'draw') {
        renderDrawTab();
    } else if (tabId === 'presentation') {
        renderSlide();
    }
}

function switchBracketTab(bracketTab) {
    state.selectedBracketTab = bracketTab;
    document.getElementById('btn-bracket-capital').classList.toggle('active', bracketTab === 'capital');
    document.getElementById('btn-bracket-provincia').classList.toggle('active', bracketTab === 'provincia');
    document.getElementById('btn-bracket-final').classList.toggle('active', bracketTab === 'final');
    
    document.getElementById('bracket-capital-view').classList.toggle('hidden', bracketTab !== 'capital');
    document.getElementById('bracket-provincia-view').classList.toggle('hidden', bracketTab !== 'provincia');
    document.getElementById('bracket-final-view').classList.toggle('hidden', bracketTab !== 'final');
}

function switchCalendarViewMode(mode) {
    state.calendarViewMode = mode;
    document.getElementById('view-mode-list').classList.toggle('active', mode === 'list');
    document.getElementById('view-mode-calendar').classList.toggle('active', mode === 'grid');
    
    document.getElementById('matches-list-view').classList.toggle('hidden', mode !== 'list');
    document.getElementById('matches-grid-view').classList.toggle('hidden', mode !== 'grid');
    document.getElementById('calendar-month-nav').classList.toggle('hidden', mode !== 'grid');
    
    const groupingContainer = document.getElementById('calendar-grouping-container');
    const downloadPdfBtn = document.getElementById('btn-download-pdf');
    if (groupingContainer) groupingContainer.classList.toggle('hidden', mode !== 'list');
    if (downloadPdfBtn) downloadPdfBtn.classList.toggle('hidden', mode !== 'list');
    
    if (mode === 'grid') {
        renderVisualGrid();
    }
}

function adjustCalendarMonth(dir) {
    state.currentCalendarMonth += dir;
    if (state.currentCalendarMonth < 0) {
        state.currentCalendarMonth = 11;
        state.currentCalendarYear--;
    } else if (state.currentCalendarMonth > 11) {
        state.currentCalendarMonth = 0;
        state.currentCalendarYear++;
    }
    
    const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    document.getElementById('calendar-month-title').innerText = `${months[state.currentCalendarMonth]} ${state.currentCalendarYear}`;
    renderVisualGrid();
}

function handleFiltersChange() {
    state.groupFilters.stage = document.getElementById('filter-stage').value;
    state.groupFilters.group = document.getElementById('filter-group').value;
    state.groupFilters.team = document.getElementById('filter-team').value;
    state.groupFilters.status = document.getElementById('filter-status').value;
    renderMatchesList();
}

// --- 8. RENDERING FUNCTIONS ---
function renderAll() {
    updatePlayoffsTeams();
    renderDashboard();
    renderGroups('all');
    populateTeamsFilter();
    renderMatchesList();
    renderVisualGrid();
    renderPlayoffBrackets();
    renderConfigPanel();
    renderDrawTab();
    renderSlide();
    
    // Sync view mode on load
    switchCalendarViewMode(state.calendarViewMode || 'list');
}

function renderDashboard() {
    const totalEl = document.getElementById('stat-matches-total');
    if (!totalEl) return;
    
    // 1. Stats
    const totalMatches = state.matches.length;
    const completedMatches = state.matches.filter(m => m.status === 'completed').length;
    const progress = totalMatches > 0 ? Math.round((completedMatches / totalMatches) * 100) : 0;
    
    totalEl.innerText = totalMatches;
    document.getElementById('stat-matches-completed').innerText = completedMatches;
    document.getElementById('stat-progress').innerText = `${progress}%`;
    
    // 2. Business Rules status
    const rules = evaluateGlobalConstraints();
    const rulesList = document.getElementById('dashboard-rules-list');
    rulesList.innerHTML = `
        <li class="${rules.loadPassed ? 'passed' : 'failed'}">
            <span class="status-indicator">${rules.loadPassed ? '✓' : '✗'}</span>
            <div>
                <strong>Límite de Carga Diaria:</strong> Máx ${state.settings.maxMatchesPerDay} partidos diarios ${state.settings.useMultisede ? 'por sede' : 'total'}.
                ${rules.loadPassed ? '<span class="text-success">(Cumplido)</span>' : '<span class="text-danger">(Excedido en algunas fechas)</span>'}
            </div>
        </li>
        <li class="${rules.restPassed ? 'passed' : 'failed'}">
            <span class="status-indicator">${rules.restPassed ? '✓' : '✗'}</span>
            <div>
                <strong>Descanso Obligatorio:</strong> Mínimo ${state.settings.minRestDays} días completos entre partidos.
                ${rules.restPassed ? '<span class="text-success">(Cumplido)</span>' : '<span class="text-danger">(Violado en algunos emparejamientos)</span>'}
            </div>
        </li>
        <li class="${rules.distributionPassed ? 'passed' : 'failed'}">
            <span class="status-indicator">${rules.distributionPassed ? '✓' : '✗'}</span>
            <div>
                <strong>Distribución Territorial:</strong> Capital juega L/M/V, Provincia juega M/J.
                ${rules.distributionPassed ? '<span class="text-success">(Cumplido)</span>' : '<span class="text-danger">(Incoherencia en fechas manuales)</span>'}
            </div>
        </li>
        <li class="${rules.blockedPassed ? 'passed' : 'failed'}">
            <span class="status-indicator">${rules.blockedPassed ? '✓' : '✗'}</span>
            <div>
                <strong>Fechas Bloqueadas:</strong> Ningún partido en fechas de Hogueras o Mundial.
                ${rules.blockedPassed ? '<span class="text-success">(Cumplido)</span>' : '<span class="text-danger">(Partidos programados en fechas restringidas)</span>'}
            </div>
        </li>
        <li class="${rules.sameGroupDayPassed ? 'passed' : 'failed'}">
            <span class="status-indicator">${rules.sameGroupDayPassed ? '✓' : '✗'}</span>
            <div>
                <strong>Simetría del Grupo:</strong> Los partidos del mismo grupo no se pueden disputar el mismo día.
                ${rules.sameGroupDayPassed ? '<span class="text-success">(Cumplido)</span>' : '<span class="text-danger">(Coincidencia en el mismo día)</span>'}
            </div>
        </li>
    `;
    
    // 3. Quick matches (next 5 pending / completed)
    const matchesList = document.getElementById('dashboard-matches-list');
    matchesList.innerHTML = '';
    
    // Sort matches: group stage first, then round-wise, then date
    const sorted = [...state.matches].sort((a, b) => {
        if (a.status !== b.status) {
            // Pending first
            return a.status === 'pending' ? -1 : 1;
        }
        return new Date(a.date) - new Date(b.date);
    });
    
    const nextFive = sorted.slice(0, 5);
    nextFive.forEach(m => {
        matchesList.appendChild(createMatchRowHTML(m));
    });
}

function renderGroups(filterType = 'all') {
    const container = document.getElementById('groups-container');
    container.innerHTML = '';
    
    let groupsToRender = ['A', 'B', 'C', 'D', 'E', 'F'];
    if (filterType === 'capital') groupsToRender = ['A', 'B', 'C', 'D'];
    if (filterType === 'provincia') groupsToRender = ['E', 'F'];
    
    groupsToRender.forEach(gId => {
        const isCapital = gId <= 'D';
        const card = document.createElement('div');
        card.className = 'card group-card';
        
        const standings = calculateGroupStandings(gId);
        
        let tableRowsHTML = standings.map((team, idx) => {
            const isQualifying = idx < 2; // Top 2 qualify
            return `
                <tr class="${isQualifying ? 'qualify' : ''}">
                    <td class="t-rank">${idx + 1}</td>
                    <td><span class="team-code">${team.id}</span> ${team.name}</td>
                    <td>${team.pj}</td>
                    <td>${team.g}</td>
                    <td>${team.e}</td>
                    <td>${team.p}</td>
                    <td>${team.gf}:${team.gc}</td>
                    <td>${team.dg >= 0 ? '+' : ''}${team.dg}</td>
                    <td class="t-pts">${team.pts}</td>
                </tr>
            `;
        }).join('');
        
        card.innerHTML = `
            <h3>
                <span>Grupo ${gId}</span>
                <span class="zone-label ${isCapital ? 'capital' : 'provincia'}">${isCapital ? 'Capital (L/M/V)' : 'Provincia (M/J)'}</span>
            </h3>
            <table class="standing-table">
                <thead>
                    <tr>
                        <th style="width: 25px;">#</th>
                        <th>Equipo</th>
                        <th title="Partidos Jugados">PJ</th>
                        <th title="Ganados">G</th>
                        <th title="Empatados">E</th>
                        <th title="Perdidos">P</th>
                        <th title="Goles Favor : Goles Contra">Goles</th>
                        <th title="Diferencia de Goles">DG</th>
                        <th title="Puntos">Pts</th>
                    </tr>
                </thead>
                <tbody>
                    ${tableRowsHTML}
                </tbody>
            </table>
        `;
        
        container.appendChild(card);
    });
}

function populateTeamsFilter() {
    const filter = document.getElementById('filter-team');
    const currentValue = filter.value;
    filter.innerHTML = '<option value="all">Todos los Equipos</option>';
    
    // Sort teams by name
    const sortedTeams = [...state.teams].sort((a, b) => a.name.localeCompare(b.name));
    
    sortedTeams.forEach(t => {
        const option = document.createElement('option');
        option.value = t.id;
        option.innerText = `[${t.id}] ${t.name}`;
        filter.appendChild(option);
    });
    
    filter.value = currentValue;
}

function renderMatchesList() {
    const container = document.getElementById('matches-list-view');
    container.innerHTML = '';
    
    const filters = state.groupFilters;
    
    let filtered = state.matches.filter(m => {
        // Stage Filter
        if (filters.stage !== 'all' && m.stage !== filters.stage) return false;
        
        // Group Filter
        if (filters.group !== 'all' && m.group !== filters.group) return false;
        
        // Team Filter
        if (filters.team !== 'all' && m.homeTeam !== filters.team && m.awayTeam !== filters.team) return false;
        
        // Status Filter
        if (filters.status !== 'all' && m.status !== filters.status) return false;
        
        return true;
    });
    
    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="card text-center" style="padding: 3rem; text-align: center; color: var(--text-muted);">
                No se encontraron partidos para los filtros seleccionados.
            </div>
        `;
        return;
    }
    
    const groupingSelect = document.getElementById('calendar-grouping-mode');
    const groupingMode = groupingSelect ? groupingSelect.value : 'date';
    
    if (groupingMode === 'date') {
        // Sort matches chronologically
        filtered.sort((a, b) => {
            if (!a.date) return 1;
            if (!b.date) return -1;
            if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
            return a.time.localeCompare(b.time);
        });
        
        let currentDate = '';
        let dateSection = null;
        let listInSection = null;
        
        filtered.forEach(m => {
            if (m.date !== currentDate) {
                currentDate = m.date;
                
                dateSection = document.createElement('div');
                dateSection.className = 'date-group-section mt-6';
                
                const dateTitle = document.createElement('h3');
                dateTitle.style.fontSize = '0.95rem';
                dateTitle.style.color = 'var(--text-muted)';
                dateTitle.style.marginBottom = '0.75rem';
                dateTitle.style.display = 'flex';
                dateTitle.style.alignItems = 'center';
                dateTitle.style.justifyContent = 'space-between';
                dateTitle.innerText = m.date ? formatDateFriendly(m.date) : 'Sin fecha asignada';
                
                // Check if this date has any violations overall
                const matchesThisDay = state.matches.filter(x => x.date === m.date);
                const loadLimit = state.settings.maxMatchesPerDay;
                
                let loadConflict = false;
                if (m.date) {
                    if (state.settings.useMultisede) {
                        const venueLoads = {};
                        matchesThisDay.forEach(x => {
                            const v = getMatchVenue(x);
                            venueLoads[v] = (venueLoads[v] || 0) + 1;
                        });
                        loadConflict = Object.values(venueLoads).some(v => v > loadLimit);
                    } else {
                        loadConflict = matchesThisDay.length > loadLimit;
                    }
                }
                
                if (loadConflict) {
                    const badge = document.createElement('span');
                    badge.className = 'warning-indicator load';
                    badge.title = `Exceso de carga: Más de ${loadLimit} partidos hoy.`;
                    badge.innerText = '!';
                    dateTitle.appendChild(badge);
                }
                
                dateSection.appendChild(dateTitle);
                
                listInSection = document.createElement('div');
                listInSection.className = 'quick-matches-list';
                dateSection.appendChild(listInSection);
                
                container.appendChild(dateSection);
            }
            
            listInSection.appendChild(createMatchRowHTML(m));
        });
    } else if (groupingMode === 'round') {
        const roundOrder = {
            'group-1': 1, 'group-2': 2, 'group-3': 3,
            'playoffs-CF': 4, 'playoffs-SF': 5, 'playoffs-F': 6, 'playoffs-GF': 7
        };
        
        const getRoundKey = (m) => {
            if (m.stage === 'group') return `group-${m.round}`;
            return `playoffs-${m.round}`;
        };
        
        const getRoundName = (key) => {
            if (key === 'group-1') return 'Jornada 1 - Fase de Grupos';
            if (key === 'group-2') return 'Jornada 2 - Fase de Grupos';
            if (key === 'group-3') return 'Jornada 3 - Fase de Grupos';
            if (key === 'playoffs-CF') return 'Fase Eliminatoria - Cuartos de Final';
            if (key === 'playoffs-SF') return 'Fase Eliminatoria - Semifinales';
            if (key === 'playoffs-F') return 'Fase Eliminatoria - Finales Regionales';
            if (key === 'playoffs-GF') return 'Gran Final Absoluta';
            return 'Otros Partidos';
        };
        
        filtered.sort((a, b) => {
            const keyA = getRoundKey(a);
            const keyB = getRoundKey(b);
            const ordA = roundOrder[keyA] || 99;
            const ordB = roundOrder[keyB] || 99;
            
            if (ordA !== ordB) return ordA - ordB;
            
            if (!a.date) return 1;
            if (!b.date) return -1;
            if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
            return a.time.localeCompare(b.time);
        });
        
        let currentRoundKey = '';
        let roundSection = null;
        let listInSection = null;
        
        filtered.forEach(m => {
            const rKey = getRoundKey(m);
            if (rKey !== currentRoundKey) {
                currentRoundKey = rKey;
                
                roundSection = document.createElement('div');
                roundSection.className = 'round-group-section mt-6';
                
                const roundTitle = document.createElement('h3');
                roundTitle.style.fontSize = '0.95rem';
                roundTitle.style.color = 'var(--text-muted)';
                roundTitle.style.marginBottom = '0.75rem';
                roundTitle.innerText = getRoundName(rKey);
                
                roundSection.appendChild(roundTitle);
                
                listInSection = document.createElement('div');
                listInSection.className = 'quick-matches-list';
                roundSection.appendChild(listInSection);
                
                container.appendChild(roundSection);
            }
            
            listInSection.appendChild(createMatchRowHTML(m));
        });
    } else if (groupingMode === 'group') {
        const getGroupKey = (m) => {
            if (m.stage === 'group') return `group-${m.group}`;
            if (m.zone === 'capital') return 'playoffs-capital';
            if (m.zone === 'provincia') return 'playoffs-provincia';
            return 'playoffs-final';
        };
        
        const getGroupName = (key) => {
            if (key === 'group-A') return 'Grupo A - Capital';
            if (key === 'group-B') return 'Grupo B - Capital';
            if (key === 'group-C') return 'Grupo C - Capital';
            if (key === 'group-D') return 'Grupo D - Capital';
            if (key === 'group-E') return 'Grupo E - Provincia';
            if (key === 'group-F') return 'Grupo F - Provincia';
            if (key === 'playoffs-capital') return 'Fase Eliminatoria - Capital';
            if (key === 'playoffs-provincia') return 'Fase Eliminatoria - Provincia';
            if (key === 'playoffs-final') return 'Gran Final Absoluta';
            return 'Otros';
        };
        
        const groupOrder = {
            'group-A': 1, 'group-B': 2, 'group-C': 3, 'group-D': 4,
            'group-E': 5, 'group-F': 6,
            'playoffs-capital': 7, 'playoffs-provincia': 8, 'playoffs-final': 9
        };
        
        filtered.sort((a, b) => {
            const keyA = getGroupKey(a);
            const keyB = getGroupKey(b);
            const ordA = groupOrder[keyA] || 99;
            const ordB = groupOrder[keyB] || 99;
            
            if (ordA !== ordB) return ordA - ordB;
            
            if (!a.date) return 1;
            if (!b.date) return -1;
            if (a.date !== b.date) return new Date(a.date) - new Date(b.date);
            return a.time.localeCompare(b.time);
        });
        
        let currentGroupKey = '';
        let groupSection = null;
        let listInSection = null;
        
        filtered.forEach(m => {
            const gKey = getGroupKey(m);
            if (gKey !== currentGroupKey) {
                currentGroupKey = gKey;
                
                groupSection = document.createElement('div');
                groupSection.className = 'group-group-section mt-6';
                
                const groupTitle = document.createElement('h3');
                groupTitle.style.fontSize = '0.95rem';
                groupTitle.style.color = 'var(--text-muted)';
                groupTitle.style.marginBottom = '0.75rem';
                groupTitle.innerText = getGroupName(gKey);
                
                groupSection.appendChild(groupTitle);
                
                listInSection = document.createElement('div');
                listInSection.className = 'quick-matches-list';
                groupSection.appendChild(listInSection);
                
                container.appendChild(groupSection);
            }
            
            listInSection.appendChild(createMatchRowHTML(m));
        });
    }
}

function renderVisualGrid() {
    const container = document.getElementById('matches-grid-view');
    container.innerHTML = '';
    
    // Create header with weekdays
    const headerRow = document.createElement('div');
    headerRow.className = 'calendar-grid-weekdays';
    const weekdays = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
    weekdays.forEach(day => {
        const cell = document.createElement('div');
        cell.className = 'weekday-lbl';
        cell.innerText = day;
        headerRow.appendChild(cell);
    });
    container.appendChild(headerRow);
    
    // Create days grid
    const daysGrid = document.createElement('div');
    daysGrid.className = 'calendar-grid-days';
    
    // Compute date ranges
    const year = state.currentCalendarYear;
    const month = state.currentCalendarMonth; // 5 = June
    
    const firstDayIndex = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    
    // Calculate total slots needed (weeks)
    const totalSlots = 42; // 6 rows * 7 columns
    
    for (let i = 0; i < totalSlots; i++) {
        const cell = document.createElement('div');
        cell.className = 'calendar-day-cell';
        
        let dayNum;
        let cellDateStr;
        let isCurrentMonth = true;
        
        if (i < firstDayIndex) {
            // Previous month overflow
            dayNum = prevMonthLastDate - firstDayIndex + i + 1;
            isCurrentMonth = false;
            const prevMonth = month === 0 ? 11 : month - 1;
            const prevYear = month === 0 ? year - 1 : year;
            cellDateStr = `${prevYear}-${padZero(prevMonth + 1)}-${padZero(dayNum)}`;
        } else if (i >= firstDayIndex + lastDate) {
            // Next month overflow
            dayNum = i - firstDayIndex - lastDate + 1;
            isCurrentMonth = false;
            const nextMonth = month === 11 ? 0 : month + 1;
            const nextYear = month === 11 ? year + 1 : year;
            cellDateStr = `${nextYear}-${padZero(nextMonth + 1)}-${padZero(dayNum)}`;
        } else {
            // Current month
            dayNum = i - firstDayIndex + 1;
            cellDateStr = `${year}-${padZero(month + 1)}-${padZero(dayNum)}`;
        }
        
        if (!isCurrentMonth) {
            cell.classList.add('other-month');
        }
        
        // Check if date is blocked
        const isBlocked = state.settings.blockedDates.includes(cellDateStr);
        if (isBlocked) {
            cell.classList.add('blocked');
        }
        
        // Highlight today's date (simulated)
        if (cellDateStr === '2026-06-01') {
            cell.classList.add('today');
        }
        
        // Label
        const numLabel = document.createElement('span');
        numLabel.className = 'day-num';
        numLabel.innerText = dayNum;
        cell.appendChild(numLabel);
        
        // Matches on this day
        const dayMatches = state.matches.filter(m => m.date === cellDateStr);
        if (dayMatches.length > 0) {
            const matchesContainer = document.createElement('div');
            matchesContainer.className = 'calendar-day-matches';
            
            dayMatches.forEach(m => {
                const homeName = getTeamShortName(m.homeTeam);
                const awayName = getTeamShortName(m.awayTeam);
                
                const mini = document.createElement('div');
                mini.className = 'calendar-mini-match';
                
                // Class qualifiers for border indicators
                const violations = validateMatch(m);
                if (violations.length > 0) {
                    if (violations.some(v => v.type === 'rest' || v.type === 'blocked')) {
                        mini.classList.add('conflict');
                    } else {
                        mini.classList.add('warning-rest');
                    }
                } else if (m.status === 'completed') {
                    mini.classList.add('completed');
                }
                
                mini.title = `${m.homeTeam} vs ${m.awayTeam} (${m.time} - ${getMatchVenue(m)})`;
                if (violations.length > 0) {
                    mini.title += `\n⚠️ Alertas:\n` + violations.map(v => `- ${v.message}`).join('\n');
                }
                
                let scoreText = '';
                if (m.status === 'completed') {
                    scoreText = ` [${m.homeScore}-${m.awayScore}]`;
                }
                
                mini.innerHTML = `
                    <span><strong>${m.homeTeam}-${m.awayTeam}</strong>${scoreText}</span>
                    <span style="font-size: 0.55rem; color: var(--text-muted);">${m.time}</span>
                `;
                
                mini.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (isAdmin) {
                        openEditMatchModal(m);
                    }
                });
                
                matchesContainer.appendChild(mini);
            });
            
            cell.appendChild(matchesContainer);
        }
        
        // Click cell to schedule or view matches on that day
        cell.addEventListener('click', () => {
            if (isCurrentMonth) {
                // Set filters to this date? We could open a create match modal or filter list.
                document.getElementById('filter-stage').value = 'all';
                document.getElementById('filter-group').value = 'all';
                document.getElementById('filter-team').value = 'all';
                document.getElementById('filter-status').value = 'all';
                handleFiltersChange();
                switchCalendarViewMode('list');
                
                // Scroll to date section
                setTimeout(() => {
                    const sections = document.querySelectorAll('.date-group-section h3');
                    for (let s of sections) {
                        if (s.innerText.includes(formatDateFriendly(cellDateStr))) {
                            s.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            s.parentElement.style.outline = '2px solid var(--primary)';
                            setTimeout(() => {
                                s.parentElement.style.outline = 'none';
                            }, 1500);
                            break;
                        }
                    }
                }, 100);
            }
        });
        
        daysGrid.appendChild(cell);
    }
    
    container.appendChild(daysGrid);
}

function renderPlayoffBrackets() {
    // 1. Capital Bracket
    renderPlayoffRound('CF', 'capital-cf-matches', 'capital');
    renderPlayoffRound('SF', 'capital-sf-matches', 'capital');
    renderPlayoffRound('F', 'capital-final-matches', 'capital');
    
    // 2. Provincia Bracket
    renderPlayoffRound('SF', 'provincia-sf-matches', 'provincia');
    renderPlayoffRound('F', 'provincia-final-matches', 'provincia');
    
    // 3. Grand Final
    const gfContainer = document.getElementById('grand-final-match');
    gfContainer.innerHTML = '';
    const gfMatch = state.matches.find(m => m.stage === 'playoffs' && m.round === 'GF');
    if (gfMatch) {
        gfContainer.appendChild(createPlayoffCardHTML(gfMatch));
    }
}

function renderPlayoffRound(roundCode, containerId, zone) {
    const container = document.getElementById(containerId);
    container.innerHTML = '';
    
    const matches = state.matches.filter(m => m.stage === 'playoffs' && m.zone === zone && m.round === roundCode);
    matches.sort((a, b) => a.id.localeCompare(b.id));
    
    matches.forEach(m => {
        container.appendChild(createPlayoffCardHTML(m));
    });
}

function renderConfigPanel() {
    document.getElementById('cfg-allow-weekends').checked = state.settings.allowWeekends;
    document.getElementById('cfg-use-multisede').checked = state.settings.useMultisede;
    document.getElementById('cfg-max-matches').value = state.settings.maxMatchesPerDay;
    document.getElementById('cfg-min-rest').value = state.settings.minRestDays;
    
    // Blocked dates list
    const ul = document.getElementById('blocked-dates-ul');
    ul.innerHTML = '';
    
    state.settings.blockedDates.forEach(dateStr => {
        const li = document.createElement('li');
        li.innerHTML = `
            <span><strong>${formatDateFriendly(dateStr)}</strong> (${dateStr})</span>
            <button class="btn-remove-date" data-date="${dateStr}">Desbloquear</button>
        `;
        
        li.querySelector('.btn-remove-date').addEventListener('click', () => {
            state.settings.blockedDates = state.settings.blockedDates.filter(d => d !== dateStr);
            saveState();
            renderAll();
            showToast(`Fecha ${formatDateFriendly(dateStr)} desbloqueada.`, 'success');
        });
        
        ul.appendChild(li);
    });
}

// --- 9. VIEW COMPONENT BUILDERS (HTML GENERATORS) ---
function getTeamShield(teamId) {
    if (!teamId) return '';
    const isPlaceholder = teamId.includes('Grupo') || teamId.includes('Ganador') || teamId.includes('Campeón') || teamId.includes('Pendiente') || teamId.includes('Vacante');
    if (isPlaceholder) return '';

    const shieldMap = {
        'C1': 'CF Barrio San Gabriel.png',
        'C2': 'CD Maristas de Alicante.png',
        'C3': 'Alicante Football Academy.png',
        'C4': 'Mediterráneo CF.png',
        'C5': 'CD Villafranqueza.png',
        'C6': 'Atlético San Blas CF.png',
        'C7': 'SCD San Blas.png',
        'C8': 'CA El Principio.png',
        'C9': 'Inter Leuka Alicante.png',
        'C10': 'CD Salesianos.png',
        'C11': 'Alicante Sports Academy.png',
        'C12': 'Lacross Babel.png',
        'C13': 'CD Betis Florida.png',
        'C14': 'CD Campello.png',
        'C15': 'Playas de Alicante CF.png',
        'C16': 'Alicante City CF Academy.png',
        'P1': 'CF Monnegre Mutxamel.png',
        'P2': 'CD Campello.png',
        'P3': 'Jove Español de San Vicente.png',
        'P4': 'Villajoyosa CF.png',
        'P5': 'CD El Altet.png',
        'P6': 'AC Torrellano.png',
        'P7': 'Gimnàstic San Vicente.png',
        'P8': 'Mutxamel CF.png'
    };

    const fileName = shieldMap[teamId];
    return fileName ? `/Escudos/${encodeURIComponent(fileName)}` : '';
}

function createMatchRowHTML(match) {
    const item = document.createElement('div');
    item.className = `match-row-item ${match.status === 'completed' ? 'completed' : ''}`;
    
    const homeTeamName = getTeamFullName(match.homeTeam);
    const awayTeamName = getTeamFullName(match.awayTeam);
    
    const isPlaceholderHome = match.homeTeam.includes('Grupo') || match.homeTeam.includes('Ganador') || match.homeTeam.includes('Campeón');
    const isPlaceholderAway = match.awayTeam.includes('Grupo') || match.awayTeam.includes('Ganador') || match.awayTeam.includes('Campeón');
    
    const homeCodeHTML = isPlaceholderHome ? '' : `<span class="team-code">${match.homeTeam}</span>`;
    const awayCodeHTML = isPlaceholderAway ? '' : `<span class="team-code">${match.awayTeam}</span>`;
    
    const homeShieldUrl = getTeamShield(match.homeTeam);
    const awayShieldUrl = getTeamShield(match.awayTeam);
    const homeShieldHTML = homeShieldUrl ? `<img class="team-shield" src="${homeShieldUrl}" alt="" onerror="this.style.display='none'">` : '';
    const awayShieldHTML = awayShieldUrl ? `<img class="team-shield" src="${awayShieldUrl}" alt="" onerror="this.style.display='none'">` : '';
    
    const isCompleted = match.status === 'completed';
    const scoreHTML = isCompleted 
        ? `<div class="match-score-disp">${match.homeScore} - ${match.awayScore}</div>`
        : `<div class="match-score-disp pending">VS</div>`;
        
    // Compute violations
    const violations = validateMatch(match);
    let indicatorsHTML = '';
    if (violations.length > 0) {
        // Unique indicator types
        const types = [...new Set(violations.map(v => v.type))];
        types.forEach(type => {
            let label = '';
            let titleStr = violations.filter(v => v.type === type).map(v => v.message).join('\n');
            if (type === 'rest') label = 'D'; // Descanso
            if (type === 'load') label = 'C'; // Carga
            if (type === 'blocked') label = 'B'; // Bloqueado
            if (type === 'wrongday') label = 'Z'; // Zona
            if (type === 'samegroupday') label = 'G'; // Grupo el mismo día
            
            indicatorsHTML += `<span class="warning-indicator ${type}" title="${titleStr}">${label}</span>`;
        });
    }
    
    const displayVenue = getMatchVenue(match);
    item.innerHTML = `
        <span class="match-zone-badge ${match.zone}">${match.group ? 'Grupo ' + match.group : match.round}</span>
        <div class="match-teams">
            <div class="match-team home">
                <span class="team-name" title="${homeTeamName}">${homeTeamName}</span>
                ${homeCodeHTML}
                ${homeShieldHTML}
            </div>
            ${scoreHTML}
            <div class="match-team away">
                ${awayShieldHTML}
                ${awayCodeHTML}
                <span class="team-name" title="${awayTeamName}">${awayTeamName}</span>
            </div>
        </div>
        <div class="match-date-venue">
            <span>${match.date ? formatDateFriendlyShort(match.date) : 'Sin fecha'} • <strong>${match.time}</strong></span>
            <span class="match-venue" title="${displayVenue}">${displayVenue ? displayVenue.split(' - ')[0] : 'Sin campo asignado'}</span>
        </div>
        <div class="match-indicators">${indicatorsHTML}</div>
    `;
    
    item.addEventListener('click', () => {
        if (isAdmin) {
            openEditMatchModal(match);
        }
    });
    
    return item;
}

function createPlayoffCardHTML(match) {
    const card = document.createElement('div');
    card.className = 'playoff-match-card';
    
    const homeName = getTeamFullName(match.homeTeam);
    const awayName = getTeamFullName(match.awayTeam);
    
    const isCompleted = match.status === 'completed';
    const isPlaceholderHome = match.homeTeam.includes('Grupo') || match.homeTeam.includes('Ganador') || match.homeTeam.includes('Campeón');
    const isPlaceholderAway = match.awayTeam.includes('Grupo') || match.awayTeam.includes('Ganador') || match.awayTeam.includes('Campeón');
    
    let homeScoreText = isCompleted ? match.homeScore : '';
    let awayScoreText = isCompleted ? match.awayScore : '';
    
    let isHomeWinner = isCompleted && match.homeScore > match.awayScore;
    let isAwayWinner = isCompleted && match.awayScore > match.homeScore;
    
    // Check for alerts
    const violations = validateMatch(match);
    const hasAlert = violations.length > 0;
    
    const homeShieldUrl = getTeamShield(match.homeTeam);
    const awayShieldUrl = getTeamShield(match.awayTeam);
    const homeShieldHTML = (!isPlaceholderHome && homeShieldUrl) ? `<img class="team-shield playoff-shield" src="${homeShieldUrl}" alt="" onerror="this.style.display='none'">` : '';
    const awayShieldHTML = (!isPlaceholderAway && awayShieldUrl) ? `<img class="team-shield playoff-shield" src="${awayShieldUrl}" alt="" onerror="this.style.display='none'">` : '';
    
    card.innerHTML = `
        <div class="playoff-card-info">
            <span>ID: ${match.id}</span>
            <span>${match.date ? formatDateFriendlyShort(match.date) : 'Sin fecha'}</span>
            ${hasAlert ? `<span class="warning-indicator rest" title="${violations.map(v => v.message).join('\n')}" style="width: 14px; height: 14px; font-size: 0.55rem;">⚠️</span>` : ''}
        </div>
        <div class="playoff-card-team ${isHomeWinner ? 'winner' : ''} ${isCompleted && !isHomeWinner ? 'loser' : ''}">
            <div class="playoff-team-identity">
                ${homeShieldHTML}
                <span class="team-name" title="${homeName}">${isPlaceholderHome ? match.homeTeam : `[${match.homeTeam}] ${homeName}`}</span>
            </div>
            <span class="score">${homeScoreText}</span>
        </div>
        <div class="playoff-card-team ${isAwayWinner ? 'winner' : ''} ${isCompleted && !isAwayWinner ? 'loser' : ''}">
            <div class="playoff-team-identity">
                ${awayShieldHTML}
                <span class="team-name" title="${awayName}">${isPlaceholderAway ? match.awayTeam : `[${match.awayTeam}] ${awayName}`}</span>
            </div>
            <span class="score">${awayScoreText}</span>
        </div>
    `;
    
    card.addEventListener('click', () => {
        if (isAdmin) {
            openEditMatchModal(match);
        }
    });
    
    return card;
}

// --- 10. MODAL DIALOG MANAGEMENT & FORM ACTIONS ---
function openEditMatchModal(match) {
    state.selectedMatchToEdit = match;
    
    document.getElementById('modal-match-title').innerText = `Editar Partido - ${match.stage === 'group' ? 'Grupo ' + match.group : match.id}`;
    
    document.getElementById('modal-home-code').innerText = match.homeTeam;
    document.getElementById('modal-home-name').innerText = getTeamFullName(match.homeTeam);
    document.getElementById('modal-home-score').value = match.homeScore !== null ? match.homeScore : '';
    
    document.getElementById('modal-away-code').innerText = match.awayTeam;
    document.getElementById('modal-away-name').innerText = getTeamFullName(match.awayTeam);
    document.getElementById('modal-away-score').value = match.awayScore !== null ? match.awayScore : '';
    
    document.getElementById('modal-date').value = match.date;
    document.getElementById('modal-time').value = match.time;
    
    // Load venue from match or dynamic default
    document.getElementById('modal-venue').value = match.venue || getMatchVenue(match);
    
    document.getElementById('modal-status-completed').checked = match.status === 'completed';
    
    validateModalMatchInput();
    
    document.getElementById('match-modal').classList.add('active');
}

function closeModal() {
    document.getElementById('match-modal').classList.remove('active');
    state.selectedMatchToEdit = null;
}

function validateModalMatchInput() {
    const match = state.selectedMatchToEdit;
    if (!match) return;
    
    // Construct temporary match object to validate
    const tempMatch = {
        ...match,
        date: document.getElementById('modal-date').value,
        venue: document.getElementById('modal-venue').value.trim()
    };
    
    const violations = validateMatch(tempMatch);
    const box = document.getElementById('modal-warning-box');
    const list = document.getElementById('modal-warning-list');
    
    if (violations.length > 0) {
        list.innerHTML = violations.map(v => `<li>${v.message}</li>`).join('');
        box.classList.remove('hidden');
    } else {
        list.innerHTML = '';
        box.classList.add('hidden');
    }
}

function saveModalChanges() {
    const match = state.selectedMatchToEdit;
    if (!match) return;
    
    const homeScoreInput = document.getElementById('modal-home-score').value;
    const awayScoreInput = document.getElementById('modal-away-score').value;
    const dateInput = document.getElementById('modal-date').value;
    const timeInput = document.getElementById('modal-time').value;
    const venueInput = document.getElementById('modal-venue').value.trim();
    const completedInput = document.getElementById('modal-status-completed').checked;
    
    // Prevent completed status if scores are missing
    if (completedInput && (homeScoreInput === '' || awayScoreInput === '')) {
        showToast('Debes ingresar los goles para marcar el partido como completado.', 'warning');
        return;
    }
    
    // Save values
    match.homeScore = homeScoreInput !== '' ? parseInt(homeScoreInput) : null;
    match.awayScore = awayScoreInput !== '' ? parseInt(awayScoreInput) : null;
    match.date = dateInput;
    match.time = timeInput;
    
    // Save venue as "" if it matches the default dynamic venue or is empty
    const defaultDynamicVenue = getMatchVenue({ ...match, venue: "" });
    if (venueInput === "" || venueInput.toLowerCase() === defaultDynamicVenue.toLowerCase()) {
        match.venue = "";
    } else {
        match.venue = venueInput;
    }
    
    match.status = completedInput ? 'completed' : 'pending';
    
    updatePlayoffsTeams();
    saveState();
    closeModal();
    renderAll();
    showToast('Partido actualizado.', 'success');
}

// --- 11. HELPER UTILITIES ---
function getTeamFullName(teamId) {
    const t = state.teams.find(x => x.id === teamId);
    return t ? t.name : teamId;
}

function getTeamShortName(teamId) {
    const t = state.teams.find(x => x.id === teamId);
    if (!t) return teamId;
    // Return first two words or short form
    const words = t.name.split(' ');
    if (words.length > 1) {
        return `${words[0]} ${words[1]}`;
    }
    return t.name;
}

function padZero(num) {
    return num.toString().padStart(2, '0');
}

function formatDateISO(dateObj) {
    return `${dateObj.getFullYear()}-${padZero(dateObj.getMonth() + 1)}-${padZero(dateObj.getDate())}`;
}

function formatDateFriendly(dateStr) {
    if (!dateStr) return 'Sin fecha';
    const date = new Date(dateStr);
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    let formatted = date.toLocaleDateString('es-ES', options);
    // Capitalize first letter
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

function formatDateFriendlyShort(dateStr) {
    if (!dateStr) return 'Sin fecha';
    const date = new Date(dateStr);
    const options = { weekday: 'short', day: 'numeric', month: 'short' };
    return date.toLocaleDateString('es-ES', options);
}

function getDayName(dayIndex) {
    const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return days[dayIndex];
}

// Toast Alerts
function showToast(message, type = 'info', duration = 4000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    
    let icon = '';
    if (type === 'success') icon = '✓';
    if (type === 'danger') icon = '✗';
    if (type === 'warning') icon = '⚠';
    
    toast.innerHTML = `
        <span style="font-weight: 700;">${icon}</span>
        <span>${message}</span>
    `;
    
    container.appendChild(toast);
    
    // Auto-remove from DOM after animation completes
    if (duration > 0) {
        setTimeout(() => {
            toast.remove();
        }, duration);
    }
}

// --- 12. LIVE DRAW / SORTEO LOGIC ---
function renderDrawTab() {
    // Check if elements exist in DOM before trying to render
    const capUnassignedContainer = document.getElementById('capital-unassigned-list');
    const provUnassignedContainer = document.getElementById('provincia-unassigned-list');
    const capKeysGrid = document.getElementById('capital-keys-grid');
    const provKeysGrid = document.getElementById('provincia-keys-grid');
    const capCounter = document.getElementById('capital-draw-counter');
    const provCounter = document.getElementById('provincia-draw-counter');

    if (!capUnassignedContainer || !provUnassignedContainer || !capKeysGrid || !provKeysGrid) {
        return; // Not on correct page/state or not loaded yet
    }

    // 1. Compute assignments and unassigned lists
    const assignedCapital = state.teams.filter(t => t.zone === 'capital' && t.name !== t.id).map(t => t.name);
    const unassignedCapital = enrolledTeams.capital.filter(name => !assignedCapital.includes(name));

    const assignedProvincia = state.teams.filter(t => t.zone === 'provincia' && t.name !== t.id).map(t => t.name);
    const unassignedProvincia = enrolledTeams.provincia.filter(name => !assignedProvincia.includes(name));

    // Update Counters
    capCounter.innerText = `${16 - unassignedCapital.length} / 16 Asignados`;
    provCounter.innerText = `${8 - unassignedProvincia.length} / 8 Asignados`;

    // 2. Render unassigned list for Capital
    capUnassignedContainer.innerHTML = '';
    if (unassignedCapital.length === 0) {
        capUnassignedContainer.innerHTML = '<span style="color: var(--success); font-size: 0.8rem; font-style: italic;">Todos asignados</span>';
    } else {
        unassignedCapital.forEach(name => {
            const item = document.createElement('div');
            item.className = 'unassigned-team-item';
            if (state.selectedDrawTeam && state.selectedDrawTeam.name === name && state.selectedDrawTeam.zone === 'capital') {
                item.classList.add('selected');
            }
            item.innerText = name;
            item.addEventListener('click', () => {
                selectDrawTeam(name, 'capital');
            });
            capUnassignedContainer.appendChild(item);
        });
    }

    // 3. Render unassigned list for Provincia
    provUnassignedContainer.innerHTML = '';
    if (unassignedProvincia.length === 0) {
        provUnassignedContainer.innerHTML = '<span style="color: var(--success); font-size: 0.8rem; font-style: italic;">Todos asignados</span>';
    } else {
        unassignedProvincia.forEach(name => {
            const item = document.createElement('div');
            item.className = 'unassigned-team-item';
            if (state.selectedDrawTeam && state.selectedDrawTeam.name === name && state.selectedDrawTeam.zone === 'provincia') {
                item.classList.add('selected');
            }
            item.innerText = name;
            item.addEventListener('click', () => {
                selectDrawTeam(name, 'provincia');
            });
            provUnassignedContainer.appendChild(item);
        });
    }

    // 4. Render keys grid for Capital (C1-C16)
    capKeysGrid.innerHTML = '';
    const capTeams = state.teams.filter(t => t.zone === 'capital').sort((a, b) => {
        // Sort C1, C2... numerically
        const numA = parseInt(a.id.replace('C', ''));
        const numB = parseInt(b.id.replace('C', ''));
        return numA - numB;
    });

    capTeams.forEach(team => {
        const isAssigned = team.name !== team.id;
        const card = document.createElement('div');
        card.className = `key-card ${isAssigned ? 'assigned' : ''}`;
        
        card.innerHTML = `
            <div class="lottery-ball">${team.id}</div>
            <span class="team-assigned-name">${isAssigned ? team.name : 'Por asignar...'}</span>
            <span class="key-group-label">Grupo ${team.group}</span>
            ${isAssigned ? `<button class="btn-unlink-key" title="Desvincular equipo">&times;</button>` : ''}
        `;

        if (isAssigned) {
            card.querySelector('.btn-unlink-key').addEventListener('click', (e) => {
                e.stopPropagation();
                unlinkKey(team.id);
            });
        } else {
            card.addEventListener('click', () => {
                assignTeamToKey(team.id, 'capital');
            });
        }

        capKeysGrid.appendChild(card);
    });

    // 5. Render keys grid for Provincia (P1-P8)
    provKeysGrid.innerHTML = '';
    const provTeams = state.teams.filter(t => t.zone === 'provincia').sort((a, b) => {
        const numA = parseInt(a.id.replace('P', ''));
        const numB = parseInt(b.id.replace('P', ''));
        return numA - numB;
    });

    provTeams.forEach(team => {
        const isAssigned = team.name !== team.id;
        const card = document.createElement('div');
        card.className = `key-card ${isAssigned ? 'assigned' : ''}`;
        
        card.innerHTML = `
            <div class="lottery-ball">${team.id}</div>
            <span class="team-assigned-name">${isAssigned ? team.name : 'Por asignar...'}</span>
            <span class="key-group-label">Grupo ${team.group}</span>
            ${isAssigned ? `<button class="btn-unlink-key" title="Desvincular equipo">&times;</button>` : ''}
        `;

        if (isAssigned) {
            card.querySelector('.btn-unlink-key').addEventListener('click', (e) => {
                e.stopPropagation();
                unlinkKey(team.id);
            });
        } else {
            card.addEventListener('click', () => {
                assignTeamToKey(team.id, 'provincia');
            });
        }

        provKeysGrid.appendChild(card);
    });
}

function selectDrawTeam(name, zone) {
    if (!isAdmin) return;
    if (state.selectedDrawTeam && state.selectedDrawTeam.name === name && state.selectedDrawTeam.zone === zone) {
        // Deselect if already selected
        state.selectedDrawTeam = null;
    } else {
        state.selectedDrawTeam = { name, zone };
    }
    renderDrawTab();
}

function assignTeamToKey(key, zone) {
    if (!isAdmin) return;
    if (!state.selectedDrawTeam) {
        showToast('Selecciona primero un equipo disponible de la lista a la izquierda.', 'warning');
        return;
    }
    if (state.selectedDrawTeam.zone !== zone) {
        showToast(`El equipo seleccionado pertenece a la zona de ${state.selectedDrawTeam.zone.toUpperCase()} y no se puede asignar a una clave de ${zone.toUpperCase()}.`, 'danger');
        return;
    }

    const targetTeam = state.teams.find(t => t.id === key);
    if (targetTeam) {
        targetTeam.name = state.selectedDrawTeam.name;
        state.selectedDrawTeam = null;
        saveState();
        renderAll();
        showToast(`Equipo asignado a la clave ${key} correctamente.`, 'success');
    }
}

function unlinkKey(key) {
    if (!isAdmin) return;
    const targetTeam = state.teams.find(t => t.id === key);
    if (targetTeam) {
        const oldName = targetTeam.name;
        targetTeam.name = targetTeam.id; // restore name to ID (C1, C2, etc.)
        
        // Reset matches involving this team to avoid inconsistent standings calculations
        state.matches.forEach(m => {
            if (m.stage === 'group' && (m.homeTeam === key || m.awayTeam === key)) {
                m.homeScore = null;
                m.awayScore = null;
                m.status = 'pending';
            }
        });
        
        state.selectedDrawTeam = null;
        updatePlayoffsTeams();
        saveState();
        renderAll();
        showToast(`Se ha desvinculado a ${oldName} de la clave ${key}.`, 'info');
    }
}

function resetDraw() {
    if (!isAdmin) return;
    if (confirm('¿Seguro que quieres reiniciar el sorteo? Se desvincularán todos los equipos reales de las claves de sorteo y se limpiarán los resultados de los partidos.')) {
        state.teams.forEach(t => {
            t.name = t.id;
        });
        state.matches.forEach(m => {
            m.homeScore = null;
            m.awayScore = null;
            m.status = 'pending';
        });
        state.selectedDrawTeam = null;
        updatePlayoffsTeams();
        saveState();
        renderAll();
        showToast('Sorteo restablecido por completo.', 'warning');
    }
}

function randomizeDraw() {
    if (!isAdmin) return;
    if (confirm('¿Seguro que deseas autocompletar de forma aleatoria los emparejamientos restantes del sorteo?')) {
        // Capital
        const assignedCapital = state.teams.filter(t => t.zone === 'capital' && t.name !== t.id).map(t => t.name);
        const unassignedCapital = enrolledTeams.capital.filter(name => !assignedCapital.includes(name));
        
        // Shuffle unassigned Capital teams
        const shuffledCapital = [...unassignedCapital].sort(() => Math.random() - 0.5);
        
        state.teams.filter(t => t.zone === 'capital' && t.name === t.id).forEach(t => {
            if (shuffledCapital.length > 0) {
                t.name = shuffledCapital.pop();
            }
        });

        // Provincia
        const assignedProvincia = state.teams.filter(t => t.zone === 'provincia' && t.name !== t.id).map(t => t.name);
        const unassignedProvincia = enrolledTeams.provincia.filter(name => !assignedProvincia.includes(name));

        // Shuffle unassigned Provincia teams
        const shuffledProvincia = [...unassignedProvincia].sort(() => Math.random() - 0.5);

        state.teams.filter(t => t.zone === 'provincia' && t.name === t.id).forEach(t => {
            if (shuffledProvincia.length > 0) {
                t.name = shuffledProvincia.pop();
            }
        });

        state.selectedDrawTeam = null;
        updatePlayoffsTeams();
        saveState();
        renderAll();
        showToast('Sorteo completado aleatoriamente.', 'success');
    }
}

// --- 13. PRESENTATION SLIDESHOW DATA & LOGIC ---
const SLIDES_DATA = [
    {
        title: "78ª Copa San Pedro 2026",
        content: `
            <div class="cover-slide">
                <img src="https://www.copasanpedro.es/wp-content/uploads/2026/03/logocopasp.png" alt="Copa San Pedro Logo" class="cover-logo-img">
                <div class="cover-edition">78ª EDICIÓN</div>
                <div class="cover-subtitle">Procedimiento de Sorteo y Criterios de Distribución del Calendario</div>
                <p style="margin-top: 1rem; font-size: 0.95rem; color: var(--text-muted);">Explicación técnica de la estructura competitiva antes del sorteo oficial</p>
            </div>
        `
    },
    {
        title: "Fechas Clave y Pausas",
        content: `
            <div style="background: rgba(254, 189, 1, 0.1); border-left: 4px solid var(--primary); padding: 0.75rem 1rem; border-radius: 4px; margin-bottom: 1.25rem; font-size: 0.85rem; line-height: 1.4; color: var(--text-main);">
                <strong>Ajuste de Fechas y Descanso:</strong> Debido a que hay equipos que juegan la fase eliminatoria (playoffs), se han modificado y adaptado las fechas para distanciar los partidos entre Cuartos de Final, Semifinales, Finales y la Gran Final. Esto garantiza descansos más prolongados y equitativos para las plantillas.
            </div>
            <p>El calendario se ha estructurado para respetar días festivos locales y coordinarse con grandes eventos deportivos:</p>
            <div class="timeline-container">
                <div class="timeline-event" style="width: 15%;">
                    <div class="timeline-node">1</div>
                    <div class="timeline-info">
                        <span class="date">1/9 Jun</span>
                        <span class="label">Inicio Torneo</span>
                    </div>
                </div>
                <div class="timeline-event" style="width: 15%;">
                    <div class="timeline-node blocked">M</div>
                    <div class="timeline-info">
                        <span class="date">15 y 27 Jun</span>
                        <span class="label">Pausa Mundial</span>
                    </div>
                </div>
                <div class="timeline-event" style="width: 15%;">
                    <div class="timeline-node blocked">H</div>
                    <div class="timeline-info">
                        <span class="date">20-24 Jun</span>
                        <span class="label">Hogueras</span>
                    </div>
                </div>
                <div class="timeline-event" style="width: 15%;">
                    <div class="timeline-node">CF</div>
                    <div class="timeline-info">
                        <span class="date">29 Jun - 1 Jul</span>
                        <span class="label">Cuartos Final</span>
                    </div>
                </div>
                <div class="timeline-event" style="width: 15%;">
                    <div class="timeline-node">SF</div>
                    <div class="timeline-info">
                        <span class="date">30 Jun - 8 Jul</span>
                        <span class="label">Semifinales</span>
                    </div>
                </div>
                <div class="timeline-event" style="width: 15%;">
                    <div class="timeline-node">F</div>
                    <div class="timeline-info">
                        <span class="date">9-10 Jul / 17 Jul</span>
                        <span class="label">Finales / GF</span>
                    </div>
                </div>
            </div>
            <ul class="slide-bullets" style="margin-top: 1.5rem;">
                <li><strong>Coordinación Mundial de España:</strong> Pausas en días clave de la fase de grupos para evitar competencia televisiva y de asistencia.</li>
                <li><strong>Festividad de Hogueras:</strong> Parón completo del 20 al 24 de junio para permitir la participación festiva de Alicante.</li>
            </ul>
        `
    },
    {
        title: "Reglas de Carga y Descanso",
        content: `
            <p>Para velar por la integridad física de los futbolistas y asegurar la mejor experiencia competitiva:</p>
            <div class="infographic-row">
                <div class="info-card">
                    <h4>Asistencia de Público</h4>
                    <p>Máximo <strong>2 partidos diarios</strong> por sede para favorecer la asistencia de público al máximo de partidos.</p>
                </div>
                <div class="info-card">
                    <h4>Descanso Mínimo</h4>
                    <p>Mínimo <strong>2 días completos</strong> de descanso entre partidos para cada equipo participante.</p>
                </div>
                <div class="info-card">
                    <h4>Simetría de Grupo</h4>
                    <p>Los partidos del mismo grupo se juegan en días diferentes para que los equipos puedan seguir a sus rivales.</p>
                </div>
            </div>
            <ul class="slide-bullets" style="margin-top: 1.5rem;">
                <li>El motor del calendario comprueba dinámicamente estas reglas. Cualquier cambio manual en fechas que infrinja las reglas mostrará una alerta visual inmediata.</li>
            </ul>
        `
    },
    {
        title: "Criterios de Grupos",
        content: `
            <p>Los 24 equipos se dividen en 6 grupos de forma aleatoria mediante sorteo, separando las fases competitivas:</p>
            <div class="infographic-row" style="margin-top: 1.5rem;">
                <div class="info-card" style="border-left: 4px solid var(--primary);">
                    <h4>Fase Capital (A, B, C, D)</h4>
                    <p><strong>16 Equipos</strong> distribuidos en 4 grupos de forma aleatoria.</p>
                    <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">Días: Lunes, Miércoles, Viernes</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Sedes: Campo de cada equipo (Local)</p>
                </div>
                <div class="info-card" style="border-left: 4px solid #fff;">
                    <h4>Fase Provincia (E, F)</h4>
                    <p><strong>8 Equipos</strong> distribuidos en 2 grupos de forma aleatoria.</p>
                    <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted);">Días: Martes, Jueves</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Sedes: Campo de cada equipo (Local)</p>
                </div>
            </div>
            <ul class="slide-bullets" style="margin-top: 1.5rem;">
                <li><strong>Sedes Propias:</strong> Cada equipo aporta su propio campo de juego para disputar sus partidos como local.</li>
                <li><strong>Sedes Neutrales para Finales:</strong>
                    <br>- Final Capital: <strong>Ciudad Deportiva Antonio Valls</strong> (Alicante)
                    <br>- Final Provincia: <strong>Ciudad Deportiva Camilo Cano</strong> (La Nucía)
                    <br>- Gran Final Absoluta: <strong>Estadio José Rico Pérez</strong> (Alicante)
                </li>
            </ul>
        `
    },
    {
        title: "Alternancia de Localía",
        content: `
            <p>Se ha implementado una restricción estricta para garantizar que ningún equipo juegue los 3 partidos de la fase de grupos en la misma condición:</p>
            <div class="infographic-row" style="margin-top: 1.5rem;">
                <div class="info-card" style="max-width: 400px; margin: 0 auto; text-align: center;">
                    <h4>Patrones de Alternancia Permitidos</h4>
                    <div class="alternation-visual">
                        <span class="alt-pill local">LOCAL (J1)</span>
                        <span class="alt-arrow">➔</span>
                        <span class="alt-pill visitante">VISITANTE (J2)</span>
                        <span class="alt-arrow">➔</span>
                        <span class="alt-pill local">LOCAL (J3)</span>
                    </div>
                    <div class="alternation-visual" style="margin-top: 1rem;">
                        <span class="alt-pill visitante">VISITANTE (J1)</span>
                        <span class="alt-arrow">➔</span>
                        <span class="alt-pill local">LOCAL (J2)</span>
                        <span class="alt-arrow">➔</span>
                        <span class="alt-pill visitante">VISITANTE (J3)</span>
                    </div>
                </div>
            </div>
            <ul class="slide-bullets" style="margin-top: 1.5rem;">
                <li><strong>Equidad de campo:</strong> Todos los equipos juegan al menos un partido en casa y uno fuera, evitando ventajas injustas de jugar tres veces como local o visitante.</li>
            </ul>
        `
    },
    {
        title: "Mecánica del Sorteo en Directo",
        content: `
            <p>El sorteo se realiza de forma presencial con bolilleros tradicionales y asistencia informática instantánea:</p>
            <ol class="slide-bullets" style="display: flex; text-align: left; gap: 0.75rem; margin-top: 1rem;">
                <li>Los representantes de los equipos extraen una <strong>bolita física</strong> que contiene un código ficticio:
                    <br><span style="color: var(--primary); font-weight: 700;">C1 a C16</span> (Capital) o <span style="color: #fff; font-weight: 700;">P1 a P8</span> (Provincia).
                </li>
                <li>Ese código ficticio corresponde a una <strong>posición preestablecida</strong> en los grupos y calendario precomputado.</li>
                <li>Desde el <strong>Panel del Sorteo</strong>, seleccionamos al equipo real y lo vinculamos al código obtenido.</li>
                <li>El sistema actualiza automáticamente todos los grupos, calendarios y nombres en tiempo real para las pantallas.</li>
            </ol>
        `
    },
    {
        title: "Fase Final y Eliminatorias",
        content: `
            <p>Estructura de cruces directos que conduce a la unificación del torneo (reajustada para garantizar descansos óptimos):</p>
            <div class="infographic-row">
                <div class="info-card">
                    <h4>Playoffs Capital</h4>
                    <p>Clasifican los <strong>2 primeros</strong> de los Grupos A, B, C y D.</p>
                    <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Cuartos (29 Jun y 1 Jul):</p>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; line-height: 1.2;">
                        CF1: 1º Grupo A vs 2º Grupo C<br>
                        CF2: 1º Grupo B vs 2º Grupo D<br>
                        CF3: 1º Grupo C vs 2º Grupo A<br>
                        CF4: 1º Grupo D vs 2º Grupo B
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Semifinales (6 y 8 Jul):</p>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; line-height: 1.2;">
                        SF-C1: Ganador CF1 vs Ganador CF2<br>
                        SF-C2: Ganador CF3 vs Ganador CF4
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Final Capital: 10 de Julio (Neutral)</p>
                </div>
                <div class="info-card">
                    <h4>Playoffs Provincia</h4>
                    <p>Clasifican los <strong>2 primeros</strong> de los Grupos E y F.</p>
                    <p style="margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-muted); font-weight: 700;">Semifinales (30 Jun y 2 Jul):</p>
                    <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 0.5rem; line-height: 1.2;">
                        SF-P1: 1º Grupo E vs 2º Grupo F<br>
                        SF-P2: 1º Grupo F vs 2º Grupo E
                    </div>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Final Provincia: 9 de Julio (Neutral)</p>
                </div>
                <div class="info-card" style="border: 1px solid var(--primary); background: rgba(254, 189, 1, 0.02);">
                    <h4>Gran Final Absoluta</h4>
                    <p>Se enfrentan los campeones de las fases Capital y Provincia.</p>
                    <p style="margin-top: 0.5rem; font-size: 0.95rem; color: var(--primary); font-weight: 700;">Viernes, 17 de Julio</p>
                    <p style="font-size: 0.85rem; color: var(--text-muted);">Estadio José Rico Pérez de Alicante</p>
                </div>
            </div>
        `
    }
];

function renderSlide() {
    const container = document.getElementById('slide-container');
    const dotsContainer = document.getElementById('slide-dots');
    if (!container || !dotsContainer) return;

    const current = state.currentSlide || 0;
    const slide = SLIDES_DATA[current];

    // Render slide HTML
    container.innerHTML = `
        <h2 class="slide-title">${slide.title}</h2>
        <div class="slide-body">${slide.content}</div>
    `;

    // Render navigation dots
    dotsContainer.innerHTML = '';
    SLIDES_DATA.forEach((_, idx) => {
        const dot = document.createElement('div');
        dot.className = `slide-dot ${idx === current ? 'active' : ''}`;
        dot.title = `Diapositiva ${idx + 1}`;
        dot.addEventListener('click', () => {
            goToSlide(idx);
        });
        dotsContainer.appendChild(dot);
    });

    // Disable/enable prev/next buttons
    const prevBtn = document.getElementById('btn-prev-slide');
    const nextBtn = document.getElementById('btn-next-slide');
    if (prevBtn) prevBtn.disabled = current === 0;
    if (nextBtn) nextBtn.disabled = current === SLIDES_DATA.length - 1;
}

function nextSlide() {
    const current = state.currentSlide || 0;
    if (current < SLIDES_DATA.length - 1) {
        state.currentSlide = current + 1;
        saveState();
        renderSlide();
    }
}

function prevSlide() {
    const current = state.currentSlide || 0;
    if (current > 0) {
        state.currentSlide = current - 1;
        saveState();
        renderSlide();
    }
}

function goToSlide(index) {
    if (index >= 0 && index < SLIDES_DATA.length) {
        state.currentSlide = index;
        saveState();
        renderSlide();
    }
}

// Run app
window.addEventListener('DOMContentLoaded', initApp);
