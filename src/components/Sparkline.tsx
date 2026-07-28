export function Sparkline({
  values,
  domain = [1, 5],
  width = 96,
  height = 32,
}: {
  values: number[]
  domain?: [number, number]
  width?: number
  height?: number
}) {
  const [min, max] = domain
  const pad = 6 // room for the end-marker ring
  const innerWidth = width - pad * 2
  const innerHeight = height - pad * 2

  const points = values.map((v, i) => {
    const x = pad + (i / (values.length - 1)) * innerWidth
    const ratio = (v - min) / (max - min)
    const y = pad + innerHeight - ratio * innerHeight
    return [x, y] as const
  })

  const path = points
    .map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`)
    .join(' ')

  const [lastX, lastY] = points[points.length - 1]

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`Sentiment trend, most recent value ${values[values.length - 1]} of ${max}`}
    >
      <path
        d={path}
        fill="none"
        stroke="var(--series-blue)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r={5} fill="var(--surface-1)" />
      <circle cx={lastX} cy={lastY} r={4} fill="var(--series-blue)" />
    </svg>
  )
}
