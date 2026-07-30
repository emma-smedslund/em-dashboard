export function readStoredJson(key: string): unknown {
  try {
    const stored = localStorage.getItem(key)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export function writeStoredJson(key: string, value: unknown): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch {
    return false
  }
}

const DASHBOARD_STORAGE_PREFIX = 'em-dashboard:'

export function resetDashboardStorage(): void {
  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index)
    if (key?.startsWith(DASHBOARD_STORAGE_PREFIX)) localStorage.removeItem(key)
  }
}
