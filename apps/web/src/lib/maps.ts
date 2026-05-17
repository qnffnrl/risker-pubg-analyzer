export const MAP_SIZES: Record<string, number> = {
  Erangel_Main: 813000,
  Desert_Main: 813000,
  Savage_Main: 408000,
  DihorOtok_Main: 610000,
  Summerland_Main: 204000,
  Chimera_Main: 306000,
  Tiger_Main: 813000,
  Heaven_Main: 813000,
  Kiki_Main: 813000,
  Baltic_Main: 813000,
}

export function normalizeCoord(loc: { x: number; y: number }, mapName: string): [number, number] {
  const size = MAP_SIZES[mapName] ?? 813000
  return [
    Math.round((loc.x / size) * 10000) / 10000,
    Math.round((loc.y / size) * 10000) / 10000,
  ]
}

// Major landmark positions (normalized 0~1) for "자주 죽는 지역" labeling
export const MAP_LANDMARKS: Record<string, Array<{ name: string; x: number; y: number }>> = {
  Erangel_Main: [
    { name: 'Pochinki', x: 0.46, y: 0.55 },
    { name: 'School', x: 0.56, y: 0.40 },
    { name: 'Georgopol', x: 0.25, y: 0.28 },
    { name: 'Rozhok', x: 0.57, y: 0.53 },
    { name: 'Mylta Power', x: 0.74, y: 0.68 },
    { name: 'Yasnaya Polyana', x: 0.66, y: 0.32 },
    { name: 'Stalber', x: 0.73, y: 0.18 },
    { name: 'Primorsk', x: 0.24, y: 0.72 },
    { name: 'Novorepnoye', x: 0.73, y: 0.80 },
    { name: 'Hospital', x: 0.42, y: 0.30 },
  ],
  Desert_Main: [
    { name: 'Pecado', x: 0.50, y: 0.59 },
    { name: 'San Martin', x: 0.47, y: 0.49 },
    { name: 'Los Leones', x: 0.56, y: 0.72 },
    { name: 'Hacienda del Patron', x: 0.38, y: 0.40 },
    { name: 'El Pozo', x: 0.28, y: 0.58 },
  ],
  Savage_Main: [
    { name: 'Bootcamp', x: 0.52, y: 0.38 },
    { name: 'Ruins', x: 0.44, y: 0.54 },
    { name: 'Paradise Resort', x: 0.58, y: 0.25 },
    { name: 'Quarry', x: 0.30, y: 0.58 },
  ],
}

export function findNearestLandmark(
  x: number,
  y: number,
  mapName: string,
): string {
  const landmarks = MAP_LANDMARKS[mapName]
  if (!landmarks || landmarks.length === 0) return '알 수 없는 지역'
  let nearest = landmarks[0]!
  let minDist = (x - nearest.x) ** 2 + (y - nearest.y) ** 2
  for (const lm of landmarks.slice(1)) {
    const d = (x - lm.x) ** 2 + (y - lm.y) ** 2
    if (d < minDist) { minDist = d; nearest = lm }
  }
  return nearest.name
}

export function getTopDeathZones(
  deaths: Array<[number, number]>,
  mapName: string,
  topN = 3,
): Array<{ name: string; count: number }> {
  if (deaths.length === 0) return []
  const counts: Record<string, number> = {}
  for (const [x, y] of deaths) {
    const name = findNearestLandmark(x, y, mapName)
    counts[name] = (counts[name] ?? 0) + 1
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, topN)
    .map(([name, count]) => ({ name, count }))
}
