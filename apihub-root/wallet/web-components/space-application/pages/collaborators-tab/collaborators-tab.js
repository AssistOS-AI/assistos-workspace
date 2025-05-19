const spaceModule = require('assistos').loadModule('space', {});

const mockCollaborators = [
    {
        username:"Alex",
        email: "demoemail@com",
        role: "member",
        documentsCreated: 0,
        tasksCreated: 10,
        tokensUsed: 2000

    },
    {
        email: "demoemail1@com",
        username: "John",
        role: "admin",
        documentsCreated: 5,
        tasksCreated: 20,
        tokensUsed: 300
    },
    {
        email: "demoemail2@com",
        username: "Jane",
        role: "guest",
        documentsCreated: 2,
        tasksCreated: 100,
        tokensUsed: 50000
    },
    {
        email: "demoemail3@com",
        username:"Carlos",
        role: "member",
        documentsCreated: 1,
        tasksCreated: 1,
        tokensUsed: 25
    }
]
const roles = [
    "Member",
    "Guest",
    "Admin"
]
function getAvatarHTML(name, size = 32) {
    let hue = Array.from(name).reduce((s,c)=>s+c.charCodeAt(0),0) % 360
    let bg = `hsl(${hue},60%,50%)`
    return `<div class="avatar" style="background:${bg};width:${size}px;height:${size}px;font-size:${size*0.5}px">${name[0].toUpperCase()}</div>`
}


const trashIcon =
    `<svg width="19" height="18" viewBox="0 0 19 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M4.17426 17.9036C3.58372 17.9036 3.07836 17.709 2.65818 17.3197C2.238 16.9305 2.02755 16.462 2.02684 15.9143V2.98393C1.72262 2.98393 1.46779 2.88845 1.26236 2.69747C1.05692 2.5065 0.953845 2.27044 0.953129 1.98929C0.952413 1.70814 1.05549 1.47207 1.26236 1.2811C1.46923 1.09013 1.72405 0.994644 2.02684 0.994644H6.32168C6.32168 0.712828 6.42476 0.476766 6.63091 0.286458C6.83706 0.096149 7.09189 0.000663096 7.39539 0H11.6902C11.9945 0 12.2496 0.0954859 12.4558 0.286458C12.6619 0.477429 12.7647 0.713491 12.7639 0.994644H17.0588C17.363 0.994644 17.6182 1.09013 17.8243 1.2811C18.0305 1.47207 18.1332 1.70814 18.1325 1.98929C18.1318 2.27044 18.0287 2.50683 17.8233 2.69847C17.6178 2.8901 17.363 2.98526 17.0588 2.98393V15.9143C17.0588 16.4614 16.8487 16.9298 16.4285 17.3197C16.0083 17.7096 15.5026 17.9043 14.9114 17.9036H4.17426ZM14.9114 2.98393H4.17426V15.9143H14.9114V2.98393ZM7.39539 13.925C7.69961 13.925 7.95479 13.8295 8.16095 13.6386C8.3671 13.4476 8.46982 13.2115 8.4691 12.9304V5.96786C8.4691 5.68605 8.36602 5.44999 8.15987 5.25968C7.95372 5.06937 7.69889 4.97388 7.39539 4.97322C7.09189 4.97256 6.83706 5.06804 6.63091 5.25968C6.42476 5.45131 6.32168 5.68737 6.32168 5.96786V12.9304C6.32168 13.2122 6.42476 13.4486 6.63091 13.6396C6.83706 13.8305 7.09189 13.9257 7.39539 13.925ZM11.6902 13.925C11.9945 13.925 12.2496 13.8295 12.4558 13.6386C12.6619 13.4476 12.7647 13.2115 12.7639 12.9304V5.96786C12.7639 5.68605 12.6609 5.44999 12.4547 5.25968C12.2486 5.06937 11.9937 4.97388 11.6902 4.97322C11.3867 4.97256 11.1319 5.06804 10.9258 5.25968C10.7196 5.45131 10.6165 5.68737 10.6165 5.96786V12.9304C10.6165 13.2122 10.7196 13.4486 10.9258 13.6396C11.1319 13.8305 11.3867 13.9257 11.6902 13.925Z" fill="white"/>
</svg>
`
const getDeleteButton = (email) => {
    return `<button class="options-container-button" data-local-action="showActionBox  action-box-collaborators append""">
                <svg width="6" height="20" viewBox="0 0 6 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3 15.1504C3.54542 15.1504 4.07106 15.3399 4.48926 15.6826L4.66211 15.8379C5.10282 16.2786 5.34961 16.8767 5.34961 17.5C5.34961 18.0454 5.1601 18.5711 4.81738 18.9893L4.66211 19.1621C4.2214 19.6028 3.62326 19.8496 3 19.8496C2.45458 19.8496 1.92894 19.6601 1.51074 19.3174L1.33789 19.1621C0.89718 18.7214 0.650391 18.1233 0.650391 17.5C0.650391 16.9546 0.8399 16.4289 1.18262 16.0107L1.33789 15.8379C1.7786 15.3972 2.37674 15.1504 3 15.1504ZM3 7.65039C3.54542 7.65039 4.07106 7.8399 4.48926 8.18262L4.66211 8.33789C5.10282 8.7786 5.34961 9.37674 5.34961 10C5.34961 10.5454 5.1601 11.0711 4.81738 11.4893L4.66211 11.6621C4.2214 12.1028 3.62326 12.3496 3 12.3496C2.45458 12.3496 1.92894 12.1601 1.51074 11.8174L1.33789 11.6621C0.89718 11.2214 0.650391 10.6233 0.650391 10C0.650391 9.45458 0.8399 8.92894 1.18262 8.51074L1.33789 8.33789C1.7786 7.89718 2.37674 7.65039 3 7.65039ZM3 0.150391C3.54542 0.150391 4.07106 0.3399 4.48926 0.682617L4.66211 0.837891C5.10282 1.2786 5.34961 1.87674 5.34961 2.5C5.34961 3.04542 5.1601 3.57106 4.81738 3.98926L4.66211 4.16211C4.2214 4.60282 3.62326 4.84961 3 4.84961C2.45458 4.84961 1.92894 4.6601 1.51074 4.31738L1.33789 4.16211C0.89718 3.7214 0.650391 3.12326 0.650391 2.5C0.650391 1.95458 0.8399 1.42894 1.18262 1.01074L1.33789 0.837891C1.72348 0.452297 2.22965 0.214571 2.76758 0.161133L3 0.150391Z" fill="#595959" stroke="#595959" stroke-width="0.3"></path>
                </svg>
            </button>`
}

