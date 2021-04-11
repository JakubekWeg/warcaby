export const validNickRegex = /[a-zA-Z0-9\-_]{3,10}/;
export const opponentPlayer = {
    ['white']: 'black',
    ['black']: 'white',
};
export const BOARD_SIZE = 8;
export const PAWNS_ROWS = 2;
export const TILE_SIZE = 16;
export const FAST_TEST_ENABLED = false;
export const normalize = (v, min, max) => v < min ? min : (v > max ? max : v);
export class Table2d {
    constructor(width, height) {
        this.width = width;
        this.height = height;
        this.elements = Array(width * height);
    }
    set(x, y, value) {
        this.requireIndex(x, y);
        this.elements[x + this.width * y] = value;
    }
    get(x, y) {
        this.requireIndex(x, y);
        return this.elements[x + this.width * y];
    }
    getOrNull(x, y) {
        try {
            return this.get(x, y);
        }
        catch (e) {
            return null;
        }
    }
    swap(x1, y1, x2, y2) {
        this.requireIndex(x1, y1);
        this.requireIndex(x2, y2);
        const index1 = x1 + this.width * y1;
        const index2 = x2 + this.width * y2;
        const tmp = this.elements[index1];
        this.elements[index1] = this.elements[index2];
        this.elements[index2] = tmp;
    }
    fill(creator) {
        let k = 0;
        for (let i = 0; i < this.width; ++i)
            for (let j = 0; j < this.height; ++j)
                this.elements[k++] = creator(j, i);
    }
    forEach(func) {
        this.elements.forEach(func);
    }
    isIndexValid(x, y) {
        return !(x < 0 || x >= this.width || y < 0 || y >= this.height);
    }
    requireIndex(x, y) {
        if (!this.isIndexValid(x, y))
            throw new RangeError(`Requested invalid ${x}:${y} index`);
    }
}
export const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));
