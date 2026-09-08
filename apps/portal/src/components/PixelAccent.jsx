import './pixel-accent.css';

const PIXELS = [
  { x: 0, y: 26, size: 12, delay: 0 },
  { x: 16, y: 22, size: 10, delay: 70 },
  { x: 30, y: 16, size: 8, delay: 140 },
  { x: 42, y: 11, size: 6, delay: 210 },
  { x: 52, y: 7, size: 4, delay: 280 },
];

/**
 * Decorative echo of the dissolving squares in the ODS mark. Purely ornamental,
 * so it is hidden from assistive tech and stands still for reduced-motion users.
 */
export const PixelAccent = () => (
  <svg className="pixel-accent" viewBox="0 0 60 40" aria-hidden="true" focusable="false">
    {PIXELS.map((pixel) => (
      <rect
        key={pixel.x}
        className="pixel-accent__square"
        style={{ '--drift-delay': `${pixel.delay}ms` }}
        x={pixel.x}
        y={pixel.y}
        width={pixel.size}
        height={pixel.size}
        rx={pixel.size * 0.28}
      />
    ))}
  </svg>
);
