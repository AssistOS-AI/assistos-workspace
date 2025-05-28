export class CommentsSection{
    constructor(element, invalidate, props) {
        this.element = element;
        this.invalidate = invalidate;
        this.props = props;
        this.documentPresenter = this.element.closest("document-view-page").webSkelPresenter;
        this.comments = this.documentPresenter._document.comments.messages;
        if(this.props.chapterId){
            let chapterItem = this.element.closest("chapter-item");
            this.chapterPresenter = chapterItem.webSkelPresenter;
            this.comments = this.chapterPresenter.chapter.comments.messages;
        }
        if(this.props.paragraphId){
            let paragraphItem = this.element.closest("paragraph-item");
            this.paragraphPresenter = paragraphItem.webSkelPresenter;
            this.comments = this.paragraphPresenter.paragraph.comments.messages;
        }
        this.invalidate();
    }
    beforeRender() {
        let commentsHTML = "";
        for(let comment of this.comments){
            commentsHTML += `<div class="comment">
                                <div class="user-details-container">
                                    <div class="user-details">
                                        <div class="user-icon"></div>
<!--                                        <img src="./wallet/assets/icons/user.svg" class="user-icon">-->
                                        <div class="user-info">
                                            <div class="comment-username">Username</div>
                                            <div class="comment-email">${comment.userEmail}</div>
                                        </div>
                                    </div>
                                    <img data-local-action="deleteComment ${comment.id}" src="./wallet/assets/icons/check.svg" class="check-icon pointer">
                                </div>
                                <div class="comment-message">${comment.message}</div>
                             </div>`;
        }
        this.commentsHTML = commentsHTML;
    }
    async deleteComment(icon, id){
        this.comments = this.comments.filter(comment => comment.id !== id);
        let commentItem = icon.closest(".comment");
        commentItem.remove();
        if(this.paragraphPresenter){
            await this.paragraphPresenter.updateComments(this.comments);
        } else if(this.chapterPresenter){
            await this.chapterPresenter.updateComments(this.comments);
        } else {
            await this.documentPresenter.updateComments(this.comments);
        }
    }
    closeComments(button){
        this.element.remove();
    }
}