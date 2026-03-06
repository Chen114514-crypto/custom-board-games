class Board {
    private board: string[][];

    constructor() {
        this.board = this.initializeBoard();
    }

    private initializeBoard(): string[][] {
        const board: string[][] = [];
        for (let i = 0; i < 8; i++) {
            board[i] = Array(8).fill('');
        }
        return board;
    }

    public render(): void {
        const boardElement = document.createElement('div');
        boardElement.className = 'chess-board';
        this.board.forEach((row, rowIndex) => {
            const rowElement = document.createElement('div');
            rowElement.className = 'board-row';
            row.forEach((cell, cellIndex) => {
                const cellElement = document.createElement('div');
                cellElement.className = 'board-cell';
                cellElement.dataset.position = `${rowIndex}-${cellIndex}`;
                cellElement.innerText = cell; // Display piece if exists
                rowElement.appendChild(cellElement);
            });
            boardElement.appendChild(rowElement);
        });
        document.body.appendChild(boardElement);
    }

    public updateBoard(newBoard: string[][]): void {
        this.board = newBoard;
        this.render();
    }
}

export default Board;