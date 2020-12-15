import { expect, assert } from 'chai';
import { resolve } from 'path';
import * as rimraf from 'rimraf';
import { writeFile } from 'fs-extra';
import { PackageType, Package } from "azure-actions-utility/packageUtility";
import { StateConstant } from '../../src/constants/state';
import { ContentPreparer } from '../../src/handlers/contentPreparer';
import { RuntimeStackConstant } from '../../src/constants/runtime_stack';
import { FunctionSkuConstant } from '../../src/constants/function_sku';
import { AuthenticationType } from '../../src/constants/authentication_type';
import { PublishMethodConstant } from '../../src/constants/publish_method';
import { Builder } from '../../src/managers/builder';

describe('Check ContentPreparer', function () {
  let _rootPath: string;
  const _envBackup = process.env;

  beforeEach(() => {
    process.env = { ..._envBackup };
    _rootPath = resolve(__dirname, '..', '..');
  });

  afterEach(() => {
    process.env = _envBackup;
    rimraf(`${_rootPath}/tests/temp/*.zip`, (_) => {});
  });

  it('should throw error if package path is not found', function () {
    assert.throw(
      () => new Package(`${_rootPath}/some/random/path`)
    );
  });

  it('should accept zip path in package param', function () {
    const preparer = new ContentPreparer();
    const zipPackage: Package = new Package(`${_rootPath}/tests/samples/NetCoreApp.zip`);
    expect(zipPackage.getPackageType()).to.equal(PackageType.zip);
    assert.doesNotThrow(
      // @ts-ignore
      () => preparer.validatePackageType(StateConstant.PreparePublishContent, zipPackage)
    )
  });

  it('should accept folder path in package param', function () {
    const preparer = new ContentPreparer();
    const folderPackage: Package = new Package(`${_rootPath}/tests/samples/NetCoreAppFolder`);
    expect(folderPackage.getPackageType()).to.equal(PackageType.folder);
    assert.doesNotThrow(
      // @ts-ignore
      () => preparer.validatePackageType(StateConstant.PreparePublishContent, folderPackage)
    )
  });

  it('should throw exception if a jar file is provided', function () {
    const preparer = new ContentPreparer();
    const javaPackage: Package = new Package(`${_rootPath}/tests/samples/JavaApp.jar`);
    expect(javaPackage.getPackageType()).to.equal(PackageType.jar);
    assert.throw(
      // @ts-ignore
      () => preparer.validatePackageType(StateConstant.PreparePublishContent, javaPackage),
      'only accepts zip or folder'
    )
  });

  it('should generate zip file path to publish', async function () {
    const preparer = new ContentPreparer();
    const zipPath = `${_rootPath}/tests/samples/NetCoreApp.zip`;

    const params = Builder.GetDefaultActionParameters();
    params.packagePath = zipPath;

    // @ts-ignore
    const publishPath = await preparer.generatePublishContent(
      StateConstant.PreparePublishContent, params, PackageType.zip
    );
    expect(publishPath).to.equal(zipPath);
  });

  it('should archive folder path to publish', async function () {
    const preparer = new ContentPreparer();
    const folderPath = `${_rootPath}/tests/samples/NetCoreAppFolder`;
    process.env.RUNNER_TEMP = `${_rootPath}/tests/temp`;

    const params = Builder.GetDefaultActionParameters();
    params.packagePath = folderPath;

    // @ts-ignore
    const publishPath = await preparer.generatePublishContent(
      StateConstant.PreparePublishContent, params, PackageType.folder
    );

    // Test
    expect(publishPath).to.contains('.zip');
  });

  it('should archive java function app follow pom.xml', async function () {
    const preparer = new ContentPreparer();
    const folderPath = `${_rootPath}/tests/samples/JavaAppFolder`;
    process.env.RUNNER_TEMP = `${_rootPath}/tests/temp`;

    const params = Builder.GetDefaultActionParameters();
    params.packagePath = folderPath;
    params.respectPomXml = true;

    // @ts-ignore
    const publishPath = await preparer.generatePublishContent(
      StateConstant.PreparePublishContent, params, PackageType.folder
    );

    // Test
    expect(publishPath).to.contains('.zip');
  });

  it('should remove unnecessary files according to .funcignore', async function() {
    const preparer = new ContentPreparer();
    const folderPath = `${_rootPath}/tests/samples/PythonAppFuncignoreFolder`;
    process.env.RUNNER_TEMP = `${_rootPath}/tests/temp`;

    const params = Builder.GetDefaultActionParameters();
    params.packagePath = folderPath;
    params.respectFuncignore = true;

    // Create a file that should be ignored
    await writeFile(`${folderPath}/env1`, 'This file should be removed');

    // @ts-ignore
    const publishPath = await preparer.generatePublishContent(
      StateConstant.PreparePublishContent, params, PackageType.folder
    );

    // Test
    expect(publishPath).to.contains('.zip');
  });

  it('should throw errors if destination folder does not exist', async function () {
    const preparer = new ContentPreparer();
    const folderPath = `${_rootPath}/tests/sample/NetCoreAppFolder`;
    process.env.RUNNER_TEMP = `${_rootPath}/folder/does/not/exist`;

    const params = Builder.GetDefaultActionParameters();
    params.packagePath = folderPath;

    try {
      // @ts-ignore
      await preparer.generatePublishContent(
        StateConstant.PreparePublishContent, params, PackageType.folder
      );
    } catch (e) {
      expect(e.message).to.contains('Failed to archive');
    }
  });

  it('should throw errors on unsupported archive type', async function () {
    const preparer = new ContentPreparer();
    const folderPath = `${_rootPath}/tests/sample/NetCoreAppFolder`;

    const params = Builder.GetDefaultActionParameters();
    params.packagePath = folderPath;

    try {
      // @ts-ignore
      await preparer.generatePublishContent(
        StateConstant.PreparePublishContent, params, PackageType.jar
      );
    } catch (e) {
      expect(e.message).to.contains('only accepts zip or folder');
    }
  });

  it('should use website run from package for linux consumption rbac', function () {
    const preparer = new ContentPreparer();

    // @ts-ignore
    const result = preparer.derivePublishMethod(
      StateConstant.PreparePublishContent,
      PackageType.folder,
      RuntimeStackConstant.Linux,
      FunctionSkuConstant.Consumption,
      AuthenticationType.Rbac
    );

    expect(result).to.equal(PublishMethodConstant.WebsiteRunFromPackageDeploy);
  });

  it('should use zipdeploy for all other skus', function () {
    const preparer = new ContentPreparer();

    [PackageType.folder, PackageType.zip].forEach(p => {
      [RuntimeStackConstant.Linux, RuntimeStackConstant.Windows].forEach(r => {
        [FunctionSkuConstant.Consumption, FunctionSkuConstant.Dedicated, FunctionSkuConstant.ElasticPremium].forEach(f => {
          [AuthenticationType.Rbac, AuthenticationType.Scm].forEach(a => {
            // @ts-ignore
            const result = preparer.derivePublishMethod(
              StateConstant.PreparePublishContent,
              p, r, f, a
            );

            if (r !== RuntimeStackConstant.Linux && f !== FunctionSkuConstant.Consumption) {
              expect(result).to.equal(PublishMethodConstant.ZipDeploy);
            }
          });
        });
      });
    });
  });

  it('should throw an exception if unsupported archieve type is provided', function () {
    const preparer = new ContentPreparer();

    [PackageType.jar].forEach(p => {
      [RuntimeStackConstant.Linux, RuntimeStackConstant.Windows].forEach(r => {
        [FunctionSkuConstant.Consumption, FunctionSkuConstant.Dedicated, FunctionSkuConstant.ElasticPremium].forEach(f => {
          [AuthenticationType.Rbac, AuthenticationType.Scm].forEach(a => {
            // @ts-ignore
            assert.throw(
              // @ts-ignore
              () => preparer.derivePublishMethod(
                StateConstant.PreparePublishContent,
                PackageType.jar,
                RuntimeStackConstant.Linux,
                FunctionSkuConstant.Consumption,
                AuthenticationType.Rbac
              ),
              'only accepts zip or folder'
            );
          });
        });
      });
    });
  });

  it('should parse java pom.xml to get the function app name', async function () {
    const preparer = new ContentPreparer();
    const packagePath = resolve(_rootPath, 'tests', 'samples', 'JavaAppFolder');
    const expectedSourceFolder = resolve(packagePath, 'target', 'azure-functions', 'hazeng-fa-java');
    // @ts-ignore
    const sourceFolder = await preparer.getPomXmlSourceLocation(packagePath);
    expect(sourceFolder).to.equal(expectedSourceFolder);
  });

  it('should ignore java local app name if pom.xml is not found', async function () {
    const preparer = new ContentPreparer();
    const packagePath = resolve(_rootPath, 'tests');
    const expectedSourceFolder = packagePath;
    // @ts-ignore
    const sourceFolder = await preparer.getPomXmlSourceLocation(packagePath);
    expect(sourceFolder).to.equal(expectedSourceFolder);
  });

  it('should ignore java local app name if pom.xml cannot be parsed', async function () {
    const preparer = new ContentPreparer();
    const packagePath = resolve(_rootPath, 'tests', 'samples', 'BrokenJavaAppFolder');
    const expectedSourceFolder = packagePath;
    // @ts-ignore
    const sourceFolder = await preparer.getPomXmlSourceLocation(packagePath);
    expect(sourceFolder).to.equal(expectedSourceFolder);
  });
});