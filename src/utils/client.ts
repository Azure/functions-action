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
        }

        try {
            return await sendRequest(request, options);
        } catch (expt) {
            throw new WebRequestError(url, 'GET', 'Failed to ping', expt);
        }
    }
}