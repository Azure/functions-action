/*! @azure/msal-node v2.10.0 2024-07-01 */
'use strict';
'use strict';

var AppService = require('./ManagedIdentitySources/AppService.cjs');
var AzureArc = require('./ManagedIdentitySources/AzureArc.cjs');
var CloudShell = require('./ManagedIdentitySources/CloudShell.cjs');
var Imds = require('./ManagedIdentitySources/Imds.cjs');
var ServiceFabric = require('./ManagedIdentitySources/ServiceFabric.cjs');
var ManagedIdentityError = require('../error/ManagedIdentityError.cjs');
var Constants = require('../utils/Constants.cjs');
var ManagedIdentityErrorCodes = require('../error/ManagedIdentityErrorCodes.cjs');

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
/*
 * Class to initialize a managed identity and identify the service.
 * Original source of code: https://github.com/Azure/azure-sdk-for-net/blob/main/sdk/identity/Azure.Identity/src/ManagedIdentityClient.cs
 */
class ManagedIdentityClient {
    constructor(logger, nodeStorage, networkClient, cryptoProvider) {
        this.logger = logger;
        this.nodeStorage = nodeStorage;
        this.networkClient = networkClient;
        this.cryptoProvider = cryptoProvider;
    }
    async sendManagedIdentityTokenRequest(managedIdentityRequest, managedIdentityId, fakeAuthority, refreshAccessToken) {
        if (!ManagedIdentityClient.identitySource) {
            ManagedIdentityClient.identitySource =
                this.selectManagedIdentitySource(this.logger, this.nodeStorage, this.networkClient, this.cryptoProvider, managedIdentityId);
        }
        return ManagedIdentityClient.identitySource.acquireTokenWithManagedIdentity(managedIdentityRequest, managedIdentityId, fakeAuthority, refreshAccessToken);
    }
    allEnvironmentVariablesAreDefined(environmentVariables) {
        return Object.values(environmentVariables).every((environmentVariable) => {
            return environmentVariable !== undefined;
        });
    }
    /**
     * Determine the Managed Identity Source based on available environment variables. This API is consumed by ManagedIdentityApplication's getManagedIdentitySource.
     * @returns ManagedIdentitySourceNames - The Managed Identity source's name
     */
    getManagedIdentitySource() {
        ManagedIdentityClient.sourceName =
            this.allEnvironmentVariablesAreDefined(ServiceFabric.ServiceFabric.getEnvironmentVariables())
                ? Constants.ManagedIdentitySourceNames.SERVICE_FABRIC
                : this.allEnvironmentVariablesAreDefined(AppService.AppService.getEnvironmentVariables())
                    ? Constants.ManagedIdentitySourceNames.APP_SERVICE
                    : this.allEnvironmentVariablesAreDefined(CloudShell.CloudShell.getEnvironmentVariables())
                        ? Constants.ManagedIdentitySourceNames.CLOUD_SHELL
                        : this.allEnvironmentVariablesAreDefined(AzureArc.AzureArc.getEnvironmentVariables())
                            ? Constants.ManagedIdentitySourceNames.AZURE_ARC
                            : Constants.ManagedIdentitySourceNames.DEFAULT_TO_IMDS;
        return ManagedIdentityClient.sourceName;
    }
    /**
     * Tries to create a managed identity source for all sources
     * @returns the managed identity Source
     */
    selectManagedIdentitySource(logger, nodeStorage, networkClient, cryptoProvider, managedIdentityId) {
        const source = ServiceFabric.ServiceFabric.tryCreate(logger, nodeStorage, networkClient, cryptoProvider, managedIdentityId) ||
            AppService.AppService.tryCreate(logger, nodeStorage, networkClient, cryptoProvider) ||
            CloudShell.CloudShell.tryCreate(logger, nodeStorage, networkClient, cryptoProvider, managedIdentityId) ||
            AzureArc.AzureArc.tryCreate(logger, nodeStorage, networkClient, cryptoProvider, managedIdentityId) ||
            Imds.Imds.tryCreate(logger, nodeStorage, networkClient, cryptoProvider);
        if (!source) {
            throw ManagedIdentityError.createManagedIdentityError(ManagedIdentityErrorCodes.unableToCreateSource);
        }
        return source;
    }
}

exports.ManagedIdentityClient = ManagedIdentityClient;
//# sourceMappingURL=ManagedIdentityClient.cjs.map
