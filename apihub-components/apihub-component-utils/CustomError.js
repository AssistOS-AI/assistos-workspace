class CustomError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.name = this.constructor.name;
        this.statusCode = statusCode;
        Error.captureStackTrace(this, this.constructor);
    }

    static throwError(message, statusCode, detailedMessage) {
        if (detailedMessage instanceof Error) {
            detailedMessage = detailedMessage.message;
        }
        message= `${message} ${detailedMessage ? `: Detailed:${detailedMessage}` : ''}`;
        throw new this(message, statusCode);
    }

    static throwNotFoundError(message = 'Not Found', detailedMessage) {
        this.throwError(message, 404, detailedMessage);
    }

    static throwBadRequestError(message = 'Bad Request', detailedMessage) {
        this.throwError(message, 400, detailedMessage);
    }

    static throwServerError(message = 'Internal Server Error', detailedMessage) {
        this.throwError(message, 500, detailedMessage);
    }
}

module.exports = CustomError
