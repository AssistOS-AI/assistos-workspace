function isActivationTokenExpired(expirationDate) {
    const currentDate = new Date();
    const expiryDate = new Date(expirationDate);

    return currentDate > expiryDate;
}
module.exports=isActivationTokenExpired
