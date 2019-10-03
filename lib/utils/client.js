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
const webClient_1 = require("pipelines-appservice-lib/lib/webClient");
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
                return yield webClient_1.sendRequest(request, options);
            }
            catch (expt) {
                throw new exceptions_1.WebRequestError(url, 'GET', 'Failed to ping', expt);
            }
        });
    }
    static updateAppSettingViaKudu(kuduUrl, appSettings, retryCount = 1, retryIntervalSecond = 5) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'POST',
                uri: `${kuduUrl}/api/settings`,
                body: JSON.stringify(appSettings),
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            const options = {
                retriableStatusCodes: [404, 409, 500, 502, 503],
                retryCount: retryCount,
                retryIntervalInSeconds: retryIntervalSecond
            };
            try {
                return yield webClient_1.sendRequest(request, options);
            }
            catch (expt) {
                throw new exceptions_1.WebRequestError(kuduUrl, 'POST', 'Failed to update app settings via kudu', expt);
            }
        });
    }
    static deleteAppSettingViaKudu(kuduUrl, appSetting, retryCount = 1, retryIntervalSecond = 5) {
        return __awaiter(this, void 0, void 0, function* () {
            const request = {
                method: 'DELETE',
                uri: `${kuduUrl}/api/settings/${appSetting}`
            };
            const options = {
                retriableStatusCodes: [404, 409, 500, 502, 503],
                retryCount: retryCount,
                retryIntervalInSeconds: retryIntervalSecond
            };
            try {
                return yield webClient_1.sendRequest(request, options);
            }
            catch (expt) {
                throw new exceptions_1.WebRequestError(kuduUrl, 'DELETE', 'Failed to delete app setting via kudu', expt);
            }
        });
    }
}
exports.Client = Client;
