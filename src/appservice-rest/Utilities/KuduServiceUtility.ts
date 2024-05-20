import { KUDU_DEPLOYMENT_CONSTANTS } from '../Kudu/azure-app-kudu-service';
import { Kudu } from '../Kudu/azure-app-kudu-service';

import core = require('@actions/core');
import path = require('path');
import fs = require('fs');

const deploymentFolder: string = 'site/deployments';
const manifestFileName: string = 'manifest';
const GITHUB_ZIP_DEPLOY: string = 'GITHUB_ZIP_DEPLOY_FUNCTIONS_V1';

export class KuduServiceUtility {
    private _webAppKuduService: Kudu;
    private _deploymentID: string;

    constructor(kuduService: Kudu) {
        this._webAppKuduService = kuduService;
    }

    public async updateDeploymentStatus(taskResult: boolean, DeploymentID: string, customMessage: any): Promise<string> {
        try {
            let requestBody = this._getUpdateHistoryRequest(taskResult, DeploymentID, customMessage);
            return await this._webAppKuduService.updateDeployment(requestBody);
        }
        catch(error) {
            core.warning(error);
        }
    }

    public getDeploymentID(): string {
        if(this._deploymentID) {
            return this._deploymentID;
        }

        var deploymentID: string = `${process.env.GITHUB_SHA}` + Date.now().toString();
        return deploymentID;
    }

    public async deployUsingZipDeploy(packagePath: string, customMessage?: any): Promise<string> {
        try {
            console.log('Package deployment using ZIP Deploy initiated.');

            let queryParameters: Array<string> = [
                'isAsync=true',
                'deployer=' + GITHUB_ZIP_DEPLOY
            ];
            var deploymentMessage = this._getUpdateHistoryRequest(null, null, customMessage).message;
            queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
            let deploymentDetails = await this._webAppKuduService.zipDeploy(packagePath, queryParameters);
            await this._processDeploymentResponse(deploymentDetails);

            console.log('Successfully deployed web package to App Service.');
            return deploymentDetails.id;
        }
        catch(error) {
            core.error('Failed to deploy web package to App Service.');
            throw error;
        }
    }

    public async deployUsingOneDeployFlex(packagePath: string, remoteBuild: string, customMessage?: any): Promise<string> {
        try {
            console.log('Package deployment using One Deploy initiated.');

            let queryParameters: Array<string> = [
                'remoteBuild=' + remoteBuild,
                'deployer=' + GITHUB_ZIP_DEPLOY
            ];
            var deploymentMessage = this._getUpdateHistoryRequest(null, null, customMessage).message;
            queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
            let deploymentDetails = await this._webAppKuduService.oneDeployFlex(packagePath, queryParameters);
            await this._processDeploymentResponse(deploymentDetails);

            console.log('Successfully deployed web package to Function App.');
            return deploymentDetails.id;
        }
        catch(error) {
            core.error('Failed to deploy web package to Function App.');
            throw error;
        }
    }

    public async deployUsingWarDeploy(packagePath: string, customMessage?: any, targetFolderName?: any): Promise<string> {
        try {
            console.log('Package deployment using WAR Deploy initiated.');

            let queryParameters: Array<string> = [
                'isAsync=true'
            ];
            
            if(targetFolderName) {
                queryParameters.push('name=' + encodeURIComponent(targetFolderName));
            }

            var deploymentMessage = this._getUpdateHistoryRequest(null, null, customMessage).message;
            queryParameters.push('message=' + encodeURIComponent(deploymentMessage));
            let deploymentDetails = await this._webAppKuduService.warDeploy(packagePath, queryParameters);
            await this._processDeploymentResponse(deploymentDetails);
            console.log('Successfully deployed web package to App Service.');

            return deploymentDetails.id;
        }
        catch(error) {
            core.error('Failed to deploy web package to App Service.');
            throw error;
        }
    }

