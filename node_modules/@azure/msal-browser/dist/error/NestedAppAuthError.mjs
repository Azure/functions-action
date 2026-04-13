/*! @azure/msal-browser v5.6.3 2026-04-01 */
'use strict';
import { AuthError } from '@azure/msal-common/browser';
import { unsupportedMethod } from './NativeAuthErrorCodes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class NestedAppAuthError extends AuthError {
    constructor(errorCode, errorMessage) {
        super(errorCode, errorMessage);
        Object.setPrototypeOf(this, NestedAppAuthError.prototype);
        this.name = "NestedAppAuthError";
    }
    static createUnsupportedError() {
        return new NestedAppAuthError(unsupportedMethod);
    }
}

export { NestedAppAuthError };
//# sourceMappingURL=NestedAppAuthError.mjs.map
