import fs = require("fs");

import {
    WebRequest,
    WebRequestOptions,
} from "azure-actions-webclient/WebClient";
import { WebRequestError } from "../../exceptions";
import { KuduServiceClient } from "./KuduServiceClient";
import { exists } from "@actions/io/lib/io-util";

import * as core from "@actions/core";

export const KUDU_DEPLOYMENT_CONSTANTS = {
    SUCCESS: 4,
    FAILED: 3,
};

export class Kudu {
    private _client: KuduServiceClient;

    constructor(
        scmUri: string,
        username: string,
        password: string,
        accessToken?: string
    ) {
        if (accessToken === undefined) {
            var base64EncodedCredential = new Buffer(
                username + ":" + password
            ).toString("base64");
            this._client = new KuduServiceClient(
                scmUri,
                "Basic " + base64EncodedCredential
            );
        } else {
            this._client = new KuduServiceClient(
                scmUri,
                "Bearer " + accessToken
            );
        }
    }

    public async updateDeployment(requestBody: any): Promise<string> {
        var httpRequest: WebRequest = {
            method: "PUT",
            body: JSON.stringify(requestBody),
            uri: this._client.getRequestUri(
                `/api/deployments/${requestBody.id}`
            ),
        };

        try {
            let webRequestOptions: WebRequestOptions = {
                retriableErrorCodes: [],
                retriableStatusCodes: null,
                retryCount: 5,
                retryIntervalInSeconds: 5,
                retryRequestTimedout: true,
            };
            var response = await this._client.beginRequest(
                httpRequest,
                webRequestOptions
            );
            core.debug(`updateDeployment. Data: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                console.log(
                    "Successfully updated deployment History at " +
                        response.body.url
                );
                return response.body.id;
            }

            throw response;
        } catch (error) {
            throw Error(
                "Failed to update deployment history.\n" +
                    this._getFormattedError(error)
            );
        }
    }

    public async getAppSettings(): Promise<Map<string, string>> {
        var httpRequest: WebRequest = {
            method: "GET",
            uri: this._client.getRequestUri(`/api/settings`),
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            core.debug(`getAppSettings. Data: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                return response.body;
            }

            throw response;
        } catch (error) {
            throw Error(
                "Failed to fetch Kudu App Settings.\n" +
                    this._getFormattedError(error)
            );
        }
    }

    public async updateAppSettingViaKudu(
        appSettings: Record<string, string>,
        retryCount: number = 1,
        retryIntervalSecond: number = 5,
        throwOnError: Boolean = true
    ): Promise<any> {
        let httpRequest: WebRequest = {
            method: "POST",
            uri: this._client.getRequestUri(`/api/settings`),
            body: JSON.stringify(appSettings),
        };
        const options: WebRequestOptions = {
            retriableStatusCodes: [404, 409, 500, 502, 503],
            retryCount: retryCount,
            retryIntervalInSeconds: retryIntervalSecond,
        };

        try {
            let response = await this._client.beginRequest(
                httpRequest,
                options,
                "application/json"
            );
            core.info(`Response with status code ${response.statusCode}`);
            return response;
        } catch (expt) {
            if (throwOnError) {
                throw new WebRequestError(
                    httpRequest.uri,
                    "POST",
                    "Failed to update app settings via kudu",
                    expt
                );
            } else {
                core.warning(`Failed to perform POST ${httpRequest.uri}`);
            }
        }
    }

    public async deleteAppSettingViaKudu(
        appSetting: string,
        retryCount: number = 1,
        retryIntervalSecond: number = 5,
        throwOnError: Boolean = true
    ): Promise<any> {
        const httpRequest: WebRequest = {
            method: "DELETE",
            uri: this._client.getRequestUri(`/api/settings/${appSetting}`),
        };
        const options: WebRequestOptions = {
            retriableStatusCodes: [404, 409, 500, 502, 503],
            retryCount: retryCount,
            retryIntervalInSeconds: retryIntervalSecond,
        };

        try {
            const response = await this._client.beginRequest(
                httpRequest,
                options,
                "application/json"
            );
            core.info(`Response with status code ${response.statusCode}`);
            return response;
        } catch (expt) {
            if (throwOnError) {
                throw new WebRequestError(
                    httpRequest.uri,
                    "DELETE",
                    "Failed to delete app setting via kudu",
                    expt
                );
            } else {
                core.warning(`Failed to perform DELETE ${httpRequest.uri}`);
            }
        }
    }

