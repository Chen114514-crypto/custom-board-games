import { GameState } from './store/gameState';
import { Board } from './components/Board';
import { Controls } from './components/Controls';

const gameState = new GameState();
const board = new Board(gameState);
const controls = new Controls(gameState, board);

document.addEventListener('DOMContentLoaded', () => {
    board.render();
    controls.setupEventListeners();
});