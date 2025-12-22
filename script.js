const ultimateBoardElement = document.getElementById('ultimate-board');
const gameStatusElement = document.getElementById('game-status');
const resetButton = document.getElementById('reset-button');

let currentPlayer = 'X';
let ultimateBoard; // 3x3 array of small boards
let activeBigBoard = null; // [row, col] of the currently active small board
let bigBoardWins; // 3x3 array to track wins in small boards (null, 'X', 'O', 'draw')

function initializeGame() {
    ultimateBoard = Array(3).fill(null).map(() =>
        Array(3).fill(null).map(() =>
            Array(3).fill(null).map(() => Array(3).fill(null))
        )
    ); // ultimateBoard[bigRow][bigCol][smallRow][smallCol]
    bigBoardWins = Array(3).fill(null).map(() => Array(3).fill(null));
    currentPlayer = 'X';
    activeBigBoard = null; // No active board at the start, any move is allowed
    gameStatusElement.textContent = `Player ${currentPlayer}'s Turn`;
    renderBoard();
}

function renderBoard() {
    ultimateBoardElement.innerHTML = '';
    for (let bigRow = 0; bigRow < 3; bigRow++) {
        for (let bigCol = 0; bigCol < 3; bigCol++) {
            const bigBoardElement = document.createElement('div');
            bigBoardElement.classList.add('big-board');
            bigBoardElement.dataset.bigRow = bigRow;
            bigBoardElement.dataset.bigCol = bigCol;

            // Add cells first
            for (let smallRow = 0; smallRow < 3; smallRow++) {
                for (let smallCol = 0; smallCol < 3; smallCol++) {
                    const cellElement = document.createElement('div');
                    cellElement.classList.add('cell');
                    cellElement.dataset.bigRow = bigRow;
                    cellElement.dataset.bigCol = bigCol;
                    cellElement.dataset.smallRow = smallRow;
                    cellElement.dataset.smallCol = smallCol;

                    const cellValue = ultimateBoard[bigRow][bigCol][smallRow][smallCol];
                    if (cellValue) {
                        cellElement.textContent = cellValue;
                        cellElement.classList.add('occupied', cellValue.toLowerCase());
                    } else {
                        // Only add click listener if the board is not already decided
                        if (!bigBoardWins[bigRow][bigCol]) {
                           cellElement.addEventListener('click', handleCellClick);
                        }
                    }
                    bigBoardElement.appendChild(cellElement);
                }
            }

            // Now, add overlay if board is won/drawn
            if (bigBoardWins[bigRow][bigCol]) {
                bigBoardElement.classList.add(bigBoardWins[bigRow][bigCol] === 'draw' ? 'draw' : `won-${bigBoardWins[bigRow][bigCol]}`);
                const winnerOverlay = document.createElement('div');
                winnerOverlay.classList.add('winner-overlay');
                winnerOverlay.textContent = bigBoardWins[bigRow][bigCol] === 'draw' ? 'D' : bigBoardWins[bigRow][bigCol];
                bigBoardElement.appendChild(winnerOverlay);
            }

            if (activeBigBoard && activeBigBoard[0] === bigRow && activeBigBoard[1] === bigCol) {
                bigBoardElement.classList.add('active');
            } else if (activeBigBoard === null && !bigBoardWins[bigRow][bigCol]) {
                // If no active board is set (first move or sent to a completed board), all non-won boards are active
                bigBoardElement.classList.add('active');
            }

            ultimateBoardElement.appendChild(bigBoardElement);
        }
    }
}

