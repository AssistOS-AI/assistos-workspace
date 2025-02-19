class Mutex {
    constructor() {
        this._queue = [];
        this._locked = false;
    }

    lock() {
        return new Promise((resolve) => {
            const tryAcquireLock = () => {
                if (!this._locked) {
                    this._locked = true;
                    resolve(this.unlock.bind(this)); // Return unlock function
                } else {
                    this._queue.push(tryAcquireLock);
                }
            };
            tryAcquireLock();
        });
    }

    unlock() {
        if (this._queue.length > 0) {
            const nextAcquire = this._queue.shift();
            nextAcquire();
        } else {
            this._locked = false;
        }
    }
}
class ResourceLocks{
    constructor(){
        this.resourceLocks = new Map();
        this.TTL = 60000 * 10; // 10 minutes{
    }
    getMutex(resourceKey) {
        if (!this.resourceLocks.has(resourceKey)) {
            const mutex = new Mutex();
            this.resourceLocks.set(resourceKey, { mutex, timer: null });
        }
        const entry = this.resourceLocks.get(resourceKey);

        // Reset the TTL timer whenever the mutex is accessed
        if (entry.timer) clearTimeout(entry.timer);
        entry.timer = setTimeout(() => {
            this.resourceLocks.delete(resourceKey);
        }, this.TTL);
        return entry.mutex;
    }
}
module.exports = ResourceLocks;