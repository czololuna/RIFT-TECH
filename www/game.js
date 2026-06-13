const cardsBase = [
 ["Valkyria Guard","Valkyria",2,4,8,3,"defender","valkyria_guard"],
 ["Energy Blade","Vanguard",3,6,9,4,"strike","energy_blade"],
 ["Rift Mage","Maglander",3,7,6,2,"spell","rift_mage"],
 ["Shadow Scout","Shadowflare",1,3,5,1,"fast","shadow_scout"],
 ["Core Tank","Vanguard",4,5,14,6,"defender","core_tank"],
 ["Rift Breaker","Maglander",5,9,10,3,"spell","rift_breaker"],
 ["Shadow Blade","Shadowflare",2,5,6,2,"strike","shadow_blade"],
 ["Vanguard Elite","Vanguard",4,7,12,5,"strike","vanguard_elite"]
].map(c=>({name:c[0],faction:c[1],cost:c[2],atk:c[3],hp:c[4],maxHp:c[4],sh:c[5],maxSh:c[5],tag:c[6],image:c[7]}));

let deck=[], enemyDeck=[], hand=[], enemyHand=[], units=[], enemyUnits=[];
let energy=3, enemyEnergy=3, turn=1, playerHp=30, enemyHp=30;
let selectedCard=null, selectedUnit=null, selectedEnemy=null;
let logs=["RIFT-TECH start."];

function img(n){return `assets/cards/${n}.png`}
function log(t){logs.unshift(t); logs=logs.slice(0,8)}

function newDeck(){let d=[]; for(let i=0;i<4;i++) cardsBase.forEach(c=>d.push({...c})); return d.sort(()=>Math.random()-0.5)}
function draw(){
  if(deck.length && hand.length<5) hand.push(deck.pop());
  if(enemyDeck.length && enemyHand.length<5) enemyHand.push(enemyDeck.pop());
}
function start(){
  deck=newDeck(); enemyDeck=newDeck();
  for(let i=0;i<4;i++) draw();
  render();
}
function damage(u,amt){
  const b=Math.min(u.sh,amt); u.sh-=b; amt-=b; u.hp=Math.max(0,u.hp-amt);
}
function playSelected(){
  if(selectedCard===null)return;
  const c=hand[selectedCard];
  if(c.cost>energy){log("Za mało energii");render();return}
  if(units.length>=4){log("Pole pełne");render();return}
  energy-=c.cost; units.push({...c,used:c.tag!=="fast"});
  hand.splice(selectedCard,1); selectedCard=null;
  log("Wystawiono "+c.name);
  render();
}
function attackSelected(){
  if(selectedUnit===null)return;
  const a=units[selectedUnit];
  if(a.used){log("Jednostka już użyta");render();return}
  if(selectedEnemy!==null){
    const t=enemyUnits[selectedEnemy]; damage(t,a.atk); log(`${a.name} -> ${t.name}`);
    enemyUnits=enemyUnits.filter(x=>x.hp>0);
  }else{
    enemyHp=Math.max(0,enemyHp-a.atk); log(`${a.name} atakuje AI`);
  }
  a.used=true; selectedUnit=null; selectedEnemy=null; render();
}
function endTurn(){
  aiTurn(); turn++;
  energy=Math.min(10,3+Math.floor(turn/2)); enemyEnergy=energy;
  units.forEach(u=>{u.used=false;u.sh=Math.min(u.maxSh,u.sh+1)});
  enemyUnits.forEach(u=>{u.used=false;u.sh=Math.min(u.maxSh,u.sh+1)});
  draw(); log("Tura "+turn); render();
}
function aiTurn(){
  enemyHand=[...enemyHand].sort(()=>Math.random()-0.5);
  for(const c of [...enemyHand]){
    if(enemyUnits.length<4 && c.cost<=enemyEnergy){
      enemyEnergy-=c.cost; enemyUnits.push({...c,used:false});
      enemyHand.splice(enemyHand.indexOf(c),1); log("AI wystawia "+c.name);
    }
  }
  enemyUnits.forEach(u=>{
    if(units.length){let t=units[0]; damage(t,u.atk); log("AI atakuje "+t.name); units=units.filter(x=>x.hp>0)}
    else{playerHp=Math.max(0,playerHp-u.atk); log("AI bije bohatera")}
  });
}
function cardEl(c,i,type){
  const e=document.createElement("div");
  e.className=type;
  e.style.backgroundImage=`url(${img(c.image)})`;
  e.onclick=()=>{ if(type==="card") selectedCard=i; if(type==="unit"&&c.friendly) selectedUnit=i; if(type==="unit"&&!c.friendly) selectedEnemy=i; render(); };
  e.innerHTML=`<span>${c.name}<br>ATK ${c.atk} HP ${c.hp} SH ${c.sh}</span>`;
  if((type==="card"&&selectedCard===i)||(c.friendly&&selectedUnit===i)||(!c.friendly&&selectedEnemy===i)) e.classList.add("selected");
  return e;
}
function render(){
  const board=document.getElementById("board"); board.innerHTML="";
  let er=document.createElement("div"); er.className="row";
  enemyUnits.forEach((u,i)=>er.appendChild(cardEl({...u,friendly:false},i,"unit")));
  let pr=document.createElement("div"); pr.className="row";
  units.forEach((u,i)=>pr.appendChild(cardEl({...u,friendly:true},i,"unit")));
  board.append(er,pr);

  const h=document.getElementById("hand"); h.innerHTML="";
  hand.forEach((c,i)=>h.appendChild(cardEl(c,i,"card")));

  document.getElementById("stats").innerHTML=`Tura ${turn}<br>HP: ${playerHp}/30<br>AI: ${enemyHp}/30<br>Energia: ${energy}/10`;
  document.getElementById("log").innerHTML=logs.map(x=>"• "+x).join("<br>");
}
start();
