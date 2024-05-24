import { CommonAuthorizationUrlRequest, CommonSilentFlowRequest, PerformanceCallbackFunction, AccountInfo, Logger, ICrypto, IPerformanceClient, AccountFilter } from "@azure/msal-common";
import { ITokenCache } from "../cache/ITokenCache";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { INavigationClient } from "../navigation/INavigationClient";
import { AuthorizationCodeRequest } from "../request/AuthorizationCodeRequest";
import { EndSessionPopupRequest } from "../request/EndSessionPopupRequest";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { PopupRequest } from "../request/PopupRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { SilentRequest } from "../request/SilentRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { ApiId, WrapperSKU } from "../utils/BrowserConstants";
import { IController } from "./IController";
import { UnknownOperatingContext } from "../operatingcontext/UnknownOperatingContext";
import { EventHandler } from "../event/EventHandler";
import { EventCallbackFunction } from "../event/EventMessage";
import { ClearCacheRequest } from "../request/ClearCacheRequest";
/**
 * UnknownOperatingContextController class
 *
 * - Until initialize method is called, this controller is the default
 * - AFter initialize method is called, this controller will be swapped out for the appropriate controller
 * if the operating context can be determined; otherwise this controller will continued be used
 *
 * - Why do we have this?  We don't want to dynamically import (download) all of the code in StandardController if we don't need to.
 *
 * - Only includes implementation for getAccounts and handleRedirectPromise
 *   - All other methods are will throw initialization error (because either initialize method or the factory method were not used)
 *   - This controller is necessary for React Native wrapper, server side rendering and any other scenario where we don't have a DOM
 *
 */
export declare class UnknownOperatingContextController implements IController {
    protected readonly operatingContext: UnknownOperatingContext;
    protected logger: Logger;
    protected readonly browserStorage: BrowserCacheManager;
    protected readonly config: BrowserConfiguration;
    protected readonly performanceClient: IPerformanceClient;
    protected readonly browserCrypto: ICrypto;
    protected isBrowserEnvironment: boolean;
    protected initialized: boolean;
    protected readonly eventHandler: EventHandler;
    constructor(operatingContext: UnknownOperatingContext);
    getBrowserStorage(): BrowserCacheManager;
    getEventHandler(): EventHandler;
    getAccount(accountFilter: AccountFilter): AccountInfo | null;
    getAccountByHomeId(homeAccountId: string): AccountInfo | null;
    getAccountByLocalId(localAccountId: string): AccountInfo | null;
    getAccountByUsername(username: string): AccountInfo | null;
    getAllAccounts(): AccountInfo[];
    initialize(): Promise<void>;
    acquireTokenPopup(request: PopupRequest): Promise<AuthenticationResult>;
    acquireTokenRedirect(request: RedirectRequest): Promise<void>;
    acquireTokenSilent(silentRequest: SilentRequest): Promise<AuthenticationResult>;
    acquireTokenByCode(request: AuthorizationCodeRequest): Promise<AuthenticationResult>;
    acquireTokenNative(request: PopupRequest | SilentRequest | Partial<Omit<CommonAuthorizationUrlRequest, "responseMode" | "codeChallenge" | "codeChallengeMethod" | "requestedClaimsHash" | "nativeBroker">>, apiId: ApiId, accountId?: string | undefined): Promise<AuthenticationResult>;
    acquireTokenByRefreshToken(commonRequest: CommonSilentFlowRequest, silentRequest: SilentRequest): Promise<AuthenticationResult>;
    addEventCallback(callback: EventCallbackFunction): string | null;
    removeEventCallback(callbackId: string): void;
    addPerformanceCallback(callback: PerformanceCallbackFunction): string;
    removePerformanceCallback(callbackId: string): boolean;
    enableAccountStorageEvents(): void;
    disableAccountStorageEvents(): void;
    handleRedirectPromise(hash?: string | undefined): Promise<AuthenticationResult | null>;
    loginPopup(request?: PopupRequest | undefined): Promise<AuthenticationResult>;
    loginRedirect(request?: RedirectRequest | undefined): Promise<void>;
    logout(logoutRequest?: EndSessionRequest | undefined): Promise<void>;
    logoutRedirect(logoutRequest?: EndSessionRequest | undefined): Promise<void>;
    logoutPopup(logoutRequest?: EndSessionPopupRequest | undefined): Promise<void>;
    ssoSilent(request: Partial<Omit<CommonAuthorizationUrlRequest, "responseMode" | "codeChallenge" | "codeChallengeMethod" | "requestedClaimsHash" | "nativeBroker">>): Promise<AuthenticationResult>;
    getTokenCache(): ITokenCache;
    getLogger(): Logger;
    setLogger(logger: Logger): void;
    setActiveAccount(account: AccountInfo | null): void;
    getActiveAccount(): AccountInfo | null;
    initializeWrapperLibrary(sku: WrapperSKU, version: string): void;
    setNavigationClient(navigationClient: INavigationClient): void;
    getConfiguration(): BrowserConfiguration;
    isBrowserEnv(): boolean;
    getBrowserCrypto(): ICrypto;
    getPerformanceClient(): IPerformanceClient;
    getRedirectResponse(): Map<string, Promise<AuthenticationResult | null>>;
    clearCache(logoutRequest?: ClearCacheRequest): Promise<void>;
    hydrateCache(result: AuthenticationResult, request: SilentRequest | SsoSilentRequest | RedirectRequest | PopupRequest): Promise<void>;
}
//# sourceMappingURL=UnknownOperatingContextController.d.ts.map