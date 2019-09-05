"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const state_1 = require("./constants/state");
class BaseException extends Error {
    constructor(message = undefined, innerException = undefined) {
        super();
        this._innerException = innerException ? innerException : undefined;
        super.message = message ? message : "";
    }
    GetInnerException() {
        return this._innerException;
    }
    GetTraceback() {
        let errorMessages = [this.message];
        let innerException = this._innerException;
        while (innerException !== undefined && innerException instanceof BaseException) {
            errorMessages.push(innerException.message);
            innerException = innerException._innerException;
        }
        if (innerException !== undefined && innerException instanceof Error) {
            errorMessages.push(innerException.message);
            errorMessages.push(innerException.stack);
        }
        else if (innerException !== undefined) {
            errorMessages.push(String(innerException));
        }
        return errorMessages;
    }
    PrintTraceback(printer) {
        const traceback = this.GetTraceback();
        for (let i = 0; i < traceback.length; i++) {
            const prefix = " ".repeat(i * 2);
            printer(`${prefix}${traceback[i]}`);
        }
    }
}
exports.BaseException = BaseException;
class NotImplementedException extends BaseException {
}
exports.NotImplementedException = NotImplementedException;
class UnexpectedExitException extends BaseException {
    constructor(state = state_1.StateConstant.Failed) {
        super(state_1.StateConstant[state]);
    }
}
exports.UnexpectedExitException = UnexpectedExitException;
class UnexpectedConversion extends BaseException {
    constructor(constantField, value) {
        super(`Failed to convert ${value} to ${constantField}`);
    }
}
exports.UnexpectedConversion = UnexpectedConversion;
class ExecutionException extends BaseException {
    constructor(state, executionStage, innerException) {
        let errorMessage = `Execution Exception (state: ${state_1.StateConstant[state]})`;
        if (executionStage !== undefined) {
            errorMessage += ` (step: ${executionStage})`;
        }
        super(errorMessage, innerException);
    }
}
exports.ExecutionException = ExecutionException;
class InvocationException extends ExecutionException {
    constructor(state, innerException) {
        super(state, "Invocation", innerException);
    }
}
exports.InvocationException = InvocationException;
class ChangeParamsException extends ExecutionException {
    constructor(state, innerException) {
        super(state, "ChangeParams", innerException);
    }
}
exports.ChangeParamsException = ChangeParamsException;
class ChangeContextException extends ExecutionException {
    constructor(state, innerException) {
        super(state, "ChangeContext", innerException);
    }
}
exports.ChangeContextException = ChangeContextException;
class ValidationError extends BaseException {
    constructor(state, field, expectation, innerException) {
        super(`At ${state_1.StateConstant[state]}, ${field} : ${expectation}.`, innerException);
    }
}
exports.ValidationError = ValidationError;
class FileIOError extends BaseException {
    constructor(state, action, message, innerException) {
        super(`When performing file operation at ${state_1.StateConstant[state]}, ${action} : ${message}`, innerException);
    }
}
exports.FileIOError = FileIOError;
class AzureResourceError extends BaseException {
    constructor(state, action, message, innerException) {
        super(`When request Azure resource at ${state_1.StateConstant[state]}, ${action} : ${message}`, innerException);
    }
}
exports.AzureResourceError = AzureResourceError;
