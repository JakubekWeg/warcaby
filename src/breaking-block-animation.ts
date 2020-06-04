const CANVAS_SIZE = 300;
const SCALE = 3;
const BLOCK_SIZE = 16 * 3;
const PARTICLE_VISIBILITY_Y_LIMIT = CANVAS_SIZE * 0.5;

export class BreakingBlockAnimation {
	private _running = false
	private _brokeBlock = false
	private _pickFadeOutStartTime: number = 0
	private _startAnimationTime = 0;
	private _particles = [];
	private _renderFunc = this._render.bind(this);
	private _ctx: CanvasRenderingContext2D

	constructor(private _canvas: HTMLCanvasElement,
	            private readonly _block: CanvasImageSource,
	            private readonly _pick: CanvasImageSource) {

		// block.style.display = pick.style.display = 'none';
		_canvas.height = _canvas.width = CANVAS_SIZE;
		this._ctx = _canvas.getContext('2d');
		this._ctx.imageSmoothingEnabled = false;
	}

	start() {
		if (this._running) return;
		this._running = true;
		this._brokeBlock = false
		this._startAnimationTime = Date.now()
		this._pickFadeOutStartTime = 0
		requestAnimationFrame(this._renderFunc);
	}

	breakBlock() {
		if (!this._running || this._brokeBlock) return;
		this._brokeBlock = true;
		this._pickFadeOutStartTime = Date.now();
		for (let i = 0; i < 200; i++) {
			const o = {};
			BreakingBlockAnimation._reuseParticle(o);
			this._particles.push(o);
		}
		setTimeout(() => this.stop(), 2000);
	}

	stop() {
		this._running = false;
		this._ctx.setTransform(1, 0, 0, 1, 0, 0);
		this._ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
	}

	private static _reuseParticle(obj) {
		obj.x = Math.random() * BLOCK_SIZE;
		obj.y = Math.random() * BLOCK_SIZE * .5;
		obj.ox = Math.random() * 6 - 2.5;
		obj.oy = Math.random() * 8 - 2.5;
		obj.tx = Math.random() * 14 | 0;
		obj.ty = Math.random() * 14 | 0;
	}

	private _renderParticles() {
		for (const p of this._particles) {
			// if (p.y > PARTICLE_VISIBILITY_Y_LIMIT) continue;
			p.x += p.ox;
			p.y += p.oy;
			p.ox *= .95;
			p.oy += 0.1;
			if (p.y > PARTICLE_VISIBILITY_Y_LIMIT)
				p.y = PARTICLE_VISIBILITY_Y_LIMIT
			this._ctx.drawImage(this._block,
				p.tx, p.ty, 2, 2,
				p.x, p.y, 2 * SCALE, 2 * SCALE);
		}
	}

	private _render() {
		if (!this._running) return;

		const frame = (this._startAnimationTime - Date.now()) * 0.01

		this._ctx.setTransform(1, 0, 0, 1, 0, 0);
		this._ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
		if (!this._brokeBlock)
			this._ctx.drawImage(this._block, (CANVAS_SIZE - BLOCK_SIZE) / 2, (CANVAS_SIZE - BLOCK_SIZE) / 2, BLOCK_SIZE, BLOCK_SIZE);

		this._ctx.translate(CANVAS_SIZE / 2 - BLOCK_SIZE * .8, CANVAS_SIZE / 2 - BLOCK_SIZE * .6);
		const rotation = Math.sin(frame) * .4;
		this._ctx.rotate(rotation);
		const x = -BLOCK_SIZE * .5 + Math.sin(frame) * 10;
		const y = -BLOCK_SIZE * .5 + Math.cos(frame) * 5;
		if (this._pickFadeOutStartTime){
			const fadeOutProgress = (Date.now() - this._pickFadeOutStartTime) * 0.002
				this._ctx.globalAlpha = (fadeOutProgress > 1 ? 0 : (1 - fadeOutProgress));
		}
		this._ctx.drawImage(this._pick, x, y, BLOCK_SIZE, BLOCK_SIZE);
		this._ctx.globalAlpha = 1;
		this._ctx.rotate(-rotation);


		if (!this._brokeBlock) {
			let obj = this._particles.find(e => e.y >= PARTICLE_VISIBILITY_Y_LIMIT);
			if (!obj) {
				obj = {};
				this._particles.push(obj);
			}
			BreakingBlockAnimation._reuseParticle(obj);
		}


		this._renderParticles();

		requestAnimationFrame(this._renderFunc);
	}
}
