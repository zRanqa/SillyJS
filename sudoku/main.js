
(function(root){
    var sudoku = root.sudoku = {};  // Global reference to the sudoku library

    sudoku.DIGITS = "123456789";    // Allowed sudoku.DIGITS
    var ROWS = "ABCDEFGHI";         // Row lables
    var COLS = sudoku.DIGITS;       // Column lables
    var SQUARES = null;             // Square IDs

    var UNITS = null;               // All units (row, column, or box)
    var SQUARE_UNITS_MAP = null;    // Squares -> units map
    var SQUARE_PEERS_MAP = null;    // Squares -> peers map
    
    var MIN_GIVENS = 17;            // Minimum number of givens 
    var NR_SQUARES = 81;            // Number of squares
    
    // Define difficulties by how many squares are given to the player in a new
    // puzzle.
    var DIFFICULTY = {
        "easy":         62,
        "medium":       53,
        "hard":         44,
        "very-hard":    35,
        "insane":       26,
        "inhuman":      17,
    };

    // Blank character and board representation
    sudoku.BLANK_CHAR = '.';
    sudoku.BLANK_BOARD = "...................................................."+
            ".............................";

    // Init
    // -------------------------------------------------------------------------
    function initialize(){
        /* Initialize the Sudoku library (invoked after library load)
        */
        SQUARES             = sudoku._cross(ROWS, COLS);
        UNITS               = sudoku._get_all_units(ROWS, COLS);
        SQUARE_UNITS_MAP    = sudoku._get_square_units_map(SQUARES, UNITS);
        SQUARE_PEERS_MAP    = sudoku._get_square_peers_map(SQUARES, 
                                    SQUARE_UNITS_MAP);
    }

    // Generate
    // -------------------------------------------------------------------------
    sudoku.generate = function(difficulty, unique){
        /* Generate a new Sudoku puzzle of a particular `difficulty`, e.g.,
        
            // Generate an "easy" sudoku puzzle
            sudoku.generate("easy");
            
        
        Difficulties are as follows, and represent the number of given squares:
        
                "easy":         61
                "medium":       52
                "hard":         43
                "very-hard":    34
                "insane":       25
                "inhuman":      17
            
            
        You may also enter a custom number of squares to be given, e.g.,
        
            // Generate a new Sudoku puzzle with 60 given squares
            sudoku.generate(60)
    
    
        `difficulty` must be a number between 17 and 81 inclusive. If it's
        outside of that range, `difficulty` will be set to the closest bound,
        e.g., 0 -> 17, and 100 -> 81.
        
        
        By default, the puzzles are unique, uless you set `unique` to false. 
        (Note: Puzzle uniqueness is not yet implemented, so puzzles are *not* 
        guaranteed to have unique solutions)
        
        TODO: Implement puzzle uniqueness
        */
        
        // If `difficulty` is a string or undefined, convert it to a number or
        // default it to "easy" if undefined.
        if(typeof difficulty === "string" || typeof difficulty === "undefined"){
            difficulty = DIFFICULTY[difficulty] || DIFFICULTY.easy;
        }
        
        // Force difficulty between 17 and 81 inclusive
        difficulty = sudoku._force_range(difficulty, NR_SQUARES + 1, 
                MIN_GIVENS);
        
        // Default unique to true
        unique = unique || true;
        
        // Get a set of squares and all possible candidates for each square
        var blank_board = "";
        for(var i = 0; i < NR_SQUARES; ++i){
            blank_board += '.';
        }
        var candidates = sudoku._get_candidates_map(blank_board);
        
        // For each item in a shuffled list of squares
        var shuffled_squares = sudoku._shuffle(SQUARES);
        for(var si in shuffled_squares){
            var square = shuffled_squares[si];
            
            // If an assignment of a random chioce causes a contradictoin, give
            // up and try again
            var rand_candidate_idx = 
                    sudoku._rand_range(candidates[square].length);
            var rand_candidate = candidates[square][rand_candidate_idx];
            if(!sudoku._assign(candidates, square, rand_candidate)){
                break;
            }
            
            // Make a list of all single candidates
            var single_candidates = [];
            for(var si in SQUARES){
                var square = SQUARES[si];
                
                if(candidates[square].length == 1){
                    single_candidates.push(candidates[square]);
                }
            }
            
            // If we have at least difficulty, and the unique candidate count is
            // at least 8, return the puzzle!
            if(single_candidates.length >= difficulty && 
                    sudoku._strip_dups(single_candidates).length >= 8){
                var board = "";
                var givens_idxs = [];
                for(var i in SQUARES){
                    var square = SQUARES[i];
                    if(candidates[square].length == 1){
                        board += candidates[square];
                        givens_idxs.push(i);
                    } else {
                        board += sudoku.BLANK_CHAR;
                    }
                }
                
                // If we have more than `difficulty` givens, remove some random
                // givens until we're down to exactly `difficulty`
                var nr_givens = givens_idxs.length;
                if(nr_givens > difficulty){
                    givens_idxs = sudoku._shuffle(givens_idxs);
                    for(var i = 0; i < nr_givens - difficulty; ++i){
                        var target = parseInt(givens_idxs[i]);
                        board = board.substr(0, target) + sudoku.BLANK_CHAR + 
                            board.substr(target + 1);
                    }
                }
                
                // Double check board is solvable
                // TODO: Make a standalone board checker. Solve is expensive.
                if(sudoku.solve(board)){
                    return board;
                }
            }
        }
        
        // Give up and try a new puzzle
        return sudoku.generate(difficulty);
    };

    // Solve
    // -------------------------------------------------------------------------
    sudoku.solve = function(board, reverse){
        /* Solve a sudoku puzzle given a sudoku `board`, i.e., an 81-character 
        string of sudoku.DIGITS, 1-9, and spaces identified by '.', representing the
        squares. There must be a minimum of 17 givens. If the given board has no
        solutions, return false.
        
        Optionally set `reverse` to solve "backwards", i.e., rotate through the
        possibilities in reverse. Useful for checking if there is more than one
        solution.
        */
        
        // Assure a valid board
        var report = sudoku.validate_board(board);
        if(report !== true){
            throw report;
        }
        
        // Check number of givens is at least MIN_GIVENS
        var nr_givens = 0;
        for(var i in board){
            if(board[i] !== sudoku.BLANK_CHAR && sudoku._in(board[i], sudoku.DIGITS)){
                ++nr_givens;
            }
        }
        if(nr_givens < MIN_GIVENS){
            throw "Too few givens. Minimum givens is " + MIN_GIVENS;
        }

        // Default reverse to false
        reverse = reverse || false;

        var candidates = sudoku._get_candidates_map(board);
        var result = sudoku._search(candidates, reverse);
        
        if(result){
            var solution = "";
            for(var square in result){
                solution += result[square];
            }
            return solution;
        }
        return false;
    };

    sudoku.get_candidates = function(board){
        /* Return all possible candidatees for each square as a grid of 
        candidates, returnning `false` if a contradiction is encountered.
        
        Really just a wrapper for sudoku._get_candidates_map for programmer
        consumption.
        */
        
        // Assure a valid board
        var report = sudoku.validate_board(board);
        if(report !== true){
            throw report;
        }
        
        // Get a candidates map
        var candidates_map = sudoku._get_candidates_map(board);
        
        // If there's an error, return false
        if(!candidates_map){
            return false;
        }
        
        // Transform candidates map into grid
        var rows = [];
        var cur_row = [];
        var i = 0;
        for(var square in candidates_map){
            var candidates = candidates_map[square];
            cur_row.push(candidates);
            if(i % 9 == 8){
                rows.push(cur_row);
                cur_row = [];
            }
            ++i;
        }
        return rows;
    }

    sudoku._get_candidates_map = function(board){
        /* Get all possible candidates for each square as a map in the form
        {square: sudoku.DIGITS} using recursive constraint propagation. Return `false` 
        if a contradiction is encountered
        */
        
        // Assure a valid board
        var report = sudoku.validate_board(board);
        if(report !== true){
            throw report;
        }
        
        var candidate_map = {};
        var squares_values_map = sudoku._get_square_vals_map(board);
        
        // Start by assigning every digit as a candidate to every square
        for(var si in SQUARES){
            candidate_map[SQUARES[si]] = sudoku.DIGITS;
        }
        
        // For each non-blank square, assign its value in the candidate map and
        // propigate.
        for(var square in squares_values_map){
            var val = squares_values_map[square];
            
            if(sudoku._in(val, sudoku.DIGITS)){
                var new_candidates = sudoku._assign(candidate_map, square, val);
                
                // Fail if we can't assign val to square
                if(!new_candidates){
                    return false;
                }
            }
        }
        
        return candidate_map;
    };

    sudoku._search = function(candidates, reverse){
        /* Given a map of squares -> candiates, using depth-first search, 
        recursively try all possible values until a solution is found, or false
        if no solution exists. 
        */
        
        // Return if error in previous iteration
        if(!candidates){
            return false;
        }
        
        // Default reverse to false
        reverse = reverse || false;
        
        // If only one candidate for every square, we've a solved puzzle!
        // Return the candidates map.
        var max_nr_candidates = 0;
        var max_candidates_square = null;
        for(var si in SQUARES){
            var square = SQUARES[si];
            
            var nr_candidates = candidates[square].length;
                
            if(nr_candidates > max_nr_candidates){
                max_nr_candidates = nr_candidates;
                max_candidates_square = square;
            }
        }
        if(max_nr_candidates === 1){
            return candidates;
        }
        
        // Choose the blank square with the fewest possibilities > 1
        var min_nr_candidates = 10;
        var min_candidates_square = null;
        for(si in SQUARES){
            var square = SQUARES[si];
            
            var nr_candidates = candidates[square].length;
            
            if(nr_candidates < min_nr_candidates && nr_candidates > 1){
                min_nr_candidates = nr_candidates;
                min_candidates_square = square;
            }
        }
        
        // Recursively search through each of the candidates of the square 
        // starting with the one with fewest candidates.
        
        // Rotate through the candidates forwards
        var min_candidates = candidates[min_candidates_square];
        if(!reverse){
            for(var vi in min_candidates){
                var val = min_candidates[vi];
                
                // TODO: Implement a non-rediculous deep copy function
                var candidates_copy = JSON.parse(JSON.stringify(candidates));
                var candidates_next = sudoku._search(
                    sudoku._assign(candidates_copy, min_candidates_square, val)
                );
                
                if(candidates_next){
                    return candidates_next;
                }
            }
            
        // Rotate through the candidates backwards
        } else {
            for(var vi = min_candidates.length - 1; vi >= 0; --vi){
                var val = min_candidates[vi];
                
                // TODO: Implement a non-rediculous deep copy function
                var candidates_copy = JSON.parse(JSON.stringify(candidates));
                var candidates_next = sudoku._search(
                    sudoku._assign(candidates_copy, min_candidates_square, val), 
                    reverse
                );
                
                if(candidates_next){
                    return candidates_next;
                }
            }
        }
        
        // If we get through all combinations of the square with the fewest
        // candidates without finding an answer, there isn't one. Return false.
        return false;
    };

    sudoku._assign = function(candidates, square, val){
        /* Eliminate all values, *except* for `val`, from `candidates` at 
        `square` (candidates[square]), and propagate. Return the candidates map
        when finished. If a contradiciton is found, return false.
        
        WARNING: This will modify the contents of `candidates` directly.
        */

        // Grab a list of canidates without 'val'
        var other_vals = candidates[square].replace(val, "");

        // Loop through all other values and eliminate them from the candidates 
        // at the current square, and propigate. If at any point we get a 
        // contradiction, return false.
        for(var ovi in other_vals){
            var other_val = other_vals[ovi];

            var candidates_next =
                sudoku._eliminate(candidates, square, other_val);

            if(!candidates_next){
                //console.log("Contradiction found by _eliminate.");
                return false;
            }
        }

        return candidates;
    };

    sudoku._eliminate = function(candidates, square, val){
        /* Eliminate `val` from `candidates` at `square`, (candidates[square]),
        and propagate when values or places <= 2. Return updated candidates,
        unless a contradiction is detected, in which case, return false.
        
        WARNING: This will modify the contents of `candidates` directly.
        */

        // If `val` has already been eliminated from candidates[square], return
        // with candidates.
        if(!sudoku._in(val, candidates[square])){
            return candidates;
        }

        // Remove `val` from candidates[square]
        candidates[square] = candidates[square].replace(val, '');
           
        // If the square has only candidate left, eliminate that value from its 
        // peers
        var nr_candidates = candidates[square].length;
        if(nr_candidates === 1){
            var target_val = candidates[square];
            
            for(var pi in SQUARE_PEERS_MAP[square]){
                var peer = SQUARE_PEERS_MAP[square][pi];
                
                var candidates_new = 
                        sudoku._eliminate(candidates, peer, target_val);
                        
                if(!candidates_new){
                    return false;
                }
            }
        
        // Otherwise, if the square has no candidates, we have a contradiction.
        // Return false.
        } if(nr_candidates === 0){
            return false;
        }
        
        // If a unit is reduced to only one place for a value, then assign it
        for(var ui in SQUARE_UNITS_MAP[square]){
            var unit = SQUARE_UNITS_MAP[square][ui];
            
            var val_places = [];
            for(var si in unit){
                var unit_square = unit[si];
                if(sudoku._in(val, candidates[unit_square])){
                    val_places.push(unit_square);
                }
            }
            
            // If there's no place for this value, we have a contradition!
            // return false
            if(val_places.length === 0){
                return false;
                
            // Otherwise the value can only be in one place. Assign it there.
            } else if(val_places.length === 1){
                var candidates_new = 
                    sudoku._assign(candidates, val_places[0], val);
                
                if(!candidates_new){
                    return false;
                }
            }
        }
        
        return candidates;
    };

    
    // Square relationships
    // -------------------------------------------------------------------------
    // Squares, and their relationships with values, units, and peers.
    
    sudoku._get_square_vals_map = function(board){
        /* Return a map of squares -> values
        */
        var squares_vals_map = {};
        
        // Make sure `board` is a string of length 81
        if(board.length != SQUARES.length){
            throw "Board/squares length mismatch.";
            
        } else {
            for(var i in SQUARES){
                squares_vals_map[SQUARES[i]] = board[i];
            }
        }
        
        return squares_vals_map;
    };

    sudoku._get_square_units_map = function(squares, units){
        /* Return a map of `squares` and their associated units (row, col, box)
        */
        var square_unit_map = {};

        // For every square...
        for(var si in squares){
            var cur_square = squares[si];

            // Maintain a list of the current square's units
            var cur_square_units = [];

            // Look through the units, and see if the current square is in it,
            // and if so, add it to the list of of the square's units.
            for(var ui in units){
                var cur_unit = units[ui];

                if(cur_unit.indexOf(cur_square) !== -1){
                    cur_square_units.push(cur_unit);
                }
            }

            // Save the current square and its units to the map
            square_unit_map[cur_square] = cur_square_units;
        }

        return square_unit_map;
    };

    sudoku._get_square_peers_map = function(squares, units_map){
        /* Return a map of `squares` and their associated peers, i.e., a set of
        other squares in the square's unit.
        */
        var square_peers_map = {};

        // For every square...
        for(var si in squares){
            var cur_square = squares[si];
            var cur_square_units = units_map[cur_square];

            // Maintain list of the current square's peers
            var cur_square_peers = [];

            // Look through the current square's units map...
            for(var sui in cur_square_units){
                var cur_unit = cur_square_units[sui];

                for(var ui in cur_unit){
                    var cur_unit_square = cur_unit[ui];

                    if(cur_square_peers.indexOf(cur_unit_square) === -1 && 
                            cur_unit_square !== cur_square){
                        cur_square_peers.push(cur_unit_square);
                    }
                }
            }
            
            // Save the current square an its associated peers to the map
            square_peers_map[cur_square] = cur_square_peers;
        }

        return square_peers_map;
    };
    
    sudoku._get_all_units = function(rows, cols){
        /* Return a list of all units (rows, cols, boxes)
        */
        var units = [];

        // Rows
        for(var ri in rows){
            units.push(sudoku._cross(rows[ri], cols));
        }

        // Columns
        for(var ci in cols){
           units.push(sudoku._cross(rows, cols[ci]));
        }

        // Boxes
        var row_squares = ["ABC", "DEF", "GHI"];
        var col_squares = ["123", "456", "789"];
        for(var rsi in row_squares){
            for(var csi in col_squares){
                units.push(sudoku._cross(row_squares[rsi], col_squares[csi]));
            }
        }

        return units;
    };
    

    // Conversions
    // -------------------------------------------------------------------------
    sudoku.board_string_to_grid = function(board_string){
        /* Convert a board string to a two-dimensional array
        */
        var rows = [];
        var cur_row = [];
        for(var i in board_string){
            cur_row.push(board_string[i]);
            if(i % 9 == 8){
                rows.push(cur_row);
                cur_row = [];
            }
        }
        return rows;
    };
    
    sudoku.board_grid_to_string = function(board_grid){
        /* Convert a board grid to a string
        */
        var board_string = "";
        for(var r = 0; r < 9; ++r){
            for(var c = 0; c < 9; ++c){
                board_string += board_grid[r][c];
            }   
        }
        return board_string;
    };
    

    // Utility
    // -------------------------------------------------------------------------

    sudoku.print_board = function(board){
        /* Print a sudoku `board` to the console.
        */
        
        // Assure a valid board
        var report = sudoku.validate_board(board);
        if(report !== true){
            throw report;
        }
        
        var V_PADDING = " ";  // Insert after each square
        var H_PADDING = '\n'; // Insert after each row
        
        var V_BOX_PADDING = "  "; // Box vertical padding
        var H_BOX_PADDING = '\n'; // Box horizontal padding

        var display_string = "";
        
        for(var i in board){
            var square = board[i];
            
            // Add the square and some padding
            display_string += square + V_PADDING;
            
            // Vertical edge of a box, insert v. box padding
            if(i % 3 === 2){
                display_string += V_BOX_PADDING;
            }
            
            // End of a line, insert horiz. padding
            if(i % 9 === 8){
                display_string += H_PADDING;
            }
            
            // Horizontal edge of a box, insert h. box padding
            if(i % 27 === 26){
                display_string += H_BOX_PADDING;
            }
        }

        console.log(display_string);
    };

    sudoku.validate_board = function(board){
        /* Return if the given `board` is valid or not. If it's valid, return
        true. If it's not, return a string of the reason why it's not.
        */
        
        // Check for empty board
        if(!board){
            return "Empty board";
        }
        
        // Invalid board length
        if(board.length !== NR_SQUARES){
            return "Invalid board size. Board must be exactly " + NR_SQUARES +
                    " squares.";
        }
        
        // Check for invalid characters
        for(var i in board){
            if(!sudoku._in(board[i], sudoku.DIGITS) && board[i] !== sudoku.BLANK_CHAR){
                return "Invalid board character encountered at index " + i + 
                        ": " + board[i];
            }
        }
        
        // Otherwise, we're good. Return true.
        return true;
    };

    sudoku._cross = function(a, b){
        /* Cross product of all elements in `a` and `b`, e.g.,
        sudoku._cross("abc", "123") ->
        ["a1", "a2", "a3", "b1", "b2", "b3", "c1", "c2", "c3"]
        */
        var result = [];
        for(var ai in a){
            for(var bi in b){
                result.push(a[ai] + b[bi]);
            }
        }
        return result;
    };
    
    sudoku._in = function(v, seq){
        /* Return if a value `v` is in sequence `seq`.
        */
        return seq.indexOf(v) !== -1;
    };
    
    sudoku._first_true = function(seq){
        /* Return the first element in `seq` that is true. If no element is
        true, return false.
        */
        for(var i in seq){
            if(seq[i]){
                return seq[i];
            }
        }
        return false;
    };

    sudoku._shuffle = function(seq){
        /* Return a shuffled version of `seq`
        */
        
        // Create an array of the same size as `seq` filled with false
        var shuffled = [];
        for(var i = 0; i < seq.length; ++i){
            shuffled.push(false);
        }
        
        for(var i in seq){
            var ti = sudoku._rand_range(seq.length);
            
            while(shuffled[ti]){
                ti = (ti + 1) > (seq.length - 1) ? 0 : (ti + 1);
            }
            
            shuffled[ti] = seq[i];
        }
        
        return shuffled;
    };

    sudoku._rand_range = function(max, min){
        /* Get a random integer in the range of `min` to `max` (non inclusive).
        If `min` not defined, default to 0. If `max` not defined, throw an 
        error.
        */
        min = min || 0;
        if(max){
            return Math.floor(Math.random() * (max - min)) + min;
        } else {
            throw "Range undefined";
        }
    };

    sudoku._strip_dups = function(seq){
        /* Strip duplicate values from `seq`
        */
        var seq_set = [];
        var dup_map = {};
        for(var i in seq){
            var e = seq[i];
            if(!dup_map[e]){
                seq_set.push(e);
                dup_map[e] = true;
            }
        }
        return seq_set;
    };

    sudoku._force_range = function(nr, max, min){
        /* Force `nr` to be within the range from `min` to, but not including, 
        `max`. `min` is optional, and will default to 0. If `nr` is undefined,
        treat it as zero.
        */
        min = min || 0
        nr = nr || 0
        if(nr < min){
            return min;
        }
        if(nr > max){
            return max;
        }
        return nr
    }

    // Initialize library after load
    initialize();

// Pass whatever the root object is, lsike 'window' in browsers
})(this);

