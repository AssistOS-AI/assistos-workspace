const userModule = assistOS.loadModule("user");
export class SystemAdmin {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;

        this.searchQuery = '';
        this.invalidate();
    }

    async beforeRender() {
        this.usersOffset = 0;
        this.paginationLimit = 6;
        this.users = await userModule.getUsers(this.usersOffset, this.paginationLimit);
        this.totalUsers = await userModule.getUsersCount();
        this.totalAdmins = this.users.filter(user => user.role === "admin").length;
        this.usersHTML = this.getUsersHTML();
    }
    getUsersHTML(){
        let usersHTML = "";
        let roleOptions = [{
            name: "Admin",
            value: assistOS.globalRoles.ADMIN,
        },{
            name: "Marketing",
            value: assistOS.globalRoles.MARKETING,
        }, {
            name: "User",
            value: assistOS.globalRoles.USER,
        }]
        if(this.users.length === 0) {
            return `<div class="founder-empty-users">No users found</div>`;
        }
        for(let i= 0; i < this.paginationLimit - 1; i++){
            let user = this.users[i];
            if(!user) {
                continue;
            }
            let blockedHTML = "";
            if(user.blocked){
                blockedHTML = `<img class="blocked-user" src="./wallet/assets/icons/blocked.svg" alt="blocked">`;
            }
            usersHTML += `
                    <div class="cell dashboard-email">${user.email}</div>
                    <div class="cell user-role">
                        <custom-select data-email="${user.email}" data-presenter="custom-select" data-options="${encodeURIComponent(JSON.stringify(roleOptions))}" data-selected="${user.role}" data-name="role" data-width="150"></custom-select>
                    </div>
                    <div class="action-cell">
                        ${blockedHTML}
                        <div class="circle-button" data-local-action="showActionBox dashboard-user-menu ${encodeURIComponent(user.email)}">
                            <img src="./wallet/assets/icons/action-dots.svg" alt="menu">
                        </div>
                    </div>
            `;
        }
        return `
        <div class="table-labels">
            <div class="table-label">Email</div>
            <div class="table-label">Role</div>
            <div class="table-label"></div>
        </div>
        <div class="users-list">
            ${usersHTML}
        </div>`;
    }
    debounce(fn, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }
    async showActionBox(button, componentName ,encodedEmail) {
        let user = this.users.find(u => u.email === decodeURIComponent(encodedEmail));
        let props = {
            email: encodedEmail
        }
        if(user.blocked){
            props.blocked = "blocked-user";
        } else {
            props.blocked = "unblocked-user";
        }
        await assistOS.UI.showActionBox(button, "", componentName, "append", props);
    }
    async afterRender() {
        const searchInput = this.element.querySelector('#founderSearchInput');
        const debouncedInputHandler = this.debounce(async function(e) {
            if(e.target.value.length < 3 && e.target.value.length > 0) {
                return; // Ignore very short inputs
            }
            this.searchQuery = e.target.value;
            let usersList = this.element.querySelector('.users-list-container');

            await assistOS.loadifyComponent(usersList, async () => {
                this.users = await userModule.getMatchingUsers(this.searchQuery);
                this.displayUsers();
                this.changePaginationArrowsUsers();
            });

        }.bind(this), 1000);
        searchInput.addEventListener('input', debouncedInputHandler);
        let usersList = this.element.querySelector('.users-list');
        usersList.addEventListener('change', async (event) => {
            let email = event.target.getAttribute('data-email');
            let role = event.value;
            await userModule.setUserRole(email, role);
        });
        this.changePaginationArrowsUsers();
    }
    changePaginationArrowsUsers(){
            let nextButton = this.element.querySelector('.next-users');
            let prevButton = this.element.querySelector('.previous-users');
            if (this.paginationLimit > this.users.length) {
                nextButton.classList.add('disabled');
            } else {
                nextButton.classList.remove('disabled');
            }

            if (this.usersOffset === 0) {
                prevButton.classList.add('disabled');
            } else {
                prevButton.classList.remove('disabled');
            }
    }
    async changeUserPage(button, direction) {
        if (direction === 'next') {
            this.usersOffset += this.paginationLimit - 1;
        } else if (direction === 'previous') {
            this.usersOffset -= this.paginationLimit - 1;
        }
        let usersList = this.element.querySelector('.users-list-container');
        await assistOS.loadifyComponent(usersList, async () => {
            this.users = await userModule.getUsers(this.usersOffset, this.paginationLimit);
            this.displayUsers();
            this.changePaginationArrowsUsers();
        });
    }

    displayUsers(){
        let usersTableContainer = this.element.querySelector('.users-list-container');
        usersTableContainer.innerHTML = this.getUsersHTML();
    }
    async openUserLog(target, encodedEmail) {
        await assistOS.UI.showModal("user-logs", {email: encodedEmail});
    }
    async blockUser(target, encodedEmail) {
        let email = decodeURIComponent(encodedEmail);
        let message = `Are you sure you want to block user with email ${email}?`;
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if(confirmation){
            await userModule.blockUser(email);
            let user = this.users.find(u => u.email === email);
            user.blocked = true;
            this.invalidate();
            this.showNotification(`User ${email} has been blocked.`);
        }
    }
    async unblockUser(target, encodedEmail) {
        let email = decodeURIComponent(encodedEmail);
        let message = `Are you sure you want to unblock user with email ${email}?`;
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if(confirmation){
            await userModule.unblockUser(email);
            let user = this.users.find(u => u.email === email);
            user.blocked = false;
            this.invalidate();
            this.showNotification(`User ${email} has been unblocked.`);
        }
    }
    async deleteUser(target, encodedEmail) {
        let email = decodeURIComponent(encodedEmail);
        let message = `Are you sure you want to delete user with email ${email}? This action cannot be undone.`;
        let confirmation = await assistOS.UI.showModal("confirm-action-modal", {message}, true);
        if(confirmation){
            await userModule.deleteUser(email);
        }
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = 'founder-notification';

        if (type === 'error') {
            notification.classList.add('error');
        }

        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            notification.classList.add('fade-out');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}