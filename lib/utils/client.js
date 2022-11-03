"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Client = void 0;
const WebClient_1 = require("azure-actions-webclient/WebClient");
const logger_1 = require("./logger");
const exceptions_1 = require("../exceptions");
const authentication_type_1 = require("../constants/authentication_type");
const runtime_stack_1 = require("../constants/runtime_stack");
const fs = require("fs");
class Client {
    static ping(url, retryCount = 1, retryIntervalSecond = 5) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'GET',
                uri: url
            };
            const options = {
                retriableStatusCodes: [404, 500, 502, 503],
                retryCount: retryCount,
                retryIntervalInSeconds: retryIntervalSecond
            };
            try {
                return yield Client.webClient.sendRequest(request, options);
            }
            catch (expt) {
                throw new exceptions_1.WebRequestError(url, 'GET', 'Failed to ping', expt);
            }
        });
    }
    static updateAppSettingViaKudu(scm, appSettings, retryCount = 1, retryIntervalSecond = 5, throwOnError = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const base64Cred = Buffer.from(`${scm.username}:${scm.password}`).toString('base64');
            const request = {
                method: 'POST',
                uri: `${scm.uri}/api/settings`,
                body: JSON.stringify(appSettings),
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${base64Cred}`
                }
            };
            const options = {
                retriableStatusCodes: [404, 409, 500, 502, 503],
                retryCount: retryCount,
                retryIntervalInSeconds: retryIntervalSecond
            };
            try {
                const response = yield Client.webClient.sendRequest(request, options);
                logger_1.Logger.Info(`Response with status code ${response.statusCode}`);
                return response;
            }
            catch (expt) {
                if (throwOnError) {
                    throw new exceptions_1.WebRequestError(scm.uri, 'POST', 'Failed to update app settings via kudu', expt);
                }
                else {
                    logger_1.Logger.Warn(`Failed to perform POST ${scm.uri}`);
                }
            }
        });
    }
    static deleteAppSettingViaKudu(scm, appSetting, retryCount = 1, retryIntervalSecond = 5, throwOnError = true) {
        return __awaiter(this, void 0, void 0, function* () {
            const base64Cred = Buffer.from(`${scm.username}:${scm.password}`).toString('base64');
            const request = {
                method: 'DELETE',
                uri: `${scm.uri}/api/settings/${appSetting}`,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Basic ${base64Cred}`
                }
            };
            const options = {
                retriableStatusCodes: [404, 409, 500, 502, 503],
                retryCount: retryCount,
                retryIntervalInSeconds: retryIntervalSecond
            };
            try {
                const response = yield Client.webClient.sendRequest(request, options);
                logger_1.Logger.Info(`Response with status code ${response.statusCode}`);
                return response;
            }
            catch (expt) {
                if (throwOnError) {
                    throw new exceptions_1.WebRequestError(scm.uri, 'DELETE', 'Failed to delete app setting via kudu', expt);
                }
                else {
                    logger_1.Logger.Warn(`Failed to perform DELETE ${scm.uri}`);
                }
            }
        });
    }
    static validateZipDeploy(context, webPackage) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let username = "";
                let password = "";
                let uri = "";
                // if (context.authenticationType === AuthenticationType.Scm) {
                //     Logger.Info("Validating deployment package for functions app before Zip Deploy (SCM)");
                //     if (context.scmCredentials){
                //         username = context.scmCredentials.username;
                //         password = context.scmCredentials.password;
                //         uri = context.scmCredentials.uri;
                //     }
                // }
                if (context.authenticationType === authentication_type_1.AuthenticationType.Rbac &&
                    context.os === runtime_stack_1.RuntimeStackConstant.Windows) {
                    logger_1.Logger.Info("Validating deployment package for functions app before Zip Deploy (RBAC)");
                    var publishingCredentials = yield context.appService.getPublishingCredentials();
                    if (publishingCredentials.properties["scmUri"]) {
                        username = publishingCredentials.properties["publishingUserName"];
                        password = publishingCredentials.properties["publishingPassword"];
                        uri = publishingCredentials.properties["scmUri"];
                    }
                    var stats = fs.statSync(webPackage);
                    var fileSizeInBytes = stats.size;
                    const base64Cred = Buffer.from(`${username}:${password}`).toString('base64');
                    let request = {
                        method: 'POST',
                        uri: `${uri}/api/zipdeploy/validate`,
                        headers: {
                            'Authorization': `Basic ${base64Cred}`,
                            'Content-Length': fileSizeInBytes
                        },
                        body: fs.createReadStream(webPackage)
                    };
                    let response = yield Client.webClient.sendRequest(request);
                    if (response.statusCode == 200) {
                        logger_1.Logger.Info(`##[debug]Validation passed response: ${JSON.stringify(response)}`);
                        if (response.body && response.body.result) {
                            logger_1.Logger.Warn(JSON.stringify(response.body.result));
                        }
                        return null;
                    }
                    else if (response.statusCode == 400) {
                        logger_1.Logger.Info(`##[debug]Validation failed response: ${JSON.stringify(response)}`);
                        throw response;
                    }
                    else {
                        logger_1.Logger.Info(`##[debug]Skipping validation with status: ${response.statusCode}`);
                        return null;
                    }
                }
            }
            catch (error) {
                if (error && error.body && error.body.result && typeof error.body.result.valueOf() == 'string' && error.body.result.includes('ZipDeploy Validation ERROR')) {
                    throw new Error(JSON.stringify(error.body.result));
                }
                else {
                    logger_1.Logger.Info(`##[debug]Skipping validation with error: ${JSON.stringify(error)}`);
                    return null;
                }
            }
        });
    }
}
exports.Client = Client;
Client.webClient = new WebClient_1.WebClient();
