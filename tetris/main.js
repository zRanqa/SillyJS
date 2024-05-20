

const canvas = document.getElementById('renderer');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');
let viewport = {"x": 0, "y": 0};

const TETRISPOOL = ['I', 'J', 'L', 'O', 'S', 'T', 'Z'];

const PIECES = {
    'I': [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0]
    ],
    'J': [
        [1, 0, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    'L': [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    'O': [
        [1, 1],
        [1, 1]
    ],
    'S': [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    'T': [
        [0, 1, 0],
        [1, 1, 1],
        [0, 0, 0]
    ],
    'Z': [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ]
};

const pieceList = [];

const COLORS = {
    'I': 'cyan',
    'J': 'blue',
    'L': 'orange',
    'O': 'yellow',
    'S': 'lime',
    'T': 'purple',
    'Z': 'red'
};


function getNewPiece(tetrisPool) {
    if (tetrisPool == []) {
        tetrisPool = TETRISPOOL;
    }
    const index = Math.floor(Math.random() * tetrisPool.length);
    const piece = tetrisPool[index];
    tetrisPool.splice(index, 1);

    pieceList.push({"piece": piece, "x": 4, "y": 0});

    return tetrisPool;
}

function drawPieces() {
    for (let i = 0; i < pieceList.length; i++) {
        const piece = pieceList[i];
        const x = piece.x;
        const y = piece.y;

        ctx.fillStyle = COLORS[piece.piece];
        for (let j = 0; j < Math.sqrt(PIECES[piece.piece].length); j++) {
            for (let k = 0; k < 4; k++) {
                console.log(PIECES[piece.piece][j][k]);
                if (PIECES[piece.piece][j][k] == 1) {
                    ctx.fillRect((x + k) * 30, (y + j) * 30, 30, 30);
                }
            }
        }
    }
}

function movePiece(piece, dx, dy) {
    piece.x += dx;
    piece.y += dy;
}

function update() {
    for (let i = 0; i < pieceList.length; i++) {
        const piece = pieceList[i];
        movePiece(piece, 0, 1);
    }
}

function rotatePiece(piece) {
    const newPiece = [];
    for (let i = 0; i < piece.length; i++) {
        newPiece.push([]);
        for (let j = 0; j < piece.length; j++) {
            newPiece[i].push(piece[piece.length - j - 1][i]);
        }
    }
    return newPiece;
}


document.addEventListener('keydown', function(event) {
    if (event.key == 'ArrowLeft' || event.key == 'a') {
        for (let i = 0; i < pieceList.length; i++) {
            const piece = pieceList[i];
            movePiece(piece, -1, 0);
        }
    } else if (event.key == 'ArrowRight' || event.key == 'd') {
        for (let i = 0; i < pieceList.length; i++) {
            const piece = pieceList[i];
            movePiece(piece, 1, 0);
        }
    } else if (event.key == 'ArrowDown' || event.key == 's') {
        for (let i = 0; i < pieceList.length; i++) {
            const piece = pieceList[i];
            movePiece(piece, 0, 1);
        }
    } else if (event.key == 'j') {
        for (let i = 0; i < pieceList.length; i++) {
            const piece = pieceList[i];
            const newPiece = rotatePiece(PIECES[piece.piece]);
            piece.piece = newPiece;
        }
    }
});


startTime = Date.now();

function render() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawPieces();

    currentTime = Date.now() - startTime;
    if (currentTime > 1000) {
        startTime = Date.now();
        update();
    }

    requestAnimationFrame(render);
}


tetrisPool = getNewPiece(TETRISPOOL);
render();