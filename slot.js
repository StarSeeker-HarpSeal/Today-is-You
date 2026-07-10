// ============ 슬롯 릴 애니메이션 (텍스트 스왑 방식) ============
// 복잡한 위치계산(translateY) 대신 텍스트를 빠르게 바꿔치기하다가
// 점점 느려지며 최종값에 멈추는 단순한 방식. 레이아웃 타이밍 이슈에서 자유로움.

/**
 * 하나의 릴을 스핀시켜 finalLabel에 정지시킨다.
 * reelEl: .reel 요소 (내부를 비우고 새로 그림)
 * pool: 스핀 중 보여줄 필러(가짜) 값 배열
 * finalLabel: 최종 정지 값 (텍스트)
 * finalClass: 최종 셀에 추가할 클래스 (선택, 예: 'symbol-O')
 * duration: 밀리초. 지정 안하면 랜덤(1400~1900)
 */
function spinReel(reelEl, pool, finalLabel, finalClass, duration){
  return new Promise(resolve=>{
    reelEl.innerHTML = '';
    reelEl.classList.remove('stopped');

    const display = document.createElement('div');
    display.className = 'reel-cell spin-display';
    reelEl.appendChild(display);
    display.textContent = pool[0];

    reelEl.classList.add('spinning');

    const dur = duration || (1400 + Math.random()*500);
    const startTime = Date.now();

    function tick(){
      const elapsed = Date.now() - startTime;

      if(elapsed >= dur){
        display.textContent = finalLabel;
        display.classList.remove('symbol-O','symbol-X');
        if(finalClass) display.classList.add(finalClass);
        reelEl.classList.remove('spinning');
        reelEl.classList.add('stopped');
        resolve();
        return;
      }

      display.textContent = pool[Math.floor(Math.random()*pool.length)];

      // 진행률에 따라 점점 느려지는 딜레이 (40ms -> 190ms)
      const progress = elapsed / dur;
      const nextDelay = 40 + progress * 150;
      setTimeout(tick, nextDelay);
    }

    setTimeout(tick, 40);
  });
}

/**
 * 여러 릴을 동일한 duration으로 동시에 스핀 (동시 정지 연출용)
 * specs: [{el, pool, finalLabel, finalClass}, ...]
 */
function spinReelsTogether(specs, duration){
  const dur = duration || (1500 + Math.random()*300);
  return Promise.all(specs.map(s => spinReel(s.el, s.pool, s.finalLabel, s.finalClass, dur)));
}
