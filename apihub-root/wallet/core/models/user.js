export class User {
    constructor(userData) {
        this.id = userData.id;
        this.name =  userData.name || undefined;
        this.email =  userData.email || undefined;
        this.phoneNumber =  userData.phoneNumber || undefined;
    }
}