const EventEmitter = require('events');

class LLMStreamingEmitter extends EventEmitter {}

const streamEmitter = new LLMStreamingEmitter();

module.exports = streamEmitter;
