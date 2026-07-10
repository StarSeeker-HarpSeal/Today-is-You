// ============ 순수 로직 함수 모음 ============

// 배열 셔플 (Fisher-Yates)
function shuffleArray(arr){
  const a = arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    [a[i],a[j]] = [a[j],a[i]];
  }
  return a;
}

// 배열에서 랜덤 n개 뽑기 (중복없이)
function pickRandomN(arr, n){
  return shuffleArray(arr).slice(0, n);
}

/**
 * 혼자내기 로직
 * participants: string[] (이름 목록, 2명 이상)
 * 반환:
 *  - mode: 'small' (3명 이하, 전원 등장) | 'big' (4명 이상, 3명만 추첨)
 *  - shown: string[] 화면에 보여줄 이름들
 *  - winnerIndex: shown 배열 기준 당첨자 인덱스
 */
function decideSolo(participants){
  if(participants.length <= 3){
    const winnerIndex = Math.floor(Math.random()*participants.length);
    return { mode:'small', shown: participants.slice(), winnerIndex };
  } else {
    const chosen = pickRandomN(participants, 3);
    const winnerIndex = Math.floor(Math.random()*3);
    return { mode:'big', shown: chosen, winnerIndex };
  }
}

/**
 * 나눠내기 로직
 * participants: string[] (2명 이상)
 * total: 총 금액 (원)
 * 반환: [{name, amount, rank, percent}] rank 1부터, 순서대로 정렬됨
 *
 * 비율표:
 *  2명: 70 / 30
 *  3명: 60 / 30 / 10
 *  4명: 50 / 40 / 10 / 10
 *  5명 이상: 40 / 30 / 20 / (나머지 10%를 남은 인원수로 균등분배)
 */
function decideSplit(participants, total){
  const n = participants.length;
  const order = shuffleArray(participants); // 순서 = 등수

  let percents;
  if(n === 2){
    percents = [0.7, 0.3];
  } else if(n === 3){
    percents = [0.6, 0.3, 0.1];
  } else if(n === 4){
    percents = [0.5, 0.4, 0.1, 0.1];
  } else {
    const restShare = 0.1 / (n - 3);
    percents = [0.4, 0.3, 0.2];
    for(let i=0;i<n-3;i++) percents.push(restShare);
  }

  // 100원 단위 반올림
  let amounts = percents.map(p => Math.round((total * p) / 100) * 100);

  // 반올림 오차는 마지막 순위(꼴찌)가 흡수
  const sum = amounts.reduce((a,b)=>a+b, 0);
  const diff = total - sum;
  amounts[amounts.length - 1] += diff;

  return order.map((name, i) => ({
    name,
    amount: amounts[i],
    rank: i + 1,
    percent: percents[i]
  }));
}
