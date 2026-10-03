// WCA Official Scrambles generator

type MoveModifier = '' | "'" | '2';
const MODIFIERS: MoveModifier[] = ['', "'", '2'];

// Opposite faces for 3x3x3: (0,1), (2,3), (4,5)
const FACES_333 = ['U', 'D', 'L', 'R', 'F', 'B'];
const OPPOSITE_AXIS_MAP: Record<string, string> = {
  U: 'D', D: 'U',
  L: 'R', R: 'L',
  F: 'B', B: 'F'
};

export function generate3x3x3Scramble(length: number = 21): string {
  const moves: string[] = [];
  let lastFace = '';
  let secondLastFace = '';

  for (let i = 0; i < length; i++) {
    const availableFaces = FACES_333.filter(face => {
      if (face === lastFace) return false;
      // If lastFace and secondLastFace share an axis (e.g. U and D), cannot move same axis again
      if (
        lastFace &&
        OPPOSITE_AXIS_MAP[lastFace] === face &&
        secondLastFace === face
      ) {
        return false;
      }
      return true;
    });

    const chosenFace = availableFaces[Math.floor(Math.random() * availableFaces.length)];
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    moves.push(`${chosenFace}${modifier}`);
    secondLastFace = lastFace;
    lastFace = chosenFace;
  }

  return moves.join(' ');
}

export function generate2x2x2Scramble(length: number = 10): string {
  const faces = ['U', 'R', 'F'];
  const moves: string[] = [];
  let lastFace = '';

  for (let i = 0; i < length; i++) {
    const availableFaces = faces.filter(f => f !== lastFace);
    const chosenFace = availableFaces[Math.floor(Math.random() * availableFaces.length)];
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    moves.push(`${chosenFace}${modifier}`);
    lastFace = chosenFace;
  }

  return moves.join(' ');
}

export function generate4x4x4Scramble(length: number = 42): string {
  const faces = ['U', 'D', 'L', 'R', 'F', 'B', 'Uw', 'Dw', 'Lw', 'Rw', 'Fw', 'Bw'];
  const moves: string[] = [];
  let lastBase = '';

  for (let i = 0; i < length; i++) {
    const availableFaces = faces.filter(f => {
      const base = f[0];
      return base !== lastBase;
    });

    const chosenFace = availableFaces[Math.floor(Math.random() * availableFaces.length)];
    const modifier = MODIFIERS[Math.floor(Math.random() * MODIFIERS.length)];

    moves.push(`${chosenFace}${modifier}`);
    lastBase = chosenFace[0];
  }

  return moves.join(' ');
}

export function generate5x5x5Scramble(length: number = 60): string {
  return generate4x4x4Scramble(length);
}

export function generatePyraminxScramble(): string {
  const bodyFaces = ['U', 'L', 'R', 'B'];
  const moves: string[] = [];
  let lastFace = '';

  for (let i = 0; i < 11; i++) {
    const available = bodyFaces.filter(f => f !== lastFace);
    const face = available[Math.floor(Math.random() * available.length)];
    const dir = Math.random() > 0.5 ? '' : "'";
    moves.push(`${face}${dir}`);
    lastFace = face;
  }

  // Tips: u, l, r, b
  const tips = ['u', 'l', 'r', 'b'];
  for (const tip of tips) {
    if (Math.random() > 0.3) {
      const dir = Math.random() > 0.5 ? '' : "'";
      moves.push(`${tip}${dir}`);
    }
  }

  return moves.join(' ');
}

export function generateSkewbScramble(): string {
  const faces = ['U', 'L', 'R', 'B'];
  const moves: string[] = [];
  let lastFace = '';

  for (let i = 0; i < 10; i++) {
    const available = faces.filter(f => f !== lastFace);
    const face = available[Math.floor(Math.random() * available.length)];
    const dir = Math.random() > 0.5 ? '' : "'";
    moves.push(`${face}${dir}`);
    lastFace = face;
  }

  return moves.join(' ');
}

export function generateMegaminxScramble(): string {
  const lines: string[] = [];
  for (let row = 0; row < 7; row++) {
    const rowMoves: string[] = [];
    for (let col = 0; col < 5; col++) {
      const r = Math.random() > 0.5 ? 'R++' : 'R--';
      const d = Math.random() > 0.5 ? 'D++' : 'D--';
      rowMoves.push(r, d);
    }
    const u = Math.random() > 0.5 ? 'U' : "U'";
    rowMoves.push(u);
    lines.push(rowMoves.join(' '));
  }
  return lines.join('\n');
}

export function generateSquare1Scramble(): string {
  const moves: string[] = [];
  for (let i = 0; i < 14; i++) {
    const top = Math.floor(Math.random() * 12) - 5;
    const bot = Math.floor(Math.random() * 12) - 5;
    moves.push(`(${top},${bot}) /`);
  }
  return moves.join(' ');
}

export function generateClockScramble(): string {
  const dials = ['UR', 'DR', 'DL', 'UL', 'U', 'R', 'D', 'L', 'ALL'];
  const moves: string[] = [];
  for (const d of dials) {
    const amount = Math.floor(Math.random() * 12) - 5;
    const sign = amount >= 0 ? '+' : '';
    moves.push(`${d}${sign}${amount}`);
  }
  moves.push('y2');
  for (const d of ['U', 'R', 'D', 'L', 'ALL']) {
    const amount = Math.floor(Math.random() * 12) - 5;
    const sign = amount >= 0 ? '+' : '';
    moves.push(`${d}${sign}${amount}`);
  }
  // Pin states
  const pins = ['UR', 'DR', 'DL', 'UL'];
  for (const p of pins) {
    if (Math.random() > 0.5) moves.push(p);
  }
  return moves.join(' ');
}

export const SCRAMBLE_EVENTS = [
  { id: '333', name: '3x3x3', category: 'WCA', generate: () => generate3x3x3Scramble(21) },
  { id: '222', name: '2x2x2', category: 'WCA', generate: () => generate2x2x2Scramble(10) },
  { id: '444', name: '4x4x4', category: 'WCA', generate: () => generate4x4x4Scramble(42) },
  { id: '555', name: '5x5x5', category: 'WCA', generate: () => generate5x5x5Scramble(60) },
  { id: '666', name: '6x6x6', category: 'WCA', generate: () => generate5x5x5Scramble(80) },
  { id: '777', name: '7x7x7', category: 'WCA', generate: () => generate5x5x5Scramble(100) },
  { id: 'pyra', name: 'Pyraminx', category: 'WCA', generate: () => generatePyraminxScramble() },
  { id: 'skewb', name: 'Skewb', category: 'WCA', generate: () => generateSkewbScramble() },
  { id: 'sq1', name: 'Square-1', category: 'WCA', generate: () => generateSquare1Scramble() },
  { id: 'clock', name: 'Clock', category: 'WCA', generate: () => generateClockScramble() },
  { id: 'mega', name: 'Megaminx', category: 'WCA', generate: () => generateMegaminxScramble() }
];

export function getScramble(eventId: string = '333'): string {
  const ev = SCRAMBLE_EVENTS.find(e => e.id === eventId);
  return ev ? ev.generate() : generate3x3x3Scramble();
}
