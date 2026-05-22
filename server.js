const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'copasanpedro2026';
const SESSION_SECRET = process.env.SESSION_SECRET || 'copa_san_pedro_2026_default_secret_key';

// Request logging middleware
app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} - Status: ${res.statusCode} (${duration}ms)`);
    });
    next();
});

// Middleware for parsing requests
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Session setup
app.use(session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: false, // Set to true if running over HTTPS
        maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
}));

// Path for state storage
const DATA_DIR = path.join(__dirname, 'data');
const STATE_FILE = path.join(DATA_DIR, 'state.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Helper to load state
function loadStateFromFile() {
    if (fs.existsSync(STATE_FILE)) {
        try {
            const data = fs.readFileSync(STATE_FILE, 'utf8');
            return JSON.parse(data);
        } catch (e) {
            console.error("Error reading state file, returning empty state:", e.message);
            return null;
        }
    }
    return null;
}

// Helper to save state
function saveStateToFile(state) {
    try {
        fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
        return true;
    } catch (e) {
        console.error("Error writing state file:", e.message);
        return false;
    }
}

// Generate default tournament state matching client initialization
function generateDefaultState() {
    const teams = [
        { id: 'C1', name: 'C1', zone: 'capital', group: 'B' },
        { id: 'C2', name: 'C2', zone: 'capital', group: 'A' },
        { id: 'C3', name: 'C3', zone: 'capital', group: 'D' },
        { id: 'C4', name: 'C4', zone: 'capital', group: 'A' },
        { id: 'C5', name: 'C5', zone: 'capital', group: 'C' },
        { id: 'C6', name: 'C6', zone: 'capital', group: 'D' },
        { id: 'C7', name: 'C7', zone: 'capital', group: 'A' },
        { id: 'C8', name: 'C8', zone: 'capital', group: 'C' },
        { id: 'C9', name: 'C9', zone: 'capital', group: 'B' },
        { id: 'C10', name: 'C10', zone: 'capital', group: 'C' },
        { id: 'C11', name: 'C11', zone: 'capital', group: 'B' },
        { id: 'C12', name: 'C12', zone: 'capital', group: 'D' },
        { id: 'C13', name: 'C13', zone: 'capital', group: 'D' },
        { id: 'C14', name: 'C14', zone: 'capital', group: 'B' },
        { id: 'C15', name: 'C15', zone: 'capital', group: 'A' },
        { id: 'C16', name: 'C16', zone: 'capital', group: 'C' },
        { id: 'P1', name: 'P1', zone: 'provincia', group: 'E' },
        { id: 'P2', name: 'P2', zone: 'provincia', group: 'F' },
        { id: 'P3', name: 'P3', zone: 'provincia', group: 'E' },
        { id: 'P4', name: 'P4', zone: 'provincia', group: 'F' },
        { id: 'P5', name: 'P5', zone: 'provincia', group: 'E' },
        { id: 'P6', name: 'P6', zone: 'provincia', group: 'F' },
        { id: 'P7', name: 'P7', zone: 'provincia', group: 'F' },
        { id: 'P8', name: 'P8', zone: 'provincia', group: 'E' }
    ];

    const blockedDates = [
        "2026-06-15",
        "2026-06-27",
        "2026-06-20",
        "2026-06-21",
        "2026-06-22",
        "2026-06-23",
        "2026-06-24"
    ];

    const matches = [];
    const groups = ['A', 'B', 'C', 'D', 'E', 'F'];
    
    groups.forEach(gId => {
        const gTeams = teams.filter(t => t.group === gId);
        const orderMap = {
            'A': ['C7', 'C2', 'C15', 'C4'],
            'B': ['C9', 'C11', 'C1', 'C14'],
            'C': ['C5', 'C16', 'C8', 'C10'],
            'D': ['C3', 'C12', 'C6', 'C13'],
            'E': ['P3', 'P8', 'P1', 'P5'],
            'F': ['P2', 'P7', 'P4', 'P6']
        };
        const sortedTeams = orderMap[gId].map(id => gTeams.find(t => t.id === id));
        const roundPairs = [
            [[0, 1], [2, 3]],
            [[3, 0], [1, 2]],
            [[0, 2], [3, 1]]
        ];
        
        roundPairs.forEach((round, roundIdx) => {
            const roundNum = roundIdx + 1;
            round.forEach((pair, pairIdx) => {
                matches.push({
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
                    pairIdx: pairIdx
                });
            });
        });
    });

    const matchDateAssignments = {
        'A': {
            1: { 0: '2026-06-01', 1: '2026-06-03' },
            2: { 0: '2026-06-10', 1: '2026-06-12' },
            3: { 0: '2026-06-26', 1: '2026-06-29' }
        },
        'B': {
            1: { 0: '2026-06-01', 1: '2026-06-03' },
            2: { 0: '2026-06-10', 1: '2026-06-12' },
            3: { 0: '2026-06-26', 1: '2026-06-29' }
        },
        'C': {
            1: { 0: '2026-06-05', 1: '2026-06-08' },
            2: { 0: '2026-06-17', 1: '2026-06-19' },
            3: { 0: '2026-07-01', 1: '2026-07-03' }
        },
        'D': {
            1: { 0: '2026-06-05', 1: '2026-06-08' },
            2: { 0: '2026-06-17', 1: '2026-06-19' },
            3: { 0: '2026-07-01', 1: '2026-07-03' }
        },
        'E': {
            1: { 0: '2026-06-02', 1: '2026-06-04' },
            2: { 0: '2026-06-09', 1: '2026-06-11' },
            3: { 0: '2026-06-16', 1: '2026-06-18' }
        },
        'F': {
            1: { 0: '2026-06-02', 1: '2026-06-04' },
            2: { 0: '2026-06-09', 1: '2026-06-11' },
            3: { 0: '2026-06-16', 1: '2026-06-18' }
        }
    };

    matches.forEach(match => {
        const g = match.group;
        const r = match.round;
        const pIdx = match.pairIdx;
        match.date = matchDateAssignments[g][r][pIdx];
        match.time = '20:00';
        match.venue = '';
        delete match.pairIdx;
    });

    const capitalPlayoffs = [
        { id: 'CF1', stage: 'playoffs', zone: 'capital', round: 'CF', homeTeam: '1º Grupo A', awayTeam: '2º Grupo C', homeScore: null, awayScore: null, date: '2026-07-06', time: '20:00', venue: '', status: 'pending' },
        { id: 'CF2', stage: 'playoffs', zone: 'capital', round: 'CF', homeTeam: '1º Grupo B', awayTeam: '2º Grupo D', homeScore: null, awayScore: null, date: '2026-07-06', time: '20:00', venue: '', status: 'pending' },
        { id: 'CF3', stage: 'playoffs', zone: 'capital', round: 'CF', homeTeam: '1º Grupo C', awayTeam: '2º Grupo A', homeScore: null, awayScore: null, date: '2026-07-08', time: '20:00', venue: '', status: 'pending' },
        { id: 'CF4', stage: 'playoffs', zone: 'capital', round: 'CF', homeTeam: '1º Grupo D', awayTeam: '2º Grupo B', homeScore: null, awayScore: null, date: '2026-07-08', time: '20:00', venue: '', status: 'pending' },
        { id: 'SF-C1', stage: 'playoffs', zone: 'capital', round: 'SF', homeTeam: 'Ganador CF1', awayTeam: 'Ganador CF2', homeScore: null, awayScore: null, date: '2026-07-10', time: '20:00', venue: '', status: 'pending' },
        { id: 'SF-C2', stage: 'playoffs', zone: 'capital', round: 'SF', homeTeam: 'Ganador CF3', awayTeam: 'Ganador CF4', homeScore: null, awayScore: null, date: '2026-07-13', time: '20:00', venue: '', status: 'pending' },
        { id: 'Final-C', stage: 'playoffs', zone: 'capital', round: 'F', homeTeam: 'Ganador SF-C1', awayTeam: 'Ganador SF-C2', homeScore: null, awayScore: null, date: '2026-07-15', time: '20:00', venue: '', status: 'pending' }
    ];

    const provinciaPlayoffs = [
        { id: 'SF-P1', stage: 'playoffs', zone: 'provincia', round: 'SF', homeTeam: '1º Grupo E', awayTeam: '2º Grupo F', homeScore: null, awayScore: null, date: '2026-07-07', time: '20:00', venue: '', status: 'pending' },
        { id: 'SF-P2', stage: 'playoffs', zone: 'provincia', round: 'SF', homeTeam: '1º Grupo F', awayTeam: '2º Grupo E', homeScore: null, awayScore: null, date: '2026-07-09', time: '20:00', venue: '', status: 'pending' },
        { id: 'Final-P', stage: 'playoffs', zone: 'provincia', round: 'F', homeTeam: 'Ganador SF-P1', awayTeam: 'Ganador SF-P2', homeScore: null, awayScore: null, date: '2026-07-14', time: '20:00', venue: '', status: 'pending' }
    ];

    const grandFinal = [
        { id: 'Gran-Final', stage: 'playoffs', zone: 'final', round: 'GF', homeTeam: 'Campeón Capital', awayTeam: 'Campeón Provincia', homeScore: null, awayScore: null, date: '2026-07-17', time: '20:00', venue: '', status: 'pending' }
    ];

    matches.push(...capitalPlayoffs, ...provinciaPlayoffs, ...grandFinal);

    return {
        teams,
        matches,
        settings: {
            allowWeekends: false,
            useMultisede: true,
            maxMatchesPerDay: 2,
            minRestDays: 2,
            blockedDates
        },
        activeTab: 'dashboard',
        currentSlide: 0,
        currentCalendarMonth: 5,
        currentCalendarYear: 2026,
        calendarViewMode: 'list',
        selectedBracketTab: 'capital',
        selectedMatchToEdit: null,
        selectedDrawTeam: null,
        groupFilters: {
            stage: 'all',
            group: 'all',
            team: 'all',
            status: 'all'
        },
        lastUpdated: Date.now()
    };
}

// Ensure state file exists on startup
if (!fs.existsSync(STATE_FILE)) {
    console.log("State file not found. Generating default tournament state...");
    const defaultState = generateDefaultState();
    saveStateToFile(defaultState);
}

// API Endpoints

// Get Authentication Status
app.get('/api/auth-status', (req, res) => {
    res.json({ isAdmin: !!req.session.isAdmin });
});

// Login Endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        req.session.isAdmin = true;
        // Explicitly save the session to make sure it's written before sending response
        req.session.save((err) => {
            if (err) {
                console.error("Session save error:", err);
                return res.status(500).json({ success: false, message: 'Error de servidor al iniciar sesión' });
            }
            res.json({ success: true, message: 'Sesión iniciada correctamente' });
        });
    } else {
        res.status(401).json({ success: false, message: 'Usuario o contraseña incorrectos' });
    }
});

// Logout Endpoint
app.post('/api/logout', (req, res) => {
    req.session.isAdmin = false;
    req.session.destroy((err) => {
        if (err) {
            console.error("Session destroy error:", err);
            return res.status(500).json({ success: false, message: 'Error al cerrar sesión' });
        }
        res.clearCookie('connect.sid'); // default express session cookie name
        res.json({ success: true, message: 'Sesión cerrada correctamente' });
    });
});

// Get State
app.get('/api/state', (req, res) => {
    const state = loadStateFromFile();
    if (state) {
        res.json(state);
    } else {
        // Return empty indicator so that client can initialize if needed
        res.json({ initialized: false });
    }
});

// Save State (Admin Only)
app.post('/api/state', (req, res) => {
    if (!req.session.isAdmin) {
        return res.status(403).json({ success: false, message: 'Acceso denegado: Se requiere rol de administrador' });
    }
    
    const newState = req.body;
    
    // Add server timestamp to indicate last update
    newState.lastUpdated = Date.now();
    
    const success = saveStateToFile(newState);
    if (success) {
        res.json({ success: true, lastUpdated: newState.lastUpdated });
    } else {
        res.status(500).json({ success: false, message: 'No se pudo guardar el estado en el servidor' });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(`[ERROR] Unhandled exception on ${req.method} ${req.originalUrl}:`, err);
    res.status(500).json({ 
        success: false, 
        message: 'Error interno del servidor: ' + err.message 
    });
});

// Serve static files
app.use(express.static(__dirname));

// Start server
app.listen(PORT, () => {
    console.log(`==================================================`);
    console.log(` Copa San Pedro 2026 Server is running!`);
    console.log(` Local URL: http://localhost:${PORT}`);
    console.log(` Mode: ${process.env.NODE_ENV || 'development'}`);
    console.log(`==================================================`);
});
