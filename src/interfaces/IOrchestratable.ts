import { StateConstant } from '../constants/state';
import { IActionParameters } from './IActionParameters';
import { IActionContext } from './IActionContext';

export interface IOrchestratable {
    invoke: IOrchestratableInvoke;

    // You should only derive a new set a params in here
    changeParams?: IOrchestratableChangeParams;

    // You should only derive a new set of context in here
    changeContext?: IOrchestratableChangeContext;
}

export interface IOrchestratableInvoke {
    (state: StateConstant, params: IActionParameters, context: IActionContext): Promise<StateConstant>;
}

export interface IOrchestratableChangeParams {
    (state: StateConstant, params: IActionParameters, context: IActionContext): Promise<IActionParameters>;
}

export interface IOrchestratableChangeContext {
    (state: StateConstant, params: IActionParameters, context: IActionContext): Promise<IActionContext>;
}