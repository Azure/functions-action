import { expect, assert } from 'chai';
import { resolve } from 'path';
import { PackageType, Package } from "azure-actions-utility/packageUtility";
import { StateConstant } from '../../src/constants/state';
import { ContentPreparer } from '../../src/handlers/contentPreparer';

describe('ContentPreparer', function () {
  let _rootPath: string;
  const _envBackup = process.env;

  beforeEach(() => {
    process.env = { ..._envBackup };
    _rootPath = resolve(__dirname, '..', '..');
  });

  afterEach(() => {
    process.env = _envBackup;
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
    const zipPath = `${_rootPath}/tests/sample/NetCoreApp.zip`;
    // @ts-ignore
    const publishPath = await preparer.generatePublishContent(
      StateConstant.PreparePublishContent, zipPath, PackageType.zip
    );
    expect(publishPath).to.equal(zipPath);
  });

  it('should archive folder path to publish', async function () {
    const preparer = new ContentPreparer();
    const folderPath = `${_rootPath}/tests/sample/NetCoreAppFolder`;
    process.env.RUNNER_TEMP = `${_rootPath}/tests/temp`;
    // @ts-ignore
    const publishPath = await preparer.generatePublishContent(
      StateConstant.PreparePublishContent, folderPath, PackageType.folder
    );
  });
});