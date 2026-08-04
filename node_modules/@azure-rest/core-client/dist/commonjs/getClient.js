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
var getClient_exports = {};
__export(getClient_exports, {
  getClient: () => getClient
});
module.exports = __toCommonJS(getClient_exports);
var import_core_auth = require("@azure/core-auth");
var import_clientHelpers = require("./clientHelpers.js");
var import_ts_http_runtime = require("@typespec/ts-http-runtime");
function wrapRequestParameters(parameters) {
  if (parameters.onResponse) {
    return {
      ...parameters,
      onResponse(rawResponse, error) {
        parameters.onResponse?.(rawResponse, error, error);
      }
    };
  }
  return parameters;
}
function getClient(endpoint, credentialsOrPipelineOptions, clientOptions = {}) {
  let credentials;
  if (credentialsOrPipelineOptions) {
    if (isCredential(credentialsOrPipelineOptions)) {
      credentials = credentialsOrPipelineOptions;
    } else {
      clientOptions = credentialsOrPipelineOptions ?? {};
    }
  }
  const pipeline = clientOptions.pipeline ?? (0, import_clientHelpers.createDefaultPipeline)(endpoint, credentials, clientOptions);
  const tspClient = (0, import_ts_http_runtime.getClient)(endpoint, {
    ...clientOptions,
    pipeline
  });
  const client = (path, ...args) => {
    return {
      get: (requestOptions = {}) => {
        return tspClient.path(path, ...args).get(wrapRequestParameters(requestOptions));
      },
      post: (requestOptions = {}) => {
        return tspClient.path(path, ...args).post(wrapRequestParameters(requestOptions));
      },
      put: (requestOptions = {}) => {
        return tspClient.path(path, ...args).put(wrapRequestParameters(requestOptions));
      },
      patch: (requestOptions = {}) => {
        return tspClient.path(path, ...args).patch(wrapRequestParameters(requestOptions));
      },
      delete: (requestOptions = {}) => {
        return tspClient.path(path, ...args).delete(wrapRequestParameters(requestOptions));
      },
      head: (requestOptions = {}) => {
        return tspClient.path(path, ...args).head(wrapRequestParameters(requestOptions));
      },
      options: (requestOptions = {}) => {
        return tspClient.path(path, ...args).options(wrapRequestParameters(requestOptions));
      },
      trace: (requestOptions = {}) => {
        return tspClient.path(path, ...args).trace(wrapRequestParameters(requestOptions));
      }
    };
  };
  return {
    path: client,
    pathUnchecked: client,
    pipeline: tspClient.pipeline
  };
}
function isCredential(param) {
  return (0, import_core_auth.isKeyCredential)(param) || (0, import_core_auth.isTokenCredential)(param);
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  getClient
});
//# sourceMappingURL=getClient.js.map
