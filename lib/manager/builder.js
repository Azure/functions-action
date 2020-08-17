"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class Builder {
    static GetDefaultActionParameters() {
        return {
            appName: undefined,
            packagePath: undefined,
            slot: undefined,
            publishProfile: undefined
        };
    }
    static GetDefaultActionContext() {
        return {
            azureHttpUserAgent: undefined,
            azureHttpUserAgentPrefix: undefined,
            isLinux: undefined,
            kind: undefined,
            resourceGroupName: undefined,
            appService: undefined,
            appServiceUtil: undefined,
            endpoint: undefined,
            kuduService: undefined,
            kuduServiceUtil: undefined,
            package: undefined,
            packageType: undefined,
            publishContentPath: undefined,
            publishMethod: undefined,
            appSettings: undefined,
            language: undefined,
            os: undefined,
            sku: undefined,
            appUrl: undefined,
            scmCredentials: undefined,
            authenticationType: undefined
        };
    }
}
exports.Builder = Builder;
