
function getAvatarHTML(name, size = 32) {
    let hue = Array.from(name).reduce((s,c)=>s+c.charCodeAt(0),0) % 360
    let bg = `hsl(${hue},60%,50%)`
    return `<div class="avatar" style="background:${bg};width:${size}px;height:${size}px;font-size:${size*0.5}px">${name[0].toUpperCase()}</div>`
}
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
const name = "Nicoleta";
const email = "nicoleta@axiologic.net";
const loginMethods =[
    "Use an Authenticator App (OTP)",
    "Passkey (Google Password Manager)"
]
export class MyAccount {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
            this.name  = name;
            this.email = email;
            this.icon= getAvatarHTML(name,100);
            this.logins = getLoginItems(loginMethods);
    }

    async afterRender() {

    }
}