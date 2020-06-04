export type AnimateFunction = (x: number) => void
export type AnimationInterpolator = (x: number) => number

export const LinearInterpolator: AnimationInterpolator = x => x
export const SmoothInterpolator: AnimationInterpolator = x => Math.sin(2 * (x - 0.5) * Math.PI / 2) / 2 + 0.5

const pow2 = x => x * x
export const DoubleJumpInterpolator: AnimationInterpolator = x => (-pow2(4.9 * x - 2.45) + 2 * Math.abs(4.9 * x - 2.45)) * .5 + .5

export class FrameAnimation {
	private started: number
	private frameFunc = this.frame.bind(this)

	constructor(private readonly duration: number,
	            private readonly func: AnimateFunction,
	            private readonly interpolator: AnimationInterpolator = SmoothInterpolator,
	            private readonly onEnd: Function = null,
	            private readonly onStart: Function = null,
	            ) {
		if (!interpolator) this.interpolator = SmoothInterpolator
	}

	get running() {
		return Date.now() - this.started < this.duration
	}

	public start() {
		this.started = Date.now()
		if (this.onStart)
			requestAnimationFrame(this.onStart.bind(this))
		requestAnimationFrame(this.frameFunc)
	}

	private frame() {
		const progress = (Date.now() - this.started) / this.duration
		if (progress < 1) {
			this.func(this.interpolator(progress))
			requestAnimationFrame(this.frameFunc)
		} else {
			this.func(this.interpolator(1))
			if (this.onEnd) this.onEnd()
		}
	}
}
