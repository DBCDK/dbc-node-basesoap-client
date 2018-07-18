'use strict';

import * as soap from 'soap';
import * as util from 'util';

let BaseSoapClient = {};

/**
 * @param {String} wsdl The URL where the WSDL for the given service can be retrieved
 * @param {Object} config a object containe
 * @param {Object} logger An optional logger object
 * @return {{request: call}}
 */
BaseSoapClient.client = (wsdl, config, logger) => {
  let _soapclient;

  /**
   * Returns a promise for a new client
   * @param  {String} wsdl URL for service WSDL
   * @param {Object }params
   * @return {Promise}
   */
  function createClient(wsdl, params) { // eslint-disable-line
    return new Promise(function (resolve, reject) {
      if (_soapclient) {
        resolve(_soapclient);
      }
      // Create soap client from a given wsdl
      soap.createClient(wsdl, params, function (err, client) {
        // Resolve promise from result
        if (err) {
          reject(err);
        }
        else {
          _soapclient = client;
          resolve(client);
        }
      });
    });
  }

  /**
   * Returns a promise for a request
   * @param  {Object} client  soap client object
   * @param  {String} op      Action on service
   * @param  {Object} options Options for request
   * @return {Promise}
   */
  function callAction(client, op, options) {

    return new Promise(function (resolve, reject) {
      let query = util._extend({}, options);

      if(!client){
        return reject('client is not initialized.')
      }

      client[op](query, (err, result, raw, soapHeader) => { // eslint-disable-line
        if (logger) {
          logger.log('info', 'soap response', {
            service: op,
            params: options,
            err: err,
            result: result,
            soapRequest: client.lastRequest,
            statInfo: (result.result && result.result.statInfo) ? result.result.statInfo : ''
          });
        }
        if (err) {
          reject(err);
        }
        else if (result) {
          result.raw = raw;
          result.soapHeader = soapHeader;
          resolve(result);
        }
        else {
          reject('no error or result.');
        }
      });
    });
  }

  /**
   * Make request to soap service
   * @param  {String} action  Type of request
   * @param  {Object} params map of params
   * @param  {Object} opt map of extra options i.e. alternative endpoint
   * @return {Promise}
   */
  return {
    request(action, params, opt) {
      let options = opt || {};
      return createClient(wsdl, options).then(client => {
        let o = util._extend(config, params);
        return callAction(client, action, o);
      });
    }
  };
};

export default BaseSoapClient;

