/**
 * An async mutex lock.
 *
 * @export
 * @class Mutex
 */
export declare class Mutex {
    /**
     * Lock for a specific key. If the lock has been acquired by another customer, then
     * will wait until getting the lock.
     *
     * @static
     * @param {string} key lock key
     * @returns {Promise<void>}
     * @memberof Mutex
     */
    static lock(key: string): Promise<void>;
    /**
     * Unlock a key.
     *
     * @static
     * @param {string} key
     * @returns {Promise<void>}
     * @memberof Mutex
     */
    static unlock(key: string): Promise<void>;
    private static keys;
    private static listeners;
    private static onUnlockEvent;
    private static emitUnlockEvent;
}
//# sourceMappingURL=Mutex.d.ts.map