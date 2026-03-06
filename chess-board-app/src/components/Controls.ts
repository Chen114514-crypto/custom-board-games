class Controls {
    private startButton: HTMLButtonElement;
    private resetButton: HTMLButtonElement;

    constructor() {
        this.startButton = document.createElement('button');
        this.startButton.innerText = 'Start Game';
        this.startButton.addEventListener('click', this.startGame.bind(this));

        this.resetButton = document.createElement('button');
        this.resetButton.innerText = 'Reset Game';
        this.resetButton.addEventListener('click', this.resetGame.bind(this));

        this.render();
    }

    private render() {
        const controlsContainer = document.createElement('div');
        controlsContainer.appendChild(this.startButton);
        controlsContainer.appendChild(this.resetButton);
        document.body.appendChild(controlsContainer);
    }

    private startGame() {
        console.log('Game started');
        // Logic to start the game
    }

    private resetGame() {
        console.log('Game reset');
        // Logic to reset the game
    }
}

export default Controls;