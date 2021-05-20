import { expect, assert } from "chai";
import {
  FunctionRuntimeConstant,
  FunctionRuntimeUtil,
} from "../../src/constants/function_runtime";

describe("function_runtime", () => {
  it("should parse dotnet runtime", () => {
    const expected = FunctionRuntimeConstant.Dotnet;
    const actual = FunctionRuntimeUtil.FromString("dotnet");
    expect(actual).equal(expected);
  });

  it("should parse dotnet-isolated runtime", () => {
    const expected = FunctionRuntimeConstant.DotnetIsolated;
    const actual = FunctionRuntimeUtil.FromString("dotnet-isolated");
    expect(actual).equal(expected);
  });

  it("should fail for invalid runtime", () => {
    assert.throw(() => FunctionRuntimeUtil.FromString("invalid"));
  });
});
