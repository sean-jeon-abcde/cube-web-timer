// White Cross Solver for 3x3x3
import { applyMove, createSolvedCube, getCubeStateFromScramble, CubeState } from './cubeSimulator';

// Check if the 4 white edges (DF, DR, DB, DL) are solved
// In standard orientation:
// U is White (#ffffff), D is Yellow (#facc15), F is Green (#16a34a),
// R is Red (#dc2626), B is Blue (#2563eb), L is Orange (#ea580c)
// If solving White Cross on D (bottom):
// D[1] is White, B[7] is Blue (DB edge)
// D[3] is White, L[7] is Orange (DL edge)
// D[5] is White, R[7] is Red (DR edge)
// D[7] is White, F[7] is Green (DF edge)

export function isWhiteCrossSolvedOnD(state: CubeState): boolean {
  const white = '#ffffff';
  const blue = '#2563eb';
  const orange = '#ea580c';
  const red = '#dc2626';
  const green = '#16a34a';

  return (
    state.D[1] === white && state.B[7] === blue &&
    state.D[3] === white && state.L[7] === orange &&
    state.D[5] === white && state.R[7] === red &&
    state.D[7] === white && state.F[7] === green
  );
}

// Moves for cross search
const SEARCH_MOVES = [
  'U', "U'", 'U2',
  'D', "D'", 'D2',
  'L', "L'", 'L2',
  'R', "R'", 'R2',
  'F', "F'", 'F2',
  'B', "B'", 'B2'
];

export function solveWhiteCross(scramble: string): string {
  const initialState = getCubeStateFromScramble(scramble);
  if (isWhiteCrossSolvedOnD(initialState)) {
    return 'Already solved!';
  }

  // BFS search up to depth 4 or 5
  type Node = {
    state: CubeState;
    moves: string[];
    lastBase: string;
  };

  let queue: Node[] = [{ state: initialState, moves: [], lastBase: '' }];

  const maxDepth = 4;
  for (let depth = 1; depth <= maxDepth; depth++) {
    const nextQueue: Node[] = [];
    for (const node of queue) {
      for (const m of SEARCH_MOVES) {
        const base = m[0];
        if (base === node.lastBase) continue;

        const nextState = applyMove(node.state, m);
        const nextMoves = [...node.moves, m];

        if (isWhiteCrossSolvedOnD(nextState)) {
          return nextMoves.join(' ');
        }

        if (depth < maxDepth) {
          nextQueue.push({ state: nextState, moves: nextMoves, lastBase: base });
        }
      }
    }
    queue = nextQueue;
  }

  // If beyond depth 4 search, return a recommended CFOP orientation/hint
  return "z2 // White cross on bottom (Inspect: DF, DR, DB, DL edges)";
}
