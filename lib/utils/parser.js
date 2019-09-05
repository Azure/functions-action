"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const exceptions_1 = require("../exceptions");
class Parser {
    static GetAzureWebjobsStorage(azureWebjobsStorage) {
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
    static IsTrueLike(value) {
        if (value === undefined) {
            return false;
        }
        if (value.trim() === "") {
            return false;
        }
        if (value.trim().toLowerCase() in ["0", "false", "f", "no", "n"]) {
            return false;
        }
        if (value.trim().toLowerCase() in ["1", "true", "t", "yes", "y"]) {
            return true;
        }
        throw new exceptions_1.UnexpectedConversion('value', `Failed to determine if ${value} represents true or false`);
    }
}
exports.Parser = Parser;
