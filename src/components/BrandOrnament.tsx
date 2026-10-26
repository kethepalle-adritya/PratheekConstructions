type BrandOrnamentProps = { className?: string }

export function BrandOrnament({ className = '' }: BrandOrnamentProps) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 100 26"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M8 13h31m22 0h31" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M50 22c-1-7-8-9-13-10 4-1 10-1 13 4 3-5 9-5 13-4-5 1-12 3-13 10Z"
        fill="currentColor"
      />
      <path d="M50 20V6" stroke="currentColor" strokeWidth="1.2" />
      <path d="M47 11c-4-5-1-8 3-9 2 4 1 7-3 9Z" fill="currentColor" />
    </svg>
  )
}
