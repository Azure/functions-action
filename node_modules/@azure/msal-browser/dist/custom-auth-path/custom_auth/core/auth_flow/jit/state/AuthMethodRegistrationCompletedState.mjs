/*! @azure/msal-browser v5.6.3 2026-04-01 */
'use strict';
import { AuthFlowStateBase } from '../../AuthFlowState.mjs';
import { AUTH_METHOD_REGISTRATION_COMPLETED_STATE_TYPE } from '../../AuthFlowStateTypes.mjs';

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * State indicating that the auth method registration flow has completed successfully.
 */
class AuthMethodRegistrationCompletedState extends AuthFlowStateBase {
    constructor() {
        super(...arguments);
        /**
         * The type of the state.
         */
        this.stateType = AUTH_METHOD_REGISTRATION_COMPLETED_STATE_TYPE;
    }
}

export { AuthMethodRegistrationCompletedState };
//# sourceMappingURL=AuthMethodRegistrationCompletedState.mjs.map
