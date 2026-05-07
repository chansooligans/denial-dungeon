// Shared shuffle helper for ambient music pools.
//
// Each pool (hospital, red room) has a small handful of tracks. Plain
// Math.random() can pick the same track twice in a row, which feels
// repetitive — the player tends to associate "I'm in the Waiting
// Room" with whichever track played first. This helper remembers the
// last pick per pool and excludes it from subsequent random draws,
// so consecutive picks are always different.
//
// State is module-level — survives scene re-creates within a session,
// resets on page reload (which is fine; first pick of a session is
// freely random).

const lastPickByPool = new Map<string, string>()

/** Pick a track from `tracks`, excluding the most recent pick from
 *  this pool. With a 3-track pool this guarantees no immediate
 *  repeats (player gets the OTHER two on alternate visits). */
export function pickNextTrack(poolKey: string, tracks: string[]): string {
  if (tracks.length <= 1) return tracks[0]
  const last = lastPickByPool.get(poolKey)
  const candidates = last ? tracks.filter(t => t !== last) : tracks
  const pick = candidates[Math.floor(Math.random() * candidates.length)]
  lastPickByPool.set(poolKey, pick)
  return pick
}
