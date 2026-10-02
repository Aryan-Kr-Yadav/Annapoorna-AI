import React from "react";
import "./HeroPlantIllustration.css";

/**
 * HeroPlantIllustration
 * 
 * An original, continuous SVG animation depicting plant growth in progressive biological stages:
 * Stage 1: Seed in rich soil
 * Stage 2: Taproot downward extension
 * Stage 3: Shoot pushing through soil line
 * Stage 4: Stem elongation
 * Stage 5: Primary cotyledon / leaf pair unfolds
 * Stage 6: Secondary nodes emerge with vibrant foliage
 * Stage 7: Mature crop canopy with gentle ambient sway
 * Stage 8: Golden harvest grain / wheat head bloom
 * Stage 9: Subtle intelligence markers (Soil, Weather, Health) float in
 * Stage 10: Graceful pause and seamless cycle repeat
 *
 * Fully respects `prefers-reduced-motion` by displaying the mature state statically.
 */
export function HeroPlantIllustration({ className = "" }) {
  return (
    <div className={`hero-plant-container relative flex items-center justify-center select-none ${className}`}>
      {/* Soft Ambient Radiance */}
      <div className="absolute inset-0 -z-10 flex items-center justify-center">
        <div className="h-64 w-64 sm:h-80 sm:w-80 rounded-full bg-emerald-500/10 dark:bg-emerald-400/5 blur-3xl animate-pulse" />
      </div>

      <svg
        viewBox="0 0 420 460"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full max-w-[340px] sm:max-w-[420px] h-auto drop-shadow-sm"
        aria-label="Illustration of a crop growing continuously from seed to harvest"
        role="img"
      >
        <defs>
          {/* Gradients */}
          <linearGradient id="soilGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#795548" stopOpacity="0.85" />
            <stop offset="100%" stopColor="#4e342e" stopOpacity="0.95" />
          </linearGradient>

          <linearGradient id="stemGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#2e7d32" />
            <stop offset="60%" stopColor="#43a047" />
            <stop offset="100%" stopColor="#66bb6a" />
          </linearGradient>

          <linearGradient id="leafGradientLeft" x1="1" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#2e7d32" />
            <stop offset="100%" stopColor="#81c784" />
          </linearGradient>

          <linearGradient id="leafGradientRight" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#388e3c" />
            <stop offset="100%" stopColor="#a5d6a7" />
          </linearGradient>

          <linearGradient id="wheatGradient" x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#d48b28" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>

          <filter id="leafShadow" x="-10%" y="-10%" width="120%" height="120%">
            <feDropShadow dx="0" dy="2" stdDeviation="2" floodOpacity="0.1" />
          </filter>
        </defs>

        {/* ================= SOIL BED & ROOTS (BASE) ================= */}
        <g className="plant-soil-group">
          {/* Ground surface contour */}
          <path
            d="M 50 375 Q 210 365 370 375 C 390 376 400 380 400 395 C 400 415 380 425 210 425 C 40 425 20 415 20 395 C 20 380 30 376 50 375 Z"
            fill="url(#soilGradient)"
            className="soil-mound"
          />

          {/* Subsoil texture marks */}
          <ellipse cx="170" cy="392" rx="14" ry="4" fill="#3e2723" opacity="0.35" />
          <ellipse cx="250" cy="398" rx="18" ry="5" fill="#3e2723" opacity="0.3" />
          <ellipse cx="210" cy="406" rx="24" ry="6" fill="#3e2723" opacity="0.4" />
          <ellipse cx="130" cy="402" rx="10" ry="3" fill="#3e2723" opacity="0.25" />

          {/* Seed (Stage 1) */}
          <g className="plant-seed">
            <ellipse cx="210" cy="374" rx="7" ry="5" fill="#5d4037" stroke="#8d6e63" strokeWidth="1.5" />
            <path d="M 207 372 Q 210 370 213 372" stroke="#d7ccc8" strokeWidth="1" strokeLinecap="round" />
          </g>

          {/* Taproot & root system (Stage 2) */}
          <g className="plant-roots" stroke="#bcaaa4" strokeWidth="2" strokeLinecap="round" fill="none">
            <path d="M 210 379 Q 212 398 210 416" className="root-main" />
            <path d="M 211 390 Q 224 398 232 408" className="root-branch-right" strokeWidth="1.5" />
            <path d="M 209 392 Q 196 401 188 411" className="root-branch-left" strokeWidth="1.5" />
            <path d="M 210 404 Q 218 412 222 419" className="root-sub-right" strokeWidth="1.2" />
            <path d="M 210 405 Q 202 413 197 420" className="root-sub-left" strokeWidth="1.2" />
          </g>
        </g>

        {/* ================= GROWING SHOOT, STEM & LEAVES ================= */}
        {/* Sway Wrapper for mature natural organic movement */}
        <g className="plant-stem-leaves-assembly">
          {/* Main Stem (Stages 3, 4, 6) */}
          <path
            d="M 210 374 Q 210 270 210 150"
            stroke="url(#stemGradient)"
            strokeWidth="5"
            strokeLinecap="round"
            fill="none"
            className="plant-stem"
          />

          {/* Node 1: Lower First Leaf Pair (Stages 5+) */}
          <g className="leaf-node node-1">
            {/* Left Lower Leaf */}
            <path
              d="M 210 320 C 175 315 145 285 135 255 C 160 275 195 295 210 316 Z"
              fill="url(#leafGradientLeft)"
              className="leaf leaf-lower-left"
              filter="url(#leafShadow)"
            />
            {/* Left Leaf Midrib vein */}
            <path
              d="M 210 318 Q 175 298 137 257"
              stroke="#a5d6a7"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              className="leaf-vein leaf-vein-lower-left"
            />

            {/* Right Lower Leaf */}
            <path
              d="M 210 310 C 245 305 275 275 285 245 C 260 265 225 285 210 306 Z"
              fill="url(#leafGradientRight)"
              className="leaf leaf-lower-right"
              filter="url(#leafShadow)"
            />
            {/* Right Leaf Midrib vein */}
            <path
              d="M 210 308 Q 245 288 283 247"
              stroke="#c8e6c9"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              className="leaf-vein leaf-vein-lower-right"
            />
          </g>

          {/* Node 2: Mid-tier Foliage (Stages 6, 7) */}
          <g className="leaf-node node-2">
            {/* Left Mid Leaf */}
            <path
              d="M 210 250 C 170 235 140 195 130 160 C 158 185 195 215 210 246 Z"
              fill="url(#leafGradientLeft)"
              className="leaf leaf-mid-left"
              filter="url(#leafShadow)"
            />
            <path
              d="M 210 248 Q 170 215 132 163"
              stroke="#a5d6a7"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              className="leaf-vein leaf-vein-mid-left"
            />

            {/* Right Mid Leaf */}
            <path
              d="M 210 235 C 250 220 280 180 290 145 C 262 170 225 200 210 231 Z"
              fill="url(#leafGradientRight)"
              className="leaf leaf-mid-right"
              filter="url(#leafShadow)"
            />
            <path
              d="M 210 233 Q 250 200 288 148"
              stroke="#c8e6c9"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              className="leaf-vein leaf-vein-mid-right"
            />
          </g>

          {/* Node 3: Upper Crown Foliage (Stages 7, 8) */}
          <g className="leaf-node node-3">
            {/* Left Top Leaf */}
            <path
              d="M 210 180 C 180 160 160 120 158 90 C 176 115 198 145 210 176 Z"
              fill="url(#leafGradientLeft)"
              className="leaf leaf-top-left"
              filter="url(#leafShadow)"
            />
            {/* Right Top Leaf */}
            <path
              d="M 210 170 C 240 150 260 110 262 80 C 244 105 222 135 210 166 Z"
              fill="url(#leafGradientRight)"
              className="leaf leaf-top-right"
              filter="url(#leafShadow)"
            />
          </g>

          {/* ================= MATURE WHEAT / GRAIN HEAD (Stage 8, 9) ================= */}
          <g className="plant-harvest-grain">
            {/* Center rachis */}
            <line x1="210" y1="150" x2="210" y2="70" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" />

            {/* Alternating Spikelets with awns / bristles */}
            <g className="spikelets" fill="url(#wheatGradient)">
              {/* Spikelet 1 (Low left) */}
              <ellipse cx="204" cy="142" rx="6" ry="9" transform="rotate(-25 204 142)" />
              <path d="M 200 138 L 186 122" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />

              {/* Spikelet 2 (Low right) */}
              <ellipse cx="216" cy="132" rx="6" ry="9" transform="rotate(25 216 132)" />
              <path d="M 220 128 L 234 112" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />

              {/* Spikelet 3 (Mid left) */}
              <ellipse cx="204" cy="120" rx="5.5" ry="8.5" transform="rotate(-25 204 120)" />
              <path d="M 200 116 L 184 98" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />

              {/* Spikelet 4 (Mid right) */}
              <ellipse cx="216" cy="110" rx="5.5" ry="8.5" transform="rotate(25 216 110)" />
              <path d="M 220 106 L 236 88" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />

              {/* Spikelet 5 (Upper left) */}
              <ellipse cx="205" cy="98" rx="5" ry="8" transform="rotate(-25 205 98)" />
              <path d="M 201 94 L 188 74" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />

              {/* Spikelet 6 (Upper right) */}
              <ellipse cx="215" cy="88" rx="5" ry="8" transform="rotate(25 215 88)" />
              <path d="M 219 84 L 232 64" stroke="#d97706" strokeWidth="1.2" strokeLinecap="round" />

              {/* Terminal top grain & central awn */}
              <ellipse cx="210" cy="74" rx="4.5" ry="7.5" />
              <path d="M 210 68 L 210 42" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
            </g>

            {/* Golden pollen / aura sparkles */}
            <circle cx="210" cy="56" r="2.5" fill="#fde68a" className="sparkle sparkle-1" />
            <circle cx="178" cy="88" r="2" fill="#fde68a" className="sparkle sparkle-2" />
            <circle cx="242" cy="78" r="2" fill="#fde68a" className="sparkle sparkle-3" />
          </g>
        </g>

        {/* ================= FLOATING FARM INTELLIGENCE NODES (Stage 9) ================= */}
        {/* Subtle pill tags: Soil, Weather, Health (Data -> Intelligence -> Growth) */}
        <g className="floating-intel-badges">
          {/* Soil Badge (Left) */}
          <g className="intel-pill intel-soil" transform="translate(48, 280)">
            <rect width="84" height="26" rx="13" fill="var(--surface, #ffffff)" stroke="var(--border, #e2e8de)" strokeWidth="1" className="drop-shadow-xs" />
            <circle cx="14" cy="13" r="5" fill="#795548" />
            <text x="26" y="17" fill="var(--foreground, #152216)" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
              Soil N-P-K
            </text>
          </g>

          {/* Weather Telemetry (Right) */}
          <g className="intel-pill intel-weather" transform="translate(288, 230)">
            <rect width="90" height="26" rx="13" fill="var(--surface, #ffffff)" stroke="var(--border, #e2e8de)" strokeWidth="1" className="drop-shadow-xs" />
            <circle cx="14" cy="13" r="5" fill="#0284c7" />
            <text x="26" y="17" fill="var(--foreground, #152216)" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
              Rainfall 14mm
            </text>
          </g>

          {/* Crop Health (Top Left) */}
          <g className="intel-pill intel-health" transform="translate(68, 140)">
            <rect width="92" height="26" rx="13" fill="var(--surface, #ffffff)" stroke="var(--border, #e2e8de)" strokeWidth="1" className="drop-shadow-xs" />
            <circle cx="14" cy="13" r="5" fill="#16a34a" />
            <text x="26" y="17" fill="var(--foreground, #152216)" fontSize="10" fontWeight="bold" fontFamily="sans-serif">
              Crop Healthy
            </text>
          </g>
        </g>
      </svg>
    </div>
  );
}

export default HeroPlantIllustration;
