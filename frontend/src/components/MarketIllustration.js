import React from "react";

export default function MarketIllustration() {
  return (
    <svg
      viewBox="0 0 360 240"
      width="100%"
      style={{ maxWidth: 340, height: "auto", borderRadius: 16 }}
      role="img"
      aria-label="Colorful market stall illustration with fresh produce"
    >
      <defs>
        <linearGradient id="mkt-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a4a2e" />
          <stop offset="100%" stopColor="#0f2e1a" />
        </linearGradient>
        <linearGradient id="mkt-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#1a5e35" />
          <stop offset="100%" stopColor="#0d3d20" />
        </linearGradient>
      </defs>

      {/* Background */}
      <rect width="360" height="240" fill="url(#mkt-sky)" rx="16" />

      {/* Stars */}
      <circle cx="30" cy="25" r="1.5" fill="rgba(255,255,255,0.4)" />
      <circle cx="90" cy="15" r="1" fill="rgba(255,255,255,0.3)" />
      <circle cx="200" cy="12" r="1.2" fill="rgba(255,255,255,0.25)" />
      <circle cx="270" cy="20" r="1.5" fill="rgba(255,255,255,0.4)" />
      <circle cx="330" cy="35" r="1" fill="rgba(255,255,255,0.3)" />
      <circle cx="50" cy="50" r="1" fill="rgba(255,255,255,0.2)" />
      <circle cx="310" cy="55" r="1" fill="rgba(255,255,255,0.2)" />
      <circle cx="145" cy="30" r="0.8" fill="rgba(255,255,255,0.15)" />

      {/* Ground */}
      <ellipse cx="180" cy="260" rx="220" ry="75" fill="url(#mkt-ground)" />
      <ellipse cx="180" cy="268" rx="240" ry="80" fill="#0a3019" />

      {/* Background trees - left */}
      <rect x="25" y="95" width="10" height="50" fill="#4a2d0a" rx="3" />
      <circle cx="30" cy="80" r="24" fill="#1d7a3e" />
      <circle cx="18" cy="88" r="18" fill="#166e33" />
      <circle cx="42" cy="86" r="16" fill="#1a7538" />

      {/* Background trees - right */}
      <rect x="305" y="100" width="10" height="45" fill="#4a2d0a" rx="3" />
      <circle cx="310" cy="86" r="22" fill="#1d7a3e" />
      <circle cx="298" cy="92" r="16" fill="#166e33" />
      <circle cx="322" cy="90" r="14" fill="#1a7538" />

      {/* Small tree - far left */}
      <rect x="58" y="130" width="6" height="30" fill="#4a2d0a" rx="2" />
      <circle cx="61" cy="120" r="14" fill="#1a7538" />
      <circle cx="53" cy="125" r="10" fill="#166e33" />

      {/* Small tree - far right */}
      <rect x="280" y="135" width="6" height="28" fill="#4a2d0a" rx="2" />
      <circle cx="283" cy="125" r="13" fill="#1a7538" />
      <circle cx="290" cy="130" r="10" fill="#166e33" />

      {/* Bush - left */}
      <ellipse cx="75" cy="185" rx="18" ry="12" fill="#1a7538" />
      <ellipse cx="65" cy="187" rx="12" ry="9" fill="#166e33" />

      {/* Bush - right */}
      <ellipse cx="288" cy="183" rx="16" ry="11" fill="#1a7538" />
      <ellipse cx="296" cy="185" rx="12" ry="9" fill="#166e33" />

      {/* === MARKET STALL === */}

      {/* Awning poles */}
      <rect x="95" y="72" width="5" height="100" fill="#6b4512" rx="2" />
      <rect x="260" y="72" width="5" height="100" fill="#6b4512" rx="2" />

      {/* Awning - main canopy */}
      <path d="M85 76 Q180 52 275 76 L270 100 Q180 76 90 100 Z" fill="#d63031" />
      {/* Awning stripes */}
      <path d="M92 82 Q180 62 268 82 L266 88 Q180 68 94 88 Z" fill="#ffeaa7" />
      <path d="M88 92 Q180 72 272 92 L270 98 Q180 78 90 98 Z" fill="#ffeaa7" />

      {/* Bunting line */}
      <line x1="95" y1="68" x2="265" y2="68" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
      {/* Bunting flags */}
      <polygon points="110,68 116,80 104,80" fill="#e17055" />
      <polygon points="130,68 136,80 124,80" fill="#fdcb6e" />
      <polygon points="150,68 156,80 144,80" fill="#00b894" />
      <polygon points="170,68 176,80 164,80" fill="#0984e3" />
      <polygon points="190,68 196,80 184,80" fill="#e17055" />
      <polygon points="210,68 216,80 204,80" fill="#fdcb6e" />
      <polygon points="230,68 236,80 224,80" fill="#00b894" />
      <polygon points="250,68 256,80 244,80" fill="#0984e3" />

      {/* Counter/table */}
      <rect x="90" y="155" width="180" height="35" rx="4" fill="#8B6914" />
      <rect x="90" y="155" width="180" height="8" rx="3" fill="#a07c28" />
      {/* Table legs */}
      <rect x="100" y="188" width="6" height="18" fill="#6b4512" rx="1" />
      <rect x="254" y="188" width="6" height="18" fill="#6b4512" rx="1" />

      {/* Produce baskets */}
      {/* Basket 1 - tomatoes */}
      <rect x="105" y="143" width="30" height="14" rx="4" fill="#deb074" />
      <circle cx="112" cy="140" r="6" fill="#e74c3c" />
      <circle cx="125" cy="140" r="6" fill="#c0392b" />
      <circle cx="118" cy="136" r="5" fill="#e74c3c" />

      {/* Basket 2 - oranges */}
      <rect x="145" y="143" width="30" height="14" rx="4" fill="#deb074" />
      <circle cx="152" cy="140" r="6" fill="#f39c12" />
      <circle cx="165" cy="140" r="6" fill="#e67e22" />
      <circle cx="158" cy="136" r="5" fill="#f39c12" />

      {/* Basket 3 - greens */}
      <rect x="185" y="143" width="30" height="14" rx="4" fill="#deb074" />
      <circle cx="192" cy="140" r="6" fill="#27ae60" />
      <circle cx="205" cy="140" r="6" fill="#2ecc71" />
      <circle cx="198" cy="136" r="5" fill="#27ae60" />

      {/* Basket 4 - mixed */}
      <rect x="225" y="143" width="30" height="14" rx="4" fill="#deb074" />
      <circle cx="232" cy="140" r="6" fill="#9b59b6" />
      <circle cx="245" cy="140" r="6" fill="#e74c3c" />
      <circle cx="238" cy="136" r="5" fill="#f1c40f" />

      {/* Vendor figure */}
      {/* Body */}
      <rect x="167" y="118" width="26" height="38" rx="6" fill="#0984e3" />
      {/* Arms */}
      <rect x="157" y="122" width="14" height="8" rx="4" fill="#0984e3" />
      <rect x="189" y="122" width="14" height="8" rx="4" fill="#0984e3" />
      {/* Hands */}
      <circle cx="157" cy="126" r="4" fill="#fad7a0" />
      <circle cx="203" cy="126" r="4" fill="#fad7a0" />
      {/* Head */}
      <circle cx="180" cy="106" r="14" fill="#fad7a0" />
      {/* Hat */}
      <rect x="165" y="90" width="30" height="6" rx="3" fill="#2d3436" />
      <rect x="170" y="84" width="20" height="10" rx="5" fill="#2d3436" />
      {/* Eyes */}
      <circle cx="174" cy="105" r="2.5" fill="#2d3436" />
      <circle cx="186" cy="105" r="2.5" fill="#2d3436" />
      <circle cx="175" cy="104" r="0.8" fill="#fff" />
      <circle cx="187" cy="104" r="0.8" fill="#fff" />
      {/* Smile */}
      <path
        d="M174 111 Q180 116 186 111"
        stroke="#2d3436"
        strokeWidth="1.5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Cheeks */}
      <circle cx="168" cy="110" r="3" fill="rgba(255,150,150,0.25)" />
      <circle cx="192" cy="110" r="3" fill="rgba(255,150,150,0.25)" />

      {/* Sign on counter */}
      <rect x="140" y="160" width="80" height="16" rx="3" fill="#ffeaa7" />
      <text
        x="180"
        y="172"
        textAnchor="middle"
        fontSize="8"
        fontWeight="700"
        fill="#2d3436"
        fontFamily="'Outfit', sans-serif"
      >
        FRESH PRODUCE
      </text>
    </svg>
  );
}
