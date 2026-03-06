export interface Piece {
    type: string;
    color: 'white' | 'black';
    position: { x: number; y: number };
    move: (newPosition: { x: number; y: number }) => boolean;
}

export interface Board {
    squares: Array<Array<Piece | null>>;
    initialize: () => void;
    movePiece: (from: { x: number; y: number }, to: { x: number; y: number }) => boolean;
}

export interface GameState {
    currentTurn: 'white' | 'black';
    board: Board;
    history: Array<Board>;
    reset: () => void;
}