/*! @azure/msal-node v2.10.0 2024-07-01 */
'use strict';
'use strict';

var msalCommon = require('@azure/msal-common');
var Constants = require('../../utils/Constants.cjs');
var ManagedIdentityError = require('../../error/ManagedIdentityError.cjs');
var ManagedIdentityErrorCodes = require('../../error/ManagedIdentityErrorCodes.cjs');

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/**
 * Managed Identity User Assigned Id Query Parameter Names
 */
const ManagedIdentityUserAssignedIdQueryParameterNames = {
    MANAGED_IDENTITY_CLIENT_ID: "client_id",
    MANAGED_IDENTITY_OBJECT_ID: "object_id",
    MANAGED_IDENTITY_RESOURCE_ID: "mi_res_id",
};
class BaseManagedIdentitySource {
    constructor(logger, nodeStorage, networkClient, cryptoProvider) {
        this.logger = logger;
        this.nodeStorage = nodeStorage;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
    }
    async getServerTokenResponseAsync(response, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _networkClient, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _networkRequest, 
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    _networkRequestOptions) {
        return this.getServerTokenResponse(response);
    }
    getServerTokenResponse(response) {
        let refreshIn, expiresIn;
        if (response.body.expires_on) {
            expiresIn = response.body.expires_on - msalCommon.TimeUtils.nowSeconds();
            // compute refresh_in as 1/2 of expires_in, but only if expires_in > 2h
            if (expiresIn > 2 * 3600) {
                refreshIn = expiresIn / 2;
            }
        }
        const serverTokenResponse = {
            status: response.status,
            // success
            access_token: response.body.access_token,
            expires_in: expiresIn,
            scope: response.body.resource,
            token_type: response.body.token_type,
            refresh_in: refreshIn,
            // error
            correlation_id: response.body.correlation_id || response.body.correlationId,
            error: typeof response.body.error === "string"
                ? response.body.error
                : response.body.error?.code,
            error_description: response.body.message ||
                (typeof response.body.error === "string"
                    ? response.body.error_description
                    : response.body.error?.message),
            error_codes: response.body.error_codes,
            timestamp: response.body.timestamp,
            trace_id: response.body.trace_id,
        };
        return serverTokenResponse;
    }
    async acquireTokenWithManagedIdentity(managedIdentityRequest, managedIdentityId, fakeAuthority, refreshAccessToken) {
        const networkRequest = this.createRequest(managedIdentityRequest.resource, managedIdentityId);
        const headers = networkRequest.headers;
        headers[msalCommon.HeaderNames.CONTENT_TYPE] = msalCommon.Constants.URL_FORM_CONTENT_TYPE;
        const networkRequestOptions = { headers };
        if (Object.keys(networkRequest.bodyParameters).length) {
            networkRequestOptions.body =
                networkRequest.computeParametersBodyString();
        }
        const reqTimestamp = msalCommon.TimeUtils.nowSeconds();
        let response;
        try {
            // Sources that send POST requests: Cloud Shell
            if (networkRequest.httpMethod === Constants.HttpMethod.POST) {
                response =
                    await this.networkClient.sendPostRequestAsync(networkRequest.computeUri(), networkRequestOptions);
                // Sources that send GET requests: App Service, Azure Arc, IMDS, Service Fabric
            }
            else {
                response =
                    await this.networkClient.sendGetRequestAsync(networkRequest.computeUri(), networkRequestOptions);
            }
        }
        catch (error) {
            if (error instanceof msalCommon.AuthError) {
                throw error;
            }
            else {
                throw msalCommon.createClientAuthError(msalCommon.ClientAuthErrorCodes.networkError);
            }
        }
        const responseHandler = new msalCommon.ResponseHandler(managedIdentityId.id, this.nodeStorage, this.cryptoProvider, this.logger, null, null);
        const serverTokenResponse = await this.getServerTokenResponseAsync(response, this.networkClient, networkRequest, networkRequestOptions);
        responseHandler.validateTokenResponse(serverTokenResponse, refreshAccessToken);
        // caches the token
        return responseHandler.handleServerTokenResponse(serverTokenResponse, fakeAuthority, reqTimestamp, managedIdentityRequest);
    }
    getManagedIdentityUserAssignedIdQueryParameterKey(managedIdentityIdType) {
        switch (managedIdentityIdType) {
            case Constants.ManagedIdentityIdType.USER_ASSIGNED_CLIENT_ID:
                this.logger.info("[Managed Identity] Adding user assigned client id to the request.");
                return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_CLIENT_ID;
            case Constants.ManagedIdentityIdType.USER_ASSIGNED_RESOURCE_ID:
                this.logger.info("[Managed Identity] Adding user assigned resource id to the request.");
                return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_RESOURCE_ID;
            case Constants.ManagedIdentityIdType.USER_ASSIGNED_OBJECT_ID:
                this.logger.info("[Managed Identity] Adding user assigned object id to the request.");
                return ManagedIdentityUserAssignedIdQueryParameterNames.MANAGED_IDENTITY_OBJECT_ID;
            default:
                throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.invalidManagedIdentityIdType);
        }
    }
}
BaseManagedIdentitySource.getValidatedEnvVariableUrlString = (envVariableStringName, envVariable, sourceName, logger) => {
    try {
        return new msalCommon.UrlString(envVariable).urlString;
    }
    catch (error) {
        logger.info(`[Managed Identity] ${sourceName} managed identity is unavailable because the '${envVariableStringName}' environment variable is malformed.`);
        throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.MsiEnvironmentVariableUrlMalformedErrorCodes[envVariableStringName]);
    }
};

exports.BaseManagedIdentitySource = BaseManagedIdentitySource;
exports.ManagedIdentityUserAssignedIdQueryParameterNames = ManagedIdentityUserAssignedIdQueryParameterNames;
//# sourceMappingURL=BaseManagedIdentitySource.cjs.map
