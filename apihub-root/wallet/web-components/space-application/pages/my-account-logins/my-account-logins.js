const loginMethods = [
    "Use an Authenticator App (OTP)",
    "Passkey (Google Password Manager)"
]

function getLoginItems(methods) {
    return methods.map((method) => {
        return `<div class="underlined multi-value">
        <span class="accountDataValue">
            ${method}
        </span>
        <span>
        <img src="./wallet/assets/icons/trash-can.svg" alt="menu">
        </span>
    </div>`
    }).join('');
}

export class MyAccountLogins {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.logins = getLoginItems(loginMethods);
    }

    async afterRender() {

    }
    async deleteAccount() {
        let message = `Are you sure you want to delete your account ${localStorage.getItem("userEmail")||""}`;
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if (confirmation) {
            let currentSpaceId;
            let message = await assistOS.loadifyComponent(this.element, async () => {
                return message;
            });
            if (message) {
                await showApplicationError("Error deleting Account", message, "");
            } else {
                window.location.href = window.location.href.split("#")[0] + `#${currentSpaceId}`;
                window.location.reload();
            }
        }
    }
}