class Button {
    constructor(x, y, width, height, text, rgb, ID) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.text = text;
        this.rgb = 'rgb(' + rgb + ')';
        this.id = ID;
    }

    draw(ctx) {
        ctx.fillStyle = 'black';
        ctx.fillRect(this.x, this.y, this.width, this.height);
        ctx.fillStyle = this.rgb;
        ctx.fillRect(this.x+3, this.y+3, this.width-6, this.height-6);
        ctx.fillStyle = 'black';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(this.text, this.x + this.width/2, this.y + this.height/2 + 7);
    }
}

class Tile {
    constructor(x, y, width, height, value, valid, clicked, original) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.value = value;
        this.valid = valid;
        this.clicked = clicked;
        this.original = original;
        this.notes = [false, false, false, false, false, false, false, false, false];
    }

    draw(ctx, tileArray, i, whichIsClicked) {
        let valid = isValidMove(tileArray, i, this.value);
        if (this.clicked) {
            ctx.fillStyle = 'rgb(109, 193, 214)';
        }
        else if (!valid && this.value != 0) {
            ctx.fillStyle = 'rgb(255, 150, 150)';
        }
        else if (this.value == whichIsClicked[2] && whichIsClicked[2] != 0) {
            ctx.fillStyle = 'rgb(109, 193, 214)';
        }
        else if ((i % 9 == whichIsClicked[0] || i / 9 == whichIsClicked[1]) || (Math.floor((i % 9) / 3) == Math.floor(whichIsClicked[0] / 3) && Math.floor((i / 9) / 3) == Math.floor(whichIsClicked[1] / 3)) || i % 9 == whichIsClicked[0] || Math.floor(i / 9) == Math.floor(whichIsClicked[1])) {
            ctx.fillStyle = 'rgb(179, 217, 227)';
        }
        else {
            ctx.fillStyle = 'white';
        }
        ctx.fillRect(this.x, this.y, this.width, this.height);
        this.drawNumber(ctx, tileArray, i);
    }

    drawNumber(ctx, tileArray, i) {
        ctx.font = '30px Arial';
        let valid = isValidMove(tileArray, i, this.value);

        if (this.original) {
            ctx.fillStyle = 'black';
        }
        else if (this.valid && valid) {
            ctx.fillStyle = 'rgb(0, 128, 255)';
        }
        else {
            ctx.fillStyle = 'red';
        }
        if (this.value != 0) {
            ctx.fillText(this.value, this.x + this.width/2, this.y + this.height/2 + 10);
        }
        else {
            this.drawNotes(tileArray);
        }
    }

    drawNotes(tileArray) {
        for (let k = 0; k < 9; k++) {
            if (this.notes[k]) {
                clicked = getClicked(tileArray);
                ctx.font = '14px Arial';
                if (clicked[0] > -1 && clicked[1] > -1) {
                    if (tileArray[clicked[1] * 9 + clicked[0]].value == k + 1) {
                        ctx.fillStyle = 'rgb(0, 128, 255)';
                    }
                    else{
                        ctx.fillStyle = 'rgb(67, 69, 67)';
                    }
                }
                else {
                    ctx.fillStyle = 'rgb(67, 69, 67)';
                }
                ctx.fillText(k + 1, this.x + 13 + (k % 3) * 15, this.y + 19 + Math.floor(k / 3) * 15);
            }
        }
    }

}

