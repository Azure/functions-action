import { expect, assert } from 'chai';
import { resolve } from 'path';
import { StateConstant } from '../../src/constants/state';
import { ParameterValidator } from '../../src/handlers/parameterValidator';
import { IScmCredentials } from '../../src/interfaces/IScmCredentials';
import { Builder } from '../../src/managers/builder';

describe('Check ParameterValidator', function () {
  let _rootPath: string;

  beforeEach(() => {
    _rootPath = resolve(__dirname, '..', '..');
  });

  it('should throw exception when app-name is not set', function () {
    const validator = new ParameterValidator();
    // @ts-ignore
    validator._packagePath = `${_rootPath}/tests/samples/NetCoreApp.zip`;
    assert.throw(
      // @ts-ignore
      () => validator.validateFields(StateConstant.ValidateParameter),
      "At ValidateParameter, app-name : should not be empty."
    );
  });

  it('should throw exception when package is not set', function() {
    const validator = new ParameterValidator();
    // @ts-ignore
    validator._appName = 'sample-app';
    assert.throw(
      // @ts-ignore
      () => validator.validateFields(StateConstant.ValidateParameter),
      "At ValidateParameter, package : should not be empty."
    );
  });

  it('should throw exception when package is not valid', function() {
    const validator = new ParameterValidator();
    // @ts-ignore
    validator._appName = 'sample-app';
    // @ts-ignore
    validator._packagePath = `${_rootPath}/tests/samples/NotFound.zip`;
    assert.throw(
      // @ts-ignore
      () => validator.validateFields(StateConstant.ValidateParameter),
      `At ValidateParameter, package : cannot find '${_rootPath}/tests/samples/NotFound.zip'`
    );
  });

  it('should be satisfied when app-name and package are provided', function() {
    const validator = new ParameterValidator();
    // @ts-ignore
    validator._appName = 'sample-app';
    // @ts-ignore
    validator._packagePath = `${_rootPath}/tests/samples/NetCoreApp.zip`;
    assert.doesNotThrow(
      // @ts-ignore
      () => validator.validateFields(StateConstant.ValidateParameter)
    )
  });

  it('should throw slot not found error if scm credential does not match', function () {
    const scmCredential: IScmCredentials = {
      appUrl: 'http://sample-app.azurewebsites.net',
      username: '$sample-app',
      password: 'password',
      uri: 'https://$sample-app:password@sample-app.scm.azurewebsites.net'
    };
    const validator = new ParameterValidator();
    // @ts-ignore
    validator._appName = 'sample-app';
    // @ts-ignore
    validator._scmCredentials = scmCredential;
    // @ts-ignore
    validator._slot = 'cannot-be-matched';
    assert.throw(
      // @ts-ignore
      () => validator.validateScmCredentialsSlotName(StateConstant.ValidateParameter),
      'At ValidateParameter, slot-name : SCM credential does not match slot-name'
    );
  });

  it('should allow production slot to use default scm credential', function () {
    const scmCredential: IScmCredentials = {
      appUrl: 'http://sample-app.azurewebsites.net',
      username: '$sample-app',
      password: 'password',
      uri: 'https://$sample-app:password@sample-app.scm.azurewebsites.net'
    };
    const validator = new ParameterValidator();
    // @ts-ignore
    validator._appName = 'sample-app';
    // @ts-ignore
    validator._scmCredentials = scmCredential;
    // @ts-ignore
    validator._slot = 'production';
    assert.doesNotThrow(
      // @ts-ignore
      () => validator.validateScmCredentialsSlotName(StateConstant.ValidateParameter)
    );
  });

  it('should allow named slot to use scm slot credential', function () {
    const scmCredential: IScmCredentials = {
      appUrl: 'http://sample-app-stage.azurewebsites.net',
      username: '$sample-app-stage',
      password: 'password',
      uri: 'https://$sample-app-stage:password@sample-app-stage.scm.azurewebsites.net'
    };
    const validator = new ParameterValidator();
    // @ts-ignore
    validator._appName = 'sample-app';
    // @ts-ignore
    validator._scmCredentials = scmCredential;
    // @ts-ignore
    validator._slot = 'stage';
    assert.doesNotThrow(
      // @ts-ignore
      () => validator.validateScmCredentialsSlotName(StateConstant.ValidateParameter)
    );
  });

  it('should allow named slot to use scm slot credential different casing', function () {
    const scmCredential: IScmCredentials = {
      appUrl: 'http://sample-app-stage.azurewebsites.net',
      username: '$sample-app-stage',
      password: 'password',
      uri: 'https://$sample-app-stage:password@sample-app-stage.scm.azurewebsites.net'
    };
    const validator = new ParameterValidator();
    // @ts-ignore
    validator._appName = 'sample-app';
    // @ts-ignore
    validator._scmCredentials = scmCredential;
    // @ts-ignore
    validator._slot = 'STAGE';
    assert.doesNotThrow(
      // @ts-ignore
      () => validator.validateScmCredentialsSlotName(StateConstant.ValidateParameter)
    );
  });

  it('should not throw a validation error if the default scm credential is used during slot deployment', function () {
    const scmCredential = Builder.GetDefaultScmCredential();
    const validator = new ParameterValidator();
    // @ts-ignore
    validator._appName = 'sample-app';
    // @ts-ignore
    validator._scmCredentials = scmCredential;
    // @ts-ignore
    validator._slot = 'STAGE';
    assert.doesNotThrow(
      // @ts-ignore
      () => validator.validateScmCredentialsSlotName(StateConstant.ValidateParameter)
    );
  });

  it('should throw error if publishProfile is not a valid XML', async function () {
    const validator = new ParameterValidator();
    const publishProfile: string = '<not/a/valid/xml>';
    try {
      // @ts-ignore
      await validator.parseScmCredentials(StateConstant.ValidateParameter, publishProfile);
    } catch (e) {
      expect(e.message).to.equal(
        'At ValidateParameter, publish-profile : should be a valid XML. ' +
        'Please ensure your publish-profile secret is set in your GitHub repository by heading to ' +
        'GitHub repo -> Settings -> Secrets -> Repository secrets.'
      );
    }
  });

  it('should throw error if MSDeploy section does not exist in publishProfile', async function () {
    const validator = new ParameterValidator();
    const publishProfile: string = `
<publishData>
  <publishProfile profileName="sample-app - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="sample-app\$sample-app" userPWD="password" destinationAppUrl="http://sample-app.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="sample-app - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="sample-app\$sample-app" userPWD="password" destinationAppUrl="http://sample-app.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
</publishData>
    `;
    try {
      // @ts-ignore
      await validator.parseScmCredentials(StateConstant.ValidateParameter, publishProfile);
    } catch (e) {
      expect(e.message).to.equal(
        "At ValidateParameter, publish-profile : should contain valid SCM credentials. " +
        "Please ensure your publish-profile contains 'MSDeploy' publish method. " +
        "Ensure 'userName', 'userPWD', and 'publishUrl' exist in the section. " +
        "You can always acquire the latest publish-profile from portal -> function app resource -> overview -> get publish profile."
      );
    }
  });

  it('should parse scm credentials in old format publishProfile', async function () {
    const validator = new ParameterValidator();
    const publishProfile: string = `
<publishData>
  <publishProfile profileName="sample-app - Web Deploy" publishMethod="MSDeploy" publishUrl="sample-app.scm.azurewebsites.net:443" msdeploySite="sample-app" userName="$sample-app" userPWD="password" destinationAppUrl="http://sample-app.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="sample-app - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="sample-app\$sample-app" userPWD="password" destinationAppUrl="http://sample-app.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="sample-app - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="sample-app\$sample-app" userPWD="password" destinationAppUrl="http://sample-app.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
</publishData>
    `;
    // @ts-ignore
    const credentials = await validator.parseScmCredentials(StateConstant.Initialize, publishProfile);
    expect(credentials.appUrl).equal('http://sample-app.azurewebsites.net');
    expect(credentials.username).equal('$sample-app');
    expect(credentials.password).equal('password');
    expect(credentials.uri).equal('https://$sample-app:password@sample-app.scm.azurewebsites.net');
  });

  it('should parse scm credentials in old format publishProfile with slot setting', async function () {
    const validator = new ParameterValidator();
    const publishProfile: string = `
<publishData>
  <publishProfile profileName="sample-app-stage - Web Deploy" publishMethod="MSDeploy" publishUrl="sample-app-stage.scm.azurewebsites.net:443" msdeploySite="sample-app__stage" userName="$sample-app__stage" userPWD="password" destinationAppUrl="http://sample-app-stage.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="sample-app-stage - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="sample-app__stage\$sample-app__stage" userPWD="password" destinationAppUrl="http://sample-app-stage.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="sample-app-stage - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="sample-app__stage\$sample-app__stage" userPWD="password" destinationAppUrl="http://sample-app-stage.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
</publishData>
    `;
    // @ts-ignore
    const credentials = await validator.parseScmCredentials(StateConstant.Initialize, publishProfile);
    expect(credentials.appUrl).equal('http://sample-app-stage.azurewebsites.net');
    expect(credentials.username).equal('$sample-app__stage');
    expect(credentials.password).equal('password');
    expect(credentials.uri).equal('https://$sample-app__stage:password@sample-app-stage.scm.azurewebsites.net');
  });

  it('should parse scm credentials in new format publishProfile', async function() {
    const validator = new ParameterValidator();
    const publishProfile: string = `
<publishData>
  <publishProfile profileName="sample-app - Web Deploy" publishMethod="MSDeploy" publishUrl="waws-prod-mwh-007.publish.azurewebsites.windows.net:443" msdeploySite="sample-app" userName="$sample-app" userPWD="password" destinationAppUrl="http://sample-app.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="sample-app - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="sample-app\$sample-app" userPWD="password" destinationAppUrl="http://sample-app.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="sample-app - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="sample-app\$sample-app" userPWD="password" destinationAppUrl="http://sample-app.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
</publishData>
    `;
    // @ts-ignore
    const credentials = await validator.parseScmCredentials(StateConstant.Initialize, publishProfile);
    expect(credentials.appUrl).equal('http://sample-app.azurewebsites.net');
    expect(credentials.username).equal('$sample-app');
    expect(credentials.password).equal('password');
    expect(credentials.uri).equal('https://$sample-app:password@sample-app.scm.azurewebsites.net');
  });

  it('should parse scm credentials in new format publishProfile with slot setting', async function () {
    const validator = new ParameterValidator();
    const publishProfile: string = `
<publishData>
  <publishProfile profileName="sample-app-stage - Web Deploy" publishMethod="MSDeploy" publishUrl="waws-prod-mwh-007.publish.azurewebsites.windows.net:443" msdeploySite="sample-app__stage" userName="$sample-app__stage" userPWD="password" destinationAppUrl="http://sample-app-stage.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="sample-app-stage - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="sample-app__stage\$sample-app__stage" userPWD="password" destinationAppUrl="http://sample-app-stage.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="sample-app-stage - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="sample-app__stage\$sample-app__stage" userPWD="password" destinationAppUrl="http://sample-app-stage.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
</publishData>
    `;
    // @ts-ignore
    const credentials = await validator.parseScmCredentials(StateConstant.Initialize, publishProfile);
    expect(credentials.appUrl).equal('http://sample-app-stage.azurewebsites.net');
    expect(credentials.username).equal('$sample-app__stage');
    expect(credentials.password).equal('password');
    expect(credentials.uri).equal('https://$sample-app__stage:password@sample-app-stage.scm.azurewebsites.net');
  });
});