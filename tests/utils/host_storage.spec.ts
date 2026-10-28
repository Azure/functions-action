import { expect } from 'chai';
import { HostStorage } from '../../src/utils';

describe('host storage', function () {
  describe('isConfigured', function () {
    it('should accept a connection string', function () {
      expect(HostStorage.isConfigured({ AzureWebJobsStorage: 'DefaultEndpointsProtocol=https;AccountName=x' })).is.true;
    });

    [
      'AzureWebJobsStorage__accountName',
      'AzureWebJobsStorage__blobServiceUri',
      'AzureWebJobsStorage__queueServiceUri',
      'AzureWebJobsStorage__tableServiceUri',
      'AzureWebJobsStorage__credential',
      'AzureWebJobsStorage__clientId'
    ].forEach(key => {
      it(`should accept ${key}`, function () {
        expect(HostStorage.isConfigured({ [key]: 'value' })).is.true;
      });
    });

    it('should reject settings without host storage', function () {
      expect(HostStorage.isConfigured({ FUNCTIONS_WORKER_RUNTIME: 'dotnet-isolated' })).is.false;
    });

    it('should reject empty values and unrelated prefixes', function () {
      expect(HostStorage.isConfigured({ AzureWebJobsStorage: '', AzureWebJobsStorage__accountName: '' })).is.false;
      expect(HostStorage.isConfigured({ AzureWebJobsStorageOther: 'value' })).is.false;
    });

    it('should reject undefined settings', function () {
      expect(HostStorage.isConfigured(undefined)).is.false;
    });
  });

  describe('getBlobServiceUri', function () {
    it('should prefer the blob service uri', function () {
      expect(HostStorage.getBlobServiceUri('https://a.blob.core.windows.net', 'b')).equals('https://a.blob.core.windows.net');
    });

    it('should derive the uri from the account name', function () {
      expect(HostStorage.getBlobServiceUri(undefined, 'b')).equals('https://b.blob.core.windows.net');
    });

    it('should return undefined when neither is set', function () {
      expect(HostStorage.getBlobServiceUri(undefined, undefined)).is.undefined;
    });
  });
});
