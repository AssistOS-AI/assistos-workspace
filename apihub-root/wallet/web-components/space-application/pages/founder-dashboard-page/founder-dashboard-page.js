const spaceModule = assistOS.loadModule("space");
export class FounderDashboardPage {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;

        this.spaces = [
            {
                id: "space_1",
                spaceGlobalId: "workspace_001",
                name: "Engineering Team",
                documents: ["doc1", "doc2", "doc3"],
                clock: 1234567890,
                permissions: {},
                members: [
                    { id: "user_1", email: "john@example.com", displayName: "John Doe", role: "ADMIN" },
                    { id: "user_2", email: "jane@example.com", displayName: "Jane Smith", role: "MEMBER" },
                    { id: "user_3", email: "bob@example.com", displayName: "Bob Johnson", role: "MEMBER" },
                    { id: "user_4", email: "alice@example.com", displayName: "Alice Brown", role: "GUEST" }
                ]
            },
            {
                id: "space_2",
                spaceGlobalId: "workspace_002",
                name: "Marketing Hub",
                documents: ["doc4", "doc5"],
                clock: 1234567891,
                permissions: {},
                members: [
                    { id: "user_1", email: "john@example.com", displayName: "John Doe", role: "MEMBER" },
                    { id: "user_5", email: "sarah@example.com", displayName: "Sarah Wilson", role: "ADMIN" },
                    { id: "user_6", email: "mike@example.com", displayName: "Mike Davis", role: "MEMBER" }
                ]
            },
            {
                id: "space_3",
                spaceGlobalId: "workspace_003",
                name: "Product Design",
                documents: ["doc6", "doc7", "doc8", "doc9"],
                clock: 1234567892,
                permissions: {},
                members: [
                    { id: "user_7", email: "emma@example.com", displayName: "Emma Taylor", role: "ADMIN" },
                    { id: "user_8", email: "chris@example.com", displayName: "Chris Anderson", role: "MEMBER" },
                    { id: "user_9", email: "lisa@example.com", displayName: "Lisa Martinez", role: "GUEST" }
                ]
            },
            {
                id: "space_4",
                spaceGlobalId: "workspace_004",
                name: "Sales Operations",
                documents: ["doc10"],
                clock: 1234567893,
                permissions: {},
                members: [
                    { id: "user_10", email: "david@example.com", displayName: "David Lee", role: "ADMIN" },
                    { id: "user_11", email: "mary@example.com", displayName: "Mary Johnson", role: "MEMBER" }
                ]
            }
        ];

