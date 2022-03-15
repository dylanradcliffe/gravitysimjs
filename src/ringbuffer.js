// Basic ring buffer class

export class RingBuffer {
    constructor(size, discard=false) {
        this._array = new Array(size + 1);
        this._size = size + 1;
        this._writeptr = this._readptr = 0;
        this._discard = discard;
    }

    incrementWrap(v) {
        return (v + 1) % this._size;
    }

    write(item) {
        if (this.incrementWrap(this._writeptr) == this._readptr) {
            if (this._discard) {
                this._readptr = this.incrementWrap(this._readptr);
            } else {
                return undefined;
            }
        }
        this._array[this._writeptr] = item;
        this._writeptr = this.incrementWrap(this._writeptr);
        return item;
    }


    read() {
        if (this._writeptr == this._readptr) {
            return undefined;
        } else {
            const val = this._array[this._readptr];
            this._readptr = this.incrementWrap(this._readptr);
            return val;
        }

    }


    [Symbol.iterator]() {
        var tempread = this._readptr;
        return {
            next: () => { 
                const done = tempread == this._writeptr
                var value = undefined;
                if (!done) {
                    value = this._array[tempread];
                    tempread = this.incrementWrap(tempread);
                }
                return {
                    value: value,
                    done: done
                }
            }
        }
    }
};
/*
const testRingBuffer = () => {
    rb = new RingBuffer(3, true);
    rb.write(1);
    rb.write(2);
    for (i of rb) {
        console.log(i);
    }
}*/
