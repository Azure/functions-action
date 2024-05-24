/// <reference types="node" />
import http from "http";
export interface IHttpRetryPolicy {
    pauseForRetry(httpStatusCode: number, currentRetry: number, retryAfterHeader: http.IncomingHttpHeaders["retry-after"]): Promise<boolean>;
}
//# sourceMappingURL=IHttpRetryPolicy.d.ts.map