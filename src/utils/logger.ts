import * as core from "@actions/core";
import { BaseException, InvocationException } from "../exceptions";
import { IPrinter } from "../interfaces/IPrinter";
import { IActionParameters } from "../interfaces/IActionParameters";
import { IActionContext } from "../interfaces/IActionContext";
import { StateConstant } from "../constants/state";
import { LogLevelConstant } from "../constants/log_level";
import { Parser } from "./parser";

export class Logger {
    public static DefaultLogLevel = LogLevelConstant.Debug;
    private static LogLevel = Logger.DefaultLogLevel;

    public static SetLevel(newLevel: LogLevelConstant) {
        Logger.LogLevel = newLevel;
    }

    public static Debug(message: string, debugPrinter: IPrinter = core.debug) {
        if (Logger.LogLevel <= LogLevelConstant.Debug &&
            Parser.IsTrueLike(process.env.GITHUB_ACTION_DEBUG)) {
                debugPrinter(message);
        }
    }

    public static Info(message: string, infoPrinter: IPrinter = core.info) {
        if (Logger.LogLevel <= LogLevelConstant.Info) {
            infoPrinter(message);
        }
    }

    public static Warn(message: string, warnPrinter: IPrinter = core.warning) {
        if (Logger.LogLevel <= LogLevelConstant.Warning) {
            warnPrinter(message);
        }
    }

    public static Error(message: string, errorPrinter: IPrinter = core.error) {
        if (Logger.LogLevel <= LogLevelConstant.Error) {
            errorPrinter(message);
        }
    }

    public static PrintTraceback(
        be: BaseException,
        printer: IPrinter = Logger.Error
    ): void {
        be.PrintTraceback(printer);
    }

    public static PrintCurrentState(
        state: StateConstant,
        printer: IPrinter = Logger.Debug
    ): void {
        printer(`##[${StateConstant[state]}]`);
    }

    public static PrintStateParameters(
        state: StateConstant,
        params: IActionParameters,
        printer: IPrinter = Logger.Debug
    ): void {
        printer(`[${StateConstant[state]}] params`);
        for (let key in params) {
            printer(`  ${key} = ${params[key as keyof IActionParameters]}`);
        }
    }

    public static PrintStateContext(
        state: StateConstant,
        context: IActionContext,
        printer: IPrinter = Logger.Debug
    ): void {
        printer(`[${StateConstant[state]}] context`);
        for (let key in context) {
            printer(`  ${key} = ${context[key as keyof IActionContext]}`);
        }
    }
}