// QR Code visualmente plausível e determinístico — SIMULAÇÃO de Pix, nada é cobrado.
import { useMemo } from "react";

const N = 25;

function hashSeed(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h;
}

export default function FakeQR({ seed, className }: { seed: string; className?: string }) {
  const { cells } = useMemo(() => {
    let h = hashSeed(seed);
    const grid: boolean[][] = Array.from({ length: N }, () => Array(N).fill(false));
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        h = (Math.imul(h, 1103515245) + 12345) >>> 0;
        grid[r][c] = ((h >> 16) & 1) === 1;
      }
    }
    const corners: Array<[number, number]> = [
      [0, 0],
      [0, N - 7],
      [N - 7, 0],
    ];
    for (const [r0, c0] of corners) {
      for (let rr = 0; rr < 7; rr++) {
        for (let cc = 0; cc < 7; cc++) {
          grid[r0 + rr][c0 + cc] =
            rr === 0 || rr === 6 || cc === 0 || cc === 6 || (rr >= 2 && rr <= 4 && cc >= 2 && cc <= 4);
        }
      }
      // área clara ao redor dos finders
      for (let rr = -1; rr <= 7; rr++) {
        for (let cc = -1; cc <= 7; cc++) {
          const r = r0 + rr;
          const c = c0 + cc;
          if (r < 0 || c < 0 || r >= N || c >= N) continue;
          const isRing = rr === -1 || rr === 7 || cc === -1 || cc === 7;
          if (isRing) grid[r][c] = false;
        }
      }
    }
    return { cells: grid };
  }, [seed]);

  return (
    <svg
      viewBox={`-1 -1 ${N + 2} ${N + 2}`}
      className={className}
      role="img"
      aria-label="QR Code simulado do Pix"
      data-testid="pix-qr-code-box"
    >
      <rect x={-1} y={-1} width={N + 2} height={N + 2} fill="#ffffff" />
      {cells.map((row, r) =>
        row.map((filled, c) =>
          filled ? <rect key={`${r}-${c}`} x={c} y={r} width={1} height={1} fill="#181D24" /> : null,
        ),
      )}
    </svg>
  );
}