    public async getAppRuntime() {
        var httpRequest: WebRequest = {
            method: "GET",
            uri: this._client.getRequestUri(`/diagnostics/runtime`),
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            core.debug(`getAppRuntime. Data: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                return response.body;
            }

            throw response;
        } catch (error) {
            core.debug(
                "Failed to fetch Kudu App Runtime diagnostics.\n" +
                    this._getFormattedError(error)
            );
            throw Error(error);
        }
    }

    public async runCommand(
        physicalPath: string,
        command: string
    ): Promise<void> {
        var httpRequest: WebRequest = {
            method: "POST",
            uri: this._client.getRequestUri(`/api/command`),
            headers: {
                "Content-Type": "multipart/form-data",
                "If-Match": "*",
            },
            body: JSON.stringify({
                command: command,
                dir: physicalPath,
            }),
        };

        try {
            core.debug("Executing Script on Kudu. Command: " + command);
            let webRequestOptions: WebRequestOptions = {
                retriableErrorCodes: null,
                retriableStatusCodes: null,
                retryCount: 5,
                retryIntervalInSeconds: 5,
                retryRequestTimedout: false,
            };
            var response = await this._client.beginRequest(
                httpRequest,
                webRequestOptions
            );
            core.debug(`runCommand. Data: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                return;
            } else {
                throw response;
            }
        } catch (error) {
            throw Error(error.toString());
        }
    }

    public async extractZIP(
        webPackage: string,
        physicalPath: string
    ): Promise<void> {
        physicalPath = physicalPath.replace(/[\\]/g, "/");
        physicalPath =
            physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
        var httpRequest: WebRequest = {
            method: "PUT",
            uri: this._client.getRequestUri(`/api/zip/${physicalPath}/`),
            headers: {
                "Content-Type": "multipart/form-data",
                "If-Match": "*",
            },
            body: fs.createReadStream(webPackage),
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            core.debug(`extractZIP. Data: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                return;
            } else {
                throw response;
            }
        } catch (error) {
            throw Error(
                "Failed to deploy App Service package using kudu service.\n" +
                    this._getFormattedError(error)
            );
        }
    }

    public async zipDeploy(
        webPackage: string,
        queryParameters?: Array<string>
    ): Promise<any> {
        let httpRequest: WebRequest = {
            method: "POST",
            uri: this._client.getRequestUri(`/api/zipdeploy`, queryParameters),
            body: fs.createReadStream(webPackage),
        };

        try {
            let response = await this._client.beginRequest(
                httpRequest,
                null,
                "application/octet-stream"
            );
            core.debug(`ZIP Deploy response: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                core.debug("Deployment passed");
                return null;
            } else if (response.statusCode == 202) {
                let pollableURL: string = response.headers.location;
                if (!!pollableURL) {
                    core.debug(`Polling for ZIP Deploy URL: ${pollableURL}`);
                    return await this._getDeploymentDetailsFromPollURL(
                        pollableURL
                    );
                } else {
                    core.debug("zip deploy returned 202 without pollable URL.");
                    return null;
                }
            } else {
                throw response;
            }
        } catch (error) {
            const deploymentError = new Error(
                "Failed to deploy web package to App Service.\n" +
                    this._getFormattedError(error)
            );
            (deploymentError as any).statusCode = error.statusCode;
            throw deploymentError;
        }
    }

