const game = document.getElementById('game');   
const squares = [];

function init() {
    for (let i = 0; i < 16; ++i) {
        const square = document.createElement('div');
        square.classList.add('square');
        game.appendChild(square);
        squares.push(square);
    }
    addNumber();
    addNumber();
    updateStyles();
}
init()

function updateStyles() {
    for (let i = 0; i < 16; ++i) {
        switch (squares[i].innerText) {
            case '2':
                squares[i].style.backgroundColor = '#eee4da';
                squares[i].style.color = '#776e65';
                break;
            case '4':
                squares[i].style.backgroundColor = '#ede0c8';
                squares[i].style.color = '#776e65';
                break;
            case '8':
                squares[i].style.backgroundColor = '#f2b179';
                squares[i].style.color = '#f9f6f2';
                break;
            case '16':
                squares[i].style.backgroundColor = '#f59563';
                squares[i].style.color = '#f9f6f2';
                break;
            case '32':
                squares[i].style.backgroundColor = '#f67c5f';
                squares[i].style.color = '#f9f6f2';
                break;
            case '64':
                squares[i].style.backgroundColor = '#f65e3b';
                squares[i].style.color = '#f9f6f2';
                break;
            case '128':
                squares[i].style.backgroundColor = '#edcf72';
                squares[i].style.color = '#f9f6f2';
                break;
            case '256':
                squares[i].style.backgroundColor = '#edcc61';
                squares[i].style.color = '#f9f6f2';
                break;
            case '512':
                squares[i].style.backgroundColor = '#edc850';
                squares[i].style.color = '#f9f6f2';
                break;
            case '1024':
                squares[i].style.backgroundColor = '#edc53f';
                squares[i].style.color = '#f9f6f2';
                break;
            case '2048':
                squares[i].style.backgroundColor = '#edc22e';
                squares[i].style.color = '#f9f6f2';
                break;
            case '4096':
                squares[i].style.backgroundColor = '#0000ff';
                squares[i].style.color = '#f9f6f2';
                break;
            case '8192':
                squares[i].style.backgroundColor = '#0000ee';
                squares[i].style.color = '#f9f6f2';
                break;
            case '16384':
                squares[i].style.backgroundColor = '#0000dd';
                squares[i].style.color = '#f9f6f2';
                break;
            case '32768':
                squares[i].style.backgroundColor = '#0000cc';
                squares[i].style.color = '#f9f6f2';
                break;
            case '65536':
                squares[i].style.backgroundColor = '#0000bb';
                squares[i].style.color = '#f9f6f2';
                break;
            case '131072':
                squares[i].style.backgroundColor = '#0000aa';
                squares[i].style.color = '#f9f6f2';
                break;
            case '262144':
                squares[i].style.backgroundColor = '#000099';
                squares[i].style.color = '#f9f6f2';
                break;
            case '524288':
                squares[i].style.backgroundColor = '#000088';
                squares[i].style.color = '#f9f6f2';
                break;
            case '1048576':
                squares[i].style.backgroundColor = '#000077';
                squares[i].style.color = '#f9f6f2';
                break;
            case '2097152':
                squares[i].style.backgroundColor = '#000066';
                squares[i].style.color = '#f9f6f2';
                break;
            case '4194304':
                squares[i].style.backgroundColor = '#000055';
                squares[i].style.color = '#f9f6f2';
                break;
            case '8388608':
                squares[i].style.backgroundColor = '#000044';
                squares[i].style.color = '#f9f6f2';
                break;
            case '16777216':
                squares[i].style.backgroundColor = '#000033';
                squares[i].style.color = '#f9f6f2';
                break;
            case '33554432':
                squares[i].style.backgroundColor = '#000022';
                squares[i].style.color = '#f9f6f2';
                break;
            case '67108864':
                squares[i].style.backgroundColor = '#000011';
                squares[i].style.color = '#f9f6f2';
                break;
            case '134217728':
                squares[i].style.backgroundColor = '#000000';
                squares[i].style.color = '#f9f6f2';
                break;
            default:
                squares[i].style.backgroundColor = '#cdc1b4';
                squares[i].style.color = '#776e65';
                break;
                

        }
    }
}

function clearBoard() {
    for (let i = 0; i < 16; ++i) {
        squares[i].innerText = '';
    }
}

