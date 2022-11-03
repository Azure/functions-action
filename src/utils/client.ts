import { WebClient, WebRequest, WebRequestOptions, WebResponse } from 'azure-actions-webclient/WebClient';

import { IScmCredentials } from '../interfaces/IScmCredentials';
import { Logger } from './logger';
import { WebRequestError } from '../exceptions';
import { IActionContext } from '../interfaces/IActionContext';
import { AuthenticationType } from '../constants/authentication_type';
import { RuntimeStackConstant } from '../constants/runtime_stack';

const fs = require("fs");

export class Client {
    public static webClient = new WebClient();

    public static async ping(url: string, retryCount: number = 1, retryIntervalSecond: number = 5): Promise<WebResponse> {
        const request: WebRequest = {
            method: 'GET',
            uri: url
        };
        const options: WebRequestOptions = {
            retriableStatusCodes: [404, 500, 502, 503],
            retryCount: retryCount,
            retryIntervalInSeconds: retryIntervalSecond
        };

        try {
            return await Client.webClient.sendRequest(request, options);
        } catch (expt) {
            throw new WebRequestError(url, 'GET', 'Failed to ping', expt);
        }
    }

    public static async updateAppSettingViaKudu(scm: IScmCredentials, appSettings: Record<string, string>,
        retryCount: number = 1, retryIntervalSecond: number = 5, throwOnError: Boolean = true): Promise<WebResponse> {
        const base64Cred: string = Buffer.from(`${scm.username}:${scm.password}`).toString('base64');
        const request: WebRequest = {
            method: 'POST',
            uri: `${scm.uri}/api/settings`,
            body: JSON.stringify(appSettings),
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${base64Cred}`
            }
        };
        const options: WebRequestOptions = {
            retriableStatusCodes: [404, 409, 500, 502, 503],
            retryCount: retryCount,
            retryIntervalInSeconds: retryIntervalSecond
        };

        try {
            const response = await Client.webClient.sendRequest(request, options);
            Logger.Info(`Response with status code ${response.statusCode}`);
            return response;
        } catch (expt) {
            if (throwOnError) {
                throw new WebRequestError(scm.uri, 'POST', 'Failed to update app settings via kudu', expt);
            } else {
                Logger.Warn(`Failed to perform POST ${scm.uri}`);
            }
        }
    }

    public static async deleteAppSettingViaKudu(scm: IScmCredentials, appSetting: string,
        retryCount: number = 1, retryIntervalSecond: number = 5, throwOnError: Boolean = true): Promise<WebResponse> {
        const base64Cred: string = Buffer.from(`${scm.username}:${scm.password}`).toString('base64');
        const request: WebRequest = {
            method: 'DELETE',
            uri: `${scm.uri}/api/settings/${appSetting}`,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${base64Cred}`
            }
        };
        const options: WebRequestOptions = {
            retriableStatusCodes: [404, 409, 500, 502, 503],
            retryCount: retryCount,
            retryIntervalInSeconds: retryIntervalSecond
        };

        try {
            const response = await Client.webClient.sendRequest(request, options);
            Logger.Info(`Response with status code ${response.statusCode}`);
            return response;
        } catch (expt) {
            if (throwOnError) {
                throw new WebRequestError(scm.uri, 'DELETE', 'Failed to delete app setting via kudu', expt);
            } else {
                Logger.Warn(`Failed to perform DELETE ${scm.uri}`);
            }
        }
    }

    public static async validateZipDeploy(context: IActionContext, webPackage: string): Promise<any> {
        try {
            let username = "";
            let password = "";
            let uri = "";

            // if (context.authenticationType === AuthenticationType.Scm) {
            //     Logger.Info("Validating deployment package for functions app before Zip Deploy (SCM)");
            //     if (context.scmCredentials){
            //         username = context.scmCredentials.username;
            //         password = context.scmCredentials.password;
            //         uri = context.scmCredentials.uri;
            //     }
            // }
            
            if (context.authenticationType === AuthenticationType.Rbac &&
                context.os === RuntimeStackConstant.Windows) {
                Logger.Info("Validating deployment package for functions app before Zip Deploy (RBAC)");
                var publishingCredentials = await context.appService.getPublishingCredentials();
                if (publishingCredentials.properties["scmUri"]) {
                    username = publishingCredentials.properties["publishingUserName"];
                    password = publishingCredentials.properties["publishingPassword"];
                    uri = publishingCredentials.properties["scmUri"];
                }                

                var stats = fs.statSync(webPackage);
                var fileSizeInBytes = stats.size;
                const base64Cred: string = Buffer.from(`${username}:${password}`).toString('base64');
                let request: WebRequest = {
                    method: 'POST',
                    uri: `${uri}/api/zipdeploy/validate`,
                    headers: {
                        'Authorization': `Basic ${base64Cred}`,
                        'Content-Length': fileSizeInBytes
                    },
                    body: fs.createReadStream(webPackage)
                };

                let response = await Client.webClient.sendRequest(request);
                if(response.statusCode == 200) {
                    Logger.Info(`##[debug]Validation passed response: ${JSON.stringify(response)}`);
                    if (response.body && response.body.result){
                        Logger.Warn(JSON.stringify(response.body.result));          
                    }
                    return null;
                }
                else if(response.statusCode == 400) {         
                    Logger.Info(`##[debug]Validation failed response: ${JSON.stringify(response)}`);      
                    throw response;
                }
                else {
                    Logger.Info(`##[debug]Skipping validation with status: ${response.statusCode}`);
                    return null;
                }
            }
        }
        catch(error) {
            if (error && error.body && error.body.result && typeof error.body.result.valueOf() == 'string' && error.body.result.includes('ZipDeploy Validation ERROR')) {
                throw new Error(JSON.stringify(error.body.result));
            }           
            else {
                Logger.Info(`##[debug]Skipping validation with error: ${JSON.stringify(error)}`);
                return null;
            }
        }
    }
}
