import React from "react";

/**
 * DriftingCarLoader
 * A middle-page aligned drifting car loader using pure HTML and CSS (no external JS libraries).
 *
 * Structure:
 * .loader-overlay
 *   ├── .skid-marks
 *   ├── .drift-car (inline SVG)
 *   └── .loading-text ("Loading")
 */
export interface DriftingCarLoaderProps {
  className?: string;
  text?: string;
  /**
   * Duration in seconds per 360-degree rotation.
   * Default: 1.5s (1 full rotation).
   */
  rotationDuration?: number;
}

export const DriftingCarLoader: React.FC<DriftingCarLoaderProps> = ({
  className = "",
  text = "Loading",
  rotationDuration = 1.5,
}) => {
  return (
    <>
      <style>{`
        .loader-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100vw;
          height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          background: radial-gradient(circle, rgba(30, 30, 30, 1) 0%, rgba(5, 5, 5, 1) 100%);
          z-index: 9999;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          animation: loaderFadeIn 0.25s ease-out forwards;
        }

        @keyframes loaderFadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        .skid-marks {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 160px;
          height: 160px;
          margin-top: -80px;
          margin-left: -80px;
          border-radius: 50%;
          box-shadow: 
            inset 0 0 0 4px rgba(255, 255, 255, 0.08),
            inset 0 0 24px transparent,
            inset 0 0 0 28px rgba(255, 255, 255, 0.08);
          animation: spin-marks var(--spin-duration, 1.5s) infinite linear;
          pointer-events: none;
        }

        /* Subtle dashed rubber tread marks for dynamic visual spin */
        .skid-marks::before {
          content: "";
          position: absolute;
          inset: 6px;
          border-radius: 50%;
          border: 2px dashed rgba(255, 255, 255, 0.12);
        }

        .skid-marks::after {
          content: "";
          position: absolute;
          inset: 22px;
          border-radius: 50%;
          border: 1.5px dashed rgba(255, 255, 255, 0.06);
        }

        @keyframes spin-marks {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        .drift-car {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 80px;
          margin-top: -40px;
          margin-left: -20px;
          transform-origin: center center;
          animation: drift var(--spin-duration, 1.5s) infinite linear;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.65));
          pointer-events: none;
        }

        /* Circles around the skid marks with authentic counter-steer drift yaw */
        @keyframes drift {
          0% {
            transform: rotate(0deg) translateY(-58px) rotate(68deg);
          }
          100% {
            transform: rotate(360deg) translateY(-58px) rotate(68deg);
          }
        }

        .loading-text {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, 115px);
          color: #e2e8f0;
          font-size: 14px;
          font-weight: 500;
          letter-spacing: 0.32em;
          text-transform: uppercase;
          user-select: none;
          animation: pulse-opacity 2s ease-in-out infinite;
        }

        @keyframes pulse-opacity {
          0%, 100% {
            opacity: 0.35;
          }
          50% {
            opacity: 0.95;
          }
        }
      `}</style>

      <div
        className={`loader-overlay ${className}`.trim()}
        style={{ "--spin-duration": `${rotationDuration}s` } as React.CSSProperties}
      >
        <div className="skid-marks" />

        <svg
          className="drift-car"
          viewBox="0 0 100 200"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 4 Wheels: black #111 rects, 15x35, rx 5 */}
          <rect x="0" y="30" width="15" height="35" rx="5" fill="#111" />
          <rect x="85" y="30" width="15" height="35" rx="5" fill="#111" />
          <rect x="0" y="140" width="15" height="35" rx="5" fill="#111" />
          <rect x="85" y="140" width="15" height="35" rx="5" fill="#111" />

          {/* Body: #ff3366 rect at (10,10), 80x180, rx 25 */}
          <rect x="10" y="10" width="80" height="180" rx="25" fill="#ff3366" />

          {/* Front and rear glass: #1a1a1a polygons */}
          <polygon points="22,60 78,60 74,88 26,88" fill="#1a1a1a" />
          <polygon points="26,137 74,137 78,162 22,162" fill="#1a1a1a" />

          {/* Roof: #cc0044 rect at (25,90), 50x45 */}
          <rect x="25" y="90" width="50" height="45" rx="5" fill="#cc0044" />

          {/* Headlights: #ffff99 rects at the front */}
          <rect x="18" y="14" width="14" height="8" rx="3" fill="#ffff99" />
          <rect x="68" y="14" width="14" height="8" rx="3" fill="#ffff99" />

          {/* Tail lights: #ff0000 rects at the back */}
          <rect x="18" y="178" width="14" height="7" rx="3" fill="#ff0000" />
          <rect x="68" y="178" width="14" height="7" rx="3" fill="#ff0000" />
        </svg>

        <div className="loading-text">{text}</div>
      </div>
    </>
  );
};

export default DriftingCarLoader;
