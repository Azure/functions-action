import { AuthError } from "./AuthError";
import * as JoseHeaderErrorCodes from "./JoseHeaderErrorCodes";
export { JoseHeaderErrorCodes };
export declare const JoseHeaderErrorMessages: {
    missing_kid_error: string;
    missing_alg_error: string;
};
/**
 * Error thrown when there is an error in the client code running on the browser.
 */
export declare class JoseHeaderError extends AuthError {
    constructor(errorCode: string, errorMessage?: string);
}
/** Returns JoseHeaderError object */
export declare function createJoseHeaderError(code: string): JoseHeaderError;
//# sourceMappingURL=JoseHeaderError.d.ts.map