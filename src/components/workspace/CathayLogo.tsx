// src/components/workspace/CathayLogo.tsx

// 🌟 Header 左上角嘅國泰品牌標記——用返教官提供嘅正牌 brushwing 圖案
// （public/cathay-logo-white.png，白色、透明底），淨係喺深色 header 度顯示
export default function CathayLogo({ className }: { className?: string }) {
  return (
    <img
      src="/cathay-logo-white.png"
      alt="Cathay Pacific"
      className={className}
    />
  );
}
