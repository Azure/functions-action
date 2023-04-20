import {
    ServiceClient,
    ToError
} from 'azure-actions-webclient/AzureRestClient';

import { IAuthorizer } from 'azure-actions-webclient/Authorizer/IAuthorizer';
import { WebRequest } from 'azure-actions-webclient/WebClient';
import { getFormattedError } from 'azure-actions-appservice-rest/Arm/ErrorHandlerUtility';

import core = require('@actions/core');


interface AzureAppServiceConfigurationDetails {
    id: string;
    name: string;
    type: string;
    kind?: string;
    location: string;
    tags: string;
    properties?: {[key: string]: any};
}

export const WebsiteEnableSyncUpdateSiteKey: string = "WEBSITE_ENABLE_SYNC_UPDATE_SITE"; 

export class AzureAppService {
    private _resourceGroup: string;
    private _name: string;
    private _slot: string;
    private _slotUrl: string;
    public _client: ServiceClient;
    private _appServiceConfigurationDetails: AzureAppServiceConfigurationDetails;
    private _appServicePublishingProfile: any;
    private _appServiceApplicationSetings: AzureAppServiceConfigurationDetails;
    private _appServiceConfigurationSettings: AzureAppServiceConfigurationDetails;
    private _appServiceConnectionString: AzureAppServiceConfigurationDetails;
    private _isConsumptionApp: boolean;

    constructor(endpoint: IAuthorizer, resourceGroup: string, name: string, slot?: string, isConsumptionApp?: boolean) {
        this._client = new ServiceClient(endpoint, 30);
        this._resourceGroup = resourceGroup;
        this._name = name;
        this._slot = (slot && slot.toLowerCase() == "production") ? null : slot;
        this._slotUrl = !!this._slot ? `/slots/${this._slot}` : '';
        this._isConsumptionApp = isConsumptionApp;
    }

    public async get(force?: boolean): Promise<AzureAppServiceConfigurationDetails> {
        if(force || !this._appServiceConfigurationDetails) {
            this._appServiceConfigurationDetails = await this._get();
        }

        return this._appServiceConfigurationDetails;
    }

