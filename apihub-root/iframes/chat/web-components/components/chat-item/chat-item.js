const getDefaultUserImage = async () => {
    try {
        const response = await fetch(`${window.location.origin}/assets/images/default-personality`);
        const imgBuffer = await response.arrayBuffer();
        const blob = new Blob([imgBuffer], { type: response.headers.get('Content-Type') || 'image/png' });
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Error loading default image:", error);
    }
}

const stopStreamButton = `<button class="stop-stream-button chat-option-button" data-local-action="stopResponseStream" data-tooltip="Stop Generating">STOP</button>`
const copyReplyButton = ` <button class="copy-button chat-option-button" data-local-action="copyMessage" data-tooltip="Copy Text"> 
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="#000000" xmlns="http://www.w3.org/2000/svg" class="icon-md-heavy"><path fill-rule="evenodd" clip-rule="evenodd" d="M7 5C7 3.34315 8.34315 2 10 2H19C20.6569 2 22 3.34315 22 5V14C22 15.6569 20.6569 17 19 17H17V19C17 20.6569 15.6569 22 14 22H5C3.34315 22 2 20.6569 2 19V10C2 8.34315 3.34315 7 5 7H7V5ZM9 7H14C15.6569 7 17 8.34315 17 10V15H19C19.5523 15 20 14.5523 20 14V5C20 4.44772 19.5523 4 19 4H10C9.44772 4 9 4.44772 9 5V7ZM5 9C4.44772 9 4 9.44772 4 10V19C4 19.5523 4.44772 20 5 20H14C14.5523 20 15 19.5523 15 19V10C15 9.44772 14.5523 9 14 9H5Z" fill="#000000"></path></svg>
                </button>`
const addToLocalContextButton = `<button class="chat-option-button" data-local-action="addToLocalContext" data-tooltip="Add to Agent's Context">
                <svg height="22px" width="22px" version="1.2" baseProfile="tiny" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"
\t  viewBox="0 0 256 256" xml:space="preserve">
<g id="XMLID_40_">
\t<path id="XMLID_12_" fill="white" d="M66.2,129.3c-4.1,0-7.5,3.4-7.5,7.5c0,4.2,3.4,7.6,7.5,7.6c4.2,0,7.6-3.4,7.6-7.6
\t\tC73.8,132.7,70.4,129.3,66.2,129.3z"/>
\t<polygon id="XMLID_11_" fill="white" points="189.2,32.9 203.9,30.6 193.8,14.7 \t"/>
\t<path id="XMLID_50_" d="M150.3,51.4v10.3c27.4,9.4,47,35.3,47,65.9c0,17.7-6.8,34-17.7,46.3c0,0,3.3-37.1-40.5-37.1
\t\tc-63-1.4-62.2-56.9-62.2-56.9c8.9-9.4,20.3-16.4,33.3-19.7V49.8c-29.7,6.7-54.6,30.3-60.4,55.7c-1.6,6.8-3.3,24.4-3.3,24.4
\t\tl-16.7,42.4c-0.3,0.8-0.5,1.6-0.5,2.5c0,3.6,2.9,6.5,6.5,6.5h10.7v22.5c0,17.5,14.2,31.7,31.7,31.7h12.7v17.4h85.9v-61.1
\t\tc18.8-14.7,30.8-37.6,30.8-63.3C207.5,92,183.4,61.3,150.3,51.4z M66.2,144.4c-4.1,0-7.5-3.4-7.5-7.6c0-4.1,3.4-7.5,7.5-7.5
\t\tc4.2,0,7.6,3.4,7.6,7.5C73.8,141,70.4,144.4,66.2,144.4z"/>
\t<path id="XMLID_47_" d="M197.9,3.1l-11.5,1.9l-13.6,49.3l11.5-1.9l2.8-11.2l21.6-3.5l6.3,9.6l11.9-1.9L197.9,3.1z M189.2,32.9
\t\tl4.5-18.2L204,30.6L189.2,32.9z"/>
\t<path id="XMLID_6_" d="M124.2,79.8c1,0,2.1-0.4,2.8-1.2c0.7-0.8,1.2-1.7,1.2-2.8s-0.4-2.1-1.2-2.8c-0.8-0.8-1.7-1.2-2.8-1.2
\t\ts-2.1,0.4-2.8,1.2c-0.8,0.8-1.2,1.7-1.2,2.8s0.4,2.1,1.2,2.8C122.2,79.4,123.2,79.8,124.2,79.8z"/>
\t<path id="XMLID_5_" d="M125.8,62.7c0.5,0.2,1,0.3,1.4,0.3c1.6,0,3.1-1,3.7-2.6l0,0c0.8-2-0.2-4.3-2.3-5.1c-2-0.8-4.3,0.2-5.1,2.3
\t\tC122.7,59.7,123.8,62,125.8,62.7z"/>
\t<path id="XMLID_4_" d="M130.7,51.6c0.7,0.5,1.5,0.8,2.3,0.8c1.3,0,2.4-0.6,3.2-1.6c1.3-1.7,0.9-4.3-0.8-5.5
\t\tc-1.7-1.3-4.3-0.9-5.5,0.8C128.5,47.8,128.9,50.2,130.7,51.6z"/>
\t<path id="XMLID_3_" d="M141.5,43.5c0.8,0,1.7-0.3,2.4-0.8c1.7-1.3,2-3.8,0.7-5.6c-1.3-1.7-3.8-2-5.6-0.7c-1.7,1.3-2,3.8-0.7,5.6
\t\tC139.1,43,140.3,43.5,141.5,43.5z"/>
\t<path id="XMLID_2_" d="M152,37.5c0.5,0,1-0.1,1.4-0.3c2-0.8,3.1-3.1,2.3-5.2c-0.8-2.1-3.1-3.1-5.2-2.2l0,0c-2,0.8-3.1,3.1-2.3,5.2
\t\tC149,36.6,150.4,37.5,152,37.5z"/>
\t<path id="XMLID_1_" d="M166.6,34.9c1,0,2.1-0.4,2.8-1.2c0.8-0.8,1.2-1.7,1.2-2.8c0-1-0.4-2.1-1.2-2.8c-0.8-0.8-1.7-1.2-2.8-1.2
\t\ts-2.1,0.4-2.8,1.2c-0.8,0.8-1.2,1.7-1.2,2.8c0,1,0.4,2.1,1.2,2.8C164.5,34.5,165.6,34.9,166.6,34.9z"/>
</g>
</svg>
</button>`

