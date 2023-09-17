import { usersService, showModal, showActionBox } from "../../../imports.js";

export class usersPage {
    constructor(element) {
        this.lastName = "Last name";
        this.firstName = "First name";
        this.email = "Email";
        this.phoneNumber = "Phone number";
        this.modal = "showAddUserModal";
        this.button = "Add User";
        this.tableRows = "No data loaded";
        this.element = element;
        const userService = new usersService();
        if(webSkel.company.users) {
            this._userConfigs = webSkel.company.users;
            setTimeout(()=> {
                this.invalidate();
            }, 0);
        }
        this.updateState = ()=> {
            this._userConfigs = webSkel.company.users;
            this.invalidate();
        }
        webSkel.company.onChange(this.updateState);
    }

    beforeRender() {
        this.tableRows = "";
        if (this._userConfigs && this._userConfigs.length > 0) {
            this._userConfigs.forEach((item) => {
                this.tableRows += `<user-unit data-last-name="${item.lastName}" data-first-name="${item.firstName}" data-email="${item.email}" data-phone-number="${item.phoneNumber}"></user-unit>`;
            });
        } else {
            this.tableRows = `<user-unit data-last-name="No data loaded"></user-unit>`;
        }
    }

    async showAddUserModal(_target) {
        await showModal(document.querySelector("body"), "add-user-modal", {});
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await showActionBox(_target, primaryKey, componentName, insertionMode);
    }
}