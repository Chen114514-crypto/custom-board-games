import { Board } from '../src/components/Board';

describe('Board', () => {
    let board: Board;

    beforeEach(() => {
        board = new Board();
    });

    test('should initialize with the correct setup', () => {
        const initialSetup = board.getBoardState();
        expect(initialSetup).toEqual(expect.arrayContaining([
            expect.arrayContaining([expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object)]),
            expect.arrayContaining([expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object)]),
            expect.arrayContaining([null, null, null, null, null, null, null, null]),
            expect.arrayContaining([null, null, null, null, null, null, null, null]),
            expect.arrayContaining([null, null, null, null, null, null, null, null]),
            expect.arrayContaining([expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object)]),
            expect.arrayContaining([expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object)]),
            expect.arrayContaining([expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object), expect.any(Object)]),
        ]));
    });

    test('should allow a piece to move to a valid position', () => {
        board.movePiece('e2', 'e4');
        const boardState = board.getBoardState();
        expect(boardState[4][4]).toBeDefined();
        expect(boardState[6][4]).toBeNull();
    });

    test('should not allow a piece to move to an invalid position', () => {
        const moveResult = board.movePiece('e2', 'e5');
        expect(moveResult).toBe(false);
        const boardState = board.getBoardState();
        expect(boardState[4][4]).toBeUndefined();
        expect(boardState[6][4]).toBeDefined();
    });
});