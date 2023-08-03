module.exports = {
    ctor: function (brandId, userId) {
        this.brandId = brandId;
        this.userId=userId;
    },
    read: function () {
        return this.getState();
    },
    actions: {
        update: function (brandId, userId) {
            this.brandId = brandId;
            this.userId=userId;
        }
    }
}