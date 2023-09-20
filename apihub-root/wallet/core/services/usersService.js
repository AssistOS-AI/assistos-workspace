export class usersService {
    constructor() {

    }

    getPersonalities() {
        return webSkel.space.users || [];
    }

    async addUser(user) {
        await webSkel.localStorage.addUser(user);
        webSkel.space.users.push(user);
    }
}