const canvas = document.getElementById('renderer');
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
const ctx = canvas.getContext('2d');
let viewport = {"x": 0, "y": 0};

window.addEventListener('resize', () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});


function isValidMove(grid, k, num) {
    // grid is one array containing all the tiles with a length of 81 (9x9 grid)
    let row = Math.floor(k / 9);
    let col = k % 9;
    // Check if the number already exists in the same row
    for (let i = 0; i < 9; i++) {
        if (grid[row * 9 + i].value === num && i !== col) {
            return false;
        }
    }

    // Check if the number already exists in the same column
    for (let i = 0; i < 9; i++) {
        if (grid[i * 9 + col].value === num && i !== row) {
            return false;
        }
    }

    // Check if the number already exists in the same 3x3 box
    const boxStartRow = Math.floor(row / 3) * 3;
    const boxStartCol = Math.floor(col / 3) * 3;
    for (let i = boxStartRow; i < boxStartRow + 3; i++) {
        for (let j = boxStartCol; j < boxStartCol + 3; j++) {
            if (grid[i * 9 + j].value === num && i !== row && j !== col) {
                return false;
            }
        }
    }

    return true; // Valid move
}

function convertSudoku(string) {
    let tileArray = [];
    let count = 0;
    let offsetY = 0;
    let offsetX = -13;
    for (let i = 0; i < 81; i++) {
        let j = i % 9;
        if (j == 0 && i !== 0) {
            offsetX = -15;
            offsetX += 2;
        }
        if (j == 1 || j == 2) {
            offsetX += 2;
        }
        if (j == 3) {
            offsetX += 5;
        }
        if (j == 4 || j == 5) {
            offsetX += 2;
        }
        if (j == 6) {
            offsetX += 5;
        }
        if (j == 7 || j == 8) {
            offsetX += 2;
        }
        if (j == 0 && i !== 0) {
            if (i / 9 == 0 || i / 9 == 1 || i / 9 == 2) {
                offsetY += 2;
            }
            if (i / 9 == 3) {
                offsetY += 5;
            }
            if (i / 9 == 4 || i / 9 == 5) {
                offsetY += 2;
            }
            if (i / 9 == 6) {
                offsetY += 5;
            }
            if (i / 9 == 7 || i / 9 == 8) {
                offsetY += 2;
            }
        }
        if (i % 9 === 0 && i !== 0) {
            ++count;
        }
        let x = window.innerWidth / 2 - 300 + (i % 9) * 60 + offsetX;
        let y = 25 + count * 60 + offsetY;

        let newValue = 0;
        let newValid = false;
        let original = false;
        if (parseInt(string[i]) >= 0){
            newValue = parseInt(string[i]);
            newValid = true;
            original = true
        }
        else {
            newValue = 0;
            newValid = false;
            original = false;
        }
        let newTile = new Tile(x, y, 60, 60, newValue, newValid, false, original);
        tileArray.push(newTile);
    }
    return tileArray;
}

