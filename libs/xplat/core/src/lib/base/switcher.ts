import pSome from 'p-some';
import pAny from 'p-any';
import { pipe, map, flatten } from 'ramda';
import { STATIC_FINDER, IPFSNode, FindObject } from './find';
import { fetchFn } from './helpers';

const DEFAULT_CONTENT_CHECKER = `topics/list/home.video.json`;

/**
 * Switcher class help us find the most stable, accessible gateway.
 * An api hash is hosted on a master node, then replicated it via DNS caching to another nodes in the network.
 * All we have to do here is find the latest api key and accessible gateway.
 * Any available gateway will be accessible to any online nodes in the network, so we only have to find one gateway that is reachable, then based on that gateway we will try to connect with known node to find latest API hash.
 */
export class Switcher {
  public api: string = '';
  public gateway: string = '';
  public thumbnails: string = '';
  public availableGateways: string[] = [];
  public finder: FindObject = STATIC_FINDER;

  constructor(gateway?: string, api?: string, thumbnails?: string) {
    // Load from static finder
    this.api = api || this.finder.api;
    this.gateway = gateway || this.finder.gateways[0];
    this.thumbnails = thumbnails || this.finder.thumbnails;
  }

  /**
   * Start load gateway and api to fetch the latest stable one.
   * This method will be invoke manually.
   */
  async load(finder: FindObject = STATIC_FINDER) {
    this.finder = finder; // Override static finder with the latest one from internet.
    // Skip fetching if data alread cached
    if (this.api && this.gateway && this.thumbnails) {
      this.availableGateways = [this.gateway];
      return {
        gateway: this.gateway,
        api: this.api,
        thumbnails: this.thumbnails,
      };
    }
    this.fallbackAPI();
    this.fallbackGateway();
    try {
      const gateway = await this.loadStableGateway();
      const { api, thumbnails } = await this.loadStableAPI();
      return { gateway, api, thumbnails };
    } catch (err) {
      throw err;
    }
  }

  async loadStableGateway() {
    this.availableGateways = await this.findAvailableGateways();
    this.gateway = this.availableGateways[0];
    this.availableGateways = [this.gateway];
    return this.gateway;
  }

  async loadStableAPI() {
    // Load stable via ipns with limited timeout
    // When it is not resolvable, resolve the finder instead.
    const latestData = await pAny([
      this.fetchLatestData(),
      this.getDefaultFinder(),
    ]);
    if (latestData) {
      this.api = latestData.api;
      this.thumbnails = latestData.thumbnails;
      return { api: this.api, thumbnails: this.thumbnails };
    } else {
      this.fallbackAPI();
    }
  }

  async getDefaultFinder(): Promise<FindObject> {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.finder);
      }, 3000);
    });
  }

  async fetchLatestData(): Promise<FindObject> {
    const buildUrl = pipe(
      map((gateway) =>
        map((node: IPFSNode) => `${gateway}/ipns/${node.id}`, this.finder.nodes)
      ),
      flatten,
      map((url: any) => fetchFn(url as string))
    )(this.availableGateways);
    const { data } = await pAny(buildUrl);
    return 'api' in data ? data : null;
  }

  /**
   * Find available gateways order by fastest that we can get access to.
   */
  async findAvailableGateways(): Promise<string[]> {
    const { api, gateways } = this.finder;
    const allGateways = gateways.map((gateway) =>
      fetchFn(`${gateway}/ipfs/${api}/${DEFAULT_CONTENT_CHECKER}`, 5000).then(
        () => gateway
      )
    );
    return await pSome(allGateways, { count: Math.round(gateways.length / 2) });
  }

  /**
   * We will fallback to the api in the finder instead of api found in nodes
   */
  private fallbackAPI() {
    // Use not up to date api as default
    this.api = this.finder.api;
  }

  private fallbackGateway() {
    // Use first gateway from finder if not yet present
    this.gateway = this.finder.gateways[0];
  }
}

export const createSwitcher = (...args: any[]) => new Switcher(...args);
