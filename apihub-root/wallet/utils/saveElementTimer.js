export function SaveElementTimer(fn, t) {
    let timerObj = setInterval(fn, t);

    this.stop = async function(executeFn) {
        if (timerObj) {
            if(executeFn){
                await fn();
            }
            clearInterval(timerObj);
            timerObj = null;
        }
        return this;
    }

    // start timer using current settings (if it's not already running)
    this.start = async function() {
        if (!timerObj) {
            await this.stop();
            timerObj = setInterval(fn, t);
        }
        return this;
    }

    // start with new or original interval, stop current interval
    this.reset = async function(newT = t) {
        t = newT;
        let self = await this.stop();
        return self.start();
    }

}