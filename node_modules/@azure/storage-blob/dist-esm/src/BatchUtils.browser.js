import * as tslib_1 from "tslib";
import { blobToString } from "./utils/utils.browser";
export function getBodyAsText(batchResponse) {
    return tslib_1.__awaiter(this, void 0, void 0, function () {
        var blob;
        return tslib_1.__generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, batchResponse.blobBody];
                case 1:
                    blob = (_a.sent());
                    return [4 /*yield*/, blobToString(blob)];
                case 2: return [2 /*return*/, _a.sent()];
            }
        });
    });
}
export function utf8ByteLength(str) {
    return new Blob([str]).size;
}
//# sourceMappingURL=BatchUtils.browser.js.map