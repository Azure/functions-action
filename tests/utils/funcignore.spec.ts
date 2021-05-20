import { expect, assert } from 'chai';
import { resolve } from 'path';
import { mkdirp, remove, writeFile, pathExists } from 'fs-extra';
import { FuncIgnore } from '../../src/utils';

describe('funcignore', function () {
  let _rootPath: string;
  let _tempPath: string;

  beforeEach(async () => {
    _rootPath = resolve(__dirname, '..', '..');
    _tempPath = resolve(__dirname, '..', 'temp', 'funcignore');
    await mkdirp(_tempPath);
  });

  afterEach(async () => {
    await remove(_tempPath);
  });

  it('should check and return false if .funcignore does not exist', function() {
    const projectPath: string = `${_rootPath}/tests/samples/PythonAppFolder`;
    const hasFuncIgnore: boolean = FuncIgnore.doesFuncignoreExist(projectPath);
    expect(hasFuncIgnore).to.be.false;
  });

  it('should check and return true if .funcignore exists', function() {
    const projectPath: string = `${_rootPath}/tests/samples/PythonAppFuncignoreFolder`;
    const hasFuncIgnore: boolean = FuncIgnore.doesFuncignoreExist(projectPath);
    expect(hasFuncIgnore).to.be.true;
  });

  it('should raise error if .funcignore does not exist', function() {
    const projectPath: string = `${_rootPath}/tests/samples/PythonAppFolder`;
    assert(() => FuncIgnore.readFuncignore(projectPath), 'no such file or directory');
  });

  it('should give a list of paths if .funcignore does exist', function() {
    const projectPath: string = `${_rootPath}/tests/samples/PythonAppFuncignoreFolder`;
    const ignoreParser = FuncIgnore.readFuncignore(projectPath);
    expect(ignoreParser).to.not.be.undefined;
  });

  it('should ignore comment in funcignore', async function() {
    await writeFile(`${_tempPath}/00.txt`, '-');
    await writeFile(`${_tempPath}/.funcignore`, '# This is a comment');
    const parser = FuncIgnore.readFuncignore(_tempPath);
    FuncIgnore.removeFilesFromFuncIgnore(_tempPath, parser);
    expect(await pathExists(`${_tempPath}/00.txt`)).to.be.true;
  });

  it('should remove file in the root directory', async function() {
    await writeFile(`${_tempPath}/01.txt`, 'a');
    await writeFile(`${_tempPath}/.funcignore`, '01.txt')
    const parser = FuncIgnore.readFuncignore(_tempPath);
    FuncIgnore.removeFilesFromFuncIgnore(_tempPath, parser);
    expect(await pathExists(`${_tempPath}/01.txt`)).to.be.false;
  });

  it('should remove file with name starting with . (dot) in the root directory', async function() {
    await writeFile(`${_tempPath}/.gitignore`, 'a');
    await writeFile(`${_tempPath}/.funcignore`, '.gitignore')
    const parser = FuncIgnore.readFuncignore(_tempPath);
    FuncIgnore.removeFilesFromFuncIgnore(_tempPath, parser);
    expect(await pathExists(`${_tempPath}/.gitignore`)).to.be.false;
  });

  it('should remove multiple files in the root directory with wildcard', async function() {
    await writeFile(`${_tempPath}/01.txt`, 'a');
    await writeFile(`${_tempPath}/02.txt`, 'b');
    await writeFile(`${_tempPath}/.funcignore`, '*.txt');
    const parser = FuncIgnore.readFuncignore(_tempPath);
    FuncIgnore.removeFilesFromFuncIgnore(_tempPath, parser);
    expect(await pathExists(`${_tempPath}/01.txt`)).to.be.false;
    expect(await pathExists(`${_tempPath}/02.txt`)).to.be.false;
  });

  it('should remove folder in the root directory', async function() {
    await mkdirp(`${_tempPath}/folder`);
    await writeFile(`${_tempPath}/.funcignore`, 'folder');
    const parser = FuncIgnore.readFuncignore(_tempPath);
    FuncIgnore.removeFilesFromFuncIgnore(_tempPath, parser);
    expect(await pathExists(`${_tempPath}/folder`)).to.be.false;
  });

  it('should remove files from subdirectory', async function() {
    await mkdirp(`${_tempPath}/subdirectory`);
    await writeFile(`${_tempPath}/subdirectory/03.txt`, 'c');
    await writeFile(`${_tempPath}/.funcignore`, '*.txt');
    const parser = FuncIgnore.readFuncignore(_tempPath);
    FuncIgnore.removeFilesFromFuncIgnore(_tempPath, parser);
    expect(await pathExists(`${_tempPath}/subdirectory/03.txt`)).to.be.false;
  });

  it('should not remove file with exclusion', async function() {
    await mkdirp(`${_tempPath}/subdirectory`);
    await writeFile(`${_tempPath}/subdirectory/05.txt`, 'e');
    await writeFile(`${_tempPath}/subdirectory/06.txt`, 'f');
    await writeFile(`${_tempPath}/.funcignore`, `
/subdirectory/*
!/subdirectory/06.txt
    `);
    const parser = FuncIgnore.readFuncignore(_tempPath);
    FuncIgnore.removeFilesFromFuncIgnore(_tempPath, parser);
    expect(await pathExists(`${_tempPath}/subdirectory/05.txt`)).to.be.false;
    expect(await pathExists(`${_tempPath}/subdirectory/06.txt`)).to.be.true;
  });
});
