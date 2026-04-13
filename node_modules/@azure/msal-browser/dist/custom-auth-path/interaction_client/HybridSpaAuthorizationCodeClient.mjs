/*! @azure/msal-browser v5.6.3 2026-04-01 */
'use strict';
import { AuthorizationCodeClient } from '@azure/msal-common/browser';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
class HybridSpaAuthorizationCodeClient extends AuthorizationCodeClient {
    constructor(config, performanceClient) {
        super(config, performanceClient);
        this.includeRedirectUri = false;
    }
}

export { HybridSpaAuthorizationCodeClient };
//# sourceMappingURL=HybridSpaAuthorizationCodeClient.mjs.map
