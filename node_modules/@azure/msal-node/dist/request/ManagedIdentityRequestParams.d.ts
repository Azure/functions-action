/**
 * ManagedIdentityRequest
 * - forceRefresh - forces managed identity requests to skip the cache and make network calls if true
 * - resource  - resource requested to access the protected API. It should be of the form "{ResourceIdUri}" or {ResourceIdUri/.default}. For instance https://management.azure.net or, for Microsoft Graph, https://graph.microsoft.com/.default
 */
export type ManagedIdentityRequestParams = {
    forceRefresh?: boolean;
    resource: string;
};
//# sourceMappingURL=ManagedIdentityRequestParams.d.ts.map