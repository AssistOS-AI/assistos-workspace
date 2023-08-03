module.exports = {
    ctor: function (brandId, postId, commentId, title, body, creatorDID, timestamp, mintingFee) {
        this.brandId = brandId;
        this.postId = postId;
        this.commentId = commentId;
        this.title = title;
        this.body = body;
        this.creatorDID = creatorDID;
        this.timestamp = timestamp;
        this.value = 0;
        this.owner = creatorDID;
        this.mintingFee = mintingFee;
        this.replies = [];
    },
    _ctor: function () {
        const currentTransaction = this.getTransaction();
        currentTransaction.lookup(this.brandId, (err, brand) => {
            if (err) {
                let newError = new Error("Failed to lookup brand during comment creation");
                newError.previous = err;
                throw newError;
            }
            this._brand = brand;
            this._brand.registerCommentOwnership(this.creatorDID, this.commentId, this.postId, this.timestamp);
        });
    },
    read: function () {
        return this.getState();
    },
    actions: {
        update: function (title, body) {
            this.title = title;
            this.body = body;
        },
        addReply: function (replyId) {
            this.replies.push(replyId);
            const currentSession = this.getSession();
            currentSession.lookup(replyId, (err, reply)=>{
                if (err) {
                    let newError = new Error("Failed to lookup comment during adding a reply");
                    newError.previous = err;
                    throw newError;
                }
                this.value += reply.value;
            });
            
        }
    }
}