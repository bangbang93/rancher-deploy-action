import * as core from '@actions/core';

import {getInputs} from './context.js';
import Rancher from './rancher.js';

try {
  const input = await getInputs();
  const {rancher, dockerImage, serviceName, projectId, namespaceId} = input;

  const client = new Rancher(rancher.urlApi, rancher.accessKey, rancher.secretKey);

  let findOne = false;
  const {data: projects} = await client.fetchProjectsAsync(projectId);
  for (const project of projects) {
    const {data: workloads} = await client.fetchProjectWorkloadsAsync(project);
    for (const workload of workloads) {
      const result = await client.changeImageAsync(
        workload,
        {
          name: serviceName,
          image: dockerImage
        },
        input.targetContainers
      );

      core.info(`deploy successful for ${result.id}`);
      findOne = true;
    }
  }

  if (!findOne) {
    core.setFailed(`Couldn't found workload "${serviceName}" in namespace "${namespaceId}", project "${projectId}"`);
  }
} catch (err) {
  core.setFailed(err as Error);
}
