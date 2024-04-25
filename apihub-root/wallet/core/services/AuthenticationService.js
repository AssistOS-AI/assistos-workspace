export class AuthenticationService{
    getDemoUserCredentials() {
        try {
            const demoUserCredentials= JSON.parse(getCookieValue("demoCredentials"));
            return [demoUserCredentials.email, demoUserCredentials.password]
        } catch (error) {
            console.log(error+"No demo credentials found")
            return ["",""];
        }
    }
}