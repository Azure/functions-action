import { expect } from 'chai';
import { Logger } from '../../src/utils/logger';
import { LogLevelConstant } from '../../src/constants/log_level';
import { IPrinter } from '../../src/interfaces/IPrinter';

describe('logger', function () {
  let _loggedMessage: string;

  const _mockPrinter: IPrinter = (message) => {
    _loggedMessage = message;
  }

  const _envBackup = process.env;

  beforeEach(() => {
    Logger.SetLevel(Logger.DefaultLogLevel);
    process.env = { ..._envBackup };
    _loggedMessage = '';
  });

  afterEach(() => {
    process.env = _envBackup;
  });

  it('should have a default log level set to debug', function() {
    expect(Logger.DefaultLogLevel).equal(LogLevelConstant.Debug)
  });

  it('should have debug level log disabled by default', function() {
    Logger.Debug('debug-should-not-be-printed', _mockPrinter);
    expect(_loggedMessage).is.empty;
  });

  it('should enable debug level when github action in debug mode', function() {
    process.env.GITHUB_ACTION_DEBUG = '1';
    Logger.Debug('debug-enabled', _mockPrinter);
    expect(_loggedMessage).equal('debug-enabled');
  });

  it('should disable debug log when set to info or above', function() {
    process.env.GITHUB_ACTION_DEBUG = '1';
    [LogLevelConstant.Info,
      LogLevelConstant.Warning,
      LogLevelConstant.Error,
      LogLevelConstant.Off
    ].forEach(level => {
      Logger.SetLevel(level);
      Logger.Debug('debug-disabled', _mockPrinter);
      expect(_loggedMessage).is.empty;
    });
  });

  it('should emit info log by default', function() {
    Logger.Info('info-enabled', _mockPrinter);
    expect(_loggedMessage).equal('info-enabled');
  });

  it('should disable info log when set to warning or above', function() {
    [LogLevelConstant.Warning,
      LogLevelConstant.Error,
      LogLevelConstant.Off
    ].forEach(level => {
      Logger.SetLevel(level);
      Logger.Info('info-enabled', _mockPrinter);
      expect(_loggedMessage).is.empty;
    });
  });

  it('should emit warning log by default', function() {
    Logger.Warn('warning-enabled', _mockPrinter);
    expect(_loggedMessage).equal('warning-enabled');
  });

  it('should disable warning log when set to error or above', function() {
    [LogLevelConstant.Error,
      LogLevelConstant.Off
    ].forEach(level => {
      Logger.SetLevel(level);
      Logger.Warn('warning-disabled', _mockPrinter);
      expect(_loggedMessage).is.empty;
    });
  });

  it('should emit error log by default', function() {
    Logger.Error('error-enabled', _mockPrinter);
    expect(_loggedMessage).equal('error-enabled');
  });

  it('should disable warning log when set to off', function() {
    [LogLevelConstant.Off].forEach(level => {
      Logger.SetLevel(level);
      Logger.Error('error-disabled', _mockPrinter);
      expect(_loggedMessage).is.empty;
    });
  });
});