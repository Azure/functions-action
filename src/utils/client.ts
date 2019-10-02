import { WebRequest, WebRequestOptions, WebResponse, sendRequest } from 'pipelines-appservice-lib/lib/webClient';
import { WebRequestError } from '../exceptions';

export class Client {
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
            return await sendRequest(request, options);
        } catch (expt) {
            throw new WebRequestError(url, 'GET', 'Failed to ping', expt);
        }
    }

    public static async updateAppSettingViaKudu(kuduUrl: string, appSettings: Record<string, string>,
        retryCount: number = 1, retryIntervalSecond: number = 5): Promise<WebResponse> {
        const request: WebRequest = {
            method: 'POST',
            uri: `${kuduUrl}/api/settings`,
            body: JSON.stringify(appSettings),
            headers: {
                'Content-Type': 'application/json'
            }
        };
        const options: WebRequestOptions = {
            retriableStatusCodes: [404, 409, 500, 502, 503],
            retryCount: retryCount,
            retryIntervalInSeconds: retryIntervalSecond
        };

        try {
            return await sendRequest(request, options);
        } catch (expt) {
            throw new WebRequestError(kuduUrl, 'POST', 'Failed to update app settings via kudu', expt);
        }
    }

    public static async deleteAppSettingViaKudu(kuduUrl: string, appSetting: string,
        retryCount: number = 1, retryIntervalSecond: number = 5): Promise<WebResponse> {
        const request: WebRequest = {
            method: 'DELETE',
            uri: `${kuduUrl}/api/settings/${appSetting}`
        };
        const options: WebRequestOptions = {
            retriableStatusCodes: [404, 409, 500, 502, 503],
            retryCount: retryCount,
            retryIntervalInSeconds: retryIntervalSecond
        };

        try {
            return await sendRequest(request, options);
        } catch (expt) {
            throw new WebRequestError(kuduUrl, 'DELETE', 'Failed to delete app setting via kudu', expt);
        }
    }
}