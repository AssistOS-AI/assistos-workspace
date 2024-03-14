class Manager {
    constructor() {
        this.apiExporter = require('./apis/exporter.js');
        this.modelExporer = require('./models/exporter.js');
        this.constantsExporter = require('./constants/exporter.js')
        this.initialise();
    }

    initialise() {
        this.apis = this.apiExporter();
        this.constants = this.modelExporer();
        this.models = this.constantsExporter();
    }
    static getInstance() {
        if (!Manager.instance) {
            Manager.instance = new Manager();
        }
        return Manager.instance;
    }
}

module.exports = Manager;

