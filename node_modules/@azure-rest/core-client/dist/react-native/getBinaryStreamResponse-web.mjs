// Copyright (c) Microsoft Corporation.
// Licensed under the MIT License.
/**
 * Resolves a StreamableMethod into a binary stream response using browser streaming.
 * Returns both the raw HttpResponse (for status/header inspection) and a blobBody Promise.
 * Error handling is left to the caller so that generated deserializers can apply
 * operation-specific error deserialization (per-status-code details, exception headers, etc.).
 *
 * @public
 */
export async function getBinaryStreamResponse(streamableMethod) {
    const response = await streamableMethod.asBrowserStream();
    return {
        ...response,
        blobBody: new Response(response.body).blob(),
        readableStreamBody: undefined,
    };
}
//# sourceMappingURL=getBinaryStreamResponse-web.mjs.map