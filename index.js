const fs = require('fs');
const path = require('path');
const core = require('@actions/core');

try {
  const json = core.getInput('json', { required: true });
  const prefix = core.getInput('prefix') || '';
  const masked = (core.getInput('masked') || 'false') === 'true';

  const fullPath = path.resolve(json);
  core.info(`Processing file: ${fullPath}`);

  const rawdata = fs.existsSync(json) ? fs.readFileSync(json) : json;
  const rootObj = JSON.parse(rawdata);

  const processVariable = (variable, name) => {
    if (typeof variable === 'undefined' || variable === null) {
      return;
    }

    if (Array.isArray(variable)) {
      variable.forEach((value, index) => {
        processVariable(value, name ? `${name}_${index}` : `${index}`);
      });
    } else if (typeof variable === 'object') {
      for (const field in variable) {
        processVariable(variable[field], name ? `${name}_${field}` : `${field}`);
      }
    } else {
      if (masked) {
        core.setSecret(variable);
      }

      core.info(`SET ENV '${name}' = ${variable}`);
      core.exportVariable(name, variable.toString());
    }
  };

  core.info(`PREFIX: ${prefix}`);
  processVariable(rootObj, prefix);
} catch (error) {
  core.setFailed(error.message);
}