function getClicked(tileArray) {
    clickedX = -1;
    clickedY = -1;
    clickedNum = 0;
    for (let i = 0; i < tileArray.length; i++) {
        if (tileArray[i].clicked) {
            clickedX = i % 9;
            clickedY = Math.floor(i / 9);
            clickedNum = tileArray[i].value;
        }
    }
    return [clickedX, clickedY, clickedNum];
}



function drawBackground(tileArray) {
    // light blue background
    // fill background with rgb value
    ctx.fillStyle = 'rgb(81, 100, 124)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // white inner background
    ctx.fillStyle = 'gray';
    ctx.fillRect(window.innerWidth / 2 - 300 - 17, 25, 540 + 29, 565);


    for (let i = 0; i < tileArray.length; i++) {
        tileArray[i].draw(ctx, tileArray, i, getClicked(tileArray));
    }

    // horizontal black lines
    ctx.fillStyle = 'black';
    ctx.fillRect(window.innerWidth / 2 - 300 - 15, 205 + 4, 540 + 24, 5);
    ctx.fillStyle = 'black';
    ctx.fillRect(window.innerWidth / 2 - 300 - 15, 385 + 13, 540 + 24, 5);

    // vertical black lines
    ctx.fillStyle = 'black';
    ctx.fillRect(window.innerWidth / 2 - 112 - 18, 25, 5, 540 + 24);
    ctx.fillStyle = 'black';
    ctx.fillRect(window.innerWidth / 2 + 77 - 18, 25, 5, 540 + 24);

    // black border
    ctx.fillStyle = 'black';
    ctx.fillRect(window.innerWidth / 2 - 300 - 15, 25, 540 + 24, 5);
    ctx.fillStyle = 'black';
    ctx.fillRect(window.innerWidth / 2 - 300 - 15, 587, 540 + 24, 5);
    ctx.fillStyle = 'black';
    ctx.fillRect(window.innerWidth / 2 - 300 - 17, 25, 5, 567);
    ctx.fillStyle = 'black';
    ctx.fillRect(window.innerWidth / 2 + 230 + 17, 25, 5, 567);
}