        this.searchQuery = '';
        this.invalidate();
    }

    async beforeRender() {
        this.totalSpaces = this.spaces.length;
        this.totalMembers = new Set(
            this.spaces.flatMap(space => space.members.map(member => member.id))
        ).size;
        this.totalAdmins = this.spaces.flatMap(space =>
            space.members.filter(member => member.role === "ADMIN")
        ).length;
        this.totalDocuments = this.spaces.reduce((sum, space) => sum + (space.documents?.length || 0), 0);

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
            this.searchQuery = e.target.value;
            let {users, spaces} = await spaceModule.getMatchingUsersOrSpaces(this.searchQuery);
            //this.updateSpacesList();
        }.bind(this), 1000);
        searchInput.addEventListener('input', debouncedInputHandler);

    }

    generateSpacesList() {
        let filteredSpaces = this.getFilteredSpaces(this.spaces);

        return filteredSpaces.map(space => `
            <div class="founder-space-item">
                <div class="founder-space-header">
                    <div class="founder-space-header-content">
                        <div class="founder-space-info">
                            <h3 class="founder-space-name">${space.name}</h3>
                            <div class="founder-space-meta">
                                <span class="founder-space-id">${space.spaceGlobalId}</span>
                                <div class="founder-space-stats">
                                    <span class="founder-space-stat">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                                            <circle cx="9" cy="7" r="4"></circle>
                                        </svg>
                                        ${space.members.length} members
                                    </span>
                                    <span class="founder-space-stat">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                                            <polyline points="14 2 14 8 20 8"></polyline>
                                        </svg>
                                        ${space.documents?.length || 0} documents
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                ${this.generateMembersTable(space)}
            </div>
        `).join('');
    }

    generateMembersTable(space) {
        if (space.members.length === 0) {
            return `<div class="founder-empty-members">No members in this space</div>`;
        }

        return `
            <table class="founder-members-table">
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${space.members.map(member => `
                        <tr>
                            <td>
                                <div class="founder-member-info">
                                    <div class="founder-member-avatar">
                                        ${member.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                    <span class="founder-member-name">${member.displayName}</span>
                                </div>
                            </td>
                            <td>
                                <span class="founder-member-email">${member.email}</span>
                            </td>
                            <td>
                                <select class="founder-role-selector" data-local-action="changeRole ${space.id} ${member.id}">
                                    <option value="ADMIN" ${member.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                                    <option value="MEMBER" ${member.role === 'MEMBER' ? 'selected' : ''}>Member</option>
                                    <option value="GUEST" ${member.role === 'GUEST' ? 'selected' : ''}>Guest</option>
                                </select>
                            </td>
                            <td>
                                <div class="founder-member-actions">
                                    <button class="founder-action-btn" data-local-action="editMember ${space.id} ${member.id}" title="Edit member">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button class="founder-action-btn danger" data-local-action="removeMember ${space.id} ${member.id}" title="Remove member">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <polyline points="3 6 5 6 21 6"></polyline>
                                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                        </svg>
                                    </button>
                                </div>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    getFilteredSpaces(spaces) {
        if (!this.searchQuery) return spaces;

        return spaces.filter(space =>
            space.name.toLowerCase().includes(this.searchQuery) ||
            space.spaceGlobalId.toLowerCase().includes(this.searchQuery) ||
            space.members.some(member =>
                member.displayName.toLowerCase().includes(this.searchQuery) ||
                member.email.toLowerCase().includes(this.searchQuery)
            )
        );
    }

    updateSpacesList() {
        const spacesList = this.element.querySelector('#founderSpacesList');
        if (spacesList) {
            spacesList.innerHTML = this.generateSpacesList();
        }
    }

    changeRole(target, spaceId, memberId) {
        const newRole = target.value;
        const space = this.spaces.find(s => s.id === spaceId);
        if (space) {
            const member = space.members.find(m => m.id === memberId);
            if (member) {
                const oldRole = member.role;
                member.role = newRole;

                this.totalAdmins = this.spaces.flatMap(space =>
                    space.members.filter(member => member.role === "ADMIN")
                ).length;

                this.invalidate();
                this.showNotification(`Changed ${member.displayName}'s role from ${oldRole} to ${newRole}`);
            }
        }
    }

    editMember(target, spaceId, memberId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (space) {
            const member = space.members.find(m => m.id === memberId);
            if (member) {
                this.showNotification(`Edit functionality coming soon for ${member.displayName}`);
            }
        }
    }

    removeMember(target, spaceId, memberId) {
        const space = this.spaces.find(s => s.id === spaceId);
        if (space) {
            const memberIndex = space.members.findIndex(m => m.id === memberId);
            if (memberIndex !== -1) {
                const removedMember = space.members[memberIndex];

                const adminCount = space.members.filter(m => m.role === 'ADMIN').length;
                if (removedMember.role === 'ADMIN' && adminCount === 1) {
                    this.showNotification('Cannot remove the last admin from a space', 'error');
                    return;
                }

                if (confirm(`Are you sure you want to remove ${removedMember.displayName} from ${space.name}?`)) {
                    space.members.splice(memberIndex, 1);

                    this.totalMembers = new Set(
                        this.spaces.flatMap(space => space.members.map(member => member.id))
                    ).size;
                    this.totalAdmins = this.spaces.flatMap(space =>
                        space.members.filter(member => member.role === "ADMIN")
                    ).length;

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