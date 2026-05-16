/** 닉네임 해시 기반으로 HSL 색상 생성 */
function nicknameToHue(nickname: string): number {
  let hash = 0
  for (let i = 0; i < nickname.length; i++) {
    const code = nickname.charCodeAt(i)
    hash = (hash << 5) - hash + code
    hash |= 0 // 32bit 정수 변환
  }
  return Math.abs(hash) % 360
}

type AvatarSize = 'sm' | 'md' | 'lg'

interface PlayerAvatarProps {
  nickname: string
  size?: AvatarSize
  className?: string
}

const SIZE_MAP: Record<AvatarSize, string> = {
  sm: 'h-7 w-7 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-base',
}

export function PlayerAvatar({
  nickname,
  size = 'md',
  className = '',
}: PlayerAvatarProps) {
  const hue = nicknameToHue(nickname)
  const initial = nickname.charAt(0).toUpperCase()

  return (
    <div
      className={`flex items-center justify-center rounded-full font-bold text-white ${SIZE_MAP[size]} ${className}`}
      style={{
        backgroundColor: `hsl(${hue} 60% 35%)`,
        border: `2px solid hsl(${hue} 60% 50% / 0.4)`,
      }}
      aria-label={`${nickname} 아바타`}
    >
      {initial}
    </div>
  )
}
