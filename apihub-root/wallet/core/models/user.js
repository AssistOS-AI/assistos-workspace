export class User {
    constructor(lastName, firstName, email, phoneNumber) {
        this.lastName = lastName || undefined;
        this.firstName = firstName || undefined;
        this.email = email || undefined;
        this.phoneNumber = phoneNumber || undefined;
    }
}