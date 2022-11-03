import * as Models from "./generated/src/models";
import { BatchSubRequest } from "./BatchRequest";
import { ParsedBatchResponse } from "./BatchResponse";
/**
 * Util class for parsing batch response.
 */
export declare class BatchResponseParser {
    private readonly batchResponse;
    private readonly responseBatchBoundary;
    private readonly perResponsePrefix;
    private readonly batchResponseEnding;
    private readonly subRequests;
    constructor(batchResponse: Models.ServiceSubmitBatchResponse, subRequests: Map<number, BatchSubRequest>);
    parseBatchResponse(): Promise<ParsedBatchResponse>;
}
//# sourceMappingURL=BatchResponseParser.d.ts.map