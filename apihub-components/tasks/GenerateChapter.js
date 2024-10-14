const Task = require('./Task');
const GenerateParagraph = require('./GenerateParagraph');

class GenerateChapter extends Task {
    constructor(securityContext, spaceId, userId, configs) {
        super(securityContext, spaceId, userId);
        this.configs=configs
    }

    async runTask() {
        let paragraphTasks = [];
        for(let paragraphIndex = 0; paragraphIndex < this.configs.paragraphs.length; paragraphIndex++){
            const paragraph = this.configs.paragraphs[paragraphIndex];
            paragraphTasks.push(new GenerateParagraph(this.securityContext, this.spaceId, this.userId, paragraph));
        }
        let paragraphResults = {}
        for(let paragraphTaskIndex = 0; paragraphTaskIndex < paragraphTasks.length; paragraphTaskIndex++){
            paragraphResults[paragraphTaskIndex] = paragraphTasks[paragraphTaskIndex].runTask();
        }
        await Promise.all(Object.values(paragraphResults));
        return await this.createChapter(paragraphResults);
    }

    async createChapter(paragraphResults) {
        return {
            title: this.configs.title,
            paragraphs: Object.values(paragraphResults)
        }
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
            configs: {

            }
        }
    }

}

module.exports = GenerateChapter;
