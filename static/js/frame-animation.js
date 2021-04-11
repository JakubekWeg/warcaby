export const LinearInterpolator = x => x;
export const SmoothInterpolator = x => Math.sin(2 * (x - 0.5) * Math.PI / 2) / 2 + 0.5;
const pow2 = x => x * x;
export const DoubleJumpInterpolator = x => (-pow2(4.9 * x - 2.45) + 2 * Math.abs(4.9 * x - 2.45)) * .5 + .5;
export class FrameAnimation {
    constructor(duration, func, interpolator = SmoothInterpolator, onEnd = null, onStart = null) {
        this.duration = duration;
        this.func = func;
        this.interpolator = interpolator;
        this.onEnd = onEnd;
        this.onStart = onStart;
        this.frameFunc = this.frame.bind(this);
        if (!interpolator)
            this.interpolator = SmoothInterpolator;
    }
    get running() {
        return Date.now() - this.started < this.duration;
    }
    start() {
        this.started = Date.now();
        if (this.onStart)
            requestAnimationFrame(this.onStart.bind(this));
        requestAnimationFrame(this.frameFunc);
    }
    frame() {
        const progress = (Date.now() - this.started) / this.duration;
        if (progress < 1) {
            this.func(this.interpolator(progress));
            requestAnimationFrame(this.frameFunc);
        }
        else {
            this.func(this.interpolator(1));
            if (this.onEnd)
                this.onEnd();
        }
    }
}
