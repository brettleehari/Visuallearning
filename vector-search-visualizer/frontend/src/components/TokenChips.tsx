import { getDocColor } from '../lib/colors'

interface Props {
  tokens: string[]
  index: number
  isQuery?: boolean
}

export function TokenChips({ tokens, index, isQuery }: Props) {
  const color = isQuery ? '#ffd700' : getDocColor(index)
  return (
    <div className="mb-1">
      {tokens.map((token, i) => (
        <span
          key={i}
          className="token-chip"
          style={{
            background: `${color}18`,
            color: color,
            border: `1px solid ${color}30`,
            animationDelay: `${i * 40}ms`,
          }}
        >
          {token}
        </span>
      ))}
    </div>
  )
}
