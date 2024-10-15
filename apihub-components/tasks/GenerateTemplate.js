const Task = require('./Task');

class GenerateTemplate extends Task {
    constructor(securityContext, spaceId, userId, configs) {
        super(securityContext, spaceId, userId);
        this.configs = configs
    }

    async runTask() {
        this.documentModule = require('assistos').loadModule('document', this.securityContext);
        this.templateAssembly = {
            title: this.configs.title,
            abstract: {
                edition: this.configs.edition,
                informativeText: this.configs.informativeText,
                prompt: this.configs.prompt,
            }
        }
        const chapterCount = parseInt(this.configs.chapters);

    }

    async cancelTask() {
        await this.rollback();
    }

    async rollback() {
        try {

        } catch (e) {

        }
    }

    serialize() {
        return {
            status: this.status,
            id: this.id,
            spaceId: this.spaceId,
            userId: this.userId,
            securityContext: this.securityContext,
            name: this.constructor.name,
            configs: {}
        }
    }
}

module.exports = GenerateTemplate;
