export class usersService {
    constructor() {

    }

    getPersonalities() {
        return webSkel.company.users || [];
    }

    async addUser(user) {
        await webSkel.localStorage.addUser(user);
        webSkel.company.users.push(user);
    }
}