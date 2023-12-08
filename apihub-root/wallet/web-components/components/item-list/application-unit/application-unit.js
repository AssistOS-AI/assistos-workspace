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
        console.log("In development TBD")
       // let flowId = webSkel.currentUser.space.getFlowIdByName("installApplication");
       // await webSkel.getService("applicationService").callFlow(flowId, this.element.getAttribute("data-id"));
    }
}