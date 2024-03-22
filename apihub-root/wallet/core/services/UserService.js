export class UserService{
    async getUserSpaces(){
        return system.user.spaces;
    }
}