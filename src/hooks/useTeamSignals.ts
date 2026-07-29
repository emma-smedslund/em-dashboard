import { useEffect, useMemo, useState } from 'react'
import type { TeamSignal, TeamSignalStatus } from '../types'

const STORAGE_KEY = 'em-dashboard:team-signal-statuses'

function loadStatuses(): Record<string, TeamSignalStatus> {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    return stored ? JSON.parse(stored) as Record<string, TeamSignalStatus> : {}
  } catch {
    return {}
  }
}

export function useTeamSignals(detectedSignals: TeamSignal[]) {
  const [statusById, setStatusById] = useState<Record<string, TeamSignalStatus>>(loadStatuses)

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(statusById))
  }, [statusById])

  const signals = useMemo(
    () => detectedSignals.map((signal) => ({
      ...signal,
      status: statusById[signal.id] ?? signal.status,
    })),
    [detectedSignals, statusById],
  )

  function setSignalStatus(id: string, status: TeamSignalStatus) {
    setStatusById((current) => ({ ...current, [id]: status }))
  }

  return { signals, setSignalStatus }
}
