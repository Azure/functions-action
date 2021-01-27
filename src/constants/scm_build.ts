import { UnexpectedConversion } from "../exceptions";
import { Parser } from "../utils/parser";

export enum ScmBuildConstant {
    NotSet = 0,
    Enabled = 1,
    Disabled = 2
}

export class ScmBuildUtil {
    public static FromString(setting: string) : ScmBuildConstant {
        if (setting.trim() === '') {
            return ScmBuildConstant.NotSet;
        }

        if (Parser.IsTrueLike(setting)) {
            return ScmBuildConstant.Enabled;
        }

        if (Parser.IsFalseLike(setting)) {
            return ScmBuildConstant.Disabled;
        }

        throw new UnexpectedConversion("ScmDoBuildDuringDeployment", setting);
    }

    public static ToString(setting: ScmBuildConstant): string {
        if (setting === ScmBuildConstant.Enabled) {
            return 'true';
        }

        if (setting === ScmBuildConstant.Disabled) {
            return 'false';
        }

        return undefined;
    }
}
