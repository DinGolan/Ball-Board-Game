/***************************/
/* Exercise 1 - Ball Board */
/***************************/
'use strict';

// Const Variables //
const DEBUG      = false;
const ROWS       = 10; 
const COLS       = 12;
const ROW_MID    = Math.floor(ROWS / 2);
const COL_MID    = Math.floor(COLS / 2);
const WALL       = 'WALL';
const FLOOR      = 'FLOOR';
const BALL       = 'BALL';
const GAMER      = 'GAMER';
const GLUE       = 'GLUE';
const GAMER_SICK = 'GAMER_SICK'; 
const GAMER_IMG  = '<img class="game-element" src="img/gamer.png">';
const BALL_IMG   = '<img class="game-element" src="img/ball.png">';
const GLUE_IMG   = '<img class="game-element" src="img/candy.png">';
const GAMER_SICK_IMG = '<img class="game-element" src="img/gamer-purple.png">';
const M_5_SECONDS    = 5000;
const M_3_SECONDS    = 3000;

// Global Variables //
var gBoard          = undefined;
var gGamePos        = undefined;
var gIsStuck        = false;
var gIsGameOver     = false;
var gBallIntervalId = null;
var gGlueIntervalId = null;
var gGlueTimeoutId  = null;
var countGeneratedBalls = 0;
var countBallCollected  = 0;

// Global Sound //
const collectSound = new Audio('sound/collect.mp3');

// Functions //
function onInitGame() {
    resetGameState();
    resetUI();
    
    gBoard = buildBoard();
    renderBoard();
    countNeighbors();

    resetGameTimers();
    startTimers();
}

function resetGameState() {
    gIsStuck            = false;
    gIsGameOver         = false;
    countBallCollected  = 0;
    countGeneratedBalls = 0;
    gGamePos = { i: 2, j: 9 };
}

function resetUI() {
    const elRestartBtn = document.querySelector('.restart-btn');
    elRestartBtn.style.display = 'none';
    
    const elBallCounter = document.querySelector('.ball-counter');
    elBallCounter.innerText = countBallCollected;

    const elNeighborsCount = document.querySelector('.neighbors-count');
    elNeighborsCount.innerText = 0;

    const elVictoryMsg = document.querySelector('.victory-message');
    elVictoryMsg.style.display = 'none';
}

function resetGameTimers() {
    if (gBallIntervalId) {
        clearInterval(gBallIntervalId);
        gBallIntervalId = null;
    }

    if (gGlueIntervalId) {
        clearInterval(gGlueIntervalId);
        gGlueIntervalId = null;
    }

    if (gGlueTimeoutId) {
        clearTimeout(gGlueTimeoutId);
        gGlueTimeoutId = null;
    }
}

function startTimers() {
    gBallIntervalId = setInterval(addRandomBall, M_5_SECONDS);
    gGlueIntervalId = setInterval(addRandomGlue, M_5_SECONDS);
}

function countNeighbors() {
    let countNeigh = 0;

    for (let i = gGamePos.i - 1; i <= gGamePos.i + 1; i++) {
        if (i < 0 || i >= ROWS) continue;
        
        for (let j = gGamePos.j - 1; j <= gGamePos.j + 1; j++) {    
            if (j < 0 || j >= COLS) continue;
            if (i === gGamePos.i && j === gGamePos.j) continue;

            const currCell = gBoard[i][j];
            if (currCell.gameElement === 'BALL') {
                countNeigh++;
            }   
        }
    }

    const elNeighborsCount     = document.querySelector('.neighbors-count');
    elNeighborsCount.innerText = countNeigh;
}

function buildBoard() {
    const board = createMat(ROWS, COLS);
    
    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            board[i][j] = { type: FLOOR, gameElement: null };

            if (i === 0 || i === ROWS - 1 || j === 0 || j === COLS - 1) {
                board[i][j].type = isSecretPassagePosition(i, j) ? 'FLOOR' : 'WALL';
            }
        }
    }
    
    board[gGamePos.i][gGamePos.j].gameElement = GAMER;

    // [Debug] //
    if (DEBUG) addDebugBalls(board);

    return board;
}

function createMat(rows, cols) {
    const mat = [];

    for (let i = 0; i < rows; i++) {
        const row = [];
        
        for (let j = 0; j < cols; j++) {
            row.push('');
        }

        mat.push(row);
    }

    return mat;
}

function addDebugBalls(board) {
    const debugPositions = [
        { i: 0,        j: COL_MID  },
        { i: ROW_MID,  j: 0        },
        { i: ROW_MID,  j: COLS - 1 },
        { i: ROWS - 1, j: COL_MID  }
    ];

    for (const debugPos of debugPositions) {
        board[debugPos.i][debugPos.j].gameElement = BALL;
        countGeneratedBalls++;
    }
}

function renderBoard() {
    let strHTML = '';

    for (let i = 0; i < ROWS; i++) {
        strHTML += '<tr>';

        for (let j = 0; j < COLS; j++) {
            const currCell = gBoard[i][j];
            strHTML       += getCellHTML(currCell, i, j);
        }

        strHTML += '</tr>';
    }

    const elBoard     = document.querySelector('.board');
    elBoard.innerHTML = strHTML; 
}

