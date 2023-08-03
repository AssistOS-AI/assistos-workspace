module.exports = {
    ctor: function (userId, name, email, phone, publicDescription) {
        this.userId = userId;
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.publicDescription = publicDescription;
        this.availableInvitesCounter = 0;
        this.acceptedInvites = [];
        /* the email and phone are private by default */
        this.isPrivate = true;
        this.friends = [];
    },
    actions: {
        update: function (name, email, phone, isPrivate) {
            this.name = name;
            this.email = email;
            this.phone = phone;
            this.isPrivate = isPrivate;
        },
        registeredAsValidatedUser: function () {
            this.availableInvitesCounter += 10;
        },
        addInvites: function (invites) {
            this.availableInvitesCounter += invites;
        },
        inviteAccepted: function (inviteId) {
            this.availableInvitesCounter--;
            this.acceptedInvites.push(inviteId);
            this.friends.push(inviteId);
        },
        addFriend: function (friendId) {
            this.friends.push(friendId);
        }

    }
}