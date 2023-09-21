export class User {
    constructor(lastName, firstName, email, phoneNumber) {
        this.lastName = lastName || undefined;
        this.firstName = firstName || undefined;
        this.email = email || undefined;
        this.phoneNumber = phoneNumber || undefined;
    }

    static getUsers() {
        return webSkel.space.users || [];
    }

    async static addUser(user) {
        await webSkel.storageService.addUser(user);
        webSkel.space.users.push(user);
    }
}