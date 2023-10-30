export class Script{
    constructor(scriptData) {
        this.name = scriptData.name;
        this.content = scriptData.content;
        this.id = scriptData.id || webSkel.getService("UtilsService").generateId();
        this.description = scriptData.description;
    }
}