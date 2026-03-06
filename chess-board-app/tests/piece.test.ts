import { Piece } from '../src/components/Piece';

describe('Piece', () => {
    let piece: Piece;

    beforeEach(() => {
        piece = new Piece('white', 'pawn');
    });

    test('should create a piece with correct properties', () => {
        expect(piece.color).toBe('white');
        expect(piece.type).toBe('pawn');
    });

    test('should move correctly', () => {
        const initialPosition = { x: 1, y: 1 };
        piece.setPosition(initialPosition);
        expect(piece.getPosition()).toEqual(initialPosition);

        const newPosition = { x: 1, y: 2 };
        piece.move(newPosition);
        expect(piece.getPosition()).toEqual(newPosition);
    });

    test('should not move to an invalid position', () => {
        const initialPosition = { x: 1, y: 1 };
        piece.setPosition(initialPosition);
        const invalidPosition = { x: 1, y: 3 }; // Assuming this is invalid for a pawn
        piece.move(invalidPosition);
        expect(piece.getPosition()).toEqual(initialPosition);
    });
});