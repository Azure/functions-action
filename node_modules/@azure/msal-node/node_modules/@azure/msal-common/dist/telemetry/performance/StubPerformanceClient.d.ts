import { IPerformanceClient, InProgressPerformanceEvent } from "./IPerformanceClient";
import { IPerformanceMeasurement } from "./IPerformanceMeasurement";
import { PerformanceEvent } from "./PerformanceEvent";
export declare class StubPerformanceMeasurement implements IPerformanceMeasurement {
    startMeasurement(): void;
    endMeasurement(): void;
    flushMeasurement(): number | null;
}
export declare class StubPerformanceClient implements IPerformanceClient {
    generateId(): string;
    startMeasurement(measureName: string, correlationId?: string | undefined): InProgressPerformanceEvent;
    startPerformanceMeasurement(): IPerformanceMeasurement;
    calculateQueuedTime(): number;
    addQueueMeasurement(): void;
    setPreQueueTime(): void;
    endMeasurement(): PerformanceEvent | null;
    discardMeasurements(): void;
    removePerformanceCallback(): boolean;
    addPerformanceCallback(): string;
    emitEvents(): void;
    addFields(): void;
    incrementFields(): void;
    cacheEventByCorrelationId(): void;
}
//# sourceMappingURL=StubPerformanceClient.d.ts.map