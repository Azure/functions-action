import { StateConstant } from './constants/state';
import { IPrinter } from './interfaces/IPrinter';

export class BaseException extends Error {
    private _innerException: BaseException

    constructor(
        message: string = undefined,
        innerException: BaseException = undefined
    ) {
        super();
        this._innerException = innerException ? innerException : undefined;
        this.message = message ? message : "";
    }

    public GetInnerException(): BaseException {
        return this._innerException;
    }

    public GetTraceback(): Array<string> {
        let errorMessages: Array<string> = [this.message];
        let innerException: BaseException | Error = this._innerException;
        while (innerException !== undefined && innerException instanceof BaseException) {
            errorMessages.push(innerException.message);
            innerException = innerException._innerException;
        }

        if (innerException !== undefined && innerException instanceof Error) {
            errorMessages.push(innerException.message);
            errorMessages.push(innerException.stack);
        } else if (innerException !== undefined) {
            errorMessages.push(String(innerException));
        }
        return errorMessages;
    }

    public PrintTraceback(printer: IPrinter): void {
        const traceback: Array<string> = this.GetTraceback();
        for (let i = 0; i < traceback.length; i++) {
            const prefix: string = " ".repeat(i * 2);
            printer(`${prefix}${traceback[i]}`);
        }
    }
}

export class NotImplementedException extends BaseException {
}

export class UnexpectedExitException extends BaseException {
    constructor(state: StateConstant = StateConstant.Failed) {
        super(StateConstant[state]);
    }
}

export class UnexpectedConversion extends BaseException {
    constructor(constantField: string, value: string) {
        super(`Failed to convert ${value} to ${constantField}`);
    }
}

export class ExecutionException extends BaseException {
    constructor(state: StateConstant, executionStage?: string, innerException?: BaseException) {
        let errorMessage = `Execution Exception (state: ${StateConstant[state]})`
        if (executionStage !== undefined) {
            errorMessage += ` (step: ${executionStage})`
        }
        super(errorMessage, innerException);
    }
}

export class InvocationException extends ExecutionException {
    constructor(state: StateConstant, innerException?: BaseException) {
        super(state, "Invocation", innerException);
    }
}

export class ChangeParamsException extends ExecutionException {
    constructor(state: StateConstant, innerException?: BaseException) {
        super(state, "ChangeParams", innerException);
    }
}

export class ChangeContextException extends ExecutionException {
    constructor(state: StateConstant, innerException?: BaseException) {
        super(state, "ChangeContext", innerException);
    }
}

export class ValidationError extends BaseException {
    constructor(state: StateConstant, field: string, expectation: string, innerException?: BaseException) {
        super(`At ${StateConstant[state]}, ${field} : ${expectation}.`, innerException);
    }
}

export class FileIOError extends BaseException {
    constructor(state: StateConstant, action: string, message: string, innerException?: BaseException) {
        super(`When performing file operation at ${StateConstant[state]}, ${action} : ${message}`, innerException);
    }
}

export class WebRequestError extends BaseException {
    constructor(url: string, verb: string, message: string, innerException?: BaseException) {
        super(`When [${verb}] ${url}, error: ${message}`, innerException);
    }
}

export class AzureResourceError extends BaseException {
    constructor(state: StateConstant, action: string, message: string, innerException?: BaseException) {
        super(`When request Azure resource at ${StateConstant[state]}, ${action} : ${message}`, innerException);
    }
}