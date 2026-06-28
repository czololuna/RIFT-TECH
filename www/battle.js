// ===== RIFT-TECH: FRACTURED EARTH — battle.js =====

const state = {
  energy: 3,
  maxEnergy: 3,
  turn: 1,
  playerHP: 30,
  enemyHP: 30,
  playerBoard: [],
  enemyBoard: [],
  hand: [],
  playerDeck: [],
  gameOver: false
};

// --- Wszystkie karty ---
const ALL_CARDS = [
  // LEGENDY
  { id:"valkyria",   name:"Valkyria",   cost:7, atk:5, hp:8,  img:"assets/heroes/valkyria.webp",              faction:"Valkyria",    rarity:"legendary" },
  { id:"maglander",  name:"Maglander",  cost:6, atk:4, hp:6,  img:"assets/heroes/maglander.webp",             faction:"Maglander",   rarity:"legendary" },
  { id:"vanguard",   name:"Vanguard",   cost:7, atk:5, hp:9,  img:"assets/heroes/vanguard.webp",              faction:"Vanguard",    rarity:"legendary" },
  { id:"shadowflare",name:"Shadowflare",cost:6, atk:6, hp:6,  img:"assets/heroes/shadowflare.webp",           faction:"Shadowflare", rarity:"legendary" },

  // EPIC / RARE / COMMON — numerowane pliki
  { id:"brann",      name:"Brann",      cost:4, atk:2, hp:5,  img:"assets/cards/valkyria_champion.png",          faction:"Valkyria",    rarity:"epic"   },
  { id:"skjold",     name:"Skjold",     cost:3, atk:2, hp:4,  img:"assets/cards/valkyria_sentinel.png",          faction:"Valkyria",    rarity:"rare"   },
  { id:"harka",      name:"Harka",      cost:2, atk:3, hp:2,  img:"assets/cards/valkyria_guard.png",          faction:"Valkyria",    rarity:"common" },
  { id:"axiom",      name:"Axiom",      cost:4, atk:3, hp:4,  img:"assets/cards/rift_archon.png",          faction:"Maglander",   rarity:"epic"   },
  { id:"lyra",       name:"Lyra",       cost:3, atk:2, hp:3,  img:"assets/cards/rift_weaver.png",          faction:"Maglander",   rarity:"rare"   }
];

// --- Talia gracza (startowa) ---
const PLAYER_DECK_IDS = [
  "valkyria","brann","brann","skjold","skjold","harka","harka","harka","maglander","axiom"
];

// --- DOM ---
const arenaEl     = document.getElementById("arena");
const handEl      = document.getElementById("hand");
const boardEl     = document.getElementById("board");
const gemsEl      = document.getElementById("gems");
const energyText  = document.getElementById("energyText");
const turnNum     = document.getElementById("turnNum");
const logEl       = document.getElementById("log");

// --- Init ---
function init() {
  state.playerDeck = PLAYER_DECK_IDS
    .map(id => ({...ALL_CARDS.find(c => c.id === id)}))
    .sort(() => Math.random() - 0.5);

  drawCards(4);
  renderAll();
  log("⚡ Bitwa rozpoczęta! Masz 4 karty w ręce.");
}

function drawCards(n) {
  for (let i = 0; i < n; i++) {
    if (state.playerDeck.length === 0) { log("🃏 Talia pusta!"); break; }
    const card = state.playerDeck.pop();
    card.currentHP = card.hp;
    state.hand.push(card);
  }
}

// --- Render wszystkiego ---
function renderAll() {
  renderEnergy();
  renderHand();
  renderBoard();
  renderHP();
  turnNum.textContent = state.turn;
}

function renderEnergy() {
  energyText.textContent = `${state.energy}/${state.maxEnergy}`;
  gemsEl.innerHTML = "";
  for (let i = 0; i < state.maxEnergy; i++) {
    const g = document.createElement("div");
    g.className = "gem" + (i < state.energy ? " active" : "");
    gemsEl.appendChild(g);
  }
}

