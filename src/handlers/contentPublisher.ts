import { IOrchestratable } from "../interfaces/IOrchestratable";
import { StateConstant } from "../constants/state";
import { IActionParameters } from "../interfaces/IActionParameters";
import { IActionContext } from "../interfaces/IActionContext";
import { PublishMethodConstant } from "../constants/publish_method";
import { ValidationError } from "../exceptions";
import { ZipDeploy, WebsiteRunFromPackageDeploy } from "../publishers";

export class ContentPublisher implements IOrchestratable {
    private _deploymentId: string;

    public async invoke(state: StateConstant, _1: IActionParameters, context: IActionContext): Promise<StateConstant> {
        switch (context.publishMethod) {
            case PublishMethodConstant.ZipDeploy:
                this._deploymentId = await ZipDeploy.execute(state, context);
                break;
            case PublishMethodConstant.WebsiteRunFromPackageDeploy:
                await WebsiteRunFromPackageDeploy.execute(state, context);
                break;
            default:
                throw new ValidationError(state, "publisher", "can only performs ZipDeploy and WebsiteRunFromPackageDeploy");
        }
        return StateConstant.ValidatePublishedContent;
    }

    public async changeContext(_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<IActionContext> {
        context.deploymentId = this._deploymentId;
        return context;
    }
}