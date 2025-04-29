/*! @azure/msal-node v2.10.0 2024-07-01 */
'use strict';
'use strict';

var Constants = require('../utils/Constants.cjs');

/*
 * Copyright (c) Microsoft Corporation. All rights reserved.
 * Licensed under the MIT License.
 */
const invalidFileExtension = "invalid_file_extension";
const invalidFilePath = "invalid_file_path";
const invalidManagedIdentityIdType = "invalid_managed_identity_id_type";
const invalidSecret = "invalid_secret";
const missingId = "missing_client_id";
const networkUnavailable = "network_unavailable";
const platformNotSupported = "platform_not_supported";
const unableToCreateAzureArc = "unable_to_create_azure_arc";
const unableToCreateCloudShell = "unable_to_create_cloud_shell";
const unableToCreateSource = "unable_to_create_source";
const unableToReadSecretFile = "unable_to_read_secret_file";
const userAssignedNotAvailableAtRuntime = "user_assigned_not_available_at_runtime";
const wwwAuthenticateHeaderMissing = "www_authenticate_header_missing";
const wwwAuthenticateHeaderUnsupportedFormat = "www_authenticate_header_unsupported_format";
const MsiEnvironmentVariableUrlMalformedErrorCodes = {
    [Constants.ManagedIdentityEnvironmentVariableNames.AZURE_POD_IDENTITY_AUTHORITY_HOST]: "azure_pod_identity_authority_host_url_malformed",
    [Constants.ManagedIdentityEnvironmentVariableNames.IDENTITY_ENDPOINT]: "identity_endpoint_url_malformed",
    [Constants.ManagedIdentityEnvironmentVariableNames.IMDS_ENDPOINT]: "imds_endpoint_url_malformed",
    [Constants.ManagedIdentityEnvironmentVariableNames.MSI_ENDPOINT]: "msi_endpoint_url_malformed",
};

exports.MsiEnvironmentVariableUrlMalformedErrorCodes = MsiEnvironmentVariableUrlMalformedErrorCodes;
exports.invalidFileExtension = invalidFileExtension;
exports.invalidFilePath = invalidFilePath;
exports.invalidManagedIdentityIdType = invalidManagedIdentityIdType;
exports.invalidSecret = invalidSecret;
exports.missingId = missingId;
exports.networkUnavailable = networkUnavailable;
exports.platformNotSupported = platformNotSupported;
exports.unableToCreateAzureArc = unableToCreateAzureArc;
exports.unableToCreateCloudShell = unableToCreateCloudShell;
exports.unableToCreateSource = unableToCreateSource;
exports.unableToReadSecretFile = unableToReadSecretFile;
exports.userAssignedNotAvailableAtRuntime = userAssignedNotAvailableAtRuntime;
exports.wwwAuthenticateHeaderMissing = wwwAuthenticateHeaderMissing;
exports.wwwAuthenticateHeaderUnsupportedFormat = wwwAuthenticateHeaderUnsupportedFormat;
//# sourceMappingURL=ManagedIdentityErrorCodes.cjs.map
