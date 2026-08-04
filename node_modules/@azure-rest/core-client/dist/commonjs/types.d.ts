/**
 * A Node.js Readable stream that also has a `destroy` method.
 *
 * @public
 */
export interface NodeJSReadableStream extends NodeJS.ReadableStream {
    /**
     * Destroy the stream. Optionally emit an 'error' event, and emit a
     * 'close' event (unless emitClose is set to false). After this call,
     * internal resources will be released.
     */
    destroy(error?: Error): void;
}
//# sourceMappingURL=types.d.ts.map