    public async postZipDeployOperation(oldDeploymentID: string, activeDeploymentID: string): Promise<void> {
        try {
            core.debug(`ZIP DEPLOY - Performing post zip-deploy operation: ${oldDeploymentID} => ${activeDeploymentID}`);
            let manifestFileContent = await this._webAppKuduService.getFileContent(`${deploymentFolder}/${oldDeploymentID}`, manifestFileName);
            if(!!manifestFileContent) {
                let tempManifestFile: string = path.join(`${process.env.RUNNER_TEMP}`, manifestFileName);
                fs.writeFileSync(tempManifestFile, manifestFileContent);
                await this._webAppKuduService.uploadFile(`${deploymentFolder}/${activeDeploymentID}`, manifestFileName, tempManifestFile);
            }
            core.debug('ZIP DEPLOY - Performed post-zipdeploy operation.');
        }
        catch(error) {
            core.debug(`Failed to execute post zip-deploy operation: ${JSON.stringify(error)}.`);
        }
    }

    public async warmpUp(): Promise<void> {
        try {
            core.debug('warming up Kudu Service');
            await this._webAppKuduService.getAppSettings();
            core.debug('warmed up Kudu Service');
        }
        catch(error) {
            core.debug('Failed to warm-up Kudu: ' + error.toString());
        }
    }

    private async _processDeploymentResponse(deploymentDetails: any): Promise<void> {
        try {
            var kuduDeploymentDetails = await this._webAppKuduService.getDeploymentDetails(deploymentDetails.id);
            core.debug(`logs from kudu deploy: ${kuduDeploymentDetails.log_url}`);

            if(deploymentDetails.status == KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
                await this._printZipDeployLogs(kuduDeploymentDetails.log_url);
            }
            else {
                console.log('Deploy logs can be viewed at %s', kuduDeploymentDetails.log_url);
            }
        }
        catch(error) {
            core.debug(`Unable to fetch logs for kudu Deploy: ${JSON.stringify(error)}`);
        }

        if(deploymentDetails.status == KUDU_DEPLOYMENT_CONSTANTS.FAILED) {
            throw 'Package deployment using ZIP Deploy failed. Refer logs for more details.';
        }
    }

    private async _printZipDeployLogs(log_url: string): Promise<void> {
        if(!log_url) {
            return;
        }

        var deploymentLogs = await this._webAppKuduService.getDeploymentLogs(log_url);
        for(var deploymentLog of deploymentLogs) {
            console.log(`${deploymentLog.message}`);
            if(deploymentLog.details_url) {
                await this._printZipDeployLogs(deploymentLog.details_url);
            }
        }
    }

    private _getUpdateHistoryRequest(isDeploymentSuccess: boolean, deploymentID?: string, customMessage?: any): any {    
        deploymentID = !!deploymentID ? deploymentID : this.getDeploymentID();
        
        var message: {[index: string]:any} = {
            type : "deployment",
            sha : `${process.env.GITHUB_SHA}`,
            repoName : `${process.env.GITHUB_REPOSITORY}`,
            actor: `${process.env.GITHUB_ACTOR}`
        };

        if(!!customMessage) {
            // Append Custom Messages to original message
            for(var attribute in customMessage) {
                message[attribute] = customMessage[attribute];
            }
            
        }
        var deploymentLogType: string = message['type'];
        var active: boolean = false;
        if(deploymentLogType.toLowerCase() === "deployment" && isDeploymentSuccess) {
            active = true;
        }

        return {
            id: deploymentID,
            active : active,
            status : isDeploymentSuccess ? KUDU_DEPLOYMENT_CONSTANTS.SUCCESS : KUDU_DEPLOYMENT_CONSTANTS.FAILED,
            message : JSON.stringify(message),
            author : `${process.env.GITHUB_ACTOR}`,
            deployer : 'GitHub'
        };
    }

    public async deployWebAppImage(appName: string, images: string, isLinux: boolean) {
        try {
            core.debug(`DeployWebAppImage - appName: ${appName}; images: ${images}; isLinux:${isLinux}`);
            console.log(`Deploying image ${images} to App Service ${appName}`);

            if (!images) {
                throw 'The container image to be deployed to App Service is empty.';
            }

            let headers = isLinux ? { 'LinuxFxVersion': `DOCKER|${images}` } : { 'WindowsFxVersion': `DOCKER|${images}` };
            await this._webAppKuduService.imageDeploy(headers);
            console.log('Successfully deployed image to App Service.');
        }
        catch(error) {
            core.error('Failed to deploy image to Web app Container.');
            throw error;
        }
    }

}