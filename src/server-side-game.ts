import { ServerResponse } from 'http'
import { GameLogic } from './game-logic'
import { EventInfo, FAST_TEST_ENABLED, GameFinishedReason, opponentPlayer, PlayerType, validNickRegex } from './shared'
import Timeout = NodeJS.Timeout

const TURN_TIMEOUT = 30
const TOKEN_LENGTH = 160

export class PlayerInfo {
	public readonly token: string = PlayerInfo.generateToken()
	public readonly eventQueue: EventInfo[] = []

	constructor(
		public readonly nick: string,
		public readonly playerType: PlayerType) {
	}

	public static generateToken = (): string => {
		const arr = new Array(TOKEN_LENGTH)
		for (let i = 0; i < TOKEN_LENGTH; i++) {
			arr[i] = Math.random() * 10 | 0
		}
		return arr.join('')
	}
}

export class ServerSideGame {
	private whoseTurn: PlayerType = 'spectator'
	private logic: GameLogic = new GameLogic()
	private players: PlayerInfo[] = []
	private moveTimeout: Timeout
	private otherTimeouts: Timeout[] = []
	private checkMoveTimeoutFunc = this.checkMoveTimeout.bind(this)

	registerNewPlayer(params: any, res: ServerResponse) {
		if (validNickRegex.test(params.nick)) {
			// if (FAST_TEST_ENABLED && this.players.length === 2)
			// 	this.players.shift()

			if (this.players.length >= 2)
				return res.writeHead(412).end()

			if (this.players.find(e => e.nick === params.nick))
				return res.writeHead(409).end()

			const info = new PlayerInfo(params.nick, this.players.length ? 'black' : 'white')
			this.players.push(info)


			res.writeHead(200, {
				'Content-Type': 'application/json',
			}).end(JSON.stringify({
				type: info.playerType,
				token: info.token,
				opponent: this.players.length === 2 ? {
					nick: this.players[0].nick,
					color: this.players[0].playerType,
				} : null,
			}))

			// start the game
			if (this.players.length === 2) {
				this.players[0].eventQueue.push({
					type: 'player-joined',
					extra: {
						nick: this.players[1].nick,
						color: this.players[1].playerType,
					},
				})

				this.otherTimeouts.push(setTimeout(() => {
					this.updatePlayersTurn('white')
				}, FAST_TEST_ENABLED ? 1000 : 5000))
			}
		}
	}

	resetGame(res: ServerResponse) {
		clearTimeout(this.moveTimeout)
		for (const timeout of this.otherTimeouts)
			clearTimeout(timeout)
		this.otherTimeouts.splice(0)
		this.logic.reset()
		this.players.splice(0)
		this.updatePlayersTurn('spectator')
		return res.writeHead(204).end()
	}

	poolEvents(params: any, res: ServerResponse) {
		const player = this.authorizeUser(params)
		if (!player) return res.writeHead(401).end()

		if (player.eventQueue.length > 0) {
			res.writeHead(200, {'Content-Type': 'application/json'}).end(JSON.stringify(player.eventQueue))
			player.eventQueue.length = 0
		} else
			res.writeHead(204).end()
	}

	public makeMove(params: any, res: ServerResponse) {
		const player = this.authorizeUser(params)
		if (!player)
			return res.writeHead(401).end()

		const x = +params.x
		const y = +params.y
		const index = +params.index

		if (isNaN(x) || isNaN(y) || isNaN(index))
			return res.writeHead(400).end()

		if (this.whoseTurn !== player.playerType)
			return res.writeHead(423).end()

		const move = this.logic.getAvailableMoves(x, y, player.playerType)[index]
		if (!move)
			return res.writeHead(406).end()

		this.logic.commitMove(move)
		res.writeHead(204).end()

		this.broadcastEventToPlayers({
			type: 'move-made',
			extra: {x, y, index, player: player.playerType},
		})

		if (!move.hasContinuation)
			this.updatePlayersTurn(player.playerType === 'white' ? 'black' : 'white')

	}


	private updatePlayersTurn(now: PlayerType) {
		this.whoseTurn = now
		clearTimeout(this.moveTimeout)
		if (now !== 'spectator')
			this.moveTimeout = setTimeout(this.checkMoveTimeoutFunc, TURN_TIMEOUT * 1000)
		this.broadcastEventToPlayers({
			type: 'move-subject-updated',
			extra: {
				player: now,
				timeout: TURN_TIMEOUT,
				expires: Date.now() + TURN_TIMEOUT * 1000,
			},
		})
	}

	private broadcastEventToPlayers(event: EventInfo) {
		for (let player of this.players) {
			player.eventQueue.push(event)
		}
	}

	private authorizeUser(params: any) {
		const playerToken = params.token
		if (playerToken)
			return this.players.find(e => e.token === playerToken)
	}


	private checkMoveTimeout() {
		if (this.whoseTurn === 'spectator') return

		this.broadcastEventToPlayers({
			type: 'game-finished',
			extra: {
				won: <PlayerType>opponentPlayer[this.whoseTurn],
				lost: <PlayerType>this.whoseTurn,
				reason: <GameFinishedReason>'move-timeout',
			},
		})
		this.updatePlayersTurn('spectator')
	}
}
