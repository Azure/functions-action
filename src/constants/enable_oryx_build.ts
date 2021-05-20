import { UnexpectedConversion } from "../exceptions";
import { Parser } from "../utils/parser";

export enum EnableOryxBuildConstant {
    NotSet = 0,
    Enabled = 1,
    Disabled = 2
}

export class EnableOryxBuildUtil {
    public static FromString(setting: string) : EnableOryxBuildConstant {
        if (setting.trim() === '') {
            return EnableOryxBuildConstant.NotSet;
        }

        if (Parser.IsTrueLike(setting)) {
            return EnableOryxBuildConstant.Enabled;
        }

        if (Parser.IsFalseLike(setting)) {
            return EnableOryxBuildConstant.Disabled;
        }

        throw new UnexpectedConversion("EnableOryxBuild", setting);
    }

    public static ToString(setting: EnableOryxBuildConstant): string {
        if (setting === EnableOryxBuildConstant.Enabled) {
            return 'true';
        }

        if (setting === EnableOryxBuildConstant.Disabled) {
            return 'false';
        }

        return undefined;
    }
}
