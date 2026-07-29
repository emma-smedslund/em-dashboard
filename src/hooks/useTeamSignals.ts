import { useEffect, useMemo, useState } from 'react'
import type { TeamSignal, TeamSignalStatus } from '../types'
import { readStoredJson, writeStoredJson } from '../lib/storage'

const STORAGE_KEY = 'em-dashboard:team-signal-statuses'

function loadStatuses(): Record<string, TeamSignalStatus> {
  const stored = readStoredJson(STORAGE_KEY)
  if (typeof stored !== 'object' || stored === null || Array.isArray(stored)) return {}
  return Object.fromEntries(
    Object.entries(stored).filter(
      (entry): entry is [string, TeamSignalStatus] =>
        ['New', 'Acknowledged', 'Monitoring', 'Resolved'].includes(String(entry[1])),
    ),
  )
}

export function useTeamSignals(detectedSignals: TeamSignal[]) {
  const [statusById, setStatusById] = useState<Record<string, TeamSignalStatus>>(loadStatuses)

  useEffect(() => {
    writeStoredJson(STORAGE_KEY, statusById)
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
