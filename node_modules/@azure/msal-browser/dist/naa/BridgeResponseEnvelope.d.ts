import { BridgeError } from "./BridgeError";
import { TokenResponse } from "./TokenResponse";
import { AccountInfo } from "./AccountInfo";
import { InitContext } from "./InitContext";
export type BridgeResponseEnvelope = {
    messageType: "NestedAppAuthResponse";
    requestId: string;
    success: boolean;
    token?: TokenResponse;
    error?: BridgeError;
    account?: AccountInfo;
    initContext?: InitContext;
};
//# sourceMappingURL=BridgeResponseEnvelope.d.ts.map