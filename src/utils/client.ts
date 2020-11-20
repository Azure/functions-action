import { WebClient, WebRequest, WebRequestOptions, WebResponse } from 'azure-actions-webclient/WebClient';

import { IScmCredentials } from '../interfaces/IScmCredentials';
import { Logger } from './logger';
import { WebRequestError } from '../exceptions';

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
}
