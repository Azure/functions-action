import { InteractionType } from "./BrowserConstants";
import { ICrypto } from "@azure/msal-common";
export type BrowserStateObject = {
    interactionType: InteractionType;
};
/**
 * Extracts the BrowserStateObject from the state string.
 * @param browserCrypto
 * @param state
 */
export declare function extractBrowserRequestState(browserCrypto: ICrypto, state: string): BrowserStateObject | null;
//# sourceMappingURL=BrowserProtocolUtils.d.ts.map