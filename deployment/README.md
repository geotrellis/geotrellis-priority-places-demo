### Deploying Priority Places

This directory contains the ansible playbook for deploying *priority places* to development and production servers.

#### ESRI credentials

There is a file `credentials.yaml` that is not contained in source code but is required for running this application. This contains information on ESRI API OAuth credentials (see http://resources.arcgis.com/en/help/arcgis-rest-api/index.html#//02r300000268000000). It should go in the `deployment` (this) directory.

credentials.yml should look like this:

```yaml
---
credentials_esri_oauthusr: CLIENT ID HERE
credentials_esri_oauthpwd: CLIENT SECRET HERE
```

#### Deploying to a development VM using vagrant

With vagrant installed, simply issue:

`vagrant up`

The app should be available at http://192.168.88.88/ once the VM is provisioned.

#### Deploying

To deploy, you'll need to add the deployment server to the `hosts` file (there are TODO's to be replaced). Also, if you need to use a different user than 'ubuntu', this must be replaced in the `hosts` file as well as the var for the home directory in the `site_deploy.yml` file.

Once this is done, you can provision the production server using the ansible-playbook command:

`ansible-playbook -i hosts site-deploy.yml`

