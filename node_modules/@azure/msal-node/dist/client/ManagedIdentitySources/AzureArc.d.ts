import { INetworkModule, NetworkResponse, NetworkRequestOptions, Logger, ServerAuthorizationTokenResponse } from "@azure/msal-common";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";
import { CryptoProvider } from "../../crypto/CryptoProvider";
import { NodeStorage } from "../../cache/NodeStorage";
import { ManagedIdentityTokenResponse } from "../../response/ManagedIdentityTokenResponse";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
export declare const ARC_API_VERSION: string;
export declare const SUPPORTED_AZURE_ARC_PLATFORMS: {
    win32: string;
    linux: string;
};
/**
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/AzureArcManagedIdentitySource.cs
 */
export declare class AzureArc extends BaseManagedIdentitySource {
    private identityEndpoint;
    constructor(logger: Logger, nodeStorage: NodeStorage, networkClient: INetworkModule, cryptoProvider: CryptoProvider, identityEndpoint: string);
    static getEnvironmentVariables(): Array<string | undefined>;
    static tryCreate(logger: Logger, nodeStorage: NodeStorage, networkClient: INetworkModule, cryptoProvider: CryptoProvider, managedIdentityId: ManagedIdentityId): AzureArc | null;
    createRequest(resource: string): ManagedIdentityRequestParameters;
    getServerTokenResponseAsync(originalResponse: NetworkResponse<ManagedIdentityTokenResponse>, networkClient: INetworkModule, networkRequest: ManagedIdentityRequestParameters, networkRequestOptions: NetworkRequestOptions): Promise<ServerAuthorizationTokenResponse>;
}
//# sourceMappingURL=AzureArc.d.ts.map