function checkState() {
    let lost = true;
    for (let i = 0; i < 16; ++i) {
        if (!squares[i].innerText || i % 4 !== 3 && squares[i].innerText === squares[i + 1].innerText || i < 12 && squares[i].innerText === squares[i + 4].innerText) {
            lost = false;
        }
    }
    if (lost) {
        alert('You lose!');
        for (let i = 0; i < 16; ++i) {
            squares[i].innerText = '';
        }
    }
}

function add2048() {
    const emptySquares = squares.filter(square => !square.innerText);
    const index = Math.floor(Math.random() * emptySquares.length);
    emptySquares[index].innerText = 2048;

}

function addNumber() {
    const emptySquares = squares.filter(square => !square.innerText);
    const index = Math.floor(Math.random() * emptySquares.length);
    const twoOrFour = Math.floor(Math.random() * 10);
    if (twoOrFour === 0) {
        emptySquares[index].innerText = 4;
        return;
    }
    else {
        emptySquares[index].innerText = 2;
        return;
    }
}


function moveUp() {
    
    for (let i = 4; i < 16; ++i) {
        if (squares[i].innerText) {
            let j = i;
            while (j - 4 >= 0) {
                if (!squares[j - 4].innerText) {
                    squares[j - 4].innerText = squares[j].innerText;
                    squares[j].innerText = '';
                    j -= 4;
                }
                else if (squares[j - 4].innerText === squares[j].innerText) {
                    squares[j - 4].innerText *= 2;
                    squares[j].innerText = '';
                    break;
                }
                else {
                    break;
                }
            }
        }
    }
}

function moveDown() {

    for (let i = 11; i >= 0; --i) {
        if (squares[i].innerText) {
            let j = i;
            while (j + 4 < 16) {
                if (!squares[j + 4].innerText) {
                    squares[j + 4].innerText = squares[j].innerText;
                    squares[j].innerText = '';
                    j += 4;
                }
                else if (squares[j + 4].innerText === squares[j].innerText) {
                    squares[j + 4].innerText *= 2;
                    squares[j].innerText = '';
                    break;
                }
                else {
                    break;
                }
            }
        }
    }

}
function moveLeft() {

    for (let i = 1; i < 16; ++i) {
        if (squares[i].innerText) {
            let j = i;
            while (j % 4 !== 0) {
                if (!squares[j - 1].innerText) {
                    squares[j - 1].innerText = squares[j].innerText;
                    squares[j].innerText = '';
                    --j;
                }
                else if (squares[j - 1].innerText === squares[j].innerText) {
                    squares[j - 1].innerText *= 2;
                    squares[j].innerText = '';
                    break;
                }
                else {
                    break;
                }
            }
        }
    }
}

function moveRight() {

    for (let i = 14; i >= 0; --i) {
        if (squares[i].innerText) {
            let j = i;
            while (j % 4 !== 3) {
                if (!squares[j + 1].innerText) {
                    squares[j + 1].innerText = squares[j].innerText;
                    squares[j].innerText = '';
                    ++j;
                }
                else if (squares[j + 1].innerText === squares[j].innerText) {
                    squares[j + 1].innerText *= 2;
                    squares[j].innerText = '';
                    break;
                }
                else {
                    break;
                }
            }
        }
    }

}

let toggle2048Mode = false;

document.addEventListener('keydown', (e) => {
    currentState = squares.map(square => ":"+square.innerText+":").toString();
    let moved = false;
    switch (e.key) {
        case 'ArrowUp':
            moveUp();
            moved = true
            break;
        case 'ArrowDown':
            moveDown();
            moved = true;
            break;
        case 'ArrowLeft':
            moveLeft();
            moved = true;
            break;
        case 'ArrowRight':
            moveRight();
            moved = true;
            break;
        case ' ':
            if (toggle2048Mode) {
                toggle2048Mode = false;
                clearBoard();
                addNumber();
                addNumber();
                updateStyles();
                break;
            }
            else {
                toggle2048Mode = true;
                clearBoard();
                add2048();
                add2048();
                updateStyles();
                break;
            }
        case 'r':
            // spawn every number from 2048 to 2^26
            clearBoard();
            let count = 0;
            for (let i = 2048; i < 33554432; i *= 2) {
                squares[count].innerText = i;
                checkState();
                count++;
            }
            updateStyles();


    }
    if (moved) {
        checkState();
        if (currentState !== squares.map(square => ":"+square.innerText+":").toString()) {
            if (toggle2048Mode) {
                add2048();
                updateStyles();
            }
            else {
                addNumber();
                updateStyles();
            }
        }
    }
});