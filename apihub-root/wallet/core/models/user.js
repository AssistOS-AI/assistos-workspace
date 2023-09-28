export class User {
    constructor(userData) {
        this.id = userData.id;
        this.name =  userData.name || undefined;
        this.email =  userData.email || undefined;
        this.phoneNumber =  userData.phoneNumber || undefined;
        this.secretToken =  userData.secretToken || undefined;
    }

    static getUsers() {
        return webSkel.space.users || [];
    }

   static async createUser(userData) {
       const randomNr = crypto.generateRandom(32);
       const secretToken = crypto.encrypt(randomNr,crypto.deriveEncryptionKey(formInfo.data.password));
       delete userData.password;

       userData.secretToken = secretToken;
       userData.id = crypto.getRandomSecret(32).toString().split(",").join("");
       webSkel.space.users.push(new User(userData));
       // let result = await storageManager.storeObject(currentSpaceId, "users", userData.id, JSON.stringify(userData));
       // return result.text();
       return `user created: ${userData}`;
    }
}