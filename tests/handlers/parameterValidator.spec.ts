import { expect } from 'chai';
import { StateConstant } from '../../src/constants/state';
import { ParameterValidator } from '../../src/handlers/parameterValidator';
import { IScmCredentials } from '../../src/interfaces/IScmCredentials';

describe('parameterValidator', function () {
  it('should parse scm credentials in old format publishProfile', async function () {
    const validator = new ParameterValidator();
    const parseScmCredentials: (state: StateConstant, publishProfile: string) => Promise<IScmCredentials> = (
      // @ts-ignore
      validator.parseScmCredentials
    );
    const publishProfile: string = `
<publishData>
  <publishProfile profileName="hazeng-fa-python38-azurecli - Web Deploy" publishMethod="MSDeploy" publishUrl="hazeng-fa-python38-azurecli.scm.azurewebsites.net:443" msdeploySite="hazeng-fa-python38-azurecli" userName="$hazeng-fa-python38-azurecli" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="hazeng-fa-python38-azurecli - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="hazeng-fa-python38-azurecli\$hazeng-fa-python38-azurecli" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="hazeng-fa-python38-azurecli - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="hazeng-fa-python38-azurecli\$hazeng-fa-python38-azurecli" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
</publishData>
    `;
    const credentials = await parseScmCredentials(StateConstant.Initialize, publishProfile);
    expect(credentials.appUrl).equal('http://hazeng-fa-python38-azurecli.azurewebsites.net');
    expect(credentials.username).equal('$hazeng-fa-python38-azurecli');
    expect(credentials.password).equal('password');
    expect(credentials.uri).equal('https://$hazeng-fa-python38-azurecli:password@hazeng-fa-python38-azurecli.scm.azurewebsites.net');
  });

  it('should parse scm credentials in old format publishProfile with slot setting', async function () {
    const validator = new ParameterValidator();
    const parseScmCredentials: (state: StateConstant, publishProfile: string) => Promise<IScmCredentials> = (
      // @ts-ignore
      validator.parseScmCredentials
    );
    const publishProfile: string = `
<publishData>
  <publishProfile profileName="hazeng-fa-python38-azurecli-weirdslot - Web Deploy" publishMethod="MSDeploy" publishUrl="hazeng-fa-python38-azurecli-weirdslot.scm.azurewebsites.net:443" msdeploySite="hazeng-fa-python38-azurecli__weirdslot" userName="$hazeng-fa-python38-azurecli__weirdslot" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli-weirdslot.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="hazeng-fa-python38-azurecli-weirdslot - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="hazeng-fa-python38-azurecli__weirdslot\$hazeng-fa-python38-azurecli__weirdslot" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli-weirdslot.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="hazeng-fa-python38-azurecli-weirdslot - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="hazeng-fa-python38-azurecli__weirdslot\$hazeng-fa-python38-azurecli__weirdslot" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli-weirdslot.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
</publishData>
    `;
    const credentials = await parseScmCredentials(StateConstant.Initialize, publishProfile);
    expect(credentials.appUrl).equal('http://hazeng-fa-python38-azurecli-weirdslot.azurewebsites.net');
    expect(credentials.username).equal('$hazeng-fa-python38-azurecli__weirdslot');
    expect(credentials.password).equal('password');
    expect(credentials.uri).equal('https://$hazeng-fa-python38-azurecli__weirdslot:password@hazeng-fa-python38-azurecli-weirdslot.scm.azurewebsites.net');
  });

  it('should parse scm credentials in new format publishProfile', async function() {
    const validator = new ParameterValidator();
    const parseScmCredentials: (state: StateConstant, publishProfile: string) => Promise<IScmCredentials> = (
      // @ts-ignore
      validator.parseScmCredentials
    );
    const publishProfile: string = `
<publishData>
  <publishProfile profileName="hazeng-fa-python38-azurecli - Web Deploy" publishMethod="MSDeploy" publishUrl="waws-prod-mwh-007.publish.azurewebsites.windows.net:443" msdeploySite="hazeng-fa-python38-azurecli" userName="$hazeng-fa-python38-azurecli" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="hazeng-fa-python38-azurecli - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="hazeng-fa-python38-azurecli\$hazeng-fa-python38-azurecli" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="hazeng-fa-python38-azurecli - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="hazeng-fa-python38-azurecli\$hazeng-fa-python38-azurecli" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
</publishData>
    `;
    const credentials = await parseScmCredentials(StateConstant.Initialize, publishProfile);
    expect(credentials.appUrl).equal('http://hazeng-fa-python38-azurecli.azurewebsites.net');
    expect(credentials.username).equal('$hazeng-fa-python38-azurecli');
    expect(credentials.password).equal('password');
    expect(credentials.uri).equal('https://$hazeng-fa-python38-azurecli:password@hazeng-fa-python38-azurecli.scm.azurewebsites.net');
  });

  it('should parse scm credentials in new format publishProfile with slot setting', async function () {
    const validator = new ParameterValidator();
    const parseScmCredentials: (state: StateConstant, publishProfile: string) => Promise<IScmCredentials> = (
      // @ts-ignore
      validator.parseScmCredentials
    );
    const publishProfile: string = `
<publishData>
  <publishProfile profileName="hazeng-fa-python38-azurecli-weirdslot - Web Deploy" publishMethod="MSDeploy" publishUrl="waws-prod-mwh-007.publish.azurewebsites.windows.net:443" msdeploySite="hazeng-fa-python38-azurecli__weirdslot" userName="$hazeng-fa-python38-azurecli__weirdslot" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli-weirdslot.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="hazeng-fa-python38-azurecli-weirdslot - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="hazeng-fa-python38-azurecli__weirdslot\$hazeng-fa-python38-azurecli__weirdslot" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli-weirdslot.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
  <publishProfile profileName="hazeng-fa-python38-azurecli-weirdslot - ReadOnly - FTP" publishMethod="FTP" publishUrl="ftp://waws-prod-mwh-007dr.ftp.azurewebsites.windows.net/site/wwwroot" ftpPassiveMode="True" userName="hazeng-fa-python38-azurecli__weirdslot\$hazeng-fa-python38-azurecli__weirdslot" userPWD="password" destinationAppUrl="http://hazeng-fa-python38-azurecli-weirdslot.azurewebsites.net" SQLServerDBConnectionString="" mySQLDBConnectionString="" hostingProviderForumLink="" controlPanelLink="http://windows.azure.com" webSystem="WebSites">
    <databases />
  </publishProfile>
</publishData>
    `;
    const credentials = await parseScmCredentials(StateConstant.Initialize, publishProfile);
    expect(credentials.appUrl).equal('http://hazeng-fa-python38-azurecli-weirdslot.azurewebsites.net');
    expect(credentials.username).equal('$hazeng-fa-python38-azurecli__weirdslot');
    expect(credentials.password).equal('password');
    expect(credentials.uri).equal('https://$hazeng-fa-python38-azurecli__weirdslot:password@hazeng-fa-python38-azurecli-weirdslot.scm.azurewebsites.net');
  });
});