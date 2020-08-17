"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const WebClient_1 = require("azure-actions-webclient/WebClient");
const logger_1 = require("./logger");
const exceptions_1 = require("../exceptions");
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
                logger_1.Logger.Log(`Response with status code ${response.statusCode}`);
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
                logger_1.Logger.Log(`Response with status code ${response.statusCode}`);
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
}
Client.webClient = new WebClient_1.WebClient();
exports.Client = Client;
