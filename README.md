# Action for Github to deploy image in Rancher using Rancher API

## Inputs

### `rancherUrlApi`

**Required** API Url of your rancher project workload.

### `rancherAccessKey`

**Required** API Access key created in Rancher.

### `rancherSecretKey`

**Required** API Secret key created in Rancher.

### `dockerImage`

**Required** Docker image to deploy (e.g., `myregistry/myimage:tag`).

### `serviceName`

**Required** Name of your service on rancher cluster what you want deploy.

### `projectId`

**Optional** ID of the project to filter workloads.

### `namespaceId`

**Optional** ID of the namespace to filter workloads.

### `targetContainers`

**Optional** Comma-separated list of container indices to update (e.g., `0,1,2`). Defaults to `0` (first container only).

## Example usage

### Basic usage

```yml
- name: Rancher Deploy
  uses: giautm/rancher-deploy-action@v0.1.11
  with:
    rancherUrlApi: ${{ secrets.RANCHER_URL_API }}
    rancherAccessKey: ${{ secrets.RANCHER_ACCESS_KEY}}
    rancherSecretKey: ${{ secrets.RANCHER_SECRET_KEY }}
    dockerImage: ${{ fromJSON(steps.docker-meta.outputs.json).tags[0] }}
    serviceName: 'myProject'
    namespaceId: 'xxxxxxxx'
```

### With project filter and multiple containers

```yml
- name: Rancher Deploy
  uses: giautm/rancher-deploy-action@v0.1.11
  with:
    rancherUrlApi: ${{ secrets.RANCHER_URL_API }}
    rancherAccessKey: ${{ secrets.RANCHER_ACCESS_KEY}}
    rancherSecretKey: ${{ secrets.RANCHER_SECRET_KEY }}
    dockerImage: ${{ fromJSON(steps.docker-meta.outputs.json).tags[0] }}
    serviceName: 'myProject'
    projectId: 'c-xxxxx:p-xxxxx'
    namespaceId: 'xxxxxxxx'
    targetContainers: '0,1,2'
```
