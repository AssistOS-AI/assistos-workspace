module.exports = {
    ctor: function (brandId, postId, title, image, body, creatorDID, timestamp, isActivated, mintingFee) {
        this.brandId = brandId;
        this.postId = postId;
        this.title = title;
        this.imageBase64 = image.imageBase64;
        this.body = body;
        this.creatorDID = creatorDID;
        this.timestamp = timestamp;
        this.isActivated = isActivated;
        this.mintingFee = mintingFee;
        this.value = isActivated ? mintingFee : 10 * mintingFee;
        this.comments = [];
        this.owner = creatorDID;
    },
    _ctor: function () {
        const currentTransaction = this.getTransaction();
        currentTransaction.lookup(this.brandId, (err, brand) => {
            if (err) {
                let newError = new Error("Failed to lookup brand during post creation");
                newError.previous = err;
                throw newError;
            }
            this._brand = brand;
            this._brand.registerPostOwnership(this.creatorDID, this.postId, this.timestamp);
        });
    },
    read: function () {
        return this.getState();
    },
    set: function (post) {
        Object.keys(post).forEach(key => this[key] = post[key]);
        this.external.brand = this.session.lookup(brandId);
        // shoud check if brand owns this post already by post id?
    },
    isActivated: function () {
        return this.isActivated;
    },
    actions: {
        update: function (title, body) {
            this.title = title;
            this.body = body;
        },
        activate: function (activatorDID) {
            this.isActivated = true;
            this.owner = activatorDID;
            this.brand = this.session.lookup(this.brandId);
            this.brand.updatePostOwnership(activatorDID, this.postId);
        },
        addComment: function (commentId) {
            this.comments.push(commentId);
            let comment = this.session.lookup(commentId);
            this.value += comment.value;
        }
    }
};
