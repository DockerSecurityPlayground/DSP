const expect = require('chai').expect;
const appRoot = require('app-root-path');

const dockerConverter = require(`${appRoot}/app/data/docker-converter.js`);

const fs = require('fs');
const yaml = require('js-yaml');
const jsonfile = require('jsonfile');

function normalizeComposeForCurrentCode(data) {
  const normalized = JSON.parse(JSON.stringify(data));
  delete normalized.version;

  if (normalized.networks) {
    Object.values(normalized.networks).forEach((network) => {
      const subnet = network
        && network.ipam
        && Array.isArray(network.ipam.config)
        && network.ipam.config[0]
        && network.ipam.config[0].subnet;

      if (typeof subnet === 'string' && subnet.includes('/')) {
        const [ip, mask] = subnet.split('/');
        const octets = ip.split('.');
        if (octets.length === 4) {
          octets[3] = '0';
          network.ipam.config[0].subnet = `${octets.join('.')}/${mask}`;
        }
      }
    });
  }

  return normalized;
}

describe('DockerAPIService test', () => {
  before(() => {
   // Object to testing
    this.obj = dockerConverter;
  });



// Test Docker compose
  const tests = [
    // {
    //   description: 'Test with 24 bit networks no environment , from file',
    //   yamlFile: `${appRoot}/test/data/files/yaml_network.yml`,
    //   jsonFile: `${appRoot}/test/data/files/yaml_network.json`,
    // },
    // {
    //   description: 'Test one container with ports',
    //   yamlFile: `${appRoot}/test/data/files/yaml_oneport.yml`,
    //   jsonFile: `${appRoot}/test/data/files/yaml_oneport.json`,
    // },
    // {
    //   description: 'Test environments ',
    //   yamlFile: `${appRoot}/test/data/files/yaml_env.yml`,
    //   jsonFile: `${appRoot}/test/data/files/yaml_env.json`,
    // },
    // {
    //   description: 'Test dependsOn ',
    //   yamlFile: `${appRoot}/test/data/files/depends_on.yml`,
    //   jsonFile: `${appRoot}/test/data/files/depends_on.json`,
    // },
    {
      description: 'Test volumes ',
      yamlFile: `${appRoot}/test/data/files/volumes.yml`,
      jsonFile: `${appRoot}/test/data/files/volumes.json`,
    },
    {
      description: 'Test with capabilities',
      yamlFile: `${appRoot}/test/data/files/yaml_caps.yml`,
      jsonFile: `${appRoot}/test/data/files/caps.json`,
    }
  ];

  it("Should not give error if labels does not exist", (done) => {
      const jsonFile = `${appRoot}/test/data/files/caps.json`;
      const converted = jsonfile.readFileSync(jsonFile);
      const ret = this.obj.JSONDockerComposeConvert(converted.clistDrawed, converted.networkList)
      // expect().to.not.throw();
      done();
  });

  tests.forEach((test) => {
    it(test.description, () => {
      const file = fs.readFileSync(test.yamlFile, 'utf8');
      const data = normalizeComposeForCurrentCode(yaml.load(file));
      const converted = jsonfile.readFileSync(test.jsonFile);
      const jsonCompose =
          this.obj.JSONDockerComposeConvert(converted.clistDrawed, converted.networkList);
      expect(JSON.parse(jsonCompose)).to.be.eql(data);
    });
  });
});
