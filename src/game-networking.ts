import { EventInfo, GameEventType, PlayerType, wait } from './shared'

const EVENT_POOLING_INTERVAL = 500

export class GameNetworking {
	public myNick: string
	public myType: PlayerType
	public opponentInfo: any | null = null
	private currentTurn: PlayerType = 'spectator'
	private eventHandlers: { [key: string]: any[] } = {}
	private pendingRequest: boolean = false
	private myToken: string

	get isMyTurn(): boolean {
		return this.currentTurn === this.myType
	}

	constructor() {
		this.addEventListener('player-joined', o => this.opponentInfo = o)
		this.addEventListener('move-subject-updated', ({player}) => this.currentTurn = player)
	}

	addEventListener(event: GameEventType, callback: (extra?: any) => void) {
		if (this.eventHandlers[event])
			this.eventHandlers[event].push(callback)
		else
			this.eventHandlers[event] = [callback]
	}


	register(nick: string): Promise<number> {
		if (this.myToken) throw new Error()
		return this.lockMutex(async () => {
			const result = await fetch('game/register?nick=' + encodeURIComponent(nick))
			if (result.ok) {
				const response = await result.json()
				this.myToken = response.token
				this.myType = response.type
				this.opponentInfo = response.opponent
				this.myNick = nick
				setTimeout(() => this.checkEvents(), 100)
				return 200
			} else return result.status
		})
	}

	resetGame(): Promise<boolean> {
		if (this.myToken) throw new Error()
		return this.lockMutex(() => fetch('game/reset-players').then(e => e.ok))
	}

	async waitForOpponent() {
		while (!this.opponentInfo)
			await wait(100)
	}

	public requestMovement(fromX: number, fromY: number, moveIndex: number): Promise<boolean> {
		return this.lockMutex(async () => {
			return (await fetch(`game/make-move?token=${this.myToken}&x=${fromX}&y=${fromY}&index=${moveIndex}`)).ok
		})
	}

	private async lockMutex<T>(callback: () => Promise<T>): Promise<T> {
		if (this.pendingRequest)
			throw new Error('There can be only one pending operation')
		this.pendingRequest = true
		try {
			return await callback()
		} finally {
			this.pendingRequest = false
		}
	}

	private async checkEvents() {
		if (!this.myToken) return
		const result = await fetch('game/pool-events?token=' + this.myToken)
		// noinspection FallThroughInSwitchStatementJS
		switch (result.status) {
			case 200:
				const events = await result.json()
				for (const e of events)
					this.handleEvent(e)
			case 204:
				setTimeout(() => this.checkEvents(), EVENT_POOLING_INTERVAL)
				break
			default:
				console.error('Unable to fetch events, status', result.status)
		}
	}

	private handleEvent(event: EventInfo) {
		const handlers = this.eventHandlers[event.type]
		if (!handlers)
			return console.warn('No registered handlers for event', event.type)
		try {
			for (let handler of handlers)
				handler(event.extra)
		} catch (e) {
			console.error('Error while handling event', event)
			throw e
		}
	}
}