function drawButtons(ctx, buttonList) {
    for (let i = 0; i < buttonList.length; i++) {
        buttonList[i].draw(ctx);
    }
}

function drawTimer(timer) {
    ctx.font = '30px Arial';
    ctx.fillStyle = 'black';
    if (timer.seconds < 10) {
        timerSecondsText = "0" + timer.seconds;
    }
    else {
        timerSecondsText = timer.seconds;
    }
    if (timer.minutes < 10) {
        timerMinutesText = "0" + timer.minutes;
    }
    else {
        timerMinutesText = timer.minutes;
    } 
    if (timer.hours < 10) {
        timerHoursText = "0" + timer.hours;
    }
    else {
        timerHoursText = timer.hours;
    }
    ctx.fillStyle = 'black';
    ctx.fillRect(window.innerWidth / 2 - 15, 620, 245, 50);
    ctx.fillStyle = 'white';
    ctx.fillRect(window.innerWidth / 2 - 10, 625 , 235, 40);
    ctx.fillStyle = 'black';
    ctx.fillText('Timer: ' + timerHoursText + ':' + timerMinutesText + ':' + timerSecondsText, window.innerWidth / 2 +105, 655);

}

function checkIfWon(tileArray) {
    for (let i = 0; i < tileArray.length; i++) {
        if (!tileArray[i].valid) {
            return false;
        }
    }
    return true;
}

