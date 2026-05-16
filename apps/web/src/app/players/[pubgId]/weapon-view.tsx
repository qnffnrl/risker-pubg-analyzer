'use client'

import type { WeaponSummaryData } from '@/lib/api'

interface Props {
  weaponData: Record<string, WeaponSummaryData> | null
  fetchedAt: string | null
}

// 인게임 표시 이름 (내부 ID → 실제 게임 내 이름)
const WEAPON_NAMES: Record<string, string> = {
  // AR
  Item_Weapon_HK416_C: 'M416',
  'Item_Weapon_SCAR-L_C': 'SCAR-L',
  Item_Weapon_AKM_C: 'AKM',
  Item_Weapon_M762_C: 'Beryl M762',
  Item_Weapon_QBZ95_C: 'QBZ95',
  Item_Weapon_G36C_C: 'G36C',
  Item_Weapon_Mk47Mutant_C: 'Mk47 Mutant',
  Item_Weapon_AUG_C: 'AUG A3',
  Item_Weapon_Beryl_C: 'Beryl M762',
  Item_Weapon_K2_C: 'K2',
  Item_Weapon_FNFal_C: 'SLR',
  // SR
  Item_Weapon_AWM_C: 'AWM',
  Item_Weapon_M24_C: 'M24',
  Item_Weapon_Kar98k_C: 'Kar98k',
  Item_Weapon_Mosin_C: 'Mosin-Nagant',
  Item_Weapon_Win94_C: 'Winchester Model 94',
  Item_Weapon_BipodGun_C: 'Lynx AMR',
  // DMR
  Item_Weapon_Mini14_C: 'Mini 14',
  Item_Weapon_SKS_C: 'SKS',
  Item_Weapon_SLR_C: 'SLR',
  Item_Weapon_MK12_C: 'Mk12',
  Item_Weapon_QBU88_C: 'QBU',
  Item_Weapon_VSS_C: 'VSS Vintorez',
  Item_Weapon_Mk14_C: 'Mk14 EBR',
  Item_Weapon_dragunov_C: 'Dragunov',
  // SMG
  Item_Weapon_UMP_C: 'UMP45',
  Item_Weapon_Vector_C: 'Vector',
  Item_Weapon_PP19_C: 'Bizon',
  Item_Weapon_MP5K_C: 'MP5K',
  Item_Weapon_Thompson_C: 'Tommy Gun',
  Item_Weapon_MP9_C: 'MP9',
  Item_Weapon_P90_C: 'P90',
  Item_Weapon_vz61Skorpion_C: 'Skorpion',
  // Shotgun
  Item_Weapon_S12K_C: 'S12K',
  Item_Weapon_S1897_C: 'S1897',
  Item_Weapon_DBS_C: 'DBS',
  Item_Weapon_O12_C: 'O12',
  Item_Weapon_S686_C: 'S686',
  Item_Weapon_Saiga12_C: 'Saiga-12',
  // LMG
  Item_Weapon_DP28_C: 'DP-28',
  Item_Weapon_M249_C: 'M249',
  Item_Weapon_MG3_C: 'MG3',
  // Pistol
  Item_Weapon_M1911_C: 'P1911',
  Item_Weapon_Glock18_C: 'P18C',
  Item_Weapon_DesertEagle_C: 'Deagle',
  Item_Weapon_Rhino_C: 'R45',
  Item_Weapon_NagantM1895_C: 'R1895',
  Item_Weapon_Sawnoff_C: 'Sawed-Off',
  Item_Weapon_Winchester_C: 'Winchester',
  // Special
  Item_Weapon_crossbow_C: 'Crossbow',
  Item_Weapon_FlareGun_C: 'Flare Gun',
}

