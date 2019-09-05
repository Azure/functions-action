import { StateConstant } from '../constants/state';
import { IActionContext } from '../interfaces/IActionContext';
import { IActionParameters } from '../interfaces/IActionParameters';
import { IOrchestratable } from '../interfaces/IOrchestratable';
import {
    NotImplementedException,
    InvocationException,
    ChangeParamsException,
    ChangeContextException
} from '../exceptions';
import { Logger } from '../utils/logger';
import { Builder } from './builder';

export class Orchestrator {
    private _state : StateConstant;
    private _handlers: { [state: string]: IOrchestratable };
    private _params: IActionParameters;
    private _context: IActionContext;

    constructor() {
        this._state = StateConstant.Initialize;
        this._handlers = {};
        this._params = Builder.GetDefaultActionParameters();
        this._context = Builder.GetDefaultActionContext();
    }

    public register(stateName: StateConstant, handler: IOrchestratable): void {
        this._handlers[stateName] = handler;
    }

    public async execute(): Promise<void> {
        if (this._state === undefined || this._handlers[this._state] === undefined) {
            throw new NotImplementedException(`${StateConstant[this._state]} is not implemented`);
        }

        if (this.isDone) {
            return;
        }

        Logger.PrintCurrentState(this._state);
        Logger.PrintStateParameters(this._state, this._params);
        Logger.PrintStateContext(this._state, this._context);

        const handler: IOrchestratable = this._handlers[this._state];
        let nextState: StateConstant = await this.executeInvocation(handler);
        this._params = await this.executeChangeParams(handler);
        this._context = await this.executeChangeContext(handler);
        this._state = nextState;
    }

    private async executeInvocation(handler: IOrchestratable): Promise<StateConstant> {
        if (handler.invoke === undefined) {
            throw new NotImplementedException(`Handler ${StateConstant[this._state]} has not implemented invoke()`);
        }

        try {
            const readonlyParams: IActionParameters = { ...this._params };
            const readonlyContext: IActionContext = { ...this._context };
            return await handler.invoke(this._state, readonlyParams, readonlyContext);
        } catch (expt) {
            const errorState = this._state;
            this._state = StateConstant.Failed;
            throw new InvocationException(errorState, expt);
        }
    }

    private async executeChangeParams(handler: IOrchestratable): Promise<IActionParameters> {
        if (handler.changeParams !== undefined) {
            try {
                const readonlyParams: IActionParameters = { ...this._params };
                const readonlyContext: IActionContext = { ...this._context };
                return await handler.changeParams(this._state, readonlyParams, readonlyContext);
            } catch (expt) {
                const errorState = this._state;
                this._state = StateConstant.Failed;
                throw new ChangeParamsException(errorState, expt);
            }
        } else {
            return this._params;
        }
    }

    private async executeChangeContext(handler: IOrchestratable): Promise<IActionContext> {
        if (handler.changeContext !== undefined) {
            try {
                const readonlyParams: IActionParameters = { ...this._params };
                const readonlyContext: IActionContext = { ...this._context };
                return await handler.changeContext(this._state, readonlyParams, readonlyContext);
            } catch (expt) {
                const errorState = this._state;
                this._state = StateConstant.Failed;
                throw new ChangeContextException(errorState, expt);
            }
        } else {
            return this._context;
        }
    }

    public get isDone(): boolean {
        return this._state === StateConstant.Succeeded || this._state === StateConstant.Failed;
    }

    public get state(): StateConstant {
        return this._state;
    }
}