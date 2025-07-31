export class ApplicationCreatorLanding {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender(){

    }

    async afterRender(){
        //document.querySelector('.tab-content').style.padding = '0';
    }

}