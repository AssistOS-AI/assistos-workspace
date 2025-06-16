export class AdminSpaceItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        let spaceId = this.element.getAttribute('data-space-id');
        let dashboardPresenter = this.element.closest('space-admin').webSkelPresenter;
        this.space = dashboardPresenter.spaces.find(space => space.spaceGlobalId === spaceId);
        this.invalidate();
    }
    beforeRender() {
        this.spaceName = this.space.name;
        this.spaceId = this.space.spaceGlobalId;
        this.usersCount = this.space.users.length;
        this.documentsCount = this.space.documents.length;
        this.usersTable = this.generateMembersTable(this.space);
    }
    changeSpaceVisibility(arrow){
        let usersTable = this.element.querySelector('.founder-members-table');
        if(usersTable.classList.contains('hidden')) {
            usersTable.classList.remove('hidden');
            arrow.classList.add('rotate-left');
        } else {
            usersTable.classList.add('hidden');
            arrow.classList.remove('rotate-left');
        }
    }
    generateMembersTable(space) {
        if (space.users.length === 0) {
            return `<div class="founder-empty-members">No members in this space</div>`;
        }
        return `
            <table class="founder-members-table hidden">
                <thead>
                    <tr>
                        <th>Member</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${space.users.map(user => `
                        <tr>
                            <td>
                                <div class="founder-member-info">
                                    <div class="founder-member-avatar">
                                        ${user.displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                    </div>
                                    <span class="founder-member-name">${user.displayName}</span>
                                </div>
                            </td>
                            <td>
                                <span class="founder-member-email">${user.email}</span>
                            </td>
                            <td>
                                <select class="founder-role-selector" data-local-action="changeRole ${space.spaceGlobalId} ${user.id}">
                                    <option value="ADMIN" ${user.role === 'ADMIN' ? 'selected' : ''}>Admin</option>
                                    <option value="MEMBER" ${user.role === 'MEMBER' ? 'selected' : ''}>Member</option>
                                    <option value="GUEST" ${user.role === 'GUEST' ? 'selected' : ''}>Guest</option>
                                </select>
                            </td>
                            <td>
                                <div class="founder-member-actions">
                                    <button class="founder-action-btn" data-local-action="editMember ${space.spaceGlobalId} ${user.id}" title="Edit member">
                                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                                        </svg>
                                    </button>
                                    <button class="founder-action-btn danger" data-local-action="removeMember ${space.spaceGlobalId} ${user.id}" title="Remove member">
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
}
