const name = "Nicoleta";
const email = "nicoleta@axiologic.net";
function getAvatarHTML(name, size = 32) {
    let hue = Array.from(name).reduce((s, c) => s + c.charCodeAt(0), 0) % 360
    let bg = `hsl(${hue},60%,50%)`
    return `<div class="avatar" style="background:${bg};width:${size}px;height:${size}px;font-size:${size * 0.5}px">${name[0].toUpperCase()}</div>`
}

export class MyAccountData {
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.invalidate();
    }

    async beforeRender() {
        this.name = name;
        this.email = email;
        this.icon = getAvatarHTML(name, 100);
    }

    async afterRender() {

    }
}