/// <reference types="node" />
import http from "http";
import { IHttpRetryPolicy } from "./IHttpRetryPolicy";
export declare class LinearRetryPolicy implements IHttpRetryPolicy {
    maxRetries: number;
    retryDelay: number;
    httpStatusCodesToRetryOn: Array<number>;
    constructor(maxRetries: number, retryDelay: number, httpStatusCodesToRetryOn: Array<number>);
    private retryAfterMillisecondsToSleep;
    pauseForRetry(httpStatusCode: number, currentRetry: number, retryAfterHeader: http.IncomingHttpHeaders["retry-after"]): Promise<boolean>;
}
//# sourceMappingURL=LinearRetryPolicy.d.ts.map