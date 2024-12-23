export class LogEntry {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.type = this.element.type;
        this.logMessage = this.element.message;
        this.data = this.element.dataSet;
        this.time = this.element.time;
        this.agent = this.element.agent || "System"
        this.invalidate();

    }

    async defaultAction(_target, actionValue) {

    }

    async openDocument(_target, documentId, chapterId, paragraphId) {
        await assistOS.UI.changeToDynamicPage(
            'space-application-page',
            `${assistOS.space.id}/Space/document-view-page/${documentId}`
        )
        if (!chapterId) return
        const targetId = paragraphId || chapterId
        let targetElement = document.getElementById(targetId)
        if (targetElement && targetElement.webSkelPresenter) {
            await targetElement.webSkelPresenter.presenterReadyPromise
            targetElement.scrollIntoView()
            return
        }
        const observer = new MutationObserver(async (_, obs) => {
            let el = document.getElementById(targetId)
            if (el && el.webSkelPresenter) {
                await el.webSkelPresenter.presenterReadyPromise
                el.scrollIntoView()
                obs.disconnect()
            }
        })
        observer.observe(document.body, {childList: true, subtree: true})
    }


    async beforeRender() {
        const decorate = (dataItems) => {
            return `<span class="${getClasses(dataItems)}" data-local-action="${getAction(dataItems)}">${getAlias(dataItems)}</span>`
        }

        const getAction = (dataItems) => {
            const keys = Object.keys(dataItems);
            if (keys.includes("documentId")) {
                if (keys.includes("chapterId")) {
                    if (keys.includes("paragraphId")) {
                        return `openDocument ${dataItems.documentId} ${dataItems.chapterId} ${dataItems.paragraphId}`
                    }
                    return `openDocument ${dataItems.documentId} ${dataItems.chapterId}`
                }
                return `openDocument ${dataItems.documentId}`
            }
            return "defaultAction"
        }

        const getClasses = (dateItems) => {
            return Object.keys(dateItems).includes("documentId") ? "click-item" : "default-item"
        }

        const getAlias = (dataItems) => {
            const keys = Object.keys(dataItems);
            if (keys.includes("documentId")) {
                if (keys.includes("chapterId")) {
                    if (keys.includes("paragraphId")) {
                        return `Go to Paragraph ${dataItems.paragraphId}`
                    }
                    return `Go to Chapter ${dataItems.chapterId}`
                }
                return `Go to Document ${dataItems.documentId}`
            }
            return Object.entries(dataItems).map(([key, value]) => {
                return `<span>${key}:${value} </span>`
            }).join("");
        }

        this.data = decorate(this.data)
        switch (this.type) {
            case 'ERROR':
                this.element.classList.add('logERROR');
                break;
            case 'WARNING':
                this.element.classList.add('logWARNING');
                break;
            case 'INFO':
                this.element.classList.add('logINFO');
                break;
            case 'DEBUG':
                this.element.classList.add('logDEBUG');
                break;
            default:
                this.element.classList.add('logDEFAULT');
                break;
        }
    }

    async afterRender() {

    }


    async copyMessage() {
        try {
            await navigator.clipboard.writeText(this.logMessage)
            const copyBtn = this.element.querySelector('.copy-button')
            if (!copyBtn) return
            const toast = document.createElement('div')
            toast.textContent = '✔'
            toast.style.position = 'absolute'
            toast.style.top = '-12px'
            toast.style.right = '-12px'
            toast.style.background = 'rgba(0,0,0,0.7)'
            toast.style.color = '#fff'
            toast.style.padding = '2px 6px'
            toast.style.fontSize = '12px'
            toast.style.borderRadius = '50%'
            toast.style.opacity = '0'
            toast.style.transition = 'opacity 0.2s ease'
            toast.style.pointerEvents = 'none'
            copyBtn.style.position = 'relative'
            copyBtn.appendChild(toast)
            requestAnimationFrame(() => {
                toast.style.opacity = '1'
            })
            setTimeout(() => {
                toast.style.opacity = '0'
                setTimeout(() => {
                    toast.remove()
                }, 200)
            }, 1000)
        } catch (err) {
            console.error('Failed to copy: ', err)
        }
    }

}