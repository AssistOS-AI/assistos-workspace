export class LogEntry {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.type = this.element.type;
        this.logMessage = this.element.message;
        this.data = this.element.dataSet;
        this.time = this.element.time;
        this.agent = this.element.agent||"System"
        this.invalidate();

    }

    async beforeRender() {
        this.data = Object.entries(this.data).map(([key, value]) => {
            return `<span>${key}:${value} </span>`
        }).join("");
        switch (this.type) {
            case 'ERROR':
                this.element .classList.add('logERROR');
                break;
            case 'WARNING':
                this.element .classList.add('logWARNING');
                break;
            case 'INFO':
                this.element .classList.add('logINFO');
                break;
            case 'DEBUG':
                this.element .classList.add('logDEBUG');
                break;
            default:
                this.element .classList.add('logDEFAULT');
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