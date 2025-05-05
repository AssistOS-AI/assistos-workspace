const spaceModule = require("assistos").loadModule("space", {});

export class BuildErrors {
    constructor(element,invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    async beforeRender(){
        //this.errors = await spaceModule.getErrorsFromLastBuild(assistOS.space.id);
        this.errors = [];
        this.buildErrors = JSON.stringify(this.errors, null, 2);
    }
}