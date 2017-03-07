const request = require('request');
const aws4 = require('aws4');
const https = require('https');

function signedRequest(path, config) {
  var opts = {
    service: 's3',
    path: `/${config.bucket}${path}?X-Amz-Expires=${config.expires}`,
    signQuery: true
  };
  return(aws4.sign(opts));
}

function sendResponse(_req, res, next, method, url) {
  const req = _req;
  https.request(url, function(awsResponse){
    awsResponse.pipe(res);
  }).end();
}

function proto(config) {
  return function _s3BasicAuth(req, res, next) {
    // Encode basic auth string
    let auth = Buffer.from(config.credentials, 'ascii').toString('base64');
    auth = `Basic ${auth}`;

    // Send a success or failure
    if (req.get('Authorization') === auth) {
      const url = signedRequest(req.originalUrl, config);
      sendResponse(req, res, next, config.method, url);
    } else {
      res.append('WWW-Authenticate', 'Basic realm="User Visible Realm"');
      res.status(401).end();
    }
  };
}

function s3BasicAuth(config) {
  return proto(config);
}

module.exports = s3BasicAuth;
