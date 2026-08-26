// src/components/workspace/CathayLogo.tsx

// 🌟 Header 左上角嘅國泰品牌標記——簡約嘅抽象「brushwing」線條，用返成個 app
// 一直用緊嘅 status-teal（#00bfa5）做主色，唔使掛外部圖片/字型
export default function CathayLogo({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" className={className} aria-label="Cathay Pacific">
      <circle cx="20" cy="20" r="19" stroke="#00bfa5" strokeWidth="1.5" />
      <path
        d="M6 24C11 16 16 12 24 12C30 12 34 15 36 19C30 17 25 17.5 20 21C15 24.5 10 25.5 6 24Z"
        fill="#00bfa5"
      />
      <path
        d="M8 28C13.5 22 19 19 26 19C31 19 34.5 21 36.5 24"
        stroke="#00bfa5"
        strokeWidth="1.75"
        strokeLinecap="round"
      />
    </svg>
  );
}
