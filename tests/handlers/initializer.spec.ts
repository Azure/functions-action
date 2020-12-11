import { expect, assert } from 'chai';
import { Builder } from '../../src/managers/builder';
import { StateConstant } from '../../src/constants/state';
import { Initializer } from '../../src/handlers/initializer';

describe('Check Initializer', function () {
  const _envBackup = process.env;

  beforeEach(() => {
    process.env = { ..._envBackup };
  });

  afterEach(() => {
    process.env = _envBackup;
  });

  it('should return an empty string if AZURE_HTTP_USER_AGENT is not set', function () {
    const initializer = new Initializer();
    // @ts-ignore
    const prefix = initializer.getUserAgentPrefix();
    expect(prefix).to.equal('');
  });

  it('should return the AZURE_HTTP_USER_AGENT to prefix if set', function () {
    const initializer = new Initializer();
    process.env.AZURE_HTTP_USER_AGENT = 'firefox';
    // @ts-ignore
    const prefix = initializer.getUserAgentPrefix();
    expect(prefix).to.equal('firefox');
  });

  it('should return full agent name if prefix is set', function () {
    const initializer = new Initializer();
    process.env.AZURE_HTTP_USER_AGENT = 'chrome';
    process.env.GITHUB_REPOSITORY = 'repo';
    // @ts-ignore
    const agentName = initializer.getUserAgent();
    expect(agentName).to.equal('chrome+GITHUBACTIONS_DeployFunctionAppToAzure_071ca2227754705837aa3ef9748ed59e9f8a015fd765c42f391a4cbc271c6d5e');
  });

  it('should return agent name without prefix if AZURE_HTTP_USER_AGENT is not set', function () {
    const initializer = new Initializer();
    process.env.GITHUB_REPOSITORY = 'repo';
    // @ts-ignore
    const agentName = initializer.getUserAgent();
    expect(agentName).to.equal('GITHUBACTIONS_DeployFunctionAppToAzure_071ca2227754705837aa3ef9748ed59e9f8a015fd765c42f391a4cbc271c6d5e');
  });

  it('should run invocation', async function () {
    const initializer = new Initializer();
    process.env.AZURE_HTTP_USER_AGENT = 'webkit';
    process.env.GITHUB_REPOSITORY = 'repo';
    // @ts-ignore
    const nextStep = await initializer.invoke();
    expect(nextStep).to.equal(StateConstant.ValidateParameter);
  });

  it('should run changeContext', async function () {
    const initializer = new Initializer();
    const params = Builder.GetDefaultActionParameters();
    const context = Builder.GetDefaultActionContext();
    process.env.AZURE_HTTP_USER_AGENT = 'webkit';
    process.env.GITHUB_REPOSITORY = 'repo';
    // @ts-ignore
    await initializer.changeContext(StateConstant.Initialize, params, context);
    expect(context.azureHttpUserAgentPrefix).to.equal('webkit');
    expect(context.azureHttpUserAgent).to.equal('webkit+GITHUBACTIONS_DeployFunctionAppToAzure_071ca2227754705837aa3ef9748ed59e9f8a015fd765c42f391a4cbc271c6d5e');
  });
});