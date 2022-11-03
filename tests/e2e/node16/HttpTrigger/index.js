var lodash = require('lodash');
var fs = require('fs');

module.exports = async function (context, req) {
    const folder = context.executionContext.functionDirectory;
    const filePath = fs.realpathSync(`${folder}/../sha.txt`);
    const text = fs.readFileSync(filePath,'utf8');
    context.res = { body: text };
}