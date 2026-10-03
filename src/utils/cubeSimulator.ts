// 3x3x3 Rubik's Cube Simulator for Net Visualizer
// Faces: U (0), R (1), F (2), D (3), L (4), B (5)
// Standard WCA Colors:
// U: White (#ffffff)
// R: Red (#dc2626)
// F: Green (#16a34a)
// D: Yellow (#facc15)
// L: Orange (#ea580c)
// B: Blue (#2563eb)

export type FaceName = 'U' | 'R' | 'F' | 'D' | 'L' | 'B';

export const CUBE_COLORS: Record<FaceName, string> = {
  U: '#ffffff',
  R: '#dc2626',
  F: '#16a34a',
  D: '#facc15',
  L: '#ea580c',
  B: '#2563eb'
};

export interface CubeState {
  U: string[];
  R: string[];
  F: string[];
  D: string[];
  L: string[];
  B: string[];
}

export function createSolvedCube(): CubeState {
  return {
    U: Array(9).fill(CUBE_COLORS.U),
    R: Array(9).fill(CUBE_COLORS.R),
    F: Array(9).fill(CUBE_COLORS.F),
    D: Array(9).fill(CUBE_COLORS.D),
    L: Array(9).fill(CUBE_COLORS.L),
    B: Array(9).fill(CUBE_COLORS.B)
  };
}

function rotateFaceClockwise(face: string[]): string[] {
  // 0 1 2     6 3 0
  // 3 4 5  -> 7 4 1
  // 6 7 8     8 5 2
  return [
    face[6], face[3], face[0],
    face[7], face[4], face[1],
    face[8], face[5], face[2]
  ];
}

function rotateFaceCounterClockwise(face: string[]): string[] {
  return rotateFaceClockwise(rotateFaceClockwise(rotateFaceClockwise(face)));
}

function rotateFace180(face: string[]): string[] {
  return rotateFaceClockwise(rotateFaceClockwise(face));
}

export function applyMove(state: CubeState, move: string): CubeState {
  const cleanMove = move.trim();
  if (!cleanMove) return state;

  const face = cleanMove[0].toUpperCase() as FaceName;
  const modifier = cleanMove.slice(1);
  const turns = modifier === '2' ? 2 : modifier === "'" ? 3 : 1;

  let current = {
    U: [...state.U],
    R: [...state.R],
    F: [...state.F],
    D: [...state.D],
    L: [...state.L],
    B: [...state.B]
  };

  for (let t = 0; t < turns; t++) {
    // 1. Rotate the face itself
    current[face] = rotateFaceClockwise(current[face]);

    // 2. Rotate adjacent layers
    if (face === 'U') {
      // Adjacent: B[0,1,2] <- R[0,1,2] <- F[0,1,2] <- L[0,1,2] <- B[0,1,2]
      const temp = [current.B[0], current.B[1], current.B[2]];
      current.B[0] = current.L[0]; current.B[1] = current.L[1]; current.B[2] = current.L[2];
      current.L[0] = current.F[0]; current.L[1] = current.F[1]; current.L[2] = current.F[2];
      current.F[0] = current.R[0]; current.F[1] = current.R[1]; current.F[2] = current.R[2];
      current.R[0] = temp[0];      current.R[1] = temp[1];      current.R[2] = temp[2];
    } else if (face === 'D') {
      // Adjacent: F[6,7,8] -> R[6,7,8] -> B[6,7,8] -> L[6,7,8]
      const temp = [current.F[6], current.F[7], current.F[8]];
      current.F[6] = current.L[6]; current.F[7] = current.L[7]; current.F[8] = current.L[8];
      current.L[6] = current.B[6]; current.L[7] = current.B[7]; current.L[8] = current.B[8];
      current.B[6] = current.R[6]; current.B[7] = current.R[7]; current.B[8] = current.R[8];
      current.R[6] = temp[0];      current.R[7] = temp[1];      current.R[8] = temp[2];
    } else if (face === 'R') {
      // Adjacent: U[2,5,8] -> B[6,3,0] -> D[2,5,8] -> F[2,5,8]
      const temp = [current.U[2], current.U[5], current.U[8]];
      current.U[2] = current.F[2]; current.U[5] = current.F[5]; current.U[8] = current.F[8];
      current.F[2] = current.D[2]; current.F[5] = current.D[5]; current.F[8] = current.D[8];
      current.D[2] = current.B[6]; current.D[5] = current.B[3]; current.D[8] = current.B[0];
      current.B[6] = temp[0];      current.B[3] = temp[1];      current.B[0] = temp[2];
    } else if (face === 'L') {
      // Adjacent: U[0,3,6] -> F[0,3,6] -> D[0,3,6] -> B[8,5,2]
      const temp = [current.U[0], current.U[3], current.U[6]];
      current.U[0] = current.B[8]; current.U[3] = current.B[5]; current.U[6] = current.B[2];
      current.B[8] = current.D[0]; current.B[5] = current.D[3]; current.B[2] = current.D[6];
      current.D[0] = current.F[0]; current.D[3] = current.F[3]; current.D[6] = current.F[6];
      current.F[0] = temp[0];      current.F[3] = temp[1];      current.F[6] = temp[2];
    } else if (face === 'F') {
      // Adjacent: U[6,7,8] -> R[0,3,6] -> D[2,1,0] -> L[8,5,2]
      const temp = [current.U[6], current.U[7], current.U[8]];
      current.U[6] = current.L[8]; current.U[7] = current.L[5]; current.U[8] = current.L[2];
      current.L[8] = current.D[2]; current.L[5] = current.D[1]; current.L[2] = current.D[0];
      current.D[2] = current.R[0]; current.D[1] = current.R[3]; current.D[0] = current.R[6];
      current.R[0] = temp[0];      current.R[3] = temp[1];      current.R[6] = temp[2];
    } else if (face === 'B') {
      // Adjacent: U[2,1,0] -> L[0,3,6] -> D[6,7,8] -> R[8,5,2]
      const temp = [current.U[0], current.U[1], current.U[2]];
      current.U[0] = current.R[2]; current.U[1] = current.R[5]; current.U[2] = current.R[8];
      current.R[2] = current.D[8]; current.R[5] = current.D[7]; current.R[8] = current.D[6];
      current.D[8] = current.L[6]; current.D[7] = current.L[3]; current.D[6] = current.L[0];
      current.L[6] = temp[2];      current.L[3] = temp[1];      current.L[0] = temp[0];
    }
  }

  return current;
}

export function getCubeStateFromScramble(scramble: string): CubeState {
  let state = createSolvedCube();
  const moves = scramble.split(/\s+/).filter(Boolean);
  for (const m of moves) {
    state = applyMove(state, m);
  }
  return state;
}
