"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncIgnore = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const glob = __importStar(require("glob"));
const rimraf = __importStar(require("rimraf"));
const ignore_1 = __importDefault(require("ignore"));
const logger_1 = require("./logger");
const path = require("path");
class FuncIgnore {
    static doesFuncignoreExist(working_dir) {
        const funcignorePath = (0, path_1.resolve)(working_dir, '.funcignore');
        return (0, fs_1.existsSync)(funcignorePath);
    }
    static readFuncignore(working_dir) {
        const funcignorePath = (0, path_1.resolve)(working_dir, '.funcignore');
        const rules = (0, fs_1.readFileSync)(funcignorePath).toString().split('\n').filter(l => l.trim() !== '');
        try {
            return (0, ignore_1.default)().add(rules);
        }
        catch (error) {
            logger_1.Logger.Warn(`Failed to parse .funcignore: ${error}`);
        }
    }
    static removeFilesFromFuncIgnore(working_dir, ignoreParser) {
        if (!ignoreParser) {
            logger_1.Logger.Warn(`The ignore parser is undefined. Nothing will be removed.`);
            return;
        }
        const sanitizedWorkingDir = FuncIgnore.sanitizeWorkingDir(working_dir);
        const allFiles = glob.sync(`${sanitizedWorkingDir}/**/*`, { dot: true });
        allFiles.forEach(name => {
            const filename = path.relative(working_dir, name);
            if (ignoreParser.ignores(filename)) {
                try {
                    rimraf.sync(name);
                }
                catch (error) {
                    logger_1.Logger.Warn(`Failed to remove ${filename} (file defined in .gitignore)`);
                }
            }
        });
    }
    static sanitizeWorkingDir(working_dir) {
        return (0, path_1.normalize)((0, path_1.resolve)(working_dir)).replace(/\\/g, '/');
    }
}
exports.FuncIgnore = FuncIgnore;
