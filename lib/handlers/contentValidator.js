"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const state_1 = require("../constants/state");
const configuration_1 = require("../constants/configuration");
class ContentValidator {
    invoke(_0, _1, context) {
        return __awaiter(this, void 0, void 0, function* () {
            const url = yield context.appServiceUtil.getApplicationURL();
            core.setOutput(configuration_1.ConfigurationConstant.ParamOutResultName, url);
            return state_1.StateConstant.Succeed;
        });
    }
}
exports.ContentValidator = ContentValidator;
