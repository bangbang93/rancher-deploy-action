import got, {HTTPError} from 'got';
import {URL} from 'url';

type DeploymentConfig = {
  image: string;
  name: string;
};

type WorkloadActions = {
  redeploy: string;
  pause?: string;
  resume?: string;
  rollback?: string;
};

type WorkloadLinks = {
  remove: string;
  revisions: string;
  self: string;
  update: string;
  yaml: string;
};

type Container = {
  image: string;
  imagePullPolicy: 'Always';
  name: string;
};

type Workload = {
  id: string;
  actions: WorkloadActions;
  baseType: 'workload';
  containers: Container[];
  created: string;
  links: WorkloadLinks;
  name: string;
  namespaceId: string;
  paused: boolean;
  projectId: string;
};

type ProjectLinks = {
  workloads: string;
};

type Project = {
  id: string;
  name: string;
  namespaceId: string | null;
  links: ProjectLinks;
};

class Rancher {
  private readonly headers: Record<string, string>;
  private readonly gotInstance: typeof got;

  constructor(private readonly rancherUrlApi: string, rancherAccessKey: string, rancherSecretKey: string) {
    const token = Buffer.from(rancherAccessKey + ':' + rancherSecretKey).toString('base64');
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + token
    };

    this.gotInstance = got.extend({
      headers: this.headers,
      responseType: 'json',
      throwHttpErrors: true
    });
  }

  async fetchProjectsAsync(projectId?: string) {
    const url = new URL(`${this.rancherUrlApi}/projects`);
    if (projectId) {
      url.searchParams.append('id', projectId);
    }

    const response = await this.gotInstance.get(url.toString()).json();
    return response as {
      data: Project[];
    };
  }

  async fetchProjectWorkloadsAsync(project: Project, namespaceId?: string) {
    const {links} = project;
    const url = new URL(links.workloads);
    if (namespaceId) {
      url.searchParams.append('namespaceId', namespaceId);
    }

    const response = await this.gotInstance.get(url.toString()).json();
    return response as {
      data: Workload[];
    };
  }

  async changeImageAsync(wl: Workload, config: DeploymentConfig, targetContainers: number[] = [0]): Promise<Workload> {
    const {links} = wl;

    try {
      const data = (await this.gotInstance.get(links.self).json()) as any;

      for (const index of targetContainers) {
        if (data.containers[index]) {
          data.containers[index].image = config.image;
        }
      }

      const {actions} = data;
      const response = await this.gotInstance
        .post(actions.redeploy, {
          json: data
        })
        .json();

      return response as Workload;
    } catch (error: any) {
      if (error instanceof HTTPError && error.response.statusCode === 404) {
        const data = {
          containers: [
            {
              ...config,
              imagePullPolicy: 'Always'
            }
          ],
          name: config.name,
          namespaceId: wl.namespaceId
        };

        const response = await this.gotInstance
          .post(links.update, {
            json: data
          })
          .json();

        return response as Workload;
      }
      throw error;
    }
  }
}

export default Rancher;
