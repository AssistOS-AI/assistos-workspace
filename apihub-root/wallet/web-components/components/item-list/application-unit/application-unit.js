import {getClosestParentWithPresenter, refreshElement} from "../../../../imports.js";

export class applicationUnit{
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
        debugger;
    }
    beforeRender() {
    }
    async installApplication() {
        const loading = await webSkel.showLoading(`<general-loader></general-loader>`);
        await webSkel.getService("ApplicationsService").installApplication(webSkel.currentUser.space.id, this.element.getAttribute("data-id"));
        loading.close();
        loading.remove();
        window.location="";
    }
}