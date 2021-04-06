import { IOrchestratable } from "../interfaces/IOrchestratable";
import { StateConstant } from "../constants/state";
import { IActionParameters } from "../interfaces/IActionParameters";
import { IActionContext } from "../interfaces/IActionContext";
import { PublishMethodConstant } from "../constants/publish_method";
import { ValidationError } from "../exceptions";
import { ZipDeploy, WebsiteRunFromPackageDeploy } from "../publishers";

export class ContentPublisher implements IOrchestratable {

    public async invoke(state: StateConstant, params: IActionParameters, context: IActionContext): Promise<StateConstant> {
        switch (context.publishMethod) {
            case PublishMethodConstant.ZipDeploy:
                await ZipDeploy.execute(state, context, params.enableOryxBuild, params.scmDoBuildDuringDeployment);
                break;
            case PublishMethodConstant.WebsiteRunFromPackageDeploy:
                await WebsiteRunFromPackageDeploy.execute(state, context);
                break;
            default:
                throw new ValidationError(state, "publisher", "can only performs ZipDeploy or WebsiteRunFromPackageDeploy");
        }
        return StateConstant.ValidatePublishedContent;
    }
}