// 무기 카테고리 매핑
const WEAPON_CATEGORIES: Record<string, string> = {
  // AR
  Item_Weapon_HK416_C: 'AR',
  'Item_Weapon_SCAR-L_C': 'AR',
  Item_Weapon_AKM_C: 'AR',
  Item_Weapon_M762_C: 'AR',
  Item_Weapon_QBZ95_C: 'AR',
  Item_Weapon_G36C_C: 'AR',
  Item_Weapon_Mk47Mutant_C: 'AR',
  Item_Weapon_AUG_C: 'AR',
  Item_Weapon_Beryl_C: 'AR',
  Item_Weapon_K2_C: 'AR',
  // SR
  Item_Weapon_AWM_C: 'SR',
  Item_Weapon_M24_C: 'SR',
  Item_Weapon_Kar98k_C: 'SR',
  Item_Weapon_Mosin_C: 'SR',
  Item_Weapon_Win94_C: 'SR',
  Item_Weapon_BipodGun_C: 'SR',
  // DMR
  Item_Weapon_Mini14_C: 'DMR',
  Item_Weapon_SKS_C: 'DMR',
  Item_Weapon_SLR_C: 'DMR',
  Item_Weapon_MK12_C: 'DMR',
  Item_Weapon_QBU88_C: 'DMR',
  Item_Weapon_VSS_C: 'DMR',
  Item_Weapon_Mk14_C: 'DMR',
  Item_Weapon_dragunov_C: 'DMR',
  Item_Weapon_FNFal_C: 'DMR',
  // SMG
  Item_Weapon_UMP_C: 'SMG',
  Item_Weapon_Vector_C: 'SMG',
  Item_Weapon_PP19_C: 'SMG',
  Item_Weapon_MP5K_C: 'SMG',
  Item_Weapon_Thompson_C: 'SMG',
  Item_Weapon_MP9_C: 'SMG',
  Item_Weapon_P90_C: 'SMG',
  Item_Weapon_vz61Skorpion_C: 'SMG',
  // Shotgun
  Item_Weapon_S12K_C: 'SG',
  Item_Weapon_S1897_C: 'SG',
  Item_Weapon_DBS_C: 'SG',
  Item_Weapon_O12_C: 'SG',
  Item_Weapon_S686_C: 'SG',
  Item_Weapon_Saiga12_C: 'SG',
  // LMG
  Item_Weapon_DP28_C: 'LMG',
  Item_Weapon_M249_C: 'LMG',
  Item_Weapon_MG3_C: 'LMG',
  // 권총
  Item_Weapon_M1911_C: '권총',
  Item_Weapon_Glock18_C: '권총',
  Item_Weapon_DesertEagle_C: '권총',
  Item_Weapon_Rhino_C: '권총',
  Item_Weapon_NagantM1895_C: '권총',
  Item_Weapon_Sawnoff_C: '권총',
  Item_Weapon_Winchester_C: '권총',
  Item_Weapon_vz61Skorpion_C: 'SMG',
}

const CATEGORY_COLORS: Record<string, string> = {
  AR: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  SR: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  DMR: 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  SMG: 'bg-green-500/20 text-green-400 border-green-500/30',
  SG: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  LMG: 'bg-red-500/20 text-red-400 border-red-500/30',
  권총: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  기타: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
}

function getWeaponDisplayName(itemId: string): string {
  if (WEAPON_NAMES[itemId]) return WEAPON_NAMES[itemId]!
  // fallback: 내부 ID 파싱
  return itemId.replace('Item_Weapon_', '').replace('_C', '').replace(/_/g, ' ')
}

function getCategory(itemId: string): string {
  return WEAPON_CATEGORIES[itemId] ?? '기타'
}

function getComboLabel(top2: Array<{ id: string; category: string }>): string {
  if (top2.length < 2) return top2.length === 1 ? `${getWeaponDisplayName(top2[0]!.id)} 단독 플레이` : '데이터 없음'
  const cats = [top2[0]!.category, top2[1]!.category].sort().join('+')
  const labels: Record<string, string> = {
    'AR+SR': '저격 콤보',
    'AR+SMG': '범용 콤보',
    'DMR+SR': '원거리 특화',
    'AR+DMR': '중거리 콤보',
    'AR+SG': '근접 돌격 콤보',
    'SR+SR': '저격 전문',
    'DMR+DMR': '반자동 특화',
    'SMG+SG': '실내전 특화',
    'LMG+AR': '제압 콤보',
  }
  return labels[cats] ?? `${top2[0]!.category} + ${top2[1]!.category} 콤보`
}

