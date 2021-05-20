import { UnexpectedConversion } from '../exceptions';

export enum FunctionRuntimeConstant {
    None = 1, // V1 function app does not have FUNCTIONS_WORKER_RUNTIME
    Dotnet,
    DotnetIsolated,
    Node,
    Powershell,
    Java,
    Python,
    Custom
}

export class FunctionRuntimeUtil {
    public static FromString(language: string) : FunctionRuntimeConstant {
        if (language === undefined) {
            return FunctionRuntimeConstant.None;
        }

        let key: string = "";
        language.split('-').forEach(element => {
            key += element.charAt(0).toUpperCase() + element.toLowerCase().slice(1);
        });
        const result: FunctionRuntimeConstant = FunctionRuntimeConstant[key as keyof typeof FunctionRuntimeConstant];
        if (result === undefined) {
            throw new UnexpectedConversion('FunctionRuntimeConstant', language);
        }
        return result;
    }
}
