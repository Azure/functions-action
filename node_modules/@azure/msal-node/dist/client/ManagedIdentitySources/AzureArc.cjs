/*! @azure/msal-node v2.10.0 2024-07-01 */
'use strict';
'use strict';

var msalCommon = require('@azure/msal-common');
var ManagedIdentityRequestParameters = require('../../config/ManagedIdentityRequestParameters.cjs');
var BaseManagedIdentitySource = require('./BaseManagedIdentitySource.cjs');
var ManagedIdentityError = require('../../error/ManagedIdentityError.cjs');
var Constants = require('../../utils/Constants.cjs');
var fs = require('fs');
var path = require('path');
var ManagedIdentityErrorCodes = require('../../error/ManagedIdentityErrorCodes.cjs');

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const ARC_API_VERSION = "2019-11-01";
const SUPPORTED_AZURE_ARC_PLATFORMS = {
    win32: `${process.env["ProgramData"]}\\AzureConnectedMachineAgent\\Tokens\\`,
    linux: "/var/opt/azcmagent/tokens/",
};
/**
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/AzureArcManagedIdentitySource.cs
 */
class AzureArc extends BaseManagedIdentitySource.BaseManagedIdentitySource {
    constructor(logger, nodeStorage, networkClient, cryptoProvider, identityEndpoint) {
        super(logger, nodeStorage, networkClient, cryptoProvider);
        this.identityEndpoint = identityEndpoint;
    }
    static getEnvironmentVariables() {
        const identityEndpoint = process.env[Constants.ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT];
        const imdsEndpoint = process.env[Constants.ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT];
        return [identityEndpoint, imdsEndpoint];
    }
    static tryCreate(logger, nodeStorage, networkClient, cryptoProvider, managedIdentityId) {
        const [identityEndpoint, imdsEndpoint] = AzureArc.getEnvironmentVariables();
        // if either of the identity or imds endpoints are undefined, this MSI provider is unavailable.
        if (!identityEndpoint || !imdsEndpoint) {
            logger.info(`[Managed Identity] ${Constants.ManagedIdentitySourceNames.AZURE_ARC} managed identity is unavailable because one or both of the '${Constants.ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT}' and '${Constants.ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT}' environment variables are not defined.`);
            return null;
        }
        const validatedIdentityEndpoint = AzureArc.getValidatedEnvVariableUrlString(Constants.ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT, identityEndpoint, Constants.ManagedIdentitySourceNames.AZURE_ARC, logger);
        // remove trailing slash
        validatedIdentityEndpoint.endsWith("/")
            ? validatedIdentityEndpoint.slice(0, -1)
            : validatedIdentityEndpoint;
        AzureArc.getValidatedEnvVariableUrlString(Constants.ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT, imdsEndpoint, Constants.ManagedIdentitySourceNames.AZURE_ARC, logger);
        logger.info(`[Managed Identity] Environment variables validation passed for ${Constants.ManagedIdentitySourceNames.AZURE_ARC} managed identity. Endpoint URI: ${validatedIdentityEndpoint}. Creating ${Constants.ManagedIdentitySourceNames.AZURE_ARC} managed identity.`);
        if (managedIdentityId.idType !== Constants.ManagedIdentityIdType.SYSTEM_ASSIGNED) {
            throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.unableToCreateAzureArc);
        }
        return new AzureArc(logger, nodeStorage, networkClient, cryptoProvider, identityEndpoint);
    }
    createRequest(resource) {
        const request = new ManagedIdentityRequestParameters.ManagedIdentityRequestParameters(Constants.HttpMethod.GET, this.identityEndpoint.replace("localhost", "127.0.0.1"));
        request.headers[Constants.METADATA_HEADER_NAME] = "true";
        request.queryParameters[Constants.API_VERSION_QUERY_PARAMETER_NAME] =
            ARC_API_VERSION;
        request.queryParameters[Constants.RESOURCE_BODY_OR_QUERY_PARAMETER_NAME] =
            resource;
        // bodyParameters calculated in BaseManagedIdentity.acquireTokenWithManagedIdentity
        return request;
    }
    async getServerTokenResponseAsync(originalResponse, networkClient, networkRequest, networkRequestOptions) {
        let retryResponse;
        if (originalResponse.status === msalCommon.HttpStatus.UNAUTHORIZED) {
            const wwwAuthHeader = originalResponse.headers["www-authenticate"];
            if (!wwwAuthHeader) {
                throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.wwwAuthenticateHeaderMissing);
            }
            if (!wwwAuthHeader.includes("Basic realm=")) {
                throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.wwwAuthenticateHeaderUnsupportedFormat);
            }
            const secretFilePath = wwwAuthHeader.split("Basic realm=")[1];
            // throw an error if the managed identity application is not being run on Windows or Linux
            if (!SUPPORTED_AZURE_ARC_PLATFORMS.hasOwnProperty(process.platform)) {
                throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.platformNotSupported);
            }
            // get the expected Windows or Linux file path)
            const expectedSecretFilePath = SUPPORTED_AZURE_ARC_PLATFORMS[process.platform];
            // throw an error if the file in the file path is not a .key file
            const fileName = path.basename(secretFilePath);
            if (!fileName.endsWith(".key")) {
                throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.invalidFileExtension);
            }
            /*
             * throw an error if the file path from the www-authenticate header does not match the
             * expected file path for the platform (Windows or Linux) the managed identity application
             * is running on
             */
            if (expectedSecretFilePath + fileName !== secretFilePath) {
                throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.invalidFilePath);
            }
            let secretFileSize;
            // attempt to get the secret file's size, in bytes
            try {
                secretFileSize = await fs.statSync(secretFilePath).size;
            }
            catch (e) {
                throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.unableToReadSecretFile);
            }
            // throw an error if the secret file's size is greater than 4096 bytes
            if (secretFileSize > Constants.AZURE_ARC_SECRET_FILE_MAX_SIZE_BYTES) {
                throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.invalidSecret);
            }
            // attempt to read the contents of the secret file
            let secret;
            try {
                secret = fs.readFileSync(secretFilePath, "utf-8");
            }
            catch (e) {
                throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.unableToReadSecretFile);
            }
            const authHeaderValue = `Basic ${secret}`;
            this.logger.info(`[Managed Identity] Adding authorization header to the request.`);
            networkRequest.headers[Constants.AUTHORIZATION_HEADER_NAME] = authHeaderValue;
            try {
                retryResponse =
                    await networkClient.sendGetRequestAsync(networkRequest.computeUri(), networkRequestOptions);
            }
            catch (error) {
                if (error instanceof msalCommon.AuthError) {
                    throw error;
                }
                else {
                    throw msalCommon.createClientAuthError(msalCommon.ClientAuthErrorCodes.networkError);
                }
            }
        }
        return this.getServerTokenResponse(retryResponse || originalResponse);
    }
}

exports.ARC_API_VERSION = ARC_API_VERSION;
exports.AzureArc = AzureArc;
exports.SUPPORTED_AZURE_ARC_PLATFORMS = SUPPORTED_AZURE_ARC_PLATFORMS;
//# sourceMappingURL=AzureArc.cjs.map
