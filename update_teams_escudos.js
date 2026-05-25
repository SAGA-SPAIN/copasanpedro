const fs = require('fs');
const path = require('path');

const STATE_FILE = path.join(__dirname, 'data', 'state.json');
const SERVER_FILE = path.join(__dirname, 'server.js');
const APP_FILE = path.join(__dirname, 'app.js');

// 1. Correct names map
const teamMap = {
  // Capital (Grupos A-D)
  'C1': 'CF BARRIO SAN GABRIEL',
  'C2': 'VIASPORT MARISTAS',
  'C3': 'ALICANTE FOOTBALL ACADEMY',
  'C4': 'MEDITERRÁNEO-PEÑA EL BOTIJO',
  'C5': 'CD VILLAFRANQUEZA',
  'C6': 'ATLETICO SAN BLAS',
  'C7': 'SCD SAN BLAS',
  'C8': 'C.A. EL PRINCIPIO',
  'C9': 'INTER LEUKA-DUAL LINK',
  'C10': 'SALESIANOS BY DICKENS',
  'C11': 'ALICANTE SPORT ACADEMY',
  'C12': 'LACROSS BABEL',
  'C13': 'BETIS FLORIDA',
  'C14': 'CD CAMPELLO- CASA SALVI',
  'C15': 'PLAYAS ALICANTE',
  'C16': 'ALICANTE CITY FC ACADEMY',

  // Provincia (Grupos E-F)
  'P1': 'MONNEGRE MUCHAMIEL',
  'P2': 'FUNDACIÓN CD CAMPELLO',
  'P3': 'JOVE ESPAÑOL SANT VICENT',
  'P4': 'VILLAJOYOSA CF',
  'P5': 'ALTET CF',
  'P6': 'AC TORRELANO',
  'P7': 'GIMNÀSTIC SANT VICENT',
  'P8': 'MUTXAMEL CF'
};

// Update state.json
if (fs.existsSync(STATE_FILE)) {
  const state = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  
  // Update team names in teams list
  state.teams.forEach(t => {
    if (teamMap[t.id]) {
      t.name = teamMap[t.id];
    }
  });
  
  state.lastUpdated = Date.now();
  fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), 'utf8');
  console.log("state.json team names updated!");
}

// Update server.js
let serverContent = fs.readFileSync(SERVER_FILE, 'utf8');
// Let's replace the generateDefaultState output dynamically by running our update_server_js.js replacement logic
// We can just run a node script that does this! Since we already wrote update_server_js.js, we can write a similar logic here.
console.log("Team names updated in state.json.");
