// ============ 상태 ============
let currentMode = 'solo'; // 'solo' | 'split'
let lastSplitResult = null; // 나눠내기 최종 결과 캐시 (결과화면에서 재사용)

// ============ DOM 참조 ============
const nameListEl = document.getElementById('name-list');
const addNameBtn = document.getElementById('add-name-btn');
const amountWrap = document.getElementById('amount-wrap');
const totalAmountInput = document.getElementById('total-amount');
const startBtn = document.getElementById('start-btn');
const setupWarning = document.getElementById('setup-warning');

const screenSetup = document.getElementById('screen-setup');
const screenSlot = document.getElementById('screen-slot');
const screenResult = document.getElementById('screen-result');
const slotTitle = document.getElementById('slot-title');
const slotSubtitle = document.getElementById('slot-subtitle');
const reelTrack = document.getElementById('reel-track');

function setSlotTitle(kr, en){
  slotTitle.textContent = kr;
  slotSubtitle.textContent = en;
}
const nextBtn = document.getElementById('next-btn');
const retryBtn = document.getElementById('retry-btn');
const restartBtn = document.getElementById('restart-btn');
const resultTable = document.getElementById('result-table');

// ============ 화면 전환 ============
function showScreen(el){
  [screenSetup, screenSlot, screenResult].forEach(s => s.classList.remove('active'));
  el.classList.add('active');
}

// ============ 참가자 입력 UI ============
function addNameRow(value=''){
  const li = document.createElement('li');
  li.className = 'name-row';
  li.innerHTML = `
    <input type="text" maxlength="8" placeholder="이름 입력 · Name" value="${value}">
    <button class="remove-name" aria-label="삭제">✕</button>
  `;
  li.querySelector('.remove-name').addEventListener('click', ()=>{
    if(nameListEl.children.length <= 2){
      showWarning('참가자는 최소 2명 필요해예.', 'Minimum 2 participants required.');
      return;
    }
    li.remove();
  });
  nameListEl.appendChild(li);
}

function getParticipantNames(){
  return Array.from(nameListEl.querySelectorAll('input'))
    .map(i => i.value.trim())
    .filter(v => v.length > 0);
}

function showWarning(msg, en){
  setupWarning.innerHTML = en
    ? `${msg}<span class="en-warning">${en}</span>`
    : msg;
  setupWarning.classList.remove('hidden');
}
function clearWarning(){
  setupWarning.classList.add('hidden');
}

addNameBtn.addEventListener('click', ()=>{
  if(nameListEl.children.length >= 12){
    showWarning('한 판에 최대 12명까지만 가능해예.', 'Maximum 12 participants per round.');
    return;
  }
  addNameRow();
});

// 초기 입력창 2개
addNameRow();
addNameRow();

// ============ 모드 탭 ============
document.querySelectorAll('.mode-tab').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    document.querySelectorAll('.mode-tab').forEach(b=>b.classList.remove('active'));
    btn.classList.add('active');
    currentMode = btn.dataset.mode;
    amountWrap.classList.toggle('hidden', currentMode !== 'split');
    clearWarning();
  });
});

// ============ 유틸 ============
function fmtWon(n){
  return n.toLocaleString('ko-KR') + '원';
}
function fmtPercent(p){
  const v = Math.round(p*1000)/10; // 소수1자리
  return (Number.isInteger(v) ? v : v.toFixed(1)) + '%';
}

// ============ 시작 버튼 ============
startBtn.addEventListener('click', ()=>{
  clearWarning();
  const names = getParticipantNames();
  const uniqueNames = new Set(names);

  if(names.length < 2){
    showWarning('참가자는 최소 2명 이상 입력해주세예.', 'Enter at least 2 participants.');
    return;
  }
  if(uniqueNames.size !== names.length){
    showWarning('이름이 겹치면 안 돼예. 다르게 입력해주세예.', 'Names must be unique.');
    return;
  }
  if(currentMode === 'split'){
    const total = Number(totalAmountInput.value);
    if(!total || total <= 0){
      showWarning('총금액을 입력해주세예.', 'Enter the total amount.');
      return;
    }
  }

  showScreen(screenSlot);
  nextBtn.classList.add('hidden');
  retryBtn.classList.add('hidden');

  if(currentMode === 'solo'){
    setSlotTitle('두구두구두구...', 'Drumroll...');
    runSoloSlot(names);
  } else {
    setSlotTitle('순서를 정하는 중...', 'Deciding the order...');
    const total = Number(totalAmountInput.value);
    runSplitSlot(names, total);
  }
});

