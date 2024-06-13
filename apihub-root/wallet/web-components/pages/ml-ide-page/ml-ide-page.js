export class MlIDEPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }


    beforeRender() {
    }

    afterRender() {
        this.setContext();
    }
    setContext() {
        assistOS.context = {
            "location and available actions": "We are in the ML IDE page in OS. Here you can see the ML IDE and create and run ML models. Here are also the available flows for the assistOS. You can add, edit or delete flows."
        }
    }
}