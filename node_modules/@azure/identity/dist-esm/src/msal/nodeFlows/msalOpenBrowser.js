// Copyright (c) Microsoft Corporation.
// Licensed under the MIT license.
import { MsalNode } from "./msalNodeCommon";
import { credentialLogger } from "../../util/logging";
import { handleMsalError } from "../utils";
import { hasNativeBroker } from "./msalPlugins";
import open from "open";
/**
 * A call to open(), but mockable
 * @internal
 */
export const interactiveBrowserMockable = {
    open,
};
/**
 * This MSAL client sets up a web server to listen for redirect callbacks, then calls to the MSAL's public application's `acquireTokenByDeviceCode` during `doGetToken`
 * to trigger the authentication flow, and then respond based on the values obtained from the redirect callback
 * @internal
 */
export class MsalOpenBrowser extends MsalNode {
    constructor(options) {
        var _a, _b, _c, _d;
        super(options);
        this.loginHint = options.loginHint;
        this.errorTemplate = (_a = options.browserCustomizationOptions) === null || _a === void 0 ? void 0 : _a.errorMessage;
        this.successTemplate = (_b = options.browserCustomizationOptions) === null || _b === void 0 ? void 0 : _b.successMessage;
        this.logger = credentialLogger("Node.js MSAL Open Browser");
        this.useDefaultBrokerAccount =
            ((_c = options.brokerOptions) === null || _c === void 0 ? void 0 : _c.enabled) && ((_d = options.brokerOptions) === null || _d === void 0 ? void 0 : _d.useDefaultBrokerAccount);
    }
    async doGetToken(scopes, options = {}) {
        try {
            const interactiveRequest = {
                openBrowser: async (url) => {
                    await interactiveBrowserMockable.open(url, { wait: true, newInstance: true });
                },
                scopes,
                authority: options === null || options === void 0 ? void 0 : options.authority,
                claims: options === null || options === void 0 ? void 0 : options.claims,
                correlationId: options === null || options === void 0 ? void 0 : options.correlationId,
                loginHint: this.loginHint,
                errorTemplate: this.errorTemplate,
                successTemplate: this.successTemplate,
            };
            if (hasNativeBroker() && this.enableBroker) {
                return this.doGetBrokeredToken(scopes, interactiveRequest, {
                    enableCae: options.enableCae,
                    useDefaultBrokerAccount: this.useDefaultBrokerAccount,
                });
            }
            // If the broker is not enabled, we will fall back to interactive authentication
            if (hasNativeBroker() && !this.enableBroker) {
                this.logger.verbose("Authentication will resume normally without the broker, since it's not enabled");
            }
            const result = await this.getApp("public", options === null || options === void 0 ? void 0 : options.enableCae).acquireTokenInteractive(interactiveRequest);
            return this.handleResult(scopes, result || undefined);
        }
        catch (err) {
            throw handleMsalError(scopes, err, options);
        }
    }
    /**
     * A helper function that supports brokered authentication through the MSAL's public application.
     *
     * When options.useDefaultBrokerAccount is true, the method will attempt to authenticate using the default broker account.
     * If the default broker account is not available, the method will fall back to interactive authentication.
     */
    async doGetBrokeredToken(scopes, interactiveRequest, options) {
        var _a;
        this.logger.verbose("Authentication will resume through the broker");
        if (this.parentWindowHandle) {
            interactiveRequest.windowHandle = Buffer.from(this.parentWindowHandle);
        }
        else {
            // error should have been thrown from within the constructor of InteractiveBrowserCredential
            this.logger.warning("Parent window handle is not specified for the broker. This may cause unexpected behavior. Please provide the parentWindowHandle.");
        }
        if (this.enableMsaPassthrough) {
            ((_a = interactiveRequest.tokenQueryParameters) !== null && _a !== void 0 ? _a : (interactiveRequest.tokenQueryParameters = {}))["msal_request_type"] =
                "consumer_passthrough";
        }
        if (options.useDefaultBrokerAccount) {
            interactiveRequest.prompt = "none";
            this.logger.verbose("Attempting broker authentication using the default broker account");
        }
        else {
            interactiveRequest.prompt = undefined;
            this.logger.verbose("Attempting broker authentication without the default broker account");
        }
        try {
            const result = await this.getApp("public", options === null || options === void 0 ? void 0 : options.enableCae).acquireTokenInteractive(interactiveRequest);
            if (result.fromNativeBroker) {
                this.logger.verbose(`This result is returned from native broker`);
            }
            return this.handleResult(scopes, result || undefined);
        }
        catch (e) {
            this.logger.verbose(`Failed to authenticate through the broker: ${e.message}`);
            // If we tried to use the default broker account and failed, fall back to interactive authentication
            if (options.useDefaultBrokerAccount) {
                return this.doGetBrokeredToken(scopes, interactiveRequest, {
                    enableCae: options.enableCae,
                    useDefaultBrokerAccount: false,
                });
            }
            else {
                // If we're not using the default broker account, throw the error
                throw handleMsalError(scopes, e);
            }
        }
    }
}
//# sourceMappingURL=msalOpenBrowser.js.map