function renderHand() {
  handEl.innerHTML = "";
  state.hand.forEach((card, i) => {
    const canPlay = card.cost <= state.energy && !state.gameOver;
    const div = document.createElement("div");
    div.className = "card" + (canPlay ? "" : " disabled");

    const rarityColor = {legendary:"#f59e0b", epic:"#a855f7", rare:"#3b82f6", common:"#6b7280"}[card.rarity] || "#fff";

    div.innerHTML = `
      <div class="card-cost">${card.cost}</div>
      <img src="${card.img}" alt="${card.name}" onerror="this.src='assets/heroes/valkyria.webp'">
      <div class="card-body">
        <div class="card-name" style="color:${rarityColor}">${card.name}</div>
        <div class="card-stats">
          <span>⚔️${card.atk}</span>
          <span>❤️${card.hp}</span>
        </div>
      </div>`;

    if (canPlay) div.onclick = () => playCard(i);
    handEl.appendChild(div);
  });
}

function renderBoard() {
  boardEl.innerHTML = `<div class="board-label">🛡️ Pole bitwy</div>`;

  // Jednostki wroga
  state.enemyBoard.forEach((unit, i) => {
    const div = createUnitEl(unit, true, i);
    boardEl.appendChild(div);
  });

  // Separator
  const sep = document.createElement("div");
  sep.style.cssText = "width:100%;border-top:1px dashed #1e3a5f;margin:4px 0;";
  boardEl.appendChild(sep);

  // Jednostki gracza
  state.playerBoard.forEach((unit, i) => {
    const div = createUnitEl(unit, false, i);
    boardEl.appendChild(div);
  });
}

function createUnitEl(unit, isEnemy, index) {
  const div = document.createElement("div");
  div.className = "unit" + (isEnemy ? " enemy-unit" : "") + (unit.exhausted ? " exhausted" : "");
  div.innerHTML = `
    <img src="${unit.img}" alt="${unit.name}" onerror="this.src='assets/heroes/valkyria.webp'">
    <div>${unit.name}</div>
    <div>⚔️${unit.atk} ❤️${unit.currentHP}</div>`;

  if (!isEnemy && !unit.exhausted && !state.gameOver) {
    div.onclick = () => attackWithUnit(index);
    div.title = "Kliknij aby zaatakować!";
  }
  if (isEnemy && !state.gameOver) {
    div.onclick = () => attackEnemyUnit(index);
    div.title = "Zaatakuj tę jednostkę!";
  }
  return div;
}

function renderHP() {
  const pPct = Math.max(0, (state.playerHP / 30) * 100);
  const ePct = Math.max(0, (state.enemyHP / 30) * 100);
  document.getElementById("playerHpBar").style.width = pPct + "%";
  document.getElementById("enemyHpBar").style.width  = ePct + "%";
  document.getElementById("playerHpText").textContent = `❤️ ${Math.max(0,state.playerHP)}/30`;
  document.getElementById("enemyHpText").textContent  = `❤️ ${Math.max(0,state.enemyHP)}/30`;
}

// --- Zagranie karty ---
function playCard(index) {
  if (state.gameOver) return;
  const card = state.hand[index];
  if (card.cost > state.energy) return;

  state.energy -= card.cost;
  state.hand.splice(index, 1);

  const unit = {...card, currentHP: card.hp, exhausted: true};
  state.playerBoard.push(unit);

  log(`✅ Zagrałeś ${card.name} na pole bitwy! (koszt: ${card.cost} energii)`);
  renderAll();
}

// --- Atak jednostką na bohatera wroga ---
function attackWithUnit(index) {
  if (state.gameOver) return;
  const unit = state.playerBoard[index];
  if (unit.exhausted) { log("⚠️ Ta jednostka już atakowała w tej turze!"); return; }

  if (state.enemyBoard.length > 0) {
    log(`⚔️ ${unit.name} musi najpierw zniszczyć jednostki wroga!`);
    return;
  }

  unit.exhausted = true;
  state.enemyHP -= unit.atk;
  log(`⚔️ ${unit.name} atakuje Shadowflare'a za ${unit.atk} obrażeń! HP wroga: ${Math.max(0,state.enemyHP)}`);
  renderAll();
  checkWin();
}