function getCellHTML(currCell, i, j) {
    const cellClass = getClassName({ i, j });
    const typeClass = currCell.type === WALL ? 'wall' : 'floor';
    const content   = getGameElementHTML(currCell.gameElement);

    return `<td class="${cellClass} ${typeClass}" onclick="moveTo(${i}, ${j})">${content}</td>`;
}

function getGameElementHTML(gameElement) {
    switch (gameElement) {
        case GAMER: return GAMER_IMG;
        case BALL:  return BALL_IMG;
        case GLUE:  return GLUE_IMG;
        default:    return '';
    }
}

function renderCell(position, value) {
    const cellSelector = '.' + getClassName(position);
    const elCell       = document.querySelector(cellSelector);
    elCell.innerHTML   = value;
}

function getClassName(position) {
    return `cell-${position.i}-${position.j}`;
}

function addRandomBall() {  
    const emptyRandomPos = getRandomEmptyCell();
    if (!emptyRandomPos) return;
    
    countGeneratedBalls++;
    gBoard[emptyRandomPos.i][emptyRandomPos.j].gameElement = BALL;
    renderCell(emptyRandomPos, BALL_IMG);

    // Check if the random position is a neighbor of the player and update the neighbor count if true //
    if (isSurroundingCell(emptyRandomPos)) countNeighbors();
}

function getRandomEmptyCell() {
    const emptyPositions = getEmptyPositions();
    if (emptyPositions.length === 0) return null;
    
    const randomIdx = Math.floor(Math.random() * emptyPositions.length);
    return emptyPositions[randomIdx];
}

/**
 * Explanations :
 * - Checks if a given position is a surrounding cell relative to the global game position (`gGamePos`).
 * - A surrounding cell is defined as a cell that is adjacent (including diagonally) to the current game position,
 *   but not the same as the current game position itself.
 **/
function isSurroundingCell(position) {
    // The `gGamePos` Itself //
    if (gGamePos.i === position.i && 
        gGamePos.j === position.j) return false;
    
    const diffI = Math.abs(gGamePos.i - position.i);
    const diffJ = Math.abs(gGamePos.j - position.j);
    return diffI <= 1 && diffJ <= 1;
}

function getEmptyPositions() {
    let emptyPositions = [];

    for (let i = 0; i < ROWS; i++) {
        for (let j = 0; j < COLS; j++) {
            let currCell = gBoard[i][j];
            if (currCell.type === FLOOR && currCell.gameElement === null) {
                let emptyPos = { i: i, j: j };
                emptyPositions.push(emptyPos);
            }
        }
    }

    return emptyPositions;
}

function addRandomGlue() {
    const emptyRandomPos = getRandomEmptyCell();
    if (!emptyRandomPos) return;

    gBoard[emptyRandomPos.i][emptyRandomPos.j].gameElement = GLUE;
    renderCell(emptyRandomPos, GLUE_IMG);

    setTimeout(removeGlue, M_3_SECONDS, emptyRandomPos);
}

function removeGlue(position) {
    let currCell = gBoard[position.i][position.j];

    if (currCell.gameElement === 'GLUE') {
        currCell.gameElement = null;
        renderCell(position, '');
    }
}

/**
 * Explanations :
 * - Moves the player to the specified target cell if the move is valid.
 * - Handles interactions with game elements such as walls, balls, and glue traps.
 **/
function moveTo(iTargetCell, jTargetCell) {
    if (gIsStuck || gIsGameOver) return;
    
    const targetSecretPos = getExitToOtherSide(iTargetCell, jTargetCell);
    if (targetSecretPos) {
        iTargetCell = targetSecretPos.i;
        jTargetCell = targetSecretPos.j;
    }

    if (isOutOfBounds(iTargetCell, jTargetCell)) return;

    const targetCell = gBoard[iTargetCell][jTargetCell];
    if (targetCell.type === WALL) return;

    const fromPos = { i: gGamePos.i, j: gGamePos.j };
    const toPos   = { i: iTargetCell, j: jTargetCell };
    if (!isLegalMove(fromPos, toPos)) return;    

    if (targetCell.gameElement === BALL) {
        handleBallCollection(targetCell);
    } 
    else if (targetCell.gameElement === GLUE) {
        handleGlueTrap(iTargetCell, jTargetCell);
    }

    updatePlayerPosition(iTargetCell, jTargetCell);
}

/**
 * Explanations :
 * - Determines the secret position when the target cell is out of bounds and the current game position
 *   is a secret passage coordinate (Maybe). 
 * - If the conditions are met, it returns the target secret position. Otherwise, it returns null.
 **/
function getExitToOtherSide(iTargetCell, jTargetCell) {
    const currPos = gGamePos;

    if (!isValidSecretPassageCell(currPos.i, currPos.j)) return null;

    if (currPos.i === 0        && iTargetCell === -1)   return { i: ROWS - 1 , j: currPos.j };
    if (currPos.i === ROWS - 1 && iTargetCell === ROWS) return { i: 0        , j: currPos.j };
    if (currPos.j === 0        && jTargetCell === -1)   return { i: currPos.i, j: COLS - 1  };
    if (currPos.j === COLS - 1 && jTargetCell === COLS) return { i: currPos.i, j: 0         };

    return null;
}

