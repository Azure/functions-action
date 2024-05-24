import { BridgeResponseEnvelope } from "./BridgeResponseEnvelope";
export type BridgeRequest = {
    requestId: string;
    method: string;
    resolve: (value: BridgeResponseEnvelope | PromiseLike<BridgeResponseEnvelope>) => void;
    reject: (reason?: any) => void;
};
//# sourceMappingURL=BridgeRequest.d.ts.map