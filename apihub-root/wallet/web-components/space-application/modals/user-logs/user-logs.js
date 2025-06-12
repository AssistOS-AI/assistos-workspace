let userModule = assistOS.loadModule("user");
export class UserLogs {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.email = decodeURIComponent(this.element.getAttribute('data-email'));
        this.invalidate();
    }
    async beforeRender() {
        this.logs = await userModule.getUserLogs(this.email);
        this.userLogs = JSON.stringify(this.logs, null, 2);
    }
    afterRender() {
    }


    closeModal(_target) {
        assistOS.UI.closeModal(_target);
    }
}