    public async validateZipDeploy(webPackage: string): Promise<any> {
        try {
            core.info(
                "Validating deployment package for functions app before Zip Deploy (RBAC)"
            );

            var stats = fs.statSync(webPackage);
            var fileSizeInBytes = stats.size;
            let httpRequest: WebRequest = {
                method: "POST",
                uri: this._client.getRequestUri(`/api/zipdeploy/validate`),
                headers: {
                    "Content-Length": fileSizeInBytes,
                },
                body: fs.createReadStream(webPackage),
            };

            let response = await this._client.beginRequest(httpRequest);
            if (response.statusCode == 200) {
                core.debug(
                    `Validation passed response: ${JSON.stringify(response)}`
                );
                if (response.body && response.body.result) {
                    core.warning(JSON.stringify(response.body.result));
                }
                return null;
            } else if (response.statusCode == 400) {
                core.debug(
                    `Validation failed response: ${JSON.stringify(response)}`
                );
                throw response;
            } else {
                core.debug(
                    `Skipping validation with status: ${response.statusCode}`
                );
                return null;
            }
        } catch (error) {
            if (
                error &&
                error.body &&
                error.body.result &&
                typeof error.body.result.valueOf() == "string" &&
                error.body.result.includes("ZipDeploy Validation ERROR")
            ) {
                throw new Error(JSON.stringify(error.body.result));
            } else {
                core.debug(
                    `Skipping validation with error: ${JSON.stringify(error)}`
                );
                return null;
            }
        }
    }

    public async imageDeploy(headers: any) {
        const _Error: string = "Error";
        let httpRequest: WebRequest = {
            method: "POST",
            uri: this._client.getRequestUri(`/api/app/update`),
            headers: headers,
        };

        let response = await this._client.beginRequest(httpRequest, null);
        core.debug(`Image Deploy response: ${JSON.stringify(response)}`);
        if (response.statusCode == 200) {
            if (
                !!response.body &&
                typeof response.body === "object" &&
                _Error in response.body
            ) {
                throw response.body[_Error];
            }
        } else {
            throw JSON.stringify(response);
        }
        core.debug("Deployment passed");
    }

