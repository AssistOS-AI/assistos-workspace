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
}