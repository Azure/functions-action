/*! @azure/msal-common v14.13.0 2024-07-01 */
'use strict';
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
function isCloudInstanceDiscoveryResponse(response) {
    return (response.hasOwnProperty("tenant_discovery_endpoint") &&
        response.hasOwnProperty("metadata"));
}

export { isCloudInstanceDiscoveryResponse };
//# sourceMappingURL=CloudInstanceDiscoveryResponse.mjs.map