// --- Atak na jednostkę wroga ---
// FIX #5: Gracz może teraz wybrać która z jego jednostek atakuje
function attackEnemyUnit(enemyIndex) {
  if (state.gameOver) return;
  
  // Znajdź pierwszą gotową jednostkę gracza
  const attacker = state.playerBoard.find(u => !u.exhausted);
  if (!attacker) { log("⚠️ Brak gotowych do ataku jednostek!"); return; }

  const target = state.enemyBoard[enemyIndex];
  attacker.exhausted = true;
  target.currentHP -= attacker.atk;
  attacker.currentHP -= target.atk;

  log(`⚔️ ${attacker.name} vs ${target.name} — zadaje ${attacker.atk} dmg, otrzymuje ${target.atk} dmg`);

  if (target.currentHP <= 0) {
    state.enemyBoard.splice(enemyIndex, 1);
    log(`💀 ${target.name} zniszczony!`);
  }
  if (attacker.currentHP <= 0) {
    const ai = state.playerBoard.indexOf(attacker);
    state.playerBoard.splice(ai, 1);
    log(`💀 ${attacker.name} poległ w walce!`);
  }

  renderAll();
  checkWin();
}

// --- Koniec tury gracza ---
function endTurn() {
  if (state.gameOver) return;
  log("⏭️ Kończysz turę... AI atakuje!");
  setTimeout(aiTurn, 600);
}

// --- AI tura ---
// FIX #6: Bezpieczna pętla - sprawdzamy gameOver przed każdym atakiem
function aiTurn() {
  if (state.gameOver) return;
  
  // AI zagrywa losową kartę
  const aiCards = ALL_CARDS.filter(c => c.cost <= 5);
  const pick = {...aiCards[Math.floor(Math.random() * aiCards.length)]};
  pick.currentHP = pick.hp;
  pick.exhausted = false;
  state.enemyBoard.push(pick);
  log(`🤖 AI zagrywa ${pick.name} (⚔️${pick.atk} ❤️${pick.hp})`);

  // AI atakuje jednostki gracza lub bezpośrednio
  setTimeout(() => {
    // FIX: Konwertuj forEach na zwykłą pętlę, aby móc bezpiecznie przerwać
    for (let i = 0; i < state.enemyBoard.length; i++) {
      if (state.gameOver) break; // Przerwij pętlę jeśli gra się skończyła
      
      const eUnit = state.enemyBoard[i];
      
      if (state.playerBoard.length > 0) {
        const target = state.playerBoard[0];
        target.currentHP -= eUnit.atk;
        eUnit.currentHP -= target.atk;
        log(`🤖 ${eUnit.name} atakuje ${target.name}!`);
        
        if (target.currentHP <= 0) { 
          state.playerBoard.splice(0, 1); 
          log(`💀 ${target.name} poległ!`); 
        }
        if (eUnit.currentHP <= 0) { 
          state.enemyBoard.splice(i, 1); 
          i--; // Zmniejsz indeks, bo usunęliśmy element
          log(`💀 ${eUnit.name} zniszczony!`); 
        }
      } else {
        state.playerHP -= eUnit.atk;
        log(`🤖 ${eUnit.name} atakuje Cię za ${eUnit.atk}! Twoje HP: ${Math.max(0,state.playerHP)}`);
      }
    }

    checkWin();
    if (!state.gameOver) newPlayerTurn();
  }, 800);
}

// --- Nowa tura gracza ---
function newPlayerTurn() {
  state.turn++;
  state.maxEnergy = Math.min(10, state.maxEnergy + 1);
  state.energy = state.maxEnergy;
  state.playerBoard.forEach(u => u.exhausted = false);
  drawCards(1);
  log(`🔵 Tura ${state.turn} — masz ${state.energy} energii. Dobrałeś kartę!`);
  arenaEl.textContent = `Tura ${state.turn} — zagraj kartę lub zakończ turę!`;
  renderAll();
}

// --- Koniec gry ---
function checkWin() {
  if (state.enemyHP <= 0) {
    state.gameOver = true;
    arenaEl.innerHTML = "🏆 ZWYCIĘSTWO! Rift opanowany!";
    renderAll();
  } else if (state.playerHP <= 0) {
    state.gameOver = true;
    arenaEl.innerHTML = "💀 PORAŻKA — Shadowflare przejął kontrolę.";
    renderAll();
  }
}

// --- Log ---
function log(msg) {
  logEl.textContent = msg;
  console.log(msg);
}

// --- Start ---
init();
