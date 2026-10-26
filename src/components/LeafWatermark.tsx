type LeafWatermarkProps = { className?: string }

export function LeafWatermark({ className = '' }: LeafWatermarkProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 260 260"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M34 216C46 112 111 43 225 27c-1 108-56 180-166 189" stroke="currentColor" strokeWidth="2" />
      <path d="M57 192 202 49M84 163l-5-55m33 23 43-7m-24 66-8-48m40 15 34-8" stroke="currentColor" strokeWidth="1.5" />
      <path d="M50 217c53-47 93-96 145-167" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}