const addToGlobalContextButton = `<button class="chat-option-button" data-local-action="addToGlobalContext" data-tooltip="Memorize"><svg width="26px" height="26px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M10 6V4M10 20V18M14 6V4M14 20V18M18.2222 10H20M4 10H5.77778M18.2222 14H20M4 14H5.77778M10 10H14V14H10V10ZM7.99998 18H16C17.1046 18 18 17.1046 18 16V8C18 6.89543 17.1046 6 16 6H7.99998C6.89542 6 5.99998 6.89543 5.99998 8V16C5.99998 17.1046 6.89542 18 7.99998 18Z" stroke="#000000" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
</svg></button>`

function decodeHTML(html) {
    let txt = document.createElement("textarea");
    txt.innerHTML = html;
    return txt.value;
}


export class ChatItem {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.chatPagePresenter = this.element.closest('chat-page').webSkelPresenter
        this.invalidate();
    }

    async beforeRender() {
        let id = this.element.getAttribute("data-id");
        let reply = this.chatPagePresenter.getReply(id);
        this.chatMessage = marked.parse(decodeHTML(reply.message));

        this.ownMessage = this.element.getAttribute("ownMessage");
        let userEmail = this.element.getAttribute("user-email");
        let agentName = this.element.getAttribute("agent-name");
        this.id = this.element.getAttribute("data-id");
        this.spaceId = this.element.getAttribute("spaceId");
        this.isContext = this.element.getAttribute("isContext");

        if (this.ownMessage === "false") {
            this.myselfMessage="";
            this.messageTypeBox = "others-box";
            let imageSrc = "";
            if (userEmail) {
                try {
                    //imageSrc = await getUserProfileImage(this.user);
                } catch (error) {
                    imageSrc = await getDefaultUserImage();
                }
            } else {
                // try {
                //     imageSrc = await getPersonalityImageUrl(this.spaceId, agentName);
                // } catch (e) {
                imageSrc = await getDefaultUserImage();
                //}
            }
            this.imageContainer = `<div class="user-profile-image-container"><img class="user-profile-image" src="${imageSrc}" alt="userImage"></div>`;
            this.chatBoxOptions = `<div class="chat-options other-message">
                ${copyReplyButton}
            </div>`;
        } else {
            this.myselfMessage = "myself-message";
            this.ownMessageClass = "user-box-container";
            this.messageTypeBox = "user-box";
            this.imageContainer = ``;
            this.chatBoxOptions = `<div class="chat-options myself-message">
                  ${copyReplyButton}
                  ${addToGlobalContextButton}
            </div>`;
        }
    }
    updateReply(message) {
        let messageElement = this.element.querySelector(".message");
        messageElement.innerHTML = marked.parse(decodeHTML(message));
    }

    async addToLocalContext(_target) {
        await this.chatPagePresenter.addToLocalContext(this.id, this.element)
    }

    async addToGlobalContext(_target) {
        await this.chatPagePresenter.addToGlobalContext(this)
    }

    async copyMessage(eventTarget) {
        let message = this.element.querySelector(".message").innerText;
        await navigator.clipboard.writeText(message);
    }

    async handleStartStream(endController) {
        this.endStreamController = endController;
        this.stopStreamButton.style.display = "flex";
        await this.chatPagePresenter.handleNewChatStreamedItem(this.messageElement);
    }

    async handleEndStream() {
        this.stopStreamButton.style.display = "none";
        await this.chatPagePresenter.addressEndStream(this.element);
    }

    async stopResponseStream() {
        this.endStreamController.abort();
        delete this.endStreamController;
        this.stopStreamButton.style.display = "none";
        await this.chatPagePresenter.addressEndStream(this.element);
    }

    async afterRender() {
        this.element.setAttribute('id',"done");
        if (this.element.getAttribute('data-last-item') === "true") {
            setTimeout(() => {
                const container = this.element.parentElement;
                container.scrollTo({top: container.scrollHeight, behavior: "instant"});
            }, 100);

        }
        if (this.isContext === "true") {
            this.element.classList.add('context-message')
        }
        if (this.ownMessage) {
            this.stopStreamButton = this.element.querySelector(".stop-stream-button");
        }
        this.chatBoxOptionsElement = this.element.querySelector(".chat-options");
        this.messageElement = this.element.querySelector(".message");
        this.messageElement.addEventListener('mouseenter', () => {
            this.chatBoxOptionsElement.style.display = "flex";
        });
        this.element.addEventListener('mouseleave', () => {
            this.chatBoxOptionsElement.style.display = "none";
        });


        let image = this.element.querySelector(".user-profile-image");
        image?.addEventListener("error", (e) => {
            e.target.src = "./wallet/assets/images/default-personality.png";
        });
    }

    async afterUnload() {
        if (this.endStreamController) {
            this.endStreamController.abort();
        }
    }
}