function drawNumbersLeft(tileArray) {
    let numbersLeft = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (let i = 0; i < tileArray.length; i++) {
        if (tileArray[i].value != 0) {
            numbersLeft[tileArray[i].value - 1] += 1;
        }
    }
    for (let i = 0; i < 9; i++) {
        const maxWidth = 50
        const maxHeight = 50
        const x = 300;
        const y = 40;
        ctx.fillStyle = 'black';
        ctx.fillRect(window.innerWidth / 2 + x - 30, y + 60 * i, maxWidth, maxHeight);
        ctx.fillStyle = 'white';
        ctx.fillRect(window.innerWidth / 2 + x - 30 + 5, y + 60 * i + 5, maxWidth-10, maxHeight-10);
        if (numbersLeft[i] < 9) {
            ctx.font = '40px Arial';
            ctx.fillStyle = 'black';
            ctx.fillText(i + 1, window.innerWidth / 2 + x - 30 + maxWidth/2, y + 60 * i + 15 + maxHeight/2);
        }
    }

}

function deleteNotes(tileArray, clicked) {
    for (let i = 0; i < tileArray.length; i++) {
        if (tileArray[i].clicked) {
            let row = Math.floor(i / 9);
            let col = i % 9;
            for (let j = 0; j < 9; j++) {
                if (j !== col) {
                    tileArray[row * 9 + j].notes[tileArray[i].value - 1] = false;
                }
                if (j !== row) {
                    tileArray[j * 9 + col].notes[tileArray[i].value - 1] = false;
                }
            }


            const boxStartRow = Math.floor(row / 3) * 3;
            const boxStartCol = Math.floor(col / 3) * 3;
            for (let j = boxStartRow; j < boxStartRow + 3; j++) {
                for (let k = boxStartCol; k < boxStartCol + 3; k++) {
                    if (j !== row && k !== col) {
                        tileArray[j * 9 + k].notes[tileArray[i].value - 1] = false;
                    }
                }
            }
        }
    }
}


