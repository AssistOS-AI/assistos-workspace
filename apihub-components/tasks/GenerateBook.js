const Task = require('./Task');

const GenerateChapter = require('./GenerateChapter');

class GenerateBook extends Task {
    constructor(securityContext, spaceId, userId, configs) {
        super(securityContext, spaceId, userId);
        this.configs = configs

    }

    async runTask() {
        let chapterTasks = [];
        for (let chapterIndex = 0; chapterIndex < this.configs.chapters.length; chapterIndex++) {
            const chapter = this.configs.chapters[chapterIndex];
            chapterTasks.push(new GenerateChapter(this.securityContext, this.spaceId, this.userId, chapter));
        }

        let chapterResults = {}

        for (let chapterTaskIndex = 0; chapterTaskIndex < chapterTasks.length; chapterTaskIndex++) {
            chapterResults[chapterTaskIndex] = chapterTasks[chapterTaskIndex].runTask();
        }
        await Promise.all(Object.values(chapterResults));
        return await this.createBook(chapterResults);
    }

    async createBook(chapterResults) {
        return {
            title: this.configs.title,
            author: this.configs.author,
            edition: this.configs.edition,
            chapters: Object.values(chapterResults)
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
            configs: {}
        }
    }
}

module.exports = GenerateBook;
