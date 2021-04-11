import { wait } from './shared';
const EVENT_POOLING_INTERVAL = 500;
export class GameNetworking {
    constructor() {
        this.opponentInfo = null;
        this.currentTurn = 'spectator';
        this.eventHandlers = {};
        this.pendingRequest = false;
        this.addEventListener('player-joined', o => this.opponentInfo = o);
        this.addEventListener('move-subject-updated', ({ player }) => this.currentTurn = player);
    }
    get isMyTurn() {
        return this.currentTurn === this.myType;
    }
    addEventListener(event, callback) {
        if (this.eventHandlers[event])
            this.eventHandlers[event].push(callback);
        else
            this.eventHandlers[event] = [callback];
    }
    register(nick) {
        if (this.myToken)
            throw new Error();
        return this.lockMutex(async () => {
            const result = await fetch('game/register?nick=' + encodeURIComponent(nick));
            if (result.ok) {
                const response = await result.json();
                this.myToken = response.token;
                this.myType = response.type;
                this.opponentInfo = response.opponent;
                this.myNick = nick;
                setTimeout(() => this.checkEvents(), 100);
                return 200;
            }
            else
                return result.status;
        });
    }
    resetGame() {
        if (this.myToken)
            throw new Error();
        return this.lockMutex(() => fetch('game/reset-players').then(e => e.ok));
    }
    async waitForOpponent() {
        while (!this.opponentInfo)
            await wait(100);
    }
    requestMovement(fromX, fromY, moveIndex) {
        return this.lockMutex(async () => {
            return (await fetch(`game/make-move?token=${this.myToken}&x=${fromX}&y=${fromY}&index=${moveIndex}`)).ok;
        });
    }
    async lockMutex(callback) {
        if (this.pendingRequest)
            throw new Error('There can be only one pending operation');
        this.pendingRequest = true;
        try {
            return await callback();
        }
        finally {
            this.pendingRequest = false;
        }
    }
    async checkEvents() {
        if (!this.myToken)
            return;
        const result = await fetch('game/pool-events?token=' + this.myToken);
        // noinspection FallThroughInSwitchStatementJS
        switch (result.status) {
            case 200:
                const events = await result.json();
                for (const e of events)
                    this.handleEvent(e);
            case 204:
                setTimeout(() => this.checkEvents(), EVENT_POOLING_INTERVAL);
                break;
            default:
                console.error('Unable to fetch events, status', result.status);
        }
    }
    handleEvent(event) {
        const handlers = this.eventHandlers[event.type];
        if (!handlers)
            return console.warn('No registered handlers for event', event.type);
        try {
            for (let handler of handlers)
                handler(event.extra);
        }
        catch (e) {
            console.error('Error while handling event', event);
            throw e;
        }
    }
}
