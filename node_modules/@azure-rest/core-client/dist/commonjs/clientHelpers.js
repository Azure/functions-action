var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var clientHelpers_exports = {};
__export(clientHelpers_exports, {
  addCredentialPipelinePolicy: () => addCredentialPipelinePolicy,
  createDefaultPipeline: () => createDefaultPipeline
});
module.exports = __toCommonJS(clientHelpers_exports);
var import_core_rest_pipeline = require("@azure/core-rest-pipeline");
var import_core_auth = require("@azure/core-auth");
var import_apiVersionPolicy = require("./apiVersionPolicy.js");
var import_keyCredentialAuthenticationPolicy = require("./keyCredentialAuthenticationPolicy.js");
function addCredentialPipelinePolicy(pipeline, endpoint, options = {}) {
  const { credential, clientOptions } = options;
  if (!credential) {
    return;
  }
  if ((0, import_core_auth.isTokenCredential)(credential)) {
    const tokenPolicy = (0, import_core_rest_pipeline.bearerTokenAuthenticationPolicy)({
      credential,
      scopes: clientOptions?.credentials?.scopes ?? `${endpoint}/.default`
    });
    pipeline.addPolicy(tokenPolicy);
  } else if (isKeyCredential(credential)) {
    if (!clientOptions?.credentials?.apiKeyHeaderName) {
      throw new Error(`Missing API Key Header Name`);
    }
    const keyPolicy = (0, import_keyCredentialAuthenticationPolicy.keyCredentialAuthenticationPolicy)(
      credential,
      clientOptions?.credentials?.apiKeyHeaderName
    );
    pipeline.addPolicy(keyPolicy);
  }
}
function createDefaultPipeline(endpoint, credential, options = {}) {
  const pipeline = (0, import_core_rest_pipeline.createPipelineFromOptions)(options);
  pipeline.addPolicy((0, import_apiVersionPolicy.apiVersionPolicy)(options));
  addCredentialPipelinePolicy(pipeline, endpoint, { credential, clientOptions: options });
  return pipeline;
}
function isKeyCredential(credential) {
  return typeof credential === "object" && credential !== null && "key" in credential && typeof credential.key === "string";
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  addCredentialPipelinePolicy,
  createDefaultPipeline
});
//# sourceMappingURL=clientHelpers.js.map
