import { Authority } from "./Authority";
import { INetworkModule } from "../network/INetworkModule";
import { ICacheManager } from "../cache/interface/ICacheManager";
import { AuthorityOptions } from "./AuthorityOptions";
import { Logger } from "../logger/Logger";
import { IPerformanceClient } from "../telemetry/performance/IPerformanceClient";
/**
 * Create an authority object of the correct type based on the url
 * Performs basic authority validation - checks to see if the authority is of a valid type (i.e. aad, b2c, adfs)
 *
 * Also performs endpoint discovery.
 *
 * @param authorityUri
 * @param networkClient
 * @param protocolMode
 * @internal
 */
export declare function createDiscoveredInstance(authorityUri: string, networkClient: INetworkModule, cacheManager: ICacheManager, authorityOptions: AuthorityOptions, logger: Logger, correlationId: string, performanceClient?: IPerformanceClient): Promise<Authority>;
//# sourceMappingURL=AuthorityFactory.d.ts.map