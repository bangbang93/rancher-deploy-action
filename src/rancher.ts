import fetch from 'node-fetch';

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
  private readonly headers: any;

  constructor(private readonly rancherUrlApi: string, rancherAccessKey: string, rancherSecretKey: string) {
    const token = Buffer.from(rancherAccessKey + ':' + rancherSecretKey).toString('base64');
    this.headers = {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      Authorization: 'Basic ' + token,
    };
  }

  async fetchProjectsAsync(projectId?: string) {
    const url = new URL(`${this.rancherUrlApi}/projects`);
    if (projectId) {
      url.searchParams.append('id', projectId);
    }
    const req = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers
    });

    return req.json() as Promise<{
      data: Project[];
    }>;
  }

  async fetchProjectWorkloadsAsync(project: Project, namespaceId?: string) {
    const {links} = project;
    const url = new URL(links.workloads);
    if (namespaceId) {
      url.searchParams.append('namespaceId', namespaceId);
    }
    const req = await fetch(url.toString(), {
      method: 'GET',
      headers: this.headers
    });

    return req.json() as Promise<{
      data: Workload[];
    }>;
  }

  async changeImageAsync(wl: Workload, config: DeploymentConfig, targetContainers: number[] = [0]): Promise<Workload> {
    const {links} = wl;

    const req = await fetch(links.self, {method: 'GET', headers: this.headers});
    if (req.status === 404) {
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

      const req2 = await fetch(links.update, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data)
      });

      return req2.json() as Promise<Workload>;
    } else {
      const data: any = await req.json();
      for (const index of targetContainers) {
        if (data.containers[index]) {
          data.containers[index].image = config.image;
        }
      }

      const {actions} = data;
      const req2 = await fetch(actions.redeploy, {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify(data)
      });

      return req2.json() as Promise<Workload>;
    }
  }
}

export default Rancher;
