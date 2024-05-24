import { ICrypto, INetworkModule, Logger, AccountInfo, ServerTelemetryManager, Authority, IPerformanceClient, AzureCloudOptions } from "@azure/msal-common";
import { BrowserConfiguration } from "../config/Configuration";
import { BrowserCacheManager } from "../cache/BrowserCacheManager";
import { EventHandler } from "../event/EventHandler";
import { EndSessionRequest } from "../request/EndSessionRequest";
import { RedirectRequest } from "../request/RedirectRequest";
import { PopupRequest } from "../request/PopupRequest";
import { SsoSilentRequest } from "../request/SsoSilentRequest";
import { INavigationClient } from "../navigation/INavigationClient";
import { NativeMessageHandler } from "../broker/nativeBroker/NativeMessageHandler";
import { AuthenticationResult } from "../response/AuthenticationResult";
import { ClearCacheRequest } from "../request/ClearCacheRequest";
export declare abstract class BaseInteractionClient {
    protected config: BrowserConfiguration;
    protected browserStorage: BrowserCacheManager;
    protected browserCrypto: ICrypto;
    protected networkClient: INetworkModule;
    protected logger: Logger;
    protected eventHandler: EventHandler;
    protected navigationClient: INavigationClient;
    protected nativeMessageHandler: NativeMessageHandler | undefined;
    protected correlationId: string;
    protected performanceClient: IPerformanceClient;
    constructor(config: BrowserConfiguration, storageImpl: BrowserCacheManager, browserCrypto: ICrypto, logger: Logger, eventHandler: EventHandler, navigationClient: INavigationClient, performanceClient: IPerformanceClient, nativeMessageHandler?: NativeMessageHandler, correlationId?: string);
    abstract acquireToken(request: RedirectRequest | PopupRequest | SsoSilentRequest): Promise<AuthenticationResult | void>;
    abstract logout(request: EndSessionRequest | ClearCacheRequest | undefined): Promise<void>;
    protected clearCacheOnLogout(account?: AccountInfo | null): Promise<void>;
    /**
     *
     * Use to get the redirect uri configured in MSAL or null.
     * @param requestRedirectUri
     * @returns Redirect URL
     *
     */
    getRedirectUri(requestRedirectUri?: string): string;
    /**
     *
     * @param apiId
     * @param correlationId
     * @param forceRefresh
     */
    protected initializeServerTelemetryManager(apiId: number, forceRefresh?: boolean): ServerTelemetryManager;
    /**
     * Used to get a discovered version of the default authority.
     * @param requestAuthority
     * @param requestAzureCloudOptions
     * @param account
     */
    protected getDiscoveredAuthority(requestAuthority?: string, requestAzureCloudOptions?: AzureCloudOptions, account?: AccountInfo): Promise<Authority>;
}
//# sourceMappingURL=BaseInteractionClient.d.ts.map