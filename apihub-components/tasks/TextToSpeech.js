const Task = require('./Task');
class TextToSpeech extends Task {
    constructor(securityContext, config) {
        super(securityContext);
        this.config = config;
    }
    async runTask() {

    }
    async cancelTask() {

    }

    serialize() {
        return JSON.stringify({
            status: this.status,
            id: this.id,
            securityContext: this.securityContext,
            name: this.constructor.name,
            config: this.config
        })
    }
}
module.exports = TextToSpeech;