import React from "react";
import "./SidePlantIllustration.css";

/**
 * SidePlantIllustration
 * 
 * Elegant, calm animated decorative plant for framing the Login and Register authentication forms.
 * Subtle stem growth, organic leaf opening, and gentle ambient breeze sway.
 * 
 * Props:
 * - variant: "left" (early-to-mid vegetative shoot) | "right" (taller, mature plant with subtle wheat/crop head)
 * - className: custom positioning and size classes
 */
export function SidePlantIllustration({ variant = "left", className = "" }) {
  const isRight = variant === "right";

  return (
    <div
      className={`side-plant-container relative flex items-end justify-center select-none pointer-events-none ${
        isRight ? "side-plant-right" : "side-plant-left"
      } ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 160 380"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-auto max-h-[380px] drop-shadow-xs"
      >
        <defs>
          <linearGradient id={`sideStemGrad-${variant}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#2e7d32" />
            <stop offset="100%" stopColor="#66bb6a" />
          </linearGradient>

          <linearGradient id={`sideLeafGrad-${variant}`} x1="0" y1="1" x2="1" y2="0">
            <stop offset="0%" stopColor="#388e3c" />
            <stop offset="100%" stopColor="#81c784" />
          </linearGradient>

          <linearGradient id={`sideGrainGrad-${variant}`} x1="0" y1="1" x2="0" y2="0">
            <stop offset="0%" stopColor="#d97706" />
            <stop offset="100%" stopColor="#fbbf24" />
          </linearGradient>
        </defs>

        {/* Base Soil Line / Mound */}
        <path
          d="M 10 365 Q 80 355 150 365 C 160 366 160 375 80 375 C 0 375 0 366 10 365 Z"
          fill="#5d4037"
          opacity="0.45"
        />

        {/* Stem and Leaves assembly with gentle sway */}
        <g className="side-plant-assembly">
          {/* Main Stem */}
          <path
            d={isRight ? "M 80 360 Q 82 230 80 90" : "M 80 360 Q 78 260 80 140"}
            stroke={`url(#sideStemGrad-${variant})`}
            strokeWidth="3.5"
            strokeLinecap="round"
            className="side-stem"
          />

          {/* Low Node Leaves */}
          <g className="side-node side-node-1">
            <path
              d="M 80 310 C 50 305 30 280 25 255 C 45 272 70 290 80 306 Z"
              fill={`url(#sideLeafGrad-${variant})`}
              className="side-leaf leaf-left"
            />
            <path
              d="M 80 295 C 110 290 130 265 135 240 C 115 257 90 275 80 291 Z"
              fill={`url(#sideLeafGrad-${variant})`}
              className="side-leaf leaf-right"
            />
          </g>

          {/* Mid Node Leaves */}
          <g className="side-node side-node-2">
            <path
              d="M 80 240 C 45 228 25 195 20 165 C 42 185 68 210 80 236 Z"
              fill={`url(#sideLeafGrad-${variant})`}
              className="side-leaf leaf-left"
            />
            <path
              d="M 80 225 C 115 213 135 180 140 150 C 118 170 92 195 80 221 Z"
              fill={`url(#sideLeafGrad-${variant})`}
              className="side-leaf leaf-right"
            />
          </g>

          {/* Top Node / Flower or Grain for right side */}
          {isRight ? (
            <g className="side-grain-head">
              <ellipse cx="80" cy="85" rx="5" ry="10" fill={`url(#sideGrainGrad-${variant})`} />
              <ellipse cx="74" cy="72" rx="4.5" ry="8" transform="rotate(-20 74 72)" fill={`url(#sideGrainGrad-${variant})`} />
              <ellipse cx="86" cy="64" rx="4.5" ry="8" transform="rotate(20 86 64)" fill={`url(#sideGrainGrad-${variant})`} />
              <ellipse cx="80" cy="50" rx="4" ry="7" fill={`url(#sideGrainGrad-${variant})`} />
              <line x1="80" y1="44" x2="80" y2="28" stroke="#f59e0b" strokeWidth="1.5" strokeLinecap="round" />
            </g>
          ) : (
            <g className="side-node side-node-3">
              <path
                d="M 80 170 C 55 155 42 125 40 100 C 56 118 72 142 80 166 Z"
                fill={`url(#sideLeafGrad-${variant})`}
                className="side-leaf leaf-left"
              />
              <path
                d="M 80 160 C 105 145 118 115 120 90 C 104 108 88 132 80 156 Z"
                fill={`url(#sideLeafGrad-${variant})`}
                className="side-leaf leaf-right"
              />
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

export default SidePlantIllustration;
