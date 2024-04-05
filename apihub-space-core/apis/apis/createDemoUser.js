const {
    registerUser,
    activateUser,
    hashPassword
} = require('../exporter.js')
('registerUser', 'activateUser', 'hashPassword')

const {email, password, username} = require('../../../demoUser.json');

async function createDemoUser() {
    console.log("Creating Demo User")
    try {
        await registerUser(username, email, await hashPassword(password))
        const usersPendingActivation = require('../../../data-volume/UsersPendingActivation.json')
        const activationToken = Object.keys(usersPendingActivation)[0]
        await activateUser(activationToken)
        console.log('Demo User Created')
    } catch (e) {
        console.error(`Failed Creating Demo User` + e)
    }
}
module.exports=createDemoUser