canvas.addEventListener('click', (e) => {
    let x = e.clientX;
    let y = e.clientY;

    // check if the click is inside the sudoku grid
    let foundClickInSudoku = false;
    for (let i = 0; i < tileArray.length; i++) {
        if (x > tileArray[i].x && x < tileArray[i].x + tileArray[i].width && y > tileArray[i].y && y < tileArray[i].y + tileArray[i].height) {
            for (let j = 0; j < tileArray.length; j++) {
                tileArray[j].clicked = false;
            }
            tileArray[i].clicked = true;
            foundClickInSudoku = true;
        }
    }
    if (!foundClickInSudoku) {
        for (let i = 0; i < tileArray.length; i++) {
            tileArray[i].clicked = false;
        }
        for (let i = 0; i < buttonList.length; i++) {
            if (x > buttonList[i].x && x < buttonList[i].x + buttonList[i].width && y > buttonList[i].y && y < buttonList[i].y + buttonList[i].height) {
                if (buttonList[i].id == 'newGame') {
                    tileArray = convertSudoku(sudoku.generate(newDifficulty));
                    startTime = Date.now();
                }
                else if (buttonList[i].id == 'easy') {
                    newDifficulty = 'easy';
                    buttonList[0].text = 'New Game: [EASY]';
                }
                else if (buttonList[i].id == 'medium') {
                    newDifficulty = 'medium';
                    buttonList[0].text = 'New Game: [MEDIUM]';
                }
                else if (buttonList[i].id == 'hard') {
                    newDifficulty = 'hard';
                    buttonList[0].text = 'New Game: [HARD]';
                }
                else if (buttonList[i].id == 'veryHard') {
                    newDifficulty = 'very-hard';
                    buttonList[0].text = 'New Game: [VERY HARD]';
                }
                else if (buttonList[i].id == 'insane') {
                    newDifficulty = 'insane';
                    buttonList[0].text = 'New Game: [INSANE]';
                }
                else if (buttonList[i].id == 'inhuman') {
                    newDifficulty = 'inhuman';
                    buttonList[0].text = 'New Game: [INHUMAN]';
                }
                else if (buttonList[i].id == 'note') {
                    if (buttonList[i].text == 'Notes: [Off]') {
                        buttonList[i].text = 'Notes: [On]';
                        buttonList[i].rgb = 'rgb(56, 255, 96)';
                    }
                    else {
                        buttonList[i].text = 'Notes: [Off]';
                        buttonList[i].rgb = 'rgb(200,200,200)';
                    }
                }
            }
        }
    }
});