    public async restart(): Promise<void> {
        try {
            var slotUrl: string = !!this._slot ? `/slots/${this._slot}` : '';
            var webRequest: WebRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{ResourceGroupName}/providers/Microsoft.Web/sites/{name}/${slotUrl}/restart`, {
                    '{ResourceGroupName}': this._resourceGroup,
                    '{name}': this._name
                }, null, '2016-08-01')
            };

            console.log("Restarting app service: " + this._getFormattedName());
            var response = await this._client.beginRequest(webRequest);
            core.debug(`Restart response: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                console.log('Deployment passed');
            }
            else if (response.statusCode == 202) {
                await this._client.getLongRunningOperationResult(response);
            }
            else {
                throw ToError(response);
            }

            console.log("Restarted app service: " + this._getFormattedName());
        }
        catch(error) {
            throw Error ("Failed to restart app service " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    public async getPublishingProfileWithSecrets(force?: boolean): Promise<any>{
        if(force || !this._appServicePublishingProfile) {
            this._appServicePublishingProfile = await this._getPublishingProfileWithSecrets();
        }

        return this._appServicePublishingProfile;
    }

    public async getPublishingCredentials(): Promise<any> {
        try {
            var httpRequest: WebRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/publishingcredentials/list`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            };

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to fetch publishing credentials for app service " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    public async getSitePublishingCredentialPolicies(): Promise<any> {
        try {
            var httpRequest: WebRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/basicPublishingCredentialsPolicies/scm`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2022-03-01')
            };

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to get SitePublishingCredentialPolicies. " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    public async getApplicationSettings(force?: boolean): Promise<AzureAppServiceConfigurationDetails> {
        if(force || !this._appServiceApplicationSetings) {
            this._appServiceApplicationSetings = await this._getApplicationSettings();
        }

        return this._appServiceApplicationSetings;
    }

    public async updateApplicationSettings(applicationSettings: any): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: WebRequest = {
                method: 'PUT',
                body: JSON.stringify(applicationSettings),
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/appsettings`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            };

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to update application settings for app service " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    public async patchApplicationSettings(addProperties: any, deleteProperties?: any): Promise<boolean> {
        var applicationSettings = await this.getApplicationSettings();
        var isNewValueUpdated: boolean = false;
        for(var key in addProperties) {
            if(applicationSettings.properties[key] != addProperties[key]) {
                core.debug(`Value of ${key} has been changed to ${addProperties[key]}`);
                isNewValueUpdated = true;
            }

            applicationSettings.properties[key] = addProperties[key];
        }
        
        for(var key in deleteProperties) {
            if(key in applicationSettings.properties) {
                delete applicationSettings.properties[key];
                core.debug(`Removing app setting : ${key}`);
                isNewValueUpdated = true;
            }
        }

        if(isNewValueUpdated) {
            applicationSettings.properties[WebsiteEnableSyncUpdateSiteKey] = this._isConsumptionApp ? 'false' : 'true';
            await this.updateApplicationSettings(applicationSettings);
        }

        return isNewValueUpdated;
    }

    public async patchApplicationSettingsSlot(addProperties: any): Promise<boolean> {
        var appSettingsSlotSettings = await this.getSlotConfigurationNames();
        let appSettingNames = appSettingsSlotSettings.properties.appSettingNames;
        var isNewValueUpdated: boolean = false;
        if(appSettingNames) {
            for(var key in addProperties) {
                if(addProperties[key].slotSetting == true) {
                    if((appSettingNames.length == 0) || (!appSettingNames.includes(addProperties[key].name))) {
                        appSettingNames.push(addProperties[key].name);
                    }
                    core.debug(`Slot setting updated for key : ${addProperties[key].name}`);
                    isNewValueUpdated = true;
                }
            }
        }

        if(isNewValueUpdated) {
            await this.updateSlotConfigSettings(appSettingsSlotSettings);
        }

        return isNewValueUpdated;
    }

    public async syncFunctionTriggersViaHostruntime(): Promise<any> {
        try {
            let i = 0;
            let retryCount = 5;
            let retryIntervalInSeconds = 2;
            let timeToWait: number = retryIntervalInSeconds;
            var httpRequest: WebRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/hostruntime/admin/host/synctriggers`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2015-08-01')
            }

            while(true) {
                var response = await this._client.beginRequest(httpRequest);
                if(response.statusCode == 200) {
                    return response.body;
                }
                else if(response.statusCode == 400) {
                    if (++i < retryCount) {
                        await this._sleep(timeToWait);
                        timeToWait = timeToWait * retryIntervalInSeconds + retryIntervalInSeconds;
                        continue;
                    }
                    else {
                        throw ToError(response);
                    }
                }
                else {
                    throw ToError(response);
                }
            }
        }
        catch(error) {
            throw Error("Failed to sync triggers via host runtime for function app " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    public async getConfiguration(): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: WebRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            };

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to get configuration settings for app service " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    public async updateConfiguration(applicationSettings: any): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: WebRequest = {
                method: 'PUT',
                body: JSON.stringify(applicationSettings),
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            };

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to update configuration settings for app service " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    public async patchConfiguration(properties: any): Promise<any> {
        try {
            var httpRequest: WebRequest = {
                method: 'PATCH',
                body: JSON.stringify(properties),
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/web`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            }

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to patch configuration settings for app service " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }

    }

    public async getConnectionStrings(force?: boolean): Promise<AzureAppServiceConfigurationDetails> {
        if(force || !this._appServiceConnectionString) {
            this._appServiceConnectionString = await this._getConnectionStrings();
        }

        return this._appServiceConnectionString;
    }

    public async getSlotConfigurationNames(force?: boolean): Promise<AzureAppServiceConfigurationDetails> {
        if(force || !this._appServiceConfigurationSettings) {
            this._appServiceConfigurationSettings = await this._getSlotConfigurationNames();
        }

        return this._appServiceConfigurationSettings;
    }

    public async patchConnectionString(addProperties: any): Promise<boolean> {
        var connectionStringSettings = await this.getConnectionStrings(); 
        var isNewValueUpdated: boolean = false;
        for(var key in addProperties) {
            if(JSON.stringify(connectionStringSettings.properties[key]) != JSON.stringify(addProperties[key])) {
                core.debug(`Value of ${key} has been changed to ${JSON.stringify(addProperties[key])}`);
                isNewValueUpdated = true;
            }
            connectionStringSettings.properties[key] = addProperties[key];
        }

        if(isNewValueUpdated) {
            await this.updateConnectionStrings(connectionStringSettings);
        }

        return isNewValueUpdated;
    }

    public async updateConnectionStrings(connectionStringSettings: any): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var slotUrl: string = !!this._slot ? `/slots/${this._slot}` : '';
            var httpRequest: WebRequest = {
                method: 'PUT',
                body: JSON.stringify(connectionStringSettings),
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${slotUrl}/config/connectionstrings`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to update App service " + this._getFormattedName() + " Connection Strings.\n" + getFormattedError(error));
        }
    }

    public async patchConnectionStringSlot(addProperties: any): Promise<any> {
        var connectionStringSlotSettings = await this.getSlotConfigurationNames();
        let connectionStringNames = connectionStringSlotSettings.properties.connectionStringNames;
        var isNewValueUpdated: boolean = false;
        if(connectionStringNames) {
            for(var key in addProperties) {
                if(addProperties[key].slotSetting == true) {
                    if((connectionStringNames.length == 0) || (!connectionStringNames.includes(key))) {
                        connectionStringNames.push(key);
                    }
                    core.debug(`Slot setting updated for key : ${key}`);
                    isNewValueUpdated = true;
                }
            }
        }

        if(isNewValueUpdated) {
            await this.updateSlotConfigSettings(connectionStringSlotSettings);
        }
    }

    public async updateSlotConfigSettings(SlotConfigSettings: any): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: WebRequest = {
                method: 'PUT',
                body: JSON.stringify(SlotConfigSettings),
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/config/slotConfigNames`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to update App service " + this._getFormattedName() + " Configuration Slot Settings.\n" + getFormattedError(error));
        }
    }

    public async getMetadata(): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: WebRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/metadata/list`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to get app service Meta data for " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    public async updateMetadata(applicationSettings: any): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: WebRequest = {
                method: 'PUT',
                body: JSON.stringify(applicationSettings),
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/metadata`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to update app serviceMeta data for " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    public async patchMetadata(properties: any): Promise<void> {
        var applicationSettings = await this.getMetadata();
        for(var key in properties) {
            applicationSettings.properties[key] = properties[key];
        }

        await this.updateMetadata(applicationSettings);
    }

    public getSlot(): string {
        return this._slot ? this._slot : "production";
    }

    private async _getPublishingProfileWithSecrets(): Promise<any> {
        try {
            var httpRequest: WebRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/publishxml`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            var publishingProfile = response.body;
            return publishingProfile;
        }
        catch(error) {
            throw Error("Failed to fetch publishing profile for app service " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    private async _getApplicationSettings(): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: WebRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}/config/appsettings/list`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to get application settings for app service " + this._getFormattedName() + ".\n" + getFormattedError(error));
        }
    }

    private async _getConnectionStrings(): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var slotUrl: string = !!this._slot ? `/slots/${this._slot}` : '';
            var httpRequest: WebRequest = {
                method: 'POST',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${slotUrl}/config/connectionstrings/list`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            }
         
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to get App service " + this._getFormattedName() + " Connection Strings.\n" + getFormattedError(error));
        }
    }

    private async _getSlotConfigurationNames(): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: WebRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/config/slotConfigNames`,
                {
                    '{resourceGroupName}': this._resourceGroup,
                    '{name}': this._name,
                }, null, '2016-08-01')
            }
            
            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            return response.body;
        }
        catch(error) {
            throw Error("Failed to get App service " + this._getFormattedName() + " Slot Configuration Names.\n" + getFormattedError(error));
        }
    }

    private async _get(): Promise<AzureAppServiceConfigurationDetails> {
        try {
            var httpRequest: WebRequest = {
                method: 'GET',
                uri: this._client.getRequestUri(`//subscriptions/{subscriptionId}/resourceGroups/{resourceGroupName}/providers/Microsoft.Web/sites/{name}/${this._slotUrl}`,
                    {
                        '{resourceGroupName}': this._resourceGroup,
                        '{name}': this._name,
                    }, null, '2016-08-01')
            };

            var response = await this._client.beginRequest(httpRequest);
            if(response.statusCode != 200) {
                throw ToError(response);
            }

            var appDetails = response.body;
            return appDetails as AzureAppServiceConfigurationDetails;
        }
        catch(error) {
            throw Error("Failed to fetch app service " + this._getFormattedName() + " details.\n" + getFormattedError(error));
        }
    }

    private _getFormattedName(): string {
        return this._slot ? `${this._name}-${this._slot}` : this._name;
    }

    public getName(): string {
        return this._name;
    }

    private _sleep(sleepDurationInSeconds: number): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }
 }