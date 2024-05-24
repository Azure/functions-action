// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { MsalNode } from "./msalNodeCommon";
import { handleMsalError } from "../utils";
/**
 * MSAL username and password client. Calls to the MSAL's public application's `acquireTokenByUsernamePassword` during `doGetToken`.
 * @internal
 */
export class MsalUsernamePassword extends MsalNode {
    constructor(options) {
        super(options);
        this.username = options.username;
        this.password = options.password;
    }
    async doGetToken(scopes, options) {
        try {
            const requestOptions = {
                scopes,
                username: this.username,
                password: this.password,
                correlationId: options === null || options === void 0 ? void 0 : options.correlationId,
                authority: options === null || options === void 0 ? void 0 : options.authority,
                claims: options === null || options === void 0 ? void 0 : options.claims,
            };
            const result = await this.getApp("public", options === null || options === void 0 ? void 0 : options.enableCae).acquireTokenByUsernamePassword(requestOptions);
            return this.handleResult(scopes, result || undefined);
        }
        catch (error) {
            throw handleMsalError(scopes, error, options);
        }
    }
}
//# sourceMappingURL=msalUsernamePassword.js.map