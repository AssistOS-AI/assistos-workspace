module.exports = {
    STATUS: {
        CREATED: 'created',
        PENDING: 'pending',
        RUNNING: 'running',
        COMPLETED: 'completed',
        FAILED: 'failed',
        CANCELLED: 'cancelled'
    },
    EVENTS: {
        UPDATE: "update",
        LOG: "log",
        DEPENDENCY_COMPLETED: "dependency_completed",
        DEPENDENCY_FAILED: "dependency_failed"
    },
    LOG: {
        DEBUG: "DEBUG",
        INFO: "INFO",
        WARNING: "WARNING",
        ERROR: "ERROR"
    }
}