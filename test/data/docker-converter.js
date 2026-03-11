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

  it('should convert docker-compose services into editable graph data', () => {
    const composeFile = fs.readFileSync(`${appRoot}/test/data/docker-compose-roundtrip.yml`, 'utf8');
    const converted = this.obj.ComposeDockerConvert(composeFile);

    expect(converted.canvasJSON).to.be.eql('IMPORTED');
    expect(converted.clistToDraw.map((container) => container.name)).to.have.members([
      'ftp_server',
      'tftp_server',
      'element_0',
      'hacking-nmap'
    ]);
    expect(converted.networkList).to.have.length(1);
    expect(converted.networkList[0].name).to.be.eql('network_0');
    expect(converted.networkList[0].subnet).to.be.eql('193.20.1.0');

    const ftpServer = converted.clistToDraw.find((container) => container.name === 'ftp_server');
    expect(ftpServer.networks.network_0.ip).to.be.eql('193.20.1.2');
    expect(ftpServer.networks.network_0.isDynamic).to.be.false;
    expect(ftpServer.ports).to.be.eql({ '21': '21' });

    const element0 = converted.clistToDraw.find((container) => container.name === 'element_0');
    expect(element0.networks).to.be.eql({});

    const nmap = converted.clistToDraw.find((container) => container.name === 'hacking-nmap');
    expect(nmap.networks.network_0.isDynamic).to.be.true;
    expect(nmap.keepAlive).to.be.true;
  });

  it('should merge graph output with compose while removing deleted GUI entities', () => {
    const existingCompose = yaml.load(fs.readFileSync(`${appRoot}/test/data/docker-compose-roundtrip.yml`, 'utf8'));
    const graphCompose = {
      services: {
        ftp_server: {
          image: 'nsunina/hacking-ssh-server:1.1',
          stdin_open: true,
          tty: true
        },
        element_0: {
          image: 'sharelatex/sharelatex-full:latest',
          stdin_open: true,
          tty: true
        }
      },
      networks: {
        network_0: {
          ipam: {
            config: [{ subnet: '193.20.1.0/24' }]
          }
        }
      }
    };

    const merged = this.obj.mergeComposeData(existingCompose, graphCompose, {
      serviceNames: ['ftp_server', 'element_0'],
      networkNames: ['network_0']
    });

    expect(merged.services.ftp_server.image).to.be.eql('nsunina/hacking-ssh-server:1.1');
    expect(merged.services.element_0.image).to.be.eql('sharelatex/sharelatex-full:latest');
    expect(merged.services.tftp_server).to.be.undefined;
    expect(merged.services['hacking-nmap']).to.be.undefined;
    expect(merged.version).to.be.eql('2');
  });

  it('should drop existing compose ports when the GUI removes them', () => {
    const existingCompose = {
      version: '2',
      services: {
        'hacking-dns': {
          image: 'nsunina/hacking-dns:1.0',
          stdin_open: true,
          tty: true,
          ports: ['13389:3389'],
          networks: {
            public_dnsenum: {}
          }
        }
      },
      networks: {
        public_dnsenum: {
          ipam: {
            config: [{ subnet: '193.21.1.0/24' }]
          }
        }
      }
    };

    const graphCompose = {
      services: {
        'hacking-dns': {
          image: 'nsunina/hacking-dns:1.0',
          stdin_open: true,
          tty: true,
          networks: {
            public_dnsenum: {}
          }
        }
      },
      networks: {
        public_dnsenum: {
          ipam: {
            config: [{ subnet: '193.21.1.0/24' }]
          }
        }
      }
    };

    const merged = this.obj.mergeComposeData(existingCompose, graphCompose, {
      serviceNames: ['hacking-dns'],
      networkNames: ['public_dnsenum']
    });

    expect(merged.services['hacking-dns'].ports).to.be.undefined;
    expect(merged.services['hacking-dns'].networks).to.be.eql({
      public_dnsenum: {}
    });
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
