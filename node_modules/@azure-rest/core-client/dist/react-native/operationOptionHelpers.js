// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
import { operationOptionsToRequestParameters as tspOperationOptionsToRequestParameters, } from "@typespec/ts-http-runtime";
/**
 * Helper function to convert OperationOptions to RequestParameters
 * @param options - the options that are used by Modular layer to send the request
 * @returns the result of the conversion in RequestParameters of RLC layer
 */
export function operationOptionsToRequestParameters(options) {
    const tspRequestParameters = tspOperationOptionsToRequestParameters(options);
    return {
        ...tspRequestParameters,
        tracingOptions: options.tracingOptions,
    };
}
//# sourceMappingURL=operationOptionHelpers.js.map