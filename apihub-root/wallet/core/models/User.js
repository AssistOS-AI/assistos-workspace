export class User {
    constructor(userData) {
        Object.keys(userData).forEach(objKey => {
            this[objKey] = userData[objKey];
        })
    }

    getUserSpaces() {
        return this.spaces;
    }

}