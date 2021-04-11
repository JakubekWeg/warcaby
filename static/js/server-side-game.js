import { GameLogic } from './game-logic';
import { FAST_TEST_ENABLED, opponentPlayer, validNickRegex } from './shared';
const TURN_TIMEOUT = 30;
const TOKEN_LENGTH = 160;
export class PlayerInfo {
    constructor(nick, playerType) {
        this.nick = nick;
        this.playerType = playerType;
        this.token = PlayerInfo.generateToken();
        this.eventQueue = [];
    }
}
PlayerInfo.generateToken = () => {
    const arr = new Array(TOKEN_LENGTH);
    for (let i = 0; i < TOKEN_LENGTH; i++) {
        arr[i] = Math.random() * 10 | 0;
    }
    return arr.join('');
};
export class ServerSideGame {
    constructor() {
        this.whoseTurn = 'spectator';
        this.logic = new GameLogic();
        this.players = [];
        this.otherTimeouts = [];
        this.checkMoveTimeoutFunc = this.checkMoveTimeout.bind(this);
    }
    registerNewPlayer(params, res) {
        if (validNickRegex.test(params.nick)) {
            // if (FAST_TEST_ENABLED && this.players.length === 2)
            // 	this.players.shift()
            if (this.players.length >= 2)
                return res.writeHead(412).end();
            if (this.players.find(e => e.nick === params.nick))
                return res.writeHead(409).end();
            const info = new PlayerInfo(params.nick, this.players.length ? 'black' : 'white');
            this.players.push(info);
            res.writeHead(200, {
                'Content-Type': 'application/json',
            }).end(JSON.stringify({
                type: info.playerType,
                token: info.token,
                opponent: this.players.length === 2 ? {
                    nick: this.players[0].nick,
                    color: this.players[0].playerType,
                } : null,
            }));
            // start the game
            if (this.players.length === 2) {
                this.players[0].eventQueue.push({
                    type: 'player-joined',
                    extra: {
                        nick: this.players[1].nick,
                        color: this.players[1].playerType,
                    },
                });
                this.otherTimeouts.push(setTimeout(() => {
                    this.updatePlayersTurn('white');
                }, FAST_TEST_ENABLED ? 1000 : 5000));
            }
        }
    }
    resetGame(res) {
        clearTimeout(this.moveTimeout);
        for (const timeout of this.otherTimeouts)
            clearTimeout(timeout);
        this.otherTimeouts.splice(0);
        this.logic.reset();
        this.players.splice(0);
        this.updatePlayersTurn('spectator');
        return res.writeHead(204).end();
    }
    poolEvents(params, res) {
        const player = this.authorizeUser(params);
        if (!player)
            return res.writeHead(401).end();
        if (player.eventQueue.length > 0) {
            res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(player.eventQueue));
            player.eventQueue.length = 0;
        }
        else
            res.writeHead(204).end();
    }
    makeMove(params, res) {
        const player = this.authorizeUser(params);
        if (!player)
            return res.writeHead(401).end();
        const x = +params.x;
        const y = +params.y;
        const index = +params.index;
        if (isNaN(x) || isNaN(y) || isNaN(index))
            return res.writeHead(400).end();
        if (this.whoseTurn !== player.playerType)
            return res.writeHead(423).end();
        const move = this.logic.getAvailableMoves(x, y, player.playerType)[index];
        if (!move)
            return res.writeHead(406).end();
        this.logic.commitMove(move);
        res.writeHead(204).end();
        this.broadcastEventToPlayers({
            type: 'move-made',
            extra: { x, y, index, player: player.playerType },
        });
        if (!move.hasContinuation)
            this.updatePlayersTurn(player.playerType === 'white' ? 'black' : 'white');
    }
    updatePlayersTurn(now) {
        this.whoseTurn = now;
        clearTimeout(this.moveTimeout);
        if (now !== 'spectator')
            this.moveTimeout = setTimeout(this.checkMoveTimeoutFunc, TURN_TIMEOUT * 1000);
        this.broadcastEventToPlayers({
            type: 'move-subject-updated',
            extra: {
                player: now,
                timeout: TURN_TIMEOUT,
                expires: Date.now() + TURN_TIMEOUT * 1000,
            },
        });
    }
    broadcastEventToPlayers(event) {
        for (let player of this.players) {
            player.eventQueue.push(event);
        }
    }
    authorizeUser(params) {
        const playerToken = params.token;
        if (playerToken)
            return this.players.find(e => e.token === playerToken);
    }
    checkMoveTimeout() {
        if (this.whoseTurn === 'spectator')
            return;
        this.broadcastEventToPlayers({
            type: 'game-finished',
            extra: {
                won: opponentPlayer[this.whoseTurn],
                lost: this.whoseTurn,
                reason: 'move-timeout',
            },
        });
        this.updatePlayersTurn('spectator');
    }
}