export function WeaponView({ weaponData, fetchedAt }: Props) {
  if (!weaponData) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/50 text-zinc-400">
        <span className="animate-spin text-2xl">⏳</span>
        <span className="text-sm">무기 데이터 수집 중...</span>
      </div>
    )
  }

  // 킬이 1 이상인 무기만 필터링, 킬 순 내림차순 Top 10
  const weaponEntries = Object.entries(weaponData)
    .filter(([, s]) => (s.StatsTotal.Kills ?? 0) > 0)
    .sort((a, b) => b[1].StatsTotal.Kills - a[1].StatsTotal.Kills)
    .slice(0, 10)

  const maxKills = weaponEntries[0]?.[1].StatsTotal.Kills ?? 1

  // 카테고리 분포
  const categoryKills: Record<string, number> = {}
  for (const [id, s] of Object.entries(weaponData)) {
    const cat = getCategory(id)
    categoryKills[cat] = (categoryKills[cat] ?? 0) + (s.StatsTotal.Kills ?? 0)
  }
  const totalKills = Object.values(categoryKills).reduce((a, b) => a + b, 0)
  const categoryEntries = Object.entries(categoryKills)
    .filter(([, k]) => k > 0)
    .sort((a, b) => b[1] - a[1])

  // Top 2 무기 콤보
  const top2 = weaponEntries.slice(0, 2).map(([id]) => ({ id, category: getCategory(id) }))
  const comboLabel = getComboLabel(top2)

  // 최장 킬 거리
  const longestKill = Math.max(...Object.values(weaponData).map((s) => s.StatsTotal.LongestKill ?? 0))
  const longestKillWeapon = Object.entries(weaponData).find(
    ([, s]) => s.StatsTotal.LongestKill === longestKill,
  )

  return (
    <div className="space-y-6">
      {/* 콤보 레이블 + 최장 킬 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="mb-1 text-xs text-zinc-500">주력 콤보</p>
          <p className="text-lg font-bold text-white">{comboLabel}</p>
          {top2.length >= 2 && (
            <p className="mt-1 text-xs text-zinc-400">
              {getWeaponDisplayName(top2[0]!.id)} + {getWeaponDisplayName(top2[1]!.id)}
            </p>
          )}
        </div>
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
          <p className="mb-1 text-xs text-zinc-500">최장 킬 거리</p>
          <p className="text-lg font-bold text-white">{longestKill.toFixed(0)}m</p>
          {longestKillWeapon && (
            <p className="mt-1 text-xs text-zinc-400">{getWeaponDisplayName(longestKillWeapon[0])}</p>
          )}
        </div>
      </div>

      {/* Top 10 무기 바 차트 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">Top 10 무기 (킬 기준)</h3>
        {weaponEntries.length === 0 ? (
          <p className="text-sm text-zinc-500">킬 데이터가 없습니다</p>
        ) : (
          <div className="space-y-3">
            {weaponEntries.map(([id, s]) => {
              const kills = s.StatsTotal.Kills
              const hs = kills > 0 ? ((s.StatsTotal.HeadShots / kills) * 100).toFixed(1) : '0.0'
              const cat = getCategory(id)
              const barWidth = Math.round((kills / maxKills) * 100)
              return (
                <div key={id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{getWeaponDisplayName(id)}</span>
                      <span
                        className={`rounded border px-1.5 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['기타']}`}
                      >
                        {cat}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-zinc-400">
                      <span>{kills}킬</span>
                      <span>헤드샷 {hs}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 카테고리 분포 */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-5">
        <h3 className="mb-4 text-sm font-semibold text-zinc-300">무기 카테고리 분포</h3>
        {categoryEntries.length === 0 ? (
          <p className="text-sm text-zinc-500">데이터 없음</p>
        ) : (
          <div className="space-y-2">
            {categoryEntries.map(([cat, kills]) => {
              const pct = totalKills > 0 ? ((kills / totalKills) * 100).toFixed(1) : '0.0'
              const barWidth = totalKills > 0 ? Math.round((kills / totalKills) * 100) : 0
              return (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className={`font-medium ${(CATEGORY_COLORS[cat] ?? CATEGORY_COLORS['기타'] ?? '').split(' ')[1] ?? ''}`}>
                      {cat}
                    </span>
                    <span className="text-zinc-400">
                      {kills}킬 ({pct}%)
                    </span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-zinc-800">
                    <div
                      className="h-full rounded-full bg-primary/70 transition-all"
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <p className="text-right text-xs text-zinc-600">
        역대 누적 기준 (PUBG 무기 마스터리){fetchedAt && ` · ${new Date(fetchedAt).toLocaleDateString('ko-KR')} 기준`}
      </p>
    </div>
  )
}