document.addEventListener('keydown', (e) => {
    clicked = getClicked(tileArray);
    console.log(e.key);
    if (clicked[0] != -1 && clicked[1] != -1) {
        if (e.key >= '1' && e.key <= '9') {
            if (buttonList[7].text == 'Notes: [On]') {
                clicked = getClicked(tileArray);
                if (tileArray[clicked[0] + clicked[1] * 9].notes[parseInt(e.key) - 1] == true) {
                    tileArray[clicked[0] + clicked[1] * 9].notes[parseInt(e.key) - 1] = false;
                }
                else {
                    tileArray[clicked[0] + clicked[1] * 9].notes[parseInt(e.key) - 1] = true;
                }
            }
            else {
                clicked = getClicked(tileArray);
                if (!tileArray[clicked[0] + clicked[1] * 9].original) {
                    tileArray[clicked[0] + clicked[1] * 9].value = parseInt(e.key);
                    tileArray[clicked[0] + clicked[1] * 9].valid = isValidMove(tileArray, clicked[0] + clicked[1] * 9, parseInt(e.key));
                    deleteNotes(tileArray, clicked);
                }
            }
        }
        else if (e.key == 'Backspace' || e.key == 'Delete') {
            if (!tileArray[clicked[0] + clicked[1] * 9].original) {
                tileArray[clickedX + clickedY * 9].value = 0;
                tileArray[clickedX + clickedY * 9].valid = false;
            }
        }
    }
    if (e.key == "ArrowLeft") {
        for (let i = 0; i < tileArray.length; i++) {
            if (tileArray[i].clicked) {
                tileArray[i].clicked = false;
                console.log(i % 9)
                if (i % 9 == 0) {
                    tileArray[i + 8].clicked = true;
                }
                else {
                    tileArray[i - 1].clicked = true;
                }
                i = tileArray.length;
            }
        }
    }
    else if (e.key == "ArrowRight") {
        for (let i = 0; i < tileArray.length; i++) {
            if (tileArray[i].clicked) {
                tileArray[i].clicked = false;
                if (i % 9 == 8) {
                    tileArray[i - 8].clicked = true;
                }
                else {
                    tileArray[i + 1].clicked = true;
                }
                i = tileArray.length;
            }
        }
    }
    else if (e.key == "ArrowUp") {
        for (let i = 0; i < tileArray.length; i++) {
            if (tileArray[i].clicked) {
                tileArray[i].clicked = false;
                if (Math.floor(i / 9) == 0) {
                    tileArray[i + 72].clicked = true;
                }
                else {
                    tileArray[i - 9].clicked = true;
                }
                i = tileArray.length;
            }
        }
    }
    else if (e.key == "ArrowDown") {
        for (let i = 0; i < tileArray.length; i++) {
            if (tileArray[i].clicked) {
                tileArray[i].clicked = false;
                if (Math.floor(i / 9) == 8) {
                    tileArray[i - 72].clicked = true;
                }
                else {
                    tileArray[i + 9].clicked = true;
                }
                i = tileArray.length;
            }
        }
    }
    else if (e.key == "Shift" || e.key == " ") {
        if (buttonList[7].text == 'Notes: [Off]') {
            buttonList[7].text = 'Notes: [On]';
            buttonList[7].rgb = 'rgb(56, 255, 96)';
        }
        else {
            buttonList[7].text = 'Notes: [Off]';
            buttonList[7].rgb = 'rgb(200,200,200)';
        }
    }
});


newGameButton = new Button(window.innerWidth / 2 - 300, 620, 245, 50, 'New Game: [EASY]', [109, 193, 214], 'newGame');

easyButton = new Button(window.innerWidth / 2 - 300, 690, 120, 50, 'Easy', [56, 255, 96], 'easy');
mediumButton = new Button(window.innerWidth / 2 - 300, 745, 120, 50, 'Medium', [237, 222, 85], 'medium');
hardButton = new Button(window.innerWidth / 2 - 300, 800, 120, 50, 'Hard', [242, 131, 46], 'hard');
veryHardButton = new Button(window.innerWidth / 2 - 300 + 125, 690, 120, 50, 'Very Hard', [242, 44, 54], 'veryHard');
insaneButton = new Button(window.innerWidth / 2 - 300 + 125, 745, 120, 50, 'Insane', [153, 63, 242], 'insane');
inhumanButton = new Button(window.innerWidth / 2 - 300 + 125, 800, 120, 50, 'INHUMAN', [30, 30, 30], 'inhuman');

noteButton = new Button(window.innerWidth / 2  - 15, 775, 150, 75, 'Notes: [Off]', [200,200,200], 'note');

buttonList = [newGameButton, easyButton, mediumButton, hardButton, veryHardButton, insaneButton, inhumanButton, noteButton];

let newDifficulty = "easy";
let startTime = Date.now();
let timer = {"hours": 0, "minutes": 0, "seconds": 0, "frames": 0};


let tileArray = convertSudoku(sudoku.generate(newDifficulty));

function render() {

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    currentTime = Date.now() - startTime;

    if (!checkIfWon(tileArray)) {
        timer.seconds = Math.floor(currentTime / 1000);
        timer.minutes = Math.floor(timer.seconds / 60);
        timer.hours = Math.floor(timer.minutes / 60);
        timer.seconds = timer.seconds % 60;
        timer.minutes = timer.minutes % 60;
    }

    drawBackground(tileArray);
    drawButtons(ctx, buttonList);
    drawTimer(timer);
    drawNumbersLeft(tileArray);

    if (checkIfWon(tileArray)) {
        ctx.font = '30px Arial';
        ctx.fillStyle = 'black';
        ctx.fillRect(window.innerWidth / 2 - 15, 700, 245, 50);
        ctx.fillStyle = 'limegreen';
        ctx.fillRect(window.innerWidth / 2 - 10, 705 , 235, 40);
        ctx.fillStyle = 'black';
        ctx.fillText('You Won!', window.innerWidth / 2 + 105, 735);

    }

    requestAnimationFrame(render);
}

render(tileArray);
