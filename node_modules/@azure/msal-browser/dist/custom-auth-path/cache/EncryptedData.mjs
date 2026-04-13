/*! @azure/msal-browser v5.6.3 2026-04-01 */
'use strict';
/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
function isEncrypted(data) {
    return (data.hasOwnProperty("id") &&
        data.hasOwnProperty("nonce") &&
        data.hasOwnProperty("data"));
}

export { isEncrypted };
//# sourceMappingURL=EncryptedData.mjs.map
