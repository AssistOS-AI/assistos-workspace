const spaceModule = assistOS.loadModule("space");
const userModule = assistOS.loadModule("user");
export class SpaceAdmin {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.searchQuery = '';
        this.invalidate();
    }

    async beforeRender() {
        this.spacesOffset = 0;
        this.paginationLimit = 6;
        this.spaces = await spaceModule.getSpaces(this.spacesOffset, this.paginationLimit);
        this.totalSpaces = await spaceModule.getSpacesCount();
        this.totalDocuments = await spaceModule.getAllDocumentsCount();
        this.spacesContent = this.generateSpacesList();
    }

    debounce(fn, delay) {
        let timeout;
        return function(...args) {
            clearTimeout(timeout);
            timeout = setTimeout(() => fn.apply(this, args), delay);
        };
    }

    async afterRender() {
        const searchInput = this.element.querySelector('#founderSearchInput');
        const debouncedInputHandler = this.debounce(async function(e) {
            if(e.target.value.length < 3 && e.target.value.length > 0) {
                return; // Ignore very short inputs
            }
            this.searchQuery = e.target.value;

            let spacesList = this.element.querySelector('.founder-spaces-list');

            await assistOS.loadifyComponent(spacesList, async () => {
                this.spaces = await spaceModule.getMatchingSpaces(this.searchQuery);
                this.displaySpaces();
                this.changePaginationArrowsSpaces();
            });

        }.bind(this), 1000);
        searchInput.addEventListener('input', debouncedInputHandler);
        this.changePaginationArrowsSpaces();
    }
    changePaginationArrowsSpaces(){
        let nextButton = this.element.querySelector('.next-spaces');
        let prevButton = this.element.querySelector('.previous-spaces');
        if (this.paginationLimit > this.spaces.length) {
            nextButton.classList.add('disabled');
        } else {
            nextButton.classList.remove('disabled');
        }

        if (this.spacesOffset === 0) {
            prevButton.classList.add('disabled');
        } else {
            prevButton.classList.remove('disabled');
        }
    }
    async changeSpacePage(button, direction) {
        if (direction === 'next') {
            this.spacesOffset += this.paginationLimit - 1;
        } else if (direction === 'previous') {
            this.spacesOffset -= this.paginationLimit - 1;
        }
        let spacesList = this.element.querySelector('.founder-spaces-list');
        await assistOS.loadifyComponent(spacesList, async () => {
            this.spaces = await spaceModule.getSpaces(this.spacesOffset, this.paginationLimit);
            this.displaySpaces();
            this.changePaginationArrowsSpaces();
        });
    }

    generateSpacesList() {
        let spacesList = "";
        for(let i= 0; i < this.paginationLimit - 1; i++){
            let space = this.spaces[i];
            if(!space) {
                continue;
            }
            spacesList += `<admin-space-item data-space-id="${space.spaceGlobalId}" data-presenter="dashboard-space-item"></admin-space-item>`;
        }
        return spacesList;
    }

    displaySpaces() {
        const spacesList = this.element.querySelector('.founder-spaces-list');
        if (spacesList) {
            spacesList.innerHTML = this.generateSpacesList();
        }
    }

    changeRole(target, spaceId, memberId) {
        const newRole = target.value;
        const space = this.spaces.find(s => s.id === spaceId);
        if (space) {
            const member = space.users.find(m => m.id === memberId);
            if (member) {
                const oldRole = member.role;
                member.role = newRole;

                this.totalAdmins = this.users.filter(user => user.role === "admin").length;

                this.invalidate();
                this.showNotification(`Changed ${member.displayName}'s role from ${oldRole} to ${newRole}`);
            }
        }
    }

    editMember(target, spaceId, memberId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (space) {
            const member = space.users.find(m => m.id === memberId);
            if (member) {
                this.showNotification(`Edit functionality coming soon for ${member.displayName}`);
            }
        }
    }

    removeMember(target, spaceId, memberId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (space) {
            const memberIndex = space.users.findIndex(m => m.id === memberId);
            if (memberIndex !== -1) {
                const removedMember = space.users[memberIndex];

                const adminCount = space.users.filter(m => m.role === 'ADMIN').length;
                if (removedMember.role === 'ADMIN' && adminCount === 1) {
                    this.showNotification('Cannot remove the last admin from a space', 'error');
                    return;
                }

                if (confirm(`Are you sure you want to remove ${removedMember.displayName} from ${space.name}?`)) {
                    space.users.splice(memberIndex, 1);

                    this.totalUsers = new Set(
                        this.spaces.flatMap(space => space.users.map(member => member.id))
                    ).size;
                    this.totalAdmins = this.users.filter(user => user.role === "admin").length;

                    this.invalidate();
                    this.showNotification(`${removedMember.displayName} removed from ${space.name}`);
                }
            }
        }
    }

    inviteMember(target, spaceId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (space) {
            this.showNotification(`Invite member functionality coming soon for ${space.name}`);
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