function handleCellClick(event) {
    const { bigRow, bigCol, smallRow, smallCol } = event.target.dataset;
    const br = parseInt(bigRow);
    const bc = parseInt(bigCol);
    const sr = parseInt(smallRow);
    const sc = parseInt(smallCol);

    // Check if the clicked board is the active board
    if (activeBigBoard !== null && (br !== activeBigBoard[0] || bc !== activeBigBoard[1])) {
        // If the active board is already won/drawn, any non-won board is fair game.
        // Otherwise, only the active board is allowed.
        if (!bigBoardWins[activeBigBoard[0]][activeBigBoard[1]]) {
            alert("You must play in the active board!");
            return;
        }
    }

    // Check if the cell is already occupied or the big board is already won/drawn
    if (ultimateBoard[br][bc][sr][sc] !== null || bigBoardWins[br][bc] !== null) {
        return;
    }

    ultimateBoard[br][bc][sr][sc] = currentPlayer;
    event.target.textContent = currentPlayer;
    event.target.classList.add('occupied', currentPlayer.toLowerCase());
    event.target.removeEventListener('click', handleCellClick);

    // Check for win/draw in the small board
    const smallBoardWinner = checkSmallBoardWin(br, bc);
    if (smallBoardWinner) {
        bigBoardWins[br][bc] = smallBoardWinner;
    } else if (checkSmallBoardDraw(br, bc)) {
        bigBoardWins[br][bc] = 'draw';
    }

    // Determine the next active big board
    if (bigBoardWins[sr][sc] !== null) {
        // If the next target board is already won/drawn, the next player can play anywhere
        activeBigBoard = null;
    } else {
        activeBigBoard = [sr, sc];
    }


    // Check for win in the ultimate board
    const ultimateWinner = checkUltimateWin();
    if (ultimateWinner) {
        gameStatusElement.textContent = `Player ${ultimateWinner} wins the game!`;
        disableAllCells();
    } else if (checkUltimateDraw()) {
        gameStatusElement.textContent = "The game is a draw!";
        disableAllCells();
    } else {
        currentPlayer = currentPlayer === 'X' ? 'O' : 'X';
        gameStatusElement.textContent = `Player ${currentPlayer}'s Turn`;
    }

    renderBoard();
}

function checkSmallBoardWin(bigRow, bigCol) {
    const board = ultimateBoard[bigRow][bigCol];
    const lines = [
        // Rows
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        // Columns
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        // Diagonals
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]]
    ];

    for (const line of lines) {
        const [a, b, c] = line;
        if (board[a[0]][a[1]] && board[a[0]][a[1]] === board[b[0]][b[1]] && board[a[0]][a[1]] === board[c[0]][c[1]]) {
            return board[a[0]][a[1]];
        }
    }
    return null;
}

function checkSmallBoardDraw(bigRow, bigCol) {
    const board = ultimateBoard[bigRow][bigCol];
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (board[r][c] === null) {
                return false; // Still empty cells, not a draw yet
            }
        }
    }
    return checkSmallBoardWin(bigRow, bigCol) === null; // All cells filled, but no winner
}

function checkUltimateWin() {
    const lines = [
        // Rows
        [[0, 0], [0, 1], [0, 2]],
        [[1, 0], [1, 1], [1, 2]],
        [[2, 0], [2, 1], [2, 2]],
        // Columns
        [[0, 0], [1, 0], [2, 0]],
        [[0, 1], [1, 1], [2, 1]],
        [[0, 2], [1, 2], [2, 2]],
        // Diagonals
        [[0, 0], [1, 1], [2, 2]],
        [[0, 2], [1, 1], [2, 0]]
    ];

    for (const line of lines) {
        const [a, b, c] = line;
        if (bigBoardWins[a[0]][a[1]] && bigBoardWins[a[0]][a[1]] === bigBoardWins[b[0]][b[1]] && bigBoardWins[a[0]][a[1]] === bigBoardWins[c[0]][c[1]]) {
            return bigBoardWins[a[0]][a[1]];
        }
    }
    return null;
}

function checkUltimateDraw() {
    for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
            if (bigBoardWins[r][c] === null) {
                return false; // Still unwon big boards, not a draw yet
            }
        }
    }
    return checkUltimateWin() === null; // All big boards won/drawn, but no ultimate winner
}

function disableAllCells() {
    const cells = document.querySelectorAll('.cell');
    cells.forEach(cell => {
        cell.removeEventListener('click', handleCellClick);
        cell.classList.add('occupied'); // Visually disable them
    });
}


resetButton.addEventListener('click', initializeGame);

initializeGame();
