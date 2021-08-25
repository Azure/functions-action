"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const exceptions_1 = require("../exceptions");
class Parser {
    static GetAzureWebjobsStorage(azureWebjobsStorage) {
        const result = {};
        azureWebjobsStorage.trim().split(';').forEach(entry => {
            if (!entry) {
                return; // Last ';' delimeter
            }
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
        if (!value || !value.trim()) {
            return false;
        }
        return ["1", "true", "t", "yes", "y"].includes(value.trim().toLowerCase());
    }
    static IsFalseLike(value) {
        if (!value || !value.trim()) {
            return false;
        }
        return ["0", "false", "f", "no", "n"].includes(value.trim().toLowerCase());
    }
}
exports.Parser = Parser;
