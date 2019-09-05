"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../exceptions");
class AppSettingParser {
    static getAzureWebjobsStorage(azureWebjobsStorage) {
        const result = {};
        azureWebjobsStorage.trim().split(';').map(entry => {
            const keyValue = entry.trim();
            const delimeterIndex = keyValue.indexOf('=');
            if (delimeterIndex === -1) {
                throw new exceptions_1.UnexpectedConversion('AzureWebjobsStorage', entry);
            }
            const key = keyValue.substring(0, delimeterIndex);
            const value = keyValue.substring(delimeterIndex + 1);
            result[key] = value;
        });
        return result;
    }
}
exports.AppSettingParser = AppSettingParser;
