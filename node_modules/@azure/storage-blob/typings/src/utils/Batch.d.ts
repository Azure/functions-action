/**
 * Operation is an async function to be executed and managed by Batch.
 */
export declare type Operation = () => Promise<any>;
/**
 * Batch provides basic parallel execution with concurrency limits.
 * Will stop execute left operations when one of the executed operation throws an error.
 * But Batch cannot cancel ongoing operations, you need to cancel them by yourself.
 *
 * @export
 * @class Batch
 */
export declare class Batch {
    /**
     * Concurrency. Must be lager than 0.
     *
     * @type {number}
     * @memberof Batch
     */
    private concurrency;
    /**
     * Number of active operations under execution.
     *
     * @private
     * @type {number}
     * @memberof Batch
     */
    private actives;
    /**
     * Number of completed operations under execution.
     *
     * @private
     * @type {number}
     * @memberof Batch
     */
    private completed;
    /**
     * Offset of next operation to be executed.
     *
     * @private
     * @type {number}
     * @memberof Batch
     */
    private offset;
    /**
     * Operation array to be executed.
     *
     * @private
     * @type {Operation[]}
     * @memberof Batch
     */
    private operations;
    /**
     * States of Batch. When an error happens, state will turn into error.
     * Batch will stop execute left operations.
     *
     * @private
     * @type {BatchStates}
     * @memberof Batch
     */
    private state;
    /**
     * A private emitter used to pass events inside this class.
     *
     * @private
     * @type {EventEmitter}
     * @memberof Batch
     */
    private emitter;
    /**
     * Creates an instance of Batch.
     * @param {number} [concurrency=5]
     * @memberof Batch
     */
    constructor(concurrency?: number);
    /**
     * Add a operation into queue.
     *
     * @param {Operation} operation
     * @memberof Batch
     */
    addOperation(operation: Operation): void;
    /**
     * Start execute operations in the queue.
     *
     * @returns {Promise<void>}
     * @memberof Batch
     */
    do(): Promise<void>;
    /**
     * Get next operation to be executed. Return null when reaching ends.
     *
     * @private
     * @returns {(Operation | null)}
     * @memberof Batch
     */
    private nextOperation;
    /**
     * Start execute operations. One one the most important difference between
     * this method with do() is that do() wraps as an sync method.
     *
     * @private
     * @returns {void}
     * @memberof Batch
     */
    private parallelExecute;
}
//# sourceMappingURL=Batch.d.ts.map