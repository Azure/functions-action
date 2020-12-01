import { ResourceValidator } from "../../src/handlers/resourceValidator";
import { AzureResourceFilterUtility } from "azure-actions-appservice-rest/Utilities/AzureResourceFilterUtility";
import { AuthorizerFactory } from 'azure-actions-webclient/AuthorizerFactory';
import { AzureAppServiceUtility } from 'azure-actions-appservice-rest/Utilities/AzureAppServiceUtility';
import { AzureAppService } from 'azure-actions-appservice-rest/Arm/azure-app-service';
import { StateConstant } from '../../src/constants/state';
import { AuthenticationType } from '../../src/constants/authentication_type';


describe('Test getResourceDetails', () => {
    const params: any = {
        appName : 'MOCK_APP_NAME',
        slot : 'MOCK_SLOT'
    }

    afterEach(() => {
        jest.restoreAllMocks();
    });

    beforeEach(() => {
        jest.spyOn(AuthorizerFactory,'getAuthorizer').mockImplementation(async(): Promise<any> => {return {}});
        jest.spyOn(AzureAppServiceUtility.prototype, 'getKuduService').mockImplementation(async(): Promise<any> => {return {}});
        jest.spyOn(AzureAppServiceUtility.prototype, 'getApplicationURL').mockImplementation(async(): Promise<any> => {return {}});
        jest.spyOn(AzureAppService.prototype, 'get').mockImplementation(async(): Promise<any> => {return {
            properties:''
        }});
        jest.spyOn(AzureAppService.prototype, 'getApplicationSettings').mockImplementation(async(): Promise<any> => {return {
            properties:{
                AzureWebJobsStorage:'MOCK_STORAGE'
            }
        }});
    });


    it("Test Get Resource Details for Linux/Kubeapp with SPN auth flow", async () => {
        var context: any = {
            authenticationType : AuthenticationType.Rbac
        }
        
        jest.spyOn(AzureResourceFilterUtility, 'getAppDetails').mockImplementation(async(): Promise<any> => {
            return {
                resourceGroupName:'MOCK_RESOURCE_NAME',
                kind:'functionapp, kubeapp'
            };
        });

        await ResourceValidator.prototype.invoke(StateConstant.ValidateAzureResource, params, context);
        await ResourceValidator.prototype.changeContext(StateConstant.ValidateAzureResource, params, context);
        expect(context.isLinux).toBeTruthy();
    });

    it("Test Get Resource Details for windows app with SPN auth flow", async () => {
        var context: any = {
            authenticationType : AuthenticationType.Rbac
        }
        
        jest.spyOn(AzureResourceFilterUtility, 'getAppDetails').mockImplementation(async(): Promise<any> => {
            return {
                resourceGroupName:'MOCK_RESOURCE_NAME',
                kind:'functionapp'
            };
        });

        await ResourceValidator.prototype.invoke(StateConstant.ValidateAzureResource, params, context);
        await ResourceValidator.prototype.changeContext(StateConstant.ValidateAzureResource, params, context);
        expect(context.isLinux).toBeFalsy();
    });
});
