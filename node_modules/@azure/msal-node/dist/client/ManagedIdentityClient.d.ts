import { Authority, INetworkModule, Logger, AuthenticationResult } from "@azure/msal-common";
import { CryptoProvider } from "../crypto/CryptoProvider";
import { ManagedIdentityRequest } from "../request/ManagedIdentityRequest";
import { ManagedIdentityId } from "../config/ManagedIdentityId";
import { NodeStorage } from "../cache/NodeStorage";
import { ManagedIdentitySourceNames } from "../utils/Constants";
export declare class ManagedIdentityClient {
    private logger;
    private nodeStorage;
    private networkClient;
    private cryptoProvider;
    private static identitySource?;
    static sourceName?: ManagedIdentitySourceNames;
    constructor(logger: Logger, nodeStorage: NodeStorage, networkClient: INetworkModule, cryptoProvider: CryptoProvider);
    sendManagedIdentityTokenRequest(managedIdentityRequest: ManagedIdentityRequest, managedIdentityId: ManagedIdentityId, fakeAuthority: Authority, refreshAccessToken?: boolean): Promise<AuthenticationResult>;
    private allEnvironmentVariablesAreDefined;
    /**
     * Determine the Managed Identity Source based on available environment variables. This API is consumed by ManagedIdentityApplication's getManagedIdentitySource.
     * @returns ManagedIdentitySourceNames - The Managed Identity source's name
     */
    getManagedIdentitySource(): ManagedIdentitySourceNames;
    /**
     * Tries to create a managed identity source for all sources
     * @returns the managed identity Source
     */
    private selectManagedIdentitySource;
}
//# sourceMappingURL=ManagedIdentityClient.d.ts.map