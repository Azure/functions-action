import { expect } from 'chai';
import { Orchestrator } from '../../src/managers/orchestrator';
import { StateConstant } from '../../src/constants/state';
import { IOrchestratable } from '../../src/interfaces/IOrchestratable';
import { IActionParameters } from '../../src/interfaces/IActionParameters';
import { IActionContext } from '../../src/interfaces/IActionContext';
import { SSL_OP_CRYPTOPRO_TLSEXT_BUG } from 'constants';

describe('orchestrator', function () {
  let _orc: Orchestrator;
  beforeEach(function() {
    _orc = new Orchestrator();
  });

  it('should be constructed in an initial state', function() {
    expect(_orc.state).equal(StateConstant.Initialize);
  });

  it('should not be in done mode in initial state', function() {
    expect(_orc.isDone).to.be.false;
  })

  it('should not have any handlers in the state', function() {
    // @ts-ignore
    const handlers: { [state: string]: IOrchestratable } = _orc._handlers;
    expect(handlers).to.be.empty;
  });

  it('should allow handler registration', function() {
    const customHandler: IOrchestratable = {
      invoke: async (_0: StateConstant, _1: IActionParameters, _2: IActionContext): Promise<StateConstant> => {
        return StateConstant.Succeeded;
      }
    }
    _orc.register(StateConstant.Initialize, customHandler);
    // @ts-ignore
    const handlers: { [state: string]: IOrchestratable } = _orc._handlers;
    expect(handlers).to.not.be.empty;
  });

  it('should switch state when handler is triggered', async function() {
    const customHandler: IOrchestratable = {
      invoke: async (_0: StateConstant, _1: IActionParameters, _2: IActionContext): Promise<StateConstant> => {
        return StateConstant.Succeeded;
      }
    }
    _orc.register(StateConstant.Initialize, customHandler);
    await _orc.execute();
    expect(_orc.state).equal(StateConstant.Succeeded);
  });

  it('should execute changeParams if defined', async function() {
    const customHandler: IOrchestratable = {
      invoke: async (_0: StateConstant, _1: IActionParameters, _2: IActionContext): Promise<StateConstant> => {
        return StateConstant.Succeeded;
      },
      changeParams: async (_0: StateConstant, params: IActionParameters, _2: IActionContext): Promise<IActionParameters> => {
        params.appName = 'new-appname'
        return params;
      }
    }
    _orc.register(StateConstant.Initialize, customHandler);
    await _orc.execute();
    // @ts-ignore
    const params: IActionParameters = _orc._params;
    expect(params.appName).equal('new-appname');
  });

  it('should execute changeContext if defined', async function() {
    const customHandler: IOrchestratable = {
      invoke: async (_0: StateConstant, _1: IActionParameters, _2: IActionContext): Promise<StateConstant> => {
        return StateConstant.Succeeded;
      },
      changeContext: async (_0: StateConstant, _1: IActionParameters, context: IActionContext): Promise<IActionContext> => {
        context.appUrl = 'https://anything.azurewebsites.net'
        return context;
      }
    }
    _orc.register(StateConstant.Initialize, customHandler);
    await _orc.execute();
    // @ts-ignore
    const context: IActionContext = _orc._context;
    expect(context.appUrl).equal('https://anything.azurewebsites.net');
  });

  it('should be marked as done on success', async function() {
    const customHandler: IOrchestratable = {
      invoke: async (_0: StateConstant, _1: IActionParameters, _2: IActionContext): Promise<StateConstant> => {
        return StateConstant.Succeeded;
      }
    }
    _orc.register(StateConstant.Initialize, customHandler);
    await _orc.execute();
    expect(_orc.isDone).to.be.true;
  });

  it('should be marked as done on failure', async function() {
    const customHandler: IOrchestratable = {
      invoke: async (_0: StateConstant, _1: IActionParameters, _2: IActionContext): Promise<StateConstant> => {
        return StateConstant.Failed;
      }
    }
    _orc.register(StateConstant.Initialize, customHandler);
    await _orc.execute();
    expect(_orc.isDone).to.be.true;
  });
});