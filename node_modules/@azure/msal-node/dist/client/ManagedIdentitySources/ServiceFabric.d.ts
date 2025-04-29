import { INetworkModule, Logger } from "@azure/msal-common";
import { ManagedIdentityId } from "../../config/ManagedIdentityId";
import { ManagedIdentityRequestParameters } from "../../config/ManagedIdentityRequestParameters";
import { BaseManagedIdentitySource } from "./BaseManagedIdentitySource";
import { NodeStorage } from "../../cache/NodeStorage";
import { CryptoProvider } from "../../crypto/CryptoProvider";
/**
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/ServiceFabricManagedIdentitySource.cs
 */
export declare class ServiceFabric extends BaseManagedIdentitySource {
    private identityEndpoint;
    private identityHeader;
    constructor(logger: Logger, nodeStorage: NodeStorage, networkClient: INetworkModule, cryptoProvider: CryptoProvider, identityEndpoint: string, identityHeader: string);
    static getEnvironmentVariables(): Array<string | undefined>;
    static tryCreate(logger: Logger, nodeStorage: NodeStorage, networkClient: INetworkModule, cryptoProvider: CryptoProvider, managedIdentityId: ManagedIdentityId): ServiceFabric | null;
    createRequest(resource: string, managedIdentityId: ManagedIdentityId): ManagedIdentityRequestParameters;
}
//# sourceMappingURL=ServiceFabric.d.ts.map