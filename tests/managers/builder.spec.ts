import { expect } from 'chai';
import { Builder } from '../../src/managers/builder';

describe('builder', function () {
  it('should build a default scm credentials', function() {
    const creds = Builder.GetDefaultScmCredential();
    expect(creds.appUrl).to.be.undefined;
    expect(creds.password).to.be.undefined;
    expect(creds.uri).to.be.undefined;
    expect(creds.username).to.be.undefined;
  });

  it('should build a default action parameters', function () {
    const param = Builder.GetDefaultActionParameters();
    expect(param.appName).to.be.undefined;
    expect(param.packagePath).to.be.undefined;
    expect(param.publishProfile).to.be.undefined;
    expect(param.slot).to.be.undefined;
    expect(param.respectPomXml).to.be.false;
  });

  it('should build a default action context', function() {
    const context = Builder.GetDefaultActionContext();
    expect(context.azureHttpUserAgent).to.be.undefined;
    expect(context.azureHttpUserAgentPrefix).to.be.undefined;
    expect(context.isLinux).to.be.undefined;
    expect(context.kind).to.be.undefined;
    expect(context.resourceGroupName).to.be.undefined;
    expect(context.appService).to.be.undefined;
    expect(context.appServiceUtil).to.be.undefined;
    expect(context.endpoint).to.be.undefined;
    expect(context.kuduService).to.be.undefined;
    expect(context.kuduServiceUtil).to.be.undefined;
    expect(context.package).to.be.undefined;
    expect(context.packageType).to.be.undefined;
    expect(context.publishContentPath).to.be.undefined;
    expect(context.publishMethod).to.be.undefined;
    expect(context.appSettings).to.be.undefined;
    expect(context.language).to.be.undefined;
    expect(context.os).to.be.undefined;
    expect(context.sku).to.be.undefined;
    expect(context.appUrl).to.be.undefined;
    expect(context.scmCredentials).to.be.undefined;
    expect(context.authenticationType).to.be.undefined;
  });
});