const spaceModule = assistOS.loadModule("space")

export class BuildErrors {
    constructor(element,invalidate){
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }
    async beforeRender(){
        //this.errors = await spaceModule.getErrorsFromLastBuild(assistOS.space.id);
        this.errors = [];
        if(this.errors.length === 0){
            this.buildErrors = `[No errors from last build]`;
        } else {
            this.buildErrors = JSON.stringify(this.errors, null, 2);
        }
    }
}