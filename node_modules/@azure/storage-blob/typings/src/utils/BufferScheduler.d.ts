/// <reference types="node" />
import { Readable } from "stream";
/**
 * OutgoingHandler is an async function triggered by BufferScheduler.
 */
export declare type OutgoingHandler = (buffer: Buffer, offset?: number) => Promise<any>;
/**
 * This class accepts a Node.js Readable stream as input, and keeps reading data
 * from the stream into the internal buffer structure, until it reaches maxBuffers.
 * Every available buffer will try to trigger outgoingHandler.
 *
 * The internal buffer structure includes an incoming buffer array, and a outgoing
 * buffer array. The incoming buffer array includes the "empty" buffers can be filled
 * with new incoming data. The outgoing array includes the filled buffers to be
 * handled by outgoingHandler. Every above buffer size is defined by parameter bufferSize.
 *
 * NUM_OF_ALL_BUFFERS = BUFFERS_IN_INCOMING + BUFFERS_IN_OUTGOING + BUFFERS_UNDER_HANDLING
 *
 * NUM_OF_ALL_BUFFERS <= maxBuffers
 *
 * PERFORMANCE IMPROVEMENT TIPS:
 * 1. Input stream highWaterMark is better to set a same value with bufferSize
 *    parameter, which will avoid Buffer.concat() operations.
 * 2. Parallelism should set a smaller value than maxBuffers, which is helpful to
 *    reduce the possibility when a outgoing handler waits for the stream data.
 *    in this situation, outgoing handlers are blocked.
 *    Outgoing queue shouldn't be empty.
 * @export
 * @class BufferScheduler
 */
export declare class BufferScheduler {
    /**
     * Size of buffers in incoming and outgoing queues. This class will try to align
     * data read from Readable stream into buffer chunks with bufferSize defined.
     *
     * @private
     * @type {number}
     * @memberof BufferScheduler
     */
    private readonly bufferSize;
    /**
     * How many buffers can be created or maintained.
     *
     * @private
     * @type {number}
     * @memberof BufferScheduler
     */
    private readonly maxBuffers;
    /**
     * A Node.js Readable stream.
     *
     * @private
     * @type {Readable}
     * @memberof BufferScheduler
     */
    private readonly readable;
    /**
     * OutgoingHandler is an async function triggered by BufferScheduler when there
     * are available buffers in outgoing array.
     *
     * @private
     * @type {OutgoingHandler}
     * @memberof BufferScheduler
     */
    private readonly outgoingHandler;
    /**
     * An internal event emitter.
     *
     * @private
     * @type {EventEmitter}
     * @memberof BufferScheduler
     */
    private readonly emitter;
    /**
     * Concurrency of executing outgoingHandlers. (0 < parallelism <= maxBuffers)
     *
     * @private
     * @type {number}
     * @memberof BufferScheduler
     */
    private readonly parallelism;
    /**
     * An internal offset marker to track data offset in bytes of next outgoingHandler.
     *
     * @private
     * @type {number}
     * @memberof BufferScheduler
     */
    private offset;
    /**
     * An internal marker to track whether stream is end.
     *
     * @private
     * @type {boolean}
     * @memberof BufferScheduler
     */
    private isStreamEnd;
    /**
     * An internal marker to track whether stream or outgoingHandler returns error.
     *
     * @private
     * @type {boolean}
     * @memberof BufferScheduler
     */
    private isError;
    /**
     * How many handlers are executing.
     *
     * @private
     * @type {number}
     * @memberof BufferScheduler
     */
    private executingOutgoingHandlers;
    /**
     * Encoding of the input Readable stream which has string data type instead of Buffer.
     *
     * @private
     * @type {string}
     * @memberof BufferScheduler
     */
    private encoding?;
    /**
     * How many buffers have been allocated.
     *
     * @private
     * @type {number}
     * @memberof BufferScheduler
     */
    private numBuffers;
    /**
     * Because this class doesn't know how much data every time stream pops, which
     * is defined by highWaterMarker of the stream. So BufferScheduler will cache
     * data received from the stream, when data in unresolvedDataArray exceeds the
     * blockSize defined, it will try to concat a blockSize of buffer, fill into available
     * buffers from incoming and push to outgoing array.
     *
     * @private
     * @type {Buffer[]}
     * @memberof BufferScheduler
     */
    private unresolvedDataArray;
    /**
     * How much data consisted in unresolvedDataArray.
     *
     * @private
     * @type {number}
     * @memberof BufferScheduler
     */
    private unresolvedLength;
    /**
     * The array includes all the available buffers can be used to fill data from stream.
     *
     * @private
     * @type {Buffer[]}
     * @memberof BufferScheduler
     */
    private incoming;
    /**
     * The array (queue) includes all the buffers filled from stream data.
     *
     * @private
     * @type {Buffer[]}
     * @memberof BufferScheduler
     */
    private outgoing;
    /**
     * Creates an instance of BufferScheduler.
     *
     * @param {Readable} readable A Node.js Readable stream
     * @param {number} bufferSize Buffer size of every maintained buffer
     * @param {number} maxBuffers How many buffers can be allocated
     * @param {OutgoingHandler} outgoingHandler An async function scheduled to be
     *                                          triggered when a buffer fully filled
     *                                          with stream data
     * @param {number} parallelism Concurrency of executing outgoingHandlers (>0)
     * @param {string} [encoding] [Optional] Encoding of Readable stream when it's a string stream
     * @memberof BufferScheduler
     */
    constructor(readable: Readable, bufferSize: number, maxBuffers: number, outgoingHandler: OutgoingHandler, parallelism: number, encoding?: string);
    /**
     * Start the scheduler, will return error when stream of any of the outgoingHandlers
     * returns error.
     *
     * @returns {Promise<void>}
     * @memberof BufferScheduler
     */
    do(): Promise<void>;
    /**
     * Insert a new data into unresolved array.
     *
     * @private
     * @param {Buffer} data
     * @memberof BufferScheduler
     */
    private appendUnresolvedData;
    /**
     * Try to shift a buffer with size in blockSize. The buffer returned may be less
     * than blockSize when data in unresolvedDataArray is less than bufferSize.
     *
     * @private
     * @returns {Buffer}
     * @memberof BufferScheduler
     */
    private shiftBufferFromUnresolvedDataArray;
    /**
     * Resolve data in unresolvedDataArray. For every buffer with size in blockSize
     * shifted, it will try to get (or allocate a buffer) from incoming, and fill it,
     * then push it into outgoing to be handled by outgoing handler.
     *
     * Return false when available buffers in incoming are not enough, else true.
     *
     * @private
     * @returns {boolean} Return false when buffers in incoming are not enough, else true.
     * @memberof BufferScheduler
     */
    private resolveData;
    /**
     * Try to trigger a outgoing handler for every buffer in outgoing. Stop when
     * parallelism reaches.
     *
     * @private
     * @memberof BufferScheduler
     */
    private triggerOutgoingHandlers;
    /**
     * Trigger a outgoing handler for a buffer shifted from outgoing.
     *
     * @private
     * @param {Buffer} buffer
     * @returns {Promise<any>}
     * @memberof BufferScheduler
     */
    private triggerOutgoingHandler;
    /**
     * Return buffer used by outgoing handler into incoming.
     *
     * @private
     * @param {Buffer} buffer
     * @memberof BufferScheduler
     */
    private reuseBuffer;
}
//# sourceMappingURL=BufferScheduler.d.ts.map