import { closeModal } from "../../../../WebSkel/utils/modal-utils.js";

export class addUserModal {
    constructor() {
        if(webSkel.company.users) {
            this._userConfigs = webSkel.company.users;
            setTimeout(()=> {
                this.invalidate()
            }, 0);
        }
        this.updateState = ()=> {
            this._userConfigs = webSkel.company.users;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {

    }

    closeModal(_target) {
        closeModal(_target);
    }

    submitForm(_target) {
        closeModal(_target);
    }
}