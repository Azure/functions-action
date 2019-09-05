import { KuduServiceUtility } from "pipelines-appservice-lib/lib/RestUtilities/KuduServiceUtility";
import { StateConstant } from "../constants/state";
import { IActionContext } from "../interfaces/IActionContext";
import { AzureResourceError } from "../exceptions";

export class ZipDeploy {
    public static async execute(state: StateConstant, context: IActionContext): Promise<string> {
        const kuduServiceUtility: KuduServiceUtility = context.kuduServiceUtil;
        const filePath: string = context.publishContentPath;
        try {
            return await kuduServiceUtility.deployUsingZipDeploy(filePath);
        } catch (expt) {
            throw new AzureResourceError(state, "zipDeploy", `Failed to use ${filePath} as ZipDeploy content`, expt);
        }
    }
}