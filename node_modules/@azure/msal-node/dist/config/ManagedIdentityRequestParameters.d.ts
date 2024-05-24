import { HttpMethod } from "../utils/Constants";
export declare class ManagedIdentityRequestParameters {
    private _baseEndpoint;
    httpMethod: HttpMethod;
    headers: Record<string, string>;
    bodyParameters: Record<string, string>;
    queryParameters: Record<string, string>;
    constructor(httpMethod: HttpMethod, endpoint: string);
    computeUri(): string;
    computeParametersBodyString(): string;
}
//# sourceMappingURL=ManagedIdentityRequestParameters.d.ts.map