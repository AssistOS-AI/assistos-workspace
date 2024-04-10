class Manager {
    constructor() {
        this.apiExporter = require('./exporter.js');
        this.modelExporer = require('./models/exporter.js');
        this.servicesExporter = require('./classExporter.js');
        this.constantsExporter = require('./constants/exporter.js')
        this.initialise();
    }

    initialise() {
        this.apis = this.apiExporter();
        this.constants = this.modelExporer();
        this.models = this.constantsExporter();
        this.services = this.servicesExporter();
    }

    static getInstance() {
        if (!Manager.instance) {
            Manager.instance = new Manager();
        }
        return Manager.instance;
    }
}

module.exports = Manager;