    public async warDeploy(
        webPackage: string,
        queryParameters?: Array<string>
    ): Promise<any> {
        let httpRequest: WebRequest = {
            method: "POST",
            uri: this._client.getRequestUri(`/api/wardeploy`, queryParameters),
            body: fs.createReadStream(webPackage),
        };

        try {
            let response = await this._client.beginRequest(
                httpRequest,
                null,
                "application/octet-stream"
            );
            core.debug(`War Deploy response: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                core.debug("Deployment passed");
                return null;
            } else if (response.statusCode == 202) {
                let pollableURL: string = response.headers.location;
                if (!!pollableURL) {
                    core.debug(`Polling for War Deploy URL: ${pollableURL}`);
                    return await this._getDeploymentDetailsFromPollURL(
                        pollableURL
                    );
                } else {
                    core.debug("war deploy returned 202 without pollable URL.");
                    return null;
                }
            } else {
                throw response;
            }
        } catch (error) {
            throw Error(
                "Failed to deploy web package to App Service.\n" +
                    this._getFormattedError(error)
            );
        }
    }

    public async getDeploymentDetails(deploymentID: string): Promise<any> {
        try {
            var httpRequest: WebRequest = {
                method: "GET",
                uri: this._client.getRequestUri(
                    `/api/deployments/${deploymentID}`
                ),
            };
            var response = await this._client.beginRequest(httpRequest);
            core.debug(
                `getDeploymentDetails. Data: ${JSON.stringify(response)}`
            );
            if (response.statusCode == 200) {
                return response.body;
            }

            throw response;
        } catch (error) {
            throw Error(
                "Failed to gte deployment logs.\n" +
                    this._getFormattedError(error)
            );
        }
    }

    public async getDeploymentLogs(log_url: string): Promise<any> {
        try {
            var httpRequest: WebRequest = {
                method: "GET",
                uri: log_url,
            };
            var response = await this._client.beginRequest(httpRequest);
            core.debug(`getDeploymentLogs. Data: ${JSON.stringify(response)}`);
            if (response.statusCode == 200) {
                return response.body;
            }

            throw response;
        } catch (error) {
            throw Error(
                "Failed to gte deployment logs.\n" +
                    this._getFormattedError(error)
            );
        }
    }

    public async getFileContent(
        physicalPath: string,
        fileName: string
    ): Promise<string> {
        physicalPath = physicalPath.replace(/[\\]/g, "/");
        physicalPath =
            physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
        var httpRequest: WebRequest = {
            method: "GET",
            uri: this._client.getRequestUri(
                `/api/vfs/${physicalPath}/${fileName}`
            ),
            headers: {
                "If-Match": "*",
            },
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            core.debug(
                `getFileContent. Status code: ${response.statusCode} - ${response.statusMessage}`
            );
            if ([200, 201, 204].indexOf(response.statusCode) != -1) {
                return response.body;
            } else if (response.statusCode === 404) {
                return null;
            } else {
                throw response;
            }
        } catch (error) {
            throw Error(
                "Failed to get file content " +
                    physicalPath +
                    fileName +
                    " from Kudu.\n" +
                    this._getFormattedError(error)
            );
        }
    }

    public async uploadFile(
        physicalPath: string,
        fileName: string,
        filePath: string
    ): Promise<void> {
        physicalPath = physicalPath.replace(/[\\]/g, "/");
        physicalPath =
            physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
        if (!(await exists(filePath))) {
            throw new Error("FilePathInvalid" + filePath);
        }

        var httpRequest: WebRequest = {
            method: "PUT",
            uri: this._client.getRequestUri(
                `/api/vfs/${physicalPath}/${fileName}`
            ),
            headers: {
                "If-Match": "*",
            },
            body: fs.createReadStream(filePath),
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            core.debug(`uploadFile. Data: ${JSON.stringify(response)}`);
            if ([200, 201, 204].indexOf(response.statusCode) != -1) {
                return response.body;
            }

            throw response;
        } catch (error) {
            throw Error(
                "Failed to upload file " +
                    physicalPath +
                    fileName +
                    " from Kudu.\n" +
                    this._getFormattedError(error)
            );
        }
    }

    public async deleteFile(
        physicalPath: string,
        fileName: string
    ): Promise<void> {
        physicalPath = physicalPath.replace(/[\\]/g, "/");
        physicalPath =
            physicalPath[0] == "/" ? physicalPath.slice(1) : physicalPath;
        var httpRequest: WebRequest = {
            method: "DELETE",
            uri: this._client.getRequestUri(
                `/api/vfs/${physicalPath}/${fileName}`
            ),
            headers: {
                "If-Match": "*",
            },
        };

        try {
            var response = await this._client.beginRequest(httpRequest);
            core.debug(`deleteFile. Data: ${JSON.stringify(response)}`);
            if ([200, 201, 204, 404].indexOf(response.statusCode) != -1) {
                return;
            } else {
                throw response;
            }
        } catch (error) {
            throw Error(
                "Failed to delete file " +
                    physicalPath +
                    fileName +
                    " from Kudu.\n" +
                    this._getFormattedError(error)
            );
        }
    }

    private async _getDeploymentDetailsFromPollURL(
        pollURL: string
    ): Promise<any> {
        let httpRequest: WebRequest = {
            method: "GET",
            uri: pollURL,
            headers: {},
        };

        while (true) {
            let response = await this._client.beginRequest(httpRequest);
            if (response.statusCode == 200 || response.statusCode == 202) {
                var result = response.body;
                core.debug(`POLL URL RESULT: ${JSON.stringify(response)}`);
                if (
                    result.status == KUDU_DEPLOYMENT_CONSTANTS.SUCCESS ||
                    result.status == KUDU_DEPLOYMENT_CONSTANTS.FAILED
                ) {
                    return result;
                } else {
                    core.debug(
                        `Deployment status: ${result.status} '${result.status_text}'. retry after 5 seconds`
                    );
                    await this._sleep(5);
                    continue;
                }
            } else {
                throw response;
            }
        }
    }

    private _getFormattedError(error: any) {
        if (error && error.statusCode) {
            return `${error.statusMessage} (CODE: ${error.statusCode})`;
        } else if (error && error.message) {
            if (error.statusCode) {
                error.message = `${
                    typeof error.message.valueOf() == "string"
                        ? error.message
                        : error.message.Code + " - " + error.message.Message
                } (CODE: ${error.statusCode})`;
            }

            return error.message;
        }

        return error;
    }

    private _sleep(sleepDurationInSeconds: number): Promise<any> {
        return new Promise((resolve) => {
            setTimeout(resolve, sleepDurationInSeconds * 1000);
        });
    }
}
