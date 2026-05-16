export interface StyleLabel {
  key: string
  name: string
  desc: string
  icon: string
}

export function getStyleLabel(agg: number, sur: number, pos: number, team: number): StyleLabel {
  if (agg > 70 && team > 70) return { key: 'team-ace', name: '팀 에이스', desc: '공격과 팀워크를 모두 갖춘 핵심 플레이어입니다', icon: '⚔️' }
  if (agg > 70 && sur < 35) return { key: 'rusher', name: '러셔', desc: '교전을 즐기며 공격적으로 킬을 추구합니다', icon: '🔥' }
  if (sur > 70 && pos > 70 && agg < 35) return { key: 'circle-master', name: '서클 마스터', desc: '존을 읽고 포지셔닝으로 순위를 끌어올립니다', icon: '🎯' }
  if (sur > 70 && pos > 70) return { key: 'zone-hugger', name: '존버형', desc: '안전 지역을 확보하며 끝까지 살아남습니다', icon: '🛡️' }
  if (pos > 70 && agg > 55) return { key: 'tactical', name: '전술형', desc: '유리한 포지션에서 교전을 주도합니다', icon: '🗺️' }
  if (team > 70 && sur > 55) return { key: 'support', name: '서포터', desc: '팀원을 살리고 보조하는 든든한 지원자입니다', icon: '💊' }
  if (agg > 55 && sur > 55) return { key: 'balanced-fighter', name: '균형 전사', desc: '공격과 생존을 균형있게 유지합니다', icon: '⚖️' }
  if (agg > 55) return { key: 'aggressive', name: '공격형', desc: '적극적으로 킬을 노리는 스타일입니다', icon: '💥' }
  if (sur > 55) return { key: 'survivor', name: '생존형', desc: '안전 플레이로 끝까지 버티는 스타일입니다', icon: '🏃' }
  if (pos > 55) return { key: 'positioning', name: '포지셔닝형', desc: '이동과 위치 선점을 중시하는 스타일입니다', icon: '📍' }
  if (team > 55) return { key: 'team-player', name: '팀플형', desc: '팀원과 협력하는 것을 선호합니다', icon: '🤝' }
  return { key: 'allrounder', name: '올라운더', desc: '특정 성향에 치우치지 않는 균형잡힌 플레이어입니다', icon: '🎮' }
}