export class CollaboratorsTab {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.invalidate();
    }

    async beforeRender() {
        // let collaborators = await spaceModule.getCollaborators(assistOS.space.id);
        let collaborators = mockCollaborators;
        this.collaboratorsHTML = collaborators.map(c => `
        <tr>
              <td class="collaborator-user ">
      ${getAvatarHTML(c.username)}
      <div class="user-info">
        <div class="user-name">${c.username}</div>
        <div class="user-email">${c.email}</div>
      </div>
    </td>
            <td>
                <select class="collaborator-role" data-user-email="${c.email}">
                    ${roles.map(r=>`<option value="${r.toLowerCase()}"${c.role===r.toLowerCase()?' selected':''}>${r}</option>`).join('')}
                </select>
            </td>
            <td>${c.documentsCreated}</td>
            <td>${c.tasksCreated}</td>
            <td>${c.tokensUsed}</td>
            <td class="actions-button">${getDeleteButton(c.email)}</td>
        </tr>
    `).join('')
    }

    afterRender() {
        this.element.querySelectorAll('.actions-button')
            .forEach(b => b.style.marginRight = '70px');

        this.element.querySelectorAll('.collaborator-role').forEach(el => {
            el.addEventListener('change', async e => {
                let email = e.target.dataset.userEmail
                let role = e.target.value
                let msg = await spaceModule.setCollaboratorRole(assistOS.space.id, email, role)
                if(msg) alert(msg)
                this.invalidate()
            })
        })
    }

    async showActionBox(_target, primaryKey, componentName, insertionMode) {
        await assistOS.UI.showActionBox(_target, primaryKey, componentName, insertionMode);
    }
    addCollaborator() {
        assistOS.UI.showModal("add-space-collaborator-modal");
    }

    async removeCollaborator(button, email) {
        let message = `Are you sure you want to delete collaborator ${email}?`;
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message: message}, true);
        if (confirmation) {
            let message = await spaceModule.removeCollaborator(assistOS.space.id, email);
            if (message) {
                alert(message);
            } else {
                this.invalidate();
            }
        }
    }
}