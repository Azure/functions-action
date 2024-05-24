// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { MsalNode } from "./msalNodeCommon";
import { credentialLogger } from "../../util/logging";
import { handleMsalError } from "../utils";
/**
 * This MSAL client sets up a web server to listen for redirect callbacks, then calls to the MSAL's public application's `acquireTokenByDeviceCode` during `doGetToken`
 * to trigger the authentication flow, and then respond based on the values obtained from the redirect callback
 * @internal
 */
export class MsalAuthorizationCode extends MsalNode {
    constructor(options) {
        super(options);
        this.logger = credentialLogger("Node.js MSAL Authorization Code");
        this.redirectUri = options.redirectUri;
        this.authorizationCode = options.authorizationCode;
        if (options.clientSecret) {
            this.msalConfig.auth.clientSecret = options.clientSecret;
        }
    }
    async getAuthCodeUrl(options) {
        await this.init();
        return this.getApp("confidentialFirst", options.enableCae).getAuthCodeUrl({
            scopes: options.scopes,
            redirectUri: options.redirectUri,
        });
    }
    async doGetToken(scopes, options) {
        try {
            const result = await this.getApp("confidentialFirst", options === null || options === void 0 ? void 0 : options.enableCae).acquireTokenByCode({
                scopes,
                redirectUri: this.redirectUri,
                code: this.authorizationCode,
                correlationId: options === null || options === void 0 ? void 0 : options.correlationId,
                authority: options === null || options === void 0 ? void 0 : options.authority,
                claims: options === null || options === void 0 ? void 0 : options.claims,
            });
            // The Client Credential flow does not return an account,
            // so each time getToken gets called, we will have to acquire a new token through the service.
            return this.handleResult(scopes, result || undefined);
        }
        catch (err) {
            throw handleMsalError(scopes, err, options);
        }
    }
}
//# sourceMappingURL=msalAuthorizationCode.js.map