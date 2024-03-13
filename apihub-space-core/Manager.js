class Manager {
    constructor() {
        this.apiExporter = require('./apis/exporter.js');
        this.modelExporer = require('./models/exporter.js');
        this.constantsExporter = require('./constants/exporter.js')
    }

    initialise() {
        this.apis = this.apiExporter();
        this.constants = this.modelExporer();
        this.models = this.constantsExporter();
    }

}

module.exports = Manager;

