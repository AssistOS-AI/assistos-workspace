export class User {
    constructor(userData) {
        this.lastName = userData.lastName || undefined;
        this.firstName =  userData.firstName || undefined;
        this.email =  userData.email || undefined;
        this.phoneNumber =  userData.phoneNumber || undefined;
    }
}