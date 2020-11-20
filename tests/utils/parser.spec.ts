import { expect, assert } from 'chai';
import { Parser } from '../../src/utils';

describe('parser', function () {
  it('should parse true like value', function() {
    ['1',
      't', 'T', 'true', 'True', 'TRUE',
      'y', 'Y', 'yes', 'Yes', 'YES'
    ].forEach(value => expect(Parser.IsTrueLike(value)).is.true);
  });

  it('should parse false like value', function() {
    ['0',
      'f', 'F', 'false', 'False', 'FALSE',
      'n', 'N', 'no', 'No', 'NO'
    ].forEach(value => expect(Parser.IsFalseLike(value)).is.true);
  });

  it('should recognize invalid value is not true like', function() {
    ['', '42', '-42', 'what', '$'].forEach(
      value => expect(Parser.IsTrueLike(value)).is.false
    );
  });

  it('should recognize invalid value is not false like', function() {
    ['', '42', '-42', 'what', '$'].forEach(
      value => expect(Parser.IsFalseLike(value)).is.false
    );
  });

  it('should parse azure storage connection string (with ending semicolon)', function() {
    const result = Parser.GetAzureWebjobsStorage('DefaultEndpointsProtocol=https;AccountName=mockAccountName;AccountKey=mockAccountKey;EndpointSuffix=core.windows.net;');
    expect(result['DefaultEndpointsProtocol']).equal('https');
    expect(result['AccountName']).equal('mockAccountName');
    expect(result['AccountKey']).equal('mockAccountKey');
    expect(result['EndpointSuffix']).equal('core.windows.net');
  });

  it('should parse azure storage connection string (without ending semicolon)', function() {
    const result = Parser.GetAzureWebjobsStorage('DefaultEndpointsProtocol=https;AccountName=mockAccountName;AccountKey=mockAccountKey;EndpointSuffix=core.windows.net');
    expect(result['DefaultEndpointsProtocol']).equal('https');
    expect(result['AccountName']).equal('mockAccountName');
    expect(result['AccountKey']).equal('mockAccountKey');
    expect(result['EndpointSuffix']).equal('core.windows.net');
  });

  it('should return empty dictionary when azure storage connection string is empty', function() {
    const result = Parser.GetAzureWebjobsStorage('');
    expect(result).is.empty;
  });

  it('should throw an error when parsing malformed azure storage connection string', function() {
    assert.throw(
      () => Parser.GetAzureWebjobsStorage('malformed'),
      'Failed to convert malformed to AzureWebjobsStorage'
    );
  });
});