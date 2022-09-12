import axios from 'axios';
import pAny from 'p-any';

const DEFAULT_FINDERS = [
  'https://find.vgm.tv',
  'https://ipfs.io/ipns/find.vgm.tv',
  'https://gateway.vgm.tv/ipns/find.vgm.tv',
];

export const STATIC_FINDER: FindObject = {
  site: 'https://vgm.tv',
  tracker: 'https://vgm-speaker-dana.glitch.me',
  api: 'QmQUXA1YZEyhrQg1D3UybaCG9K8ss7UL88YNqUCRSjwvKH',
  thumbnails: 'QmQeeJQE8sGosq82TaW6an89Z7eHeBPzWmGAmNL6cg8tJW',
  version: 1354,
  nodes: [
    {
      id: 'QmQjUXFjp9PnD4oyEHpj2ChJThtTjQjuQFVJiEs5BFqFrd',
      gateway: 'https://vn.gateway.vgm.tv',
      multiaddress:
        '/dns4/gateway-vn-hcm-master.duckdns.org/tcp/4001/ipfs/QmQjUXFjp9PnD4oyEHpj2ChJThtTjQjuQFVJiEs5BFqFrd',
      master: true,
    },
  ],
  gateways: [
    'https://gateway.vgm.tv',
    'https://gateway-vn-hcm-master.vgm.tv',
    'https://ipfs.io',
    'https://gateway.pinata.cloud',
    'https://storage3.bit.tube',
  ],
  gatewaysweak: ['http://gateway.vgm.cloud'],
  peers: [
    '/dns4/vn.gateway.vgm.tv/tcp/4001/ipfs/QmQjUXFjp9PnD4oyEHpj2ChJThtTjQjuQFVJiEs5BFqFrd',
    '/dns4/sg.gateway.vgm.tv/tcp/4001/ipfs/QmdYMzmS4vcRjMHMbpmJiDXvs9p4ck289QsDHmVsNfLmL4',
    '/dns4/vn-ntl.gateway.vgm.tv/tcp/4001/ipfs/QmZSnJJ1uj6pyMnXBwk7BxqtKWTWAKbU9wB6dtD7fGMb7e',
  ],
};

export interface IPFSNode {
  id: string;
  gateway: string;
  multiaddress: string;
  master: boolean;
}

export interface FindObject {
  site: string;
  tracker: string;
  api: string;
  thumbnails: string;
  version: number;
  nodes: IPFSNode[];
  gateways: string[];
  gatewaysweak: string[];
  peers: string[];
}

/**
 * Loop through each hard-coded finders to get latest available nodes.
 * This function will find the fastest finder gateway without waiting in a line.
 * @return {Promise<FindObject>}
 */
export const find = async (): Promise<FindObject> => {
  const response = await pAny(
    DEFAULT_FINDERS.map((finder) => axios.get(finder))
  );
  let result = null;
  if (response.status === 200 && 'api' in response.data) {
    result = response.data;
  }
  return result;
};
