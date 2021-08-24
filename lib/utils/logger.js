"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logger = void 0;
const core = require("@actions/core");
const state_1 = require("../constants/state");
const log_level_1 = require("../constants/log_level");
const parser_1 = require("./parser");
class Logger {
    static SetLevel(newLevel) {
        Logger.LogLevel = newLevel;
    }
    static Debug(message, debugPrinter = core.debug) {
        if (Logger.LogLevel <= log_level_1.LogLevelConstant.Debug &&
            parser_1.Parser.IsTrueLike(process.env.GITHUB_ACTION_DEBUG)) {
            debugPrinter(message);
        }
    }
    static Info(message, infoPrinter = core.info) {
        if (Logger.LogLevel <= log_level_1.LogLevelConstant.Info) {
            infoPrinter(message);
        }
    }
    static Warn(message, warnPrinter = core.warning) {
        if (Logger.LogLevel <= log_level_1.LogLevelConstant.Warning) {
            warnPrinter(message);
        }
    }
    static Error(message, errorPrinter = core.error) {
        if (Logger.LogLevel <= log_level_1.LogLevelConstant.Error) {
            errorPrinter(message);
        }
    }
    static PrintTraceback(be, printer = Logger.Error) {
        be.PrintTraceback(printer);
    }
    static PrintCurrentState(state, printer = Logger.Debug) {
        printer(`##[${state_1.StateConstant[state]}]`);
    }
    static PrintStateParameters(state, params, printer = Logger.Debug) {
        printer(`[${state_1.StateConstant[state]}] params`);
        for (let key in params) {
            printer(`  ${key} = ${params[key]}`);
        }
    }
    static PrintStateContext(state, context, printer = Logger.Debug) {
        printer(`[${state_1.StateConstant[state]}] context`);
        for (let key in context) {
            printer(`  ${key} = ${context[key]}`);
        }
    }
}
exports.Logger = Logger;
Logger.DefaultLogLevel = log_level_1.LogLevelConstant.Debug;
Logger.LogLevel = Logger.DefaultLogLevel;
