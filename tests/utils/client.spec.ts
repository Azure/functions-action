import { expect, assert } from 'chai';
import { Server } from 'http';
import * as express from 'express';
import { Client } from '../../src/utils';
import { IScmCredentials } from '../../src/interfaces/IScmCredentials';
import { isYieldExpression } from 'typescript';

describe('client', function() {
  let _app: express.Express;
  let _server: Server;
  const _port: number = 8080;
  const _url: string = `http://localhost:${_port}`;

  describe('ping', function() {
    beforeEach(() => {
      _app = express();
      _app.get('/ping200', function(req, res) {
        res.status(200).send('success-with-200');
      });
      _app.get('/ping500', function(req, res) {
        res.status(500).send('internal-server-error-500');
      });
      _app.get('/ping409', function(req, res) {
        res.status(409).send('not-retriable-error-code-409');
      });
      _server = _app.listen(_port);
    });

    afterEach(() => {
      _server.close();
    });

    it('GET 200', async function() {
      const response = await Client.ping(`${_url}/ping200`);
      expect(response.statusCode).to.equal(200);
      expect(response.body).to.equal('success-with-200');
    });

    it('GET 409 (not retriable)', async function() {
      const preInvokeMs: number = Date.now();
      const response = await Client.ping(`${_url}/ping409`, 2, 0.1);
      const postInvokeMs: number = Date.now();
      expect(response.statusCode).to.equal(409);
      expect(response.body).to.equal('not-retriable-error-code-409');
      expect(postInvokeMs - preInvokeMs < 100).to.be.true;
    });

    it('GET 500 (2 retries)', async function() {
      const preInvokeMs: number = Date.now();
      const response = await Client.ping(`${_url}/ping500`, 2, 0.1);
      const postInvokeMs: number = Date.now();
      expect(response.statusCode).to.equal(500);
      expect(response.body).to.equal('internal-server-error-500');
      expect(postInvokeMs - preInvokeMs > 100).to.be.true;
    });
  });

  describe('updateAppSettingViaKudu', function() {
    beforeEach(() => {
      _app = express();
      _app.use(express.json());
      _app.post('/api/settings', function(req, res) {
        res.status(200).json({
          'app-settings': req.body,
          'content-type': req.header('Content-Type'),
          'authorization': req.header('Authorization')
        });
      });
      _server = _app.listen(_port);
    });

    afterEach(() => {
      _server.close();
    });

    it('POST 200', async function() {
      const scm: IScmCredentials = {
        appUrl: `http://mockapp.azurewebsites.net`,
        username: 'mockUsername',
        password: 'mockPassword',
        uri: _url,
      };
      const credentialBase64: string = Buffer.from('mockUsername:mockPassword').toString('base64');
      const response = await Client.updateAppSettingViaKudu(scm, { MOCK_SETTING: 'MOCK_VALUE' });
      expect(response.statusCode).to.equal(200);
      expect(response.body['app-settings']).to.deep.equal({ MOCK_SETTING: 'MOCK_VALUE' });
      expect(response.body['content-type']).to.equal('application/json');
      expect(response.body['authorization']).to.equal(`Basic ${credentialBase64}`);
    });
  });

  describe('deleteAppSettingViaKudu', function() {
    beforeEach(() => {
      _app = express();
      _app.use(express.json());
      _app.delete('/api/settings/:key', function(req, res) {
        res.status(200).json({
          'deleted-app-setting': req.params.key,
          'content-type': req.header('Content-Type'),
          'authorization': req.header('Authorization')
        });
      });
      _server = _app.listen(_port);
    });

    afterEach(() => {
      _server.close();
    });

    it('DELETE 200', async function() {
      const scm: IScmCredentials = {
        appUrl: `http://mockapp.azurewebsites.net`,
        username: 'mockUsername',
        password: 'mockPassword',
        uri: _url,
      };
      const credentialBase64: string = Buffer.from('mockUsername:mockPassword').toString('base64');
      const response = await Client.deleteAppSettingViaKudu(scm, 'MOCK_SETTING');
      expect(response.statusCode).to.equal(200);
      expect(response.body['deleted-app-setting']).to.equal('MOCK_SETTING');
      expect(response.body['content-type']).to.equal('application/json');
      expect(response.body['authorization']).to.equal(`Basic ${credentialBase64}`);
    });
  });
});