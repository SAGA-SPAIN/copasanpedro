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
  {
    "id": "C1",
    "name": "GAVIOTA CF B.º SAN GABRIEL",
    "zone": "capital",
    "group": "B"
  },
  {
    "id": "C2",
    "name": "VIASPORT MARISTAS",
    "zone": "capital",
    "group": "A"
  },
  {
    "id": "C3",
    "name": "ALICANTE FOOTBALL ACADEMY",
    "zone": "capital",
    "group": "D"
  },
  {
    "id": "C4",
    "name": "MEDITERRÁNEO-PEÑA EL BOTIJO",
    "zone": "capital",
    "group": "A"
  },
  {
    "id": "C5",
    "name": "CD VILLAFRANQUEZA",
    "zone": "capital",
    "group": "C"
  },
  {
    "id": "C6",
    "name": "ATLETICO SAN BLAS",
    "zone": "capital",
    "group": "D"
  },
  {
    "id": "C7",
    "name": "SCD SAN BLAS",
    "zone": "capital",
    "group": "A"
  },
  {
    "id": "C8",
    "name": "C.A. EL PRINCIPIO",
    "zone": "capital",
    "group": "C"
  },
  {
    "id": "C9",
    "name": "INTER LEUKA-DUAL LINK",
    "zone": "capital",
    "group": "B"
  },
  {
    "id": "C10",
    "name": "SALESIANOS BY DICKENS",
    "zone": "capital",
    "group": "C"
  },
  {
    "id": "C11",
    "name": "ALICANTE SPORT ACADEMY",
    "zone": "capital",
    "group": "B"
  },
  {
    "id": "C12",
    "name": "LACROSS BABEL",
    "zone": "capital",
    "group": "D"
  },
  {
    "id": "C13",
    "name": "BETIS FLORIDA",
    "zone": "capital",
    "group": "D"
  },
  {
    "id": "C14",
    "name": "CD CAMPELLO- CASA SALVI",
    "zone": "capital",
    "group": "B"
  },
  {
    "id": "C15",
    "name": "PLAYAS ALICANTE",
    "zone": "capital",
    "group": "A"
  },
  {
    "id": "C16",
    "name": "ALICANTE CITY FC ACADEMY",
    "zone": "capital",
    "group": "C"
  },
  {
    "id": "P1",
    "name": "MONNEGRE MUCHAMIEL",
    "zone": "provincia",
    "group": "F"
  },
  {
    "id": "P2",
    "name": "FUNDACIÓN CD CAMPELLO",
    "zone": "provincia",
    "group": "F"
  },
  {
    "id": "P3",
    "name": "CD ESPAÑOL SAN VICENTE",
    "zone": "provincia",
    "group": "E"
  },
  {
    "id": "P4",
    "name": "VILLAJOYOSA CF",
    "zone": "provincia",
    "group": "F"
  },
  {
    "id": "P5",
    "name": "CD ALTET",
    "zone": "provincia",
    "group": "E"
  },
  {
    "id": "P6",
    "name": "AC TORRELANO",
    "zone": "provincia",
    "group": "E"
  },
  {
    "id": "P7",
    "name": "GIMNÀSTIC SANT VICENT",
    "zone": "provincia",
    "group": "E"
  },
  {
    "id": "P8",
    "name": "MUTXAMEL CF",
    "zone": "provincia",
    "group": "F"
  }
];

    const matches = [
      {
        "id": "A-R1-C7vC2",
        "stage": "group",
        "group": "A",
        "round": 1,
        "homeTeam": "C7",
        "awayTeam": "C2",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-01",
        "time": "20:30",
        "venue": "polideportivo San Blas",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "A-R1-C15vC4",
        "stage": "group",
        "group": "A",
        "round": 1,
        "homeTeam": "C15",
        "awayTeam": "C4",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-03",
        "time": "20:30",
        "venue": "Campo de Futbol Sandra Paños",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "A-R2-C4vC7",
        "stage": "group",
        "group": "A",
        "round": 2,
        "homeTeam": "C4",
        "awayTeam": "C7",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-05",
        "time": "20:30",
        "venue": "CF Sandra Paños",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "A-R2-C2vC15",
        "stage": "group",
        "group": "A",
        "round": 2,
        "homeTeam": "C2",
        "awayTeam": "C15",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-08",
        "time": "20:30",
        "venue": "Polideportivo Tombola",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "A-R3-C7vC15",
        "stage": "group",
        "group": "A",
        "round": 3,
        "homeTeam": "C7",
        "awayTeam": "C15",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-17",
        "time": "20:30",
        "venue": "polideportivo San Blas",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "A-R3-C4vC2",
        "stage": "group",
        "group": "A",
        "round": 3,
        "homeTeam": "C4",
        "awayTeam": "C2",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-17",
        "time": "20:30",
        "venue": "CF Sandra Paños",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "B-R1-C9vC11",
        "stage": "group",
        "group": "B",
        "round": 1,
        "homeTeam": "C9",
        "awayTeam": "C11",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-01",
        "time": "20:30",
        "venue": "Ciudad Deportiva Antonio Valls",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "B-R1-C1vC14",
        "stage": "group",
        "group": "B",
        "round": 1,
        "homeTeam": "C1",
        "awayTeam": "C14",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-03",
        "time": "20:30",
        "venue": "Pol. J.A. Samarach",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "B-R2-C14vC9",
        "stage": "group",
        "group": "B",
        "round": 2,
        "homeTeam": "C14",
        "awayTeam": "C9",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-05",
        "time": "20:30",
        "venue": "Pol. Pla Garbinet",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "B-R2-C11vC1",
        "stage": "group",
        "group": "B",
        "round": 2,
        "homeTeam": "C11",
        "awayTeam": "C1",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-08",
        "time": "20:30",
        "venue": "Pol. J.A. Samarach",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "B-R3-C1vC9",
        "stage": "group",
        "group": "B",
        "round": 3,
        "homeTeam": "C1",
        "awayTeam": "C9",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-17",
        "time": "20:30",
        "venue": "Pol. J.A. Samarach",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "B-R3-C14vC11",
        "stage": "group",
        "group": "B",
        "round": 3,
        "homeTeam": "C14",
        "awayTeam": "C11",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-17",
        "time": "20:30",
        "venue": "Pol. Pla Garbinet",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "C-R1-C5vC16",
        "stage": "group",
        "group": "C",
        "round": 1,
        "homeTeam": "C5",
        "awayTeam": "C16",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-05",
        "time": "20:30",
        "venue": "Campo de Futbol Antonio Solana",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "C-R1-C8vC10",
        "stage": "group",
        "group": "C",
        "round": 1,
        "homeTeam": "C8",
        "awayTeam": "C10",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-01",
        "time": "20:30",
        "venue": "Pol Pla Garbinet",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "C-R2-C10vC5",
        "stage": "group",
        "group": "C",
        "round": 2,
        "homeTeam": "C10",
        "awayTeam": "C5",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-10",
        "time": "20:30",
        "venue": "C.F Florida Babel",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "C-R2-C16vC8",
        "stage": "group",
        "group": "C",
        "round": 2,
        "homeTeam": "C16",
        "awayTeam": "C8",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-12",
        "time": "20:30",
        "venue": "Pol. Via Parque",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "C-R3-C8vC5",
        "stage": "group",
        "group": "C",
        "round": 3,
        "homeTeam": "C8",
        "awayTeam": "C5",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-19",
        "time": "20:30",
        "venue": "Pol Pla Garbinet",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "C-R3-C16vC10",
        "stage": "group",
        "group": "C",
        "round": 3,
        "homeTeam": "C16",
        "awayTeam": "C10",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-19",
        "time": "20:30",
        "venue": "Pol. Via Parque",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "D-R1-C3vC12",
        "stage": "group",
        "group": "D",
        "round": 1,
        "homeTeam": "C3",
        "awayTeam": "C12",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-03",
        "time": "20:30",
        "venue": "Ciudad Deportiva Antonio Valls",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "D-R1-C6vC13",
        "stage": "group",
        "group": "D",
        "round": 1,
        "homeTeam": "C6",
        "awayTeam": "C13",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-08",
        "time": "20:30",
        "venue": "Pol. San Blas",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "D-R2-C13vC3",
        "stage": "group",
        "group": "D",
        "round": 2,
        "homeTeam": "C13",
        "awayTeam": "C3",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-12",
        "time": "20:30",
        "venue": "CF Florida Babel",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "D-R2-C12vC6",
        "stage": "group",
        "group": "D",
        "round": 2,
        "homeTeam": "C12",
        "awayTeam": "C6",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-10",
        "time": "20:30",
        "venue": "Polideportivo Tombola",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "D-R3-C3vC6",
        "stage": "group",
        "group": "D",
        "round": 3,
        "homeTeam": "C3",
        "awayTeam": "C6",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-19",
        "time": "20:30",
        "venue": "Ciudad Deportiva Antonio Valls",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "D-R3-C13vC12",
        "stage": "group",
        "group": "D",
        "round": 3,
        "homeTeam": "C13",
        "awayTeam": "C12",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-19",
        "time": "20:30",
        "venue": "CF Florida Babel",
        "status": "pending",
        "zone": "capital"
      },
      {
        "id": "E-R1-P3vP5",
        "stage": "group",
        "group": "E",
        "round": 1,
        "homeTeam": "P3",
        "awayTeam": "P5",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-09",
        "time": "20:00",
        "venue": "Polideportivo San Vicente del Raspeig",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "E-R1-P6vP7",
        "stage": "group",
        "group": "E",
        "round": 1,
        "homeTeam": "P6",
        "awayTeam": "P7",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-11",
        "time": "20:00",
        "venue": "POLIDEPORTIVO TORRELLANO - ISABEL FERNANDEZ",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "E-R2-P7vP3",
        "stage": "group",
        "group": "E",
        "round": 2,
        "homeTeam": "P7",
        "awayTeam": "P3",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-16",
        "time": "20:00",
        "venue": "Polideportivo San Vicente del Raspeig",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "E-R2-P5vP6",
        "stage": "group",
        "group": "E",
        "round": 2,
        "homeTeam": "P5",
        "awayTeam": "P6",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-18",
        "time": "20:00",
        "venue": "Polideportivo Municipal El Altet",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "E-R3-P3vP6",
        "stage": "group",
        "group": "E",
        "round": 3,
        "homeTeam": "P3",
        "awayTeam": "P6",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-25",
        "time": "20:00",
        "venue": "Polideportivo San Vicente del Raspeig",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "E-R3-P7vP5",
        "stage": "group",
        "group": "E",
        "round": 3,
        "homeTeam": "P7",
        "awayTeam": "P5",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-30",
        "time": "20:00",
        "venue": "Polideportivo San Vicente del Raspeig",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "F-R1-P1vP2",
        "stage": "group",
        "group": "F",
        "round": 1,
        "homeTeam": "P1",
        "awayTeam": "P2",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-09",
        "time": "21:00",
        "venue": "Polideportivo El Oms Mutxamel",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "F-R1-P4vP8",
        "stage": "group",
        "group": "F",
        "round": 1,
        "homeTeam": "P4",
        "awayTeam": "P8",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-11",
        "time": "20:00",
        "venue": "Estadio Municipal Nou Pla",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "F-R2-P8vP1",
        "stage": "group",
        "group": "F",
        "round": 2,
        "homeTeam": "P8",
        "awayTeam": "P1",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-16",
        "time": "20:00",
        "venue": "Polideportivo El Oms Mutxamel",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "F-R2-P2vP4",
        "stage": "group",
        "group": "F",
        "round": 2,
        "homeTeam": "P2",
        "awayTeam": "P4",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-18",
        "time": "20:00",
        "venue": "Polideportivo \"El Vincle\"",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "F-R3-P1vP4",
        "stage": "group",
        "group": "F",
        "round": 3,
        "homeTeam": "P1",
        "awayTeam": "P4",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-25",
        "time": "21:00",
        "venue": "Polideportivo El Oms Mutxamel",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "F-R3-P8vP2",
        "stage": "group",
        "group": "F",
        "round": 3,
        "homeTeam": "P8",
        "awayTeam": "P2",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-30",
        "time": "20:00",
        "venue": "Polideportivo El Oms Mutxamel",
        "status": "pending",
        "zone": "provincia"
      },
      {
        "id": "CF1",
        "stage": "playoffs",
        "zone": "capital",
        "round": "CF",
        "homeTeam": "1º Grupo A",
        "awayTeam": "2º Grupo C",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-29",
        "time": "20:30",
        "venue": "",
        "status": "pending"
      },
      {
        "id": "CF2",
        "stage": "playoffs",
        "zone": "capital",
        "round": "CF",
        "homeTeam": "1º Grupo B",
        "awayTeam": "2º Grupo D",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-06-29",
        "time": "20:30",
        "venue": "",
        "status": "pending"
      },
      {
        "id": "CF3",
        "stage": "playoffs",
        "zone": "capital",
        "round": "CF",
        "homeTeam": "1º Grupo C",
        "awayTeam": "2º Grupo A",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-07-01",
        "time": "20:30",
        "venue": "",
        "status": "pending"
      },
      {
        "id": "CF4",
        "stage": "playoffs",
        "zone": "capital",
        "round": "CF",
        "homeTeam": "1º Grupo D",
        "awayTeam": "2º Grupo B",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-07-01",
        "time": "20:30",
        "venue": "",
        "status": "pending"
      },
      {
        "id": "SF-C1",
        "stage": "playoffs",
        "zone": "capital",
        "round": "SF",
        "homeTeam": "Ganador CF1",
        "awayTeam": "Ganador CF2",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-07-03",
        "time": "20:30",
        "venue": "",
        "status": "pending"
      },
      {
        "id": "SF-C2",
        "stage": "playoffs",
        "zone": "capital",
        "round": "SF",
        "homeTeam": "Ganador CF3",
        "awayTeam": "Ganador CF4",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-07-06",
        "time": "20:30",
        "venue": "",
        "status": "pending"
      },
      {
        "id": "Final-C",
        "stage": "playoffs",
        "zone": "capital",
        "round": "F",
        "homeTeam": "Ganador SF-C1",
        "awayTeam": "Ganador SF-C2",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-07-10",
        "time": "20:30",
        "venue": "",
        "status": "pending"
      },
      {
        "id": "SF-P1",
        "stage": "playoffs",
        "zone": "provincia",
        "round": "SF",
        "homeTeam": "1º Grupo E",
        "awayTeam": "2º Grupo F",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-07-07",
        "time": "20:00",
        "venue": "",
        "status": "pending"
      },
      {
        "id": "SF-P2",
        "stage": "playoffs",
        "zone": "provincia",
        "round": "SF",
        "homeTeam": "1º Grupo F",
        "awayTeam": "2º Grupo E",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-07-08",
        "time": "20:00",
        "venue": "",
        "status": "pending"
      },
      {
        "id": "Final-P",
        "stage": "playoffs",
        "zone": "provincia",
        "round": "F",
        "homeTeam": "Ganador SF-P1",
        "awayTeam": "Ganador SF-P2",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-07-11",
        "time": "20:00",
        "venue": "",
        "status": "pending"
      },
      {
        "id": "Gran-Final",
        "stage": "playoffs",
        "zone": "final",
        "round": "GF",
        "homeTeam": "Campeón Capital",
        "awayTeam": "Campeón Provincia",
        "homeScore": null,
        "awayScore": null,
        "date": "2026-07-17",
        "time": "20:00",
        "venue": "",
        "status": "pending"
      }
    ];

    const settings = {
  "allowWeekends": false,
  "useMultisede": true,
  "maxMatchesPerDay": 3,
  "minRestDays": 2,
  "blockedDates": [
    "2026-06-20",
    "2026-06-21",
    "2026-06-22",
    "2026-06-23",
    "2026-06-24"
  ]
};

    return {
        teams,
        matches,
        settings,
        activeTab: 'groups',
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