function isOutOfBounds(iTargetCell, jTargetCell) {
    return iTargetCell < 0 || iTargetCell >= ROWS || 
           jTargetCell < 0 || jTargetCell >= COLS;
}

/**
 * Explanations :
 * - Determines if a move from one position to another is legal.
 * - A move is considered legal if the positions are direct neighbors (horizontally or vertically adjacent) or if both positions are
 *   secret passage coordinates.
 **/
function isLegalMove(fromPos, toPos) {
    const iAbsDiff = Math.abs(toPos.i - fromPos.i); 
    const jAbsDiff = Math.abs(toPos.j - fromPos.j);
    const isDirectNeighbor = (iAbsDiff === 1 && jAbsDiff === 0) ||
                             (iAbsDiff === 0 && jAbsDiff === 1);

    const isSecretFrom     = isValidSecretPassageCell(fromPos.i, fromPos.j);
    const isSecretTo       = isValidSecretPassageCell(toPos.i, toPos.j);
    const isSecretToSecret = isSecretFrom && isSecretTo;

    return isDirectNeighbor || isSecretToSecret;
}

/**
 * Explanations :
 * - Determines if the given coordinates (i, j) represent a passage entrance in a grid. 
 * - A passage entrance is defined as one of the following :
 *   > The (Top - Middle) cell of the grid.
 *   > The (Middle - Left) cell of the grid.
 *   > The (Bottom - Middle) cell of the grid.
 *   > The (Middle - Right) cell of the grid.
 **/
function isSecretPassagePosition(i, j) {
    return (i === 0        && j === COL_MID) ||
           (i === ROW_MID  && j === 0)       ||
           (i === ROWS - 1 && j === COL_MID) ||
           (i === ROW_MID  && j === COLS - 1);
}

/**
 * Explanations :
 * - Determines if the specified cell coordinates correspond to a secret passage entrance.
 */
function isValidSecretPassageCell(i, j) {
    const currCell = gBoard[i][j];
    return (currCell.type === 'FLOOR') && isSecretPassagePosition(i, j);
}

function handleBallCollection(targetCell) {
    countBallCollected++;

    let elBallCounter = document.querySelector('.ball-counter');
    elBallCounter.innerText = countBallCollected;

    collectSound.play();

    targetCell.gameElement = null;

    if (countBallCollected >= countGeneratedBalls) {
        victoryMessage();
        endGame();
    }
}

function victoryMessage() {
    const elVictoryMsg = document.querySelector('.victory-message');
    elVictoryMsg.style.display = 'block';
}

function endGame() {
    gIsGameOver = true;
    if (gBallIntervalId) clearInterval(gBallIntervalId);
    if (gGlueIntervalId) clearInterval(gGlueIntervalId);
    let elRestartBtn = document.querySelector('.restart-btn');
    elRestartBtn.style.display = 'block';
}

function handleGlueTrap(iTargetCell, jTargetCell) {
    freezePlayerTemporarily();

    const targetPos = { i: iTargetCell, j: jTargetCell };
    setTimeout(removeGlue, M_3_SECONDS * 2, targetPos);
}

function freezePlayerTemporarily() {
    if (gGlueTimeoutId) clearTimeout(gGlueTimeoutId);

    gIsStuck = true;
    
    gGlueTimeoutId = setTimeout(() => {
        gIsStuck       = false;
        gGlueTimeoutId = null;
        gBoard[gGamePos.i][gGamePos.j].gameElement = GAMER;
        renderCell(gGamePos, GAMER_IMG);
    }, M_3_SECONDS);
}

function updatePlayerPosition(iTargetCell, jTargetCell) {
    if (gGamePos.i === iTargetCell && gGamePos.j === jTargetCell) return;

    // Clean the Current Position //
    gBoard[gGamePos.i][gGamePos.j].gameElement = null; // Model //
    renderCell(gGamePos, '');                          // DOM   //

    // Move the Selected Position //
    gGamePos.i = iTargetCell;
    gGamePos.j = jTargetCell;

    const playerType = gIsStuck ? GAMER_SICK : GAMER;
    const playerImg  = gIsStuck ? GAMER_SICK_IMG : GAMER_IMG;

    gBoard[gGamePos.i][gGamePos.j].gameElement = playerType; // Model //
    renderCell(gGamePos, playerImg);                         // DOM   //

    // Display Neighbors //
    countNeighbors();
}

function onHandleKey(event) {
    const i = gGamePos.i;
    const j = gGamePos.j;

    switch (event.key) {
        case 'ArrowLeft':
            moveTo(i, j - 1);
            break;
        
        case 'ArrowRight':
            moveTo(i, j + 1);
            break;
        
        case 'ArrowUp':
            moveTo(i - 1, j);
            break;
        
        case 'ArrowDown':
            moveTo(i + 1, j);
            break;
    }
}