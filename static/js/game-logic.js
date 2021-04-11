import { BOARD_SIZE, PAWNS_ROWS, Table2d } from './shared';
export class GameLogic {
    constructor() {
        this.board = new Table2d(BOARD_SIZE, BOARD_SIZE);
        this.reset();
    }
    reset() {
        this.continuationEntry = null;
        this.board.fill((x, y) => ({
            x, y,
            pawn: 'none',
            player: 'spectator',
        }));
        for (let i = 0; i < PAWNS_ROWS; i++) {
            const offset = i % 2;
            for (let j = 0; j < BOARD_SIZE; j += 2) {
                const e = this.board.get(j + offset, i);
                e.player = 'black';
                e.pawn = 'pawn';
            }
        }
        for (let i = BOARD_SIZE - 1; i >= BOARD_SIZE - PAWNS_ROWS; i--) {
            const offset = i % 2;
            for (let j = 0; j < BOARD_SIZE; j += 2) {
                const e = this.board.get(j + offset, i);
                e.player = 'white';
                e.pawn = 'pawn';
            }
        }
        // this.board.get(5, 0).pawn = 'king'
        // this.board.get(5, 0).player = 'black'
        //
        // this.board.get(2, 2).pawn = 'pawn'
        // this.board.get(2, 2).player = 'black'
        // this.board.get(4, 4).pawn = 'pawn'
        // this.board.get(4, 4).player = 'black'
        // this.board.get(6, 6).pawn = 'pawn'
        // this.board.get(6, 6).player = 'black'
        // this.board.get(7, 7).pawn = 'king'
        // this.board.get(7, 7).player = 'white'
        // this.board.get(7, 6).pawn = 'king'
        // this.board.get(7, 6).player = 'white'
        // const set = (x, y, player: PlayerType, pawn: PawnType = 'pawn') => {
        // 	this.board.get(x, y).pawn = pawn
        // 	this.board.get(x, y).player = player
        // }
        //
        // set(3, 5, 'black')
        //
        // // set(1, 1, 'white')
        //
        // set(7, 7, 'white')
        // set(6, 6, 'white')
        // // set(5, 5, 'white')
        // set(4, 4, 'white')
        // // set(3, 3, 'white')
    }
    commitMove(move) {
        if (this.continuationEntry && (move.from.x !== this.continuationEntry.x || move.from.y !== this.continuationEntry.y || move.type === 'movement')) {
            console.error('Executing forbidden move, logic is bound to pawn', this.continuationEntry, 'but requested move', move);
        }
        // noinspection FallThroughInSwitchStatementJS
        switch (move.type) {
            case 'attack':
                if (move.attackedPawns)
                    for (const attacked of move.attackedPawns) {
                        attacked.pawn = 'none';
                        attacked.player = 'spectator';
                    }
            case 'jump':
            case 'movement':
                move.to.player = move.from.player;
                move.to.pawn = move.from.pawn;
                move.from.pawn = 'none';
                move.from.player = 'spectator';
        }
        if (move.upgradeToKingAfterMove) {
            move.to.pawn = 'king';
        }
        this.continuationEntry = move.hasContinuation ? move.to : null;
    }
    getAvailableMoves(meX, meY, playerType) {
        const moves = [];
        if (this.continuationEntry && (meX !== this.continuationEntry.x || meY !== this.continuationEntry.y)) {
            console.warn('Attempt to get moves of pawn', { meX, meY }, 'but requries move of', this.continuationEntry);
            return moves;
        }
        const me = this.board.get(meX, meY);
        if (me.player !== playerType ||
            me.pawn === 'none') {
            console.warn('Requested tile that isn\'t mine or is empty', me);
            return moves;
        }
        const args = {
            player: playerType,
            me, meX, meY, moves,
            isBound: !!this.continuationEntry,
        };
        switch (me.pawn) {
            case 'pawn':
                this.getAvailableMovesForNormalPawn(args);
                break;
            case 'king':
                this.getAvailableMovesForKing(args);
                break;
            default:
                console.warn('Undefined pawn type - no moves!');
                break;
        }
        if (args.me.pawn === 'pawn') {
            const finalY = (args.player === 'white' ? 0 : (BOARD_SIZE - 1));
            for (const m of args.moves)
                if (m.to.y === finalY && !m.hasContinuation)
                    m.upgradeToKingAfterMove = true;
        }
        return moves;
    }
    getAvailableMovesForNormalPawn(args) {
        const forward = args.player === 'black' ? -1 : 1;
        const checkPossibility = (dirX, dirY, attackOnly, dontAdd = false) => {
            const x = args.meX + dirX;
            const y = args.meY + dirY;
            let tile = this.board.getOrNull(x, y);
            if (tile) {
                if (!attackOnly && tile.pawn === 'none') {
                    if (dontAdd || args.isBound)
                        return false;
                    return args.moves.push({
                        type: 'movement',
                        from: args.me,
                        to: tile,
                    });
                }
                else if (!attackOnly && tile.player === args.player && tile.pawn !== 'none') {
                    tile = this.board.getOrNull(x + Math.sign(dirX), y + Math.sign(dirY));
                    if (tile && tile.pawn === 'none') {
                        if (dontAdd)
                            return true;
                        else {
                            args.moves.push({
                                type: 'jump',
                                from: args.me,
                                to: tile,
                                hasContinuation: !!checkPossibility(dirX + dirX + dirX, dirY + dirY + dirY, false, true),
                            });
                        }
                    }
                }
                else if (tile.player !== args.player && tile.pawn !== 'none') {
                    let tile2 = this.board.getOrNull(x + Math.sign(dirX), y + Math.sign(dirY));
                    if (tile2 && tile2.pawn === 'none') {
                        if (dontAdd)
                            return true;
                        else {
                            args.moves.push({
                                type: 'attack',
                                attackedPawns: [tile],
                                from: args.me,
                                to: tile2,
                                hasContinuation: !!checkPossibility(dirX + dirX + dirX, dirY + dirY + dirY, false, true),
                            });
                        }
                    }
                }
            }
        };
        checkPossibility(forward, -forward, false);
        checkPossibility(-forward, -forward, false);
        checkPossibility(-forward, forward, true);
        checkPossibility(forward, forward, true);
    }
    getAvailableMovesForKing(args) {
        const checkRow = (dirX, dirY) => {
            let x = args.meX;
            let y = args.meY;
            let attacked = [];
            let lastWasEnemy = false;
            do {
                x += dirX;
                y += dirY;
                const tile = this.board.getOrNull(x, y);
                if (!tile || tile.player === args.player)
                    break;
                if (tile.pawn === 'none') {
                    lastWasEnemy = false;
                    args.moves.push({
                        from: args.me,
                        to: tile,
                        type: attacked.length ? 'attack' : 'movement',
                        attackedPawns: attacked.length ? [...attacked] : null,
                    });
                }
                else if (lastWasEnemy)
                    break;
                else {
                    lastWasEnemy = true;
                    attacked.push(tile);
                }
            } while (true);
        };
        checkRow(-1, -1);
        checkRow(1, 1);
        checkRow(1, -1);
        checkRow(-1, 1);
    }
}
