export enum StateConstant {
    // State when initialize Github Action
    Initialize = 1,

    // Get & Check the parameter from action.yml
    ValidateParameter,

    // Get & Check if the resources does exist
    ValidateAzureResource,

    // Zip content and choose the proper deployment method
    PreparePublishContent,

    // Publish content to Azure Functionapps
    PublishContent,

    // Validate if the content has been published successfully
    ValidatePublishedContent,

    // End state with success
    Succeeded,

    // End state with failure
    Failed
}