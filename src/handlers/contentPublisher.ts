import { IOrchestratable } from "../interfaces/IOrchestratable";
import { StateConstant } from "../constants/state";
import { IActionParameters } from "../interfaces/IActionParameters";
import { IActionContext } from "../interfaces/IActionContext";
import { PublishMethodConstant } from "../constants/publish_method";
import { ValidationError } from "../exceptions";
import { ZipDeploy, WebsiteRunFromPackageDeploy } from "../publishers";

export class ContentPublisher implements IOrchestratable {

    public async invoke(state: StateConstant, _1: IActionParameters, context: IActionContext): Promise<StateConstant> {
        switch (context.publishMethod) {
            case PublishMethodConstant.ZipDeploy:
                await ZipDeploy.execute(state, context);
                break;
            case PublishMethodConstant.WebsiteRunFromPackageDeploy:
                await WebsiteRunFromPackageDeploy.execute(state, context);
                break;
            default:
                throw new ValidationError(state, "publisher", "can only performs ZipDeploy and WebsiteRunFromPackageDeploy");
        }
        return StateConstant.ValidatePublishedContent;
    }
}