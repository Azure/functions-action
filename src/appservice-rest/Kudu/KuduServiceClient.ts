import util = require('util');

import { WebClient, WebRequest, WebRequestOptions, WebResponse } from 'azure-actions-webclient/WebClient';

import core = require('@actions/core');

export class KuduServiceClient {
    private _scmUri;
    private _accessToken: string;
    private _cookie: string[];
    private _webClient: WebClient;

    constructor(scmUri: string, accessToken: string) {
        this._accessToken = accessToken;
        this._scmUri = scmUri;
        this._webClient = new WebClient();
    }

    public async beginRequest(request: WebRequest, reqOptions?: WebRequestOptions, contentType?: string): Promise<WebResponse> {
        request.headers = request.headers || {};
        request.headers["Authorization"] = this._accessToken;
        request.headers['Content-Type'] = contentType || 'application/json; charset=utf-8';

        if(!!this._cookie) {
            core.debug(`setting affinity cookie ${JSON.stringify(this._cookie)}`);
            request.headers['Cookie'] = this._cookie;
        }

        let retryCount = reqOptions && typeof reqOptions.retryCount === 'number' ? reqOptions.retryCount : 5;

        while(retryCount >= 0) {
            try {
                let httpResponse = await this._webClient.sendRequest(request, reqOptions);
                if(httpResponse.headers['set-cookie'] && !this._cookie) {
                    this._cookie = httpResponse.headers['set-cookie'];
                    core.debug(`loaded affinity cookie ${JSON.stringify(this._cookie)}`);
                }

                return httpResponse;
            }
            catch(exception) {
                let exceptionString: string = exception.toString();
                if(exceptionString.indexOf("Hostname/IP doesn't match certificates's altnames") != -1
                    || exceptionString.indexOf("unable to verify the first certificate") != -1
                    || exceptionString.indexOf("unable to get local issuer certificate") != -1) {
                        core.warning('To use a certificate in App Service, the certificate must be signed by a trusted certificate authority. If your web app gives you certificate validation errors, you\'re probably using a self-signed certificate and to resolve them you need to export variable named ACTIONS_AZURE_REST_IGNORE_SSL_ERRORS to the value true.');
                }

                if(retryCount > 0 && exceptionString.indexOf('Request timeout') != -1 && (!reqOptions || reqOptions.retryRequestTimedout)) {
                    core.debug('encountered request timedout issue in Kudu. Retrying again');
                    retryCount -= 1;
                    continue;
                }

                throw exception;
            }
        }

    }

    public getRequestUri(uriFormat: string, queryParameters?: Array<string>) {
        uriFormat = uriFormat[0] == "/" ? uriFormat : "/" + uriFormat;

        if(queryParameters && queryParameters.length > 0) {
            uriFormat = uriFormat + '?' + queryParameters.join('&');
        }

        return this._scmUri + uriFormat;
    }

    public getScmUri(): string {
        return this._scmUri;
    }
}