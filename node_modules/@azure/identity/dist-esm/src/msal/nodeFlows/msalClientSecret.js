// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { MsalNode } from "./msalNodeCommon";
import { handleMsalError } from "../utils";
/**
 * MSAL client secret client. Calls to MSAL's confidential application's `acquireTokenByClientCredential` during `doGetToken`.
 * @internal
 */
export class MsalClientSecret extends MsalNode {
    constructor(options) {
        super(options);
        this.requiresConfidential = true;
        this.msalConfig.auth.clientSecret = options.clientSecret;
    }
    async doGetToken(scopes, options = {}) {
        try {
            const result = await this.getApp("confidential", options.enableCae).acquireTokenByClientCredential({
                scopes,
                correlationId: options.correlationId,
                azureRegion: this.azureRegion,
                authority: options.authority,
                claims: options.claims,
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
//# sourceMappingURL=msalClientSecret.js.map