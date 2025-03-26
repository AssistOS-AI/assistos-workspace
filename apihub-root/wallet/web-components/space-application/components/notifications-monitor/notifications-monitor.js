const utilModule = require('assistos').loadModule('util', {});

export class NotificationsMonitor {
    constructor(element, invalidate) {
        this.element = element;
        this.invalidate = invalidate;
        this.taskWatchers = {};
        this.currentTab = null;
        this.tasksToWatch = [];
        this.invalidate();
    }

    async beforeRender() {
        this.debugChecked = localStorage.getItem('logType') === 'debug' ? "checked" : "";
        this.observingMode = this.debugChecked ? "debug" : "info";
    }

    async afterRender() {
        this.header = this.element.querySelector('#monitorHeader');
        this.minimizeBtn = this.element.querySelector('#minimizeMonitor');
        this.addBtn = this.element.querySelector('#addWatcher');
        this.tabsContainer = this.element.querySelector('#tabsContainer');
        this.taskWatchersContainer = this.element.querySelector('#taskWatchersContainer');

        this.addBtn.addEventListener('click', () => this.promptAddWatcher());

        const llmObserverTab = document.createElement('div');
        llmObserverTab.classList.add('tab', 'active');
        llmObserverTab.textContent = 'Notifications';
        this.tabsContainer.insertBefore(llmObserverTab, this.addBtn);
        llmObserverTab.addEventListener('click', () => this.activateTab('llmObserver'));

        this.taskWatchers['llmObserver'] = {
            tab: llmObserverTab,
            taskWatcherElement: this.taskWatchersContainer.querySelector('llm-observer')
        };
        this.currentTab = 'llmObserver';

        let tasksToWatch = localStorage.getItem('tasksToWatch') ? JSON.parse(localStorage.getItem('tasksToWatch')) : [];

        for (let taskId of tasksToWatch) {
            await this.addTaskWatcher(taskId);
        }

        this.filterLogsOptionsElement = this.element.querySelector('#filterLogsOptions')

    }

    async downloadSpaceTaskLogs(_target) {
        window.location.href = `/logs/${assistOS.space.id}`;
    }


    showFilterLogsOptions() {
        const leaveFilterLogsOptions = (event) => {
            if (!event.target.closest('#filterLogsOptions') && event.target.id !== 'filterLogs') {
                this.filterLogsOptionsElement.classList.remove('active');
                document.removeEventListener('click', leaveFilterLogsOptions);
            }
        };

        if (!this.filterLogsOptionsElement.classList.contains('active')) {
            this.filterLogsOptionsElement.classList.add('active');
            setTimeout(() => {
                document.addEventListener('click', leaveFilterLogsOptions);
            }, 0);
        }
    }

    async toggleDebugCheckbox() {
        let llmObserver=this.element.querySelector('llm-observer');
        const llmObserverPresenter=llmObserver.webSkelPresenter;
        if (this.debugCheckbox.checked) {
            localStorage.setItem('logType', 'debug');
            await llmObserverPresenter.observeDebugLogs();
        } else {
            localStorage.setItem('logType', 'info');
            await llmObserverPresenter.observeInfoLogs();
        }
    }


    promptAddWatcher() {
        const taskId = prompt("Insert Task ID:");
        if (taskId) {
            this.addTaskWatcher(taskId);
        }
    }

    addTaskToCache(taskId) {
        this.tasksToWatch.push(taskId);
        localStorage.setItem('tasksToWatch', JSON.stringify(this.tasksToWatch));
    }

    removeTaskFromCache(taskId) {
        this.tasksToWatch = this.tasksToWatch.filter(id => id !== taskId);
        localStorage.setItem('tasksToWatch', JSON.stringify(this.tasksToWatch));
    }

    async addTaskWatcher(taskId) {
        if (this.taskWatchers[taskId]) {
            return;
        }
        try {
            await utilModule.getTask(taskId);
        } catch (error) {
            console.warn(`Cannot Load Task: ${error.message}`)
            return;
        }

        this.addTaskToCache(taskId);

        const tab = document.createElement('div');
        tab.classList.add('tab');
        tab.textContent = `Task ${taskId}`;

        const closeBtn = document.createElement('button');
        closeBtn.classList.add('closeTab');
        closeBtn.innerHTML = '&times;';
        tab.appendChild(closeBtn);

        const lastTab = this.tabsContainer.lastElementChild;

        this.tabsContainer.insertBefore(tab, lastTab);

        const taskWatcherHTML = `<task-watcher taskId="${taskId}" data-presenter="task-watcher"></task-watcher>`;
        this.taskWatchersContainer.insertAdjacentHTML("beforeend", taskWatcherHTML);

        const taskWatcherElement = this.taskWatchersContainer.querySelector(`task-watcher[taskId="${taskId}"]`);

        this.taskWatchers[taskId] = {
            tab,
            taskWatcherElement
        };

        tab.addEventListener('click', (e) => {
            if (e.target.classList.contains('closeTab')) {
                e.stopPropagation();
                this.removeTaskWatcher(taskId);
            } else {
                this.activateTab(taskId);
            }
        });

        this.activateTab(taskId);
    }

    minimizeMonitor() {
        assistOS.closeNotificationMonitor();
    }

    activateTab(taskId) {
        if (this.currentTab === taskId) return;

        if (this.currentTab && this.taskWatchers[this.currentTab]) {
            this.taskWatchers[this.currentTab].tab.classList.remove('active');
            this.taskWatchers[this.currentTab].taskWatcherElement.classList.remove('active');
        }

        this.currentTab = taskId;
        const watcher = this.taskWatchers[taskId];
        if (watcher) {
            watcher.tab.classList.add('active');
            watcher.taskWatcherElement.classList.add('active');
        }
    }


    removeTaskWatcher(taskId) {
        if (taskId === 'llmObserver') return;

        const watcher = this.taskWatchers[taskId];
        if (!watcher) return;

        this.tabsContainer.removeChild(watcher.tab);
        this.taskWatchersContainer.removeChild(watcher.taskWatcherElement);
        delete this.taskWatchers[taskId];

        this.removeTaskFromCache(taskId);

        if (this.currentTab === taskId) {
            const remainingTaskIds = Object.keys(this.taskWatchers);
            if (remainingTaskIds.length > 0) {
                this.activateTab(remainingTaskIds[0]);
            } else {
                this.currentTab = 'llmObserver';
                this.activateTab('llmObserver');
            }
        }
    }


}

