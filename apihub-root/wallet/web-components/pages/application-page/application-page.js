export class applicationPage {
    constructor(element, invalidate) {
        this.element=element;
        this.invalidate = invalidate;
        this.invalidate();
        let id = webSkel.getService("UtilsService").parseURL();
        this._app = webSkel.currentUser.space.getApplication(id);
    }

    beforeRender() {

    }
}