// ============ 혼자내기 슬롯 ============
function runSoloSlot(names){
  reelTrack.innerHTML = '';
  const decision = decideSolo(names);

  if(decision.mode === 'small'){
    // 이름은 고정 표시, O/X만 스핀
    const specs = [];
    decision.shown.forEach((name, idx)=>{
      const row = document.createElement('div');
      row.className = 'reel-row';
      row.innerHTML = `
        <div class="solo-name-label">${name}</div>
        <div class="reel result-reel"></div>
      `;
      reelTrack.appendChild(row);
      const reelEl = row.querySelector('.reel');
      const isWinner = idx === decision.winnerIndex;
      specs.push({
        el: reelEl,
        pool: ['O','X'],
        finalLabel: isWinner ? 'O' : 'X',
        finalClass: isWinner ? 'symbol-O' : 'symbol-X'
      });
    });

    spinReelsTogether(specs).then(()=>{
      setSlotTitle('오늘의 결과는!', 'Here is your result!');
      finishSlotRound();
    });

  } else {
    // 4명 초과: 3명 추첨 + O/X 동시 공개
    const specs = [];
    decision.shown.forEach((name, idx)=>{
      const row = document.createElement('div');
      row.className = 'reel-row';
      row.innerHTML = `
        <div class="reel name-reel"></div>
        <div class="reel result-reel"></div>
      `;
      reelTrack.appendChild(row);
      const [nameReel, resultReel] = row.querySelectorAll('.reel');
      const isWinner = idx === decision.winnerIndex;

      specs.push({
        el: nameReel,
        pool: names,
        finalLabel: name
      });
      specs.push({
        el: resultReel,
        pool: ['O','X'],
        finalLabel: isWinner ? 'O' : 'X',
        finalClass: isWinner ? 'symbol-O' : 'symbol-X'
      });
    });

    spinReelsTogether(specs).then(()=>{
      setSlotTitle('오늘의 결과는!', 'Here is your result!');
      finishSlotRound();
    });
  }
}

function finishSlotRound(){
  nextBtn.classList.add('hidden');
  retryBtn.classList.remove('hidden');
}

// ============ 나눠내기 슬롯 ============
function runSplitSlot(names, total){
  reelTrack.innerHTML = '';
  const result = decideSplit(names, total); // [{name, amount, rank, percent}]
  lastSplitResult = { result, total };

  const nameReels = [];
  const amountReels = [];

  result.forEach((r)=>{
    const row = document.createElement('div');
    row.className = 'reel-row';
    row.innerHTML = `
      <div class="rank-badge">${fmtPercent(r.percent)}</div>
      <div class="reel name-reel"></div>
      <div class="reel result-reel amount-reel"></div>
    `;
    reelTrack.appendChild(row);
    const [nameReel, amtReel] = row.querySelectorAll('.reel');
    nameReels.push({ el: nameReel, pool: names, finalLabel: r.name });
    amountReels.push({ el: amtReel, pool: ['?','?','?'], finalLabel: fmtWon(r.amount) });
  });

  // 1단계: 이름 먼저 스톱
  spinReelsTogether(nameReels).then(()=>{
    setSlotTitle('이제 금액을 확인할게예...', 'Now checking the amounts...');
    return new Promise(res => setTimeout(res, 500));
  }).then(()=>{
    // 2단계: 금액 스톱
    return spinReelsTogether(amountReels);
  }).then(()=>{
    setSlotTitle('정산 완료!', 'Settlement complete!');
    nextBtn.classList.remove('hidden');
    retryBtn.classList.remove('hidden');
  });
}

// ============ 나눠내기 -> 최종 결과 화면 ============
nextBtn.addEventListener('click', ()=>{
  if(!lastSplitResult) return;
  renderResultScreen(lastSplitResult.result, lastSplitResult.total);
  showScreen(screenResult);
});

function renderResultScreen(result, total){
  resultTable.innerHTML = '';
  result.forEach(r=>{
    const line = document.createElement('div');
    line.className = 'result-line';
    line.innerHTML = `
      <span class="rank">${r.rank}위</span>
      <span class="rname">${r.name}</span>
      <span class="ramt">${fmtWon(r.amount)}</span>
    `;
    resultTable.appendChild(line);
  });
  const totalLine = document.createElement('div');
  totalLine.className = 'result-total';
  totalLine.innerHTML = `<span>총액</span><span>${fmtWon(total)}</span>`;
  resultTable.appendChild(totalLine);
}

// ============ 다시 하기 ============
retryBtn.addEventListener('click', backToSetup);
restartBtn.addEventListener('click', backToSetup);

function backToSetup(){
  showScreen(screenSetup);
}
