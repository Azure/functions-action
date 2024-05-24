import { StandardInteractionClient } from "./StandardInteractionClient";
import { CommonSilentFlowRequest, ServerTelemetryManager, RefreshTokenClient, AzureCloudOptions, AccountInfo } from "@azure/msal-common";
import { AuthenticationResult } from "../response/AuthenticationResult";
export declare class SilentRefreshClient extends StandardInteractionClient {
    /**
     * Exchanges the refresh token for new tokens
     * @param request
     */
    acquireToken(request: CommonSilentFlowRequest): Promise<AuthenticationResult>;
    /**
     * Currently Unsupported
     */
    logout(): Promise<void>;
    /**
     * Creates a Refresh Client with the given authority, or the default authority.
     * @param serverTelemetryManager
     * @param authorityUrl
     */
    protected createRefreshTokenClient(serverTelemetryManager: ServerTelemetryManager, authorityUrl?: string, azureCloudOptions?: AzureCloudOptions, account?: AccountInfo): Promise<RefreshTokenClient>;
}
//# sourceMappingURL=SilentRefreshClient.d.ts.map