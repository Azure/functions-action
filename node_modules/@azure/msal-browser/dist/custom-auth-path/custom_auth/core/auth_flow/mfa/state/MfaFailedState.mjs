/*! @azure/msal-browser v5.6.3 2026-04-01 */
'use strict';
import { AuthFlowStateBase } from '../../AuthFlowState.mjs';
import { MFA_FAILED_STATE_TYPE } from '../../AuthFlowStateTypes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * State indicating that the MFA flow has failed.
 */
class MfaFailedState extends AuthFlowStateBase {
    constructor() {
        super(...arguments);
        /**
         * The type of the state.
         */
        this.stateType = MFA_FAILED_STATE_TYPE;
    }
}

export { MfaFailedState };
//# sourceMappingURL=MfaFailedState.mjs.map
