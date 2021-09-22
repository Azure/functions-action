"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.FuncIgnore = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const glob = require("glob");
const rimraf = require("rimraf");
const ignore = require("ignore");
const logger_1 = require("./logger");
class FuncIgnore {
    static doesFuncignoreExist(working_dir) {
        const funcignorePath = (0, path_1.resolve)(working_dir, '.funcignore');
        return (0, fs_1.existsSync)(funcignorePath);
    }
    static readFuncignore(working_dir) {
        const funcignorePath = (0, path_1.resolve)(working_dir, '.funcignore');
        const rules = (0, fs_1.readFileSync)(funcignorePath).toString().split('\n').filter(l => l.trim() !== '');
        try {
            // @ts-ignore
            return ignore().add(rules);
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
            const filename = name.replace(`${sanitizedWorkingDir}/`, '');
            if (ignoreParser.ignores(filename)) {
                try {
                    rimraf.sync(name, { maxBusyTries: 1 });
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
