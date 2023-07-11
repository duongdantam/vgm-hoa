import axios from 'axios';
import pAny from 'p-any';

const DEFAULT_FINDERS = [
	'https://find.vgm.tv',
	'https://ipfs.io/ipns/find.vgm.tv',
	'https://gateway.vgm.tv/ipns/find.vgm.tv',
];

export const STATIC_FINDER: FindObject = {
	site: 'https://fuyin.tv',
	tracker: 'https://vgm-speaker-dana.glitch.me',
	api: 'QmV5cpEYnxEyQ6yaZrypyzMAFq8xSD2S9Uj445qmjYEdE6',
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
		'https://cdn.vgm.tv',
		'https://cdn1.vgm.tv',
		'https://cdn-ct.vgm.tv',
		'https://ipfs.io',
		'https://cloudflare-ipfs.com',
		'https://gateway.pinata.cloud',
		'https://storage3.bit.tube',
	],
	gatewaysweak: ['http://cdn.vgm.tv'],
	peers: [
		"/dns4/node0.hjm.bid/udp/4001/quic-v1/p2p/12D3KooWJVA45ydfCAqRTjJ4SHxdsbyGehvK5EgPwvEM5ifsLPeY",
		"/dns4/node1.hjm.bid/udp/4001/quic-v1/p2p/12D3KooWMTonuzH86waA39BYPpCeM4sCuEePBfsfiGret2mhcerL",
		"/dns4/ct1.hjm.bid/udp/4001/quic-v1/p2p/12D3KooWQRn6fopodKZfuZhBZTLrb8UXNTmDX1EgMj6if8g1xBUh",
		"/dns4/hn1.hjm.bid/udp/4001/quic-v1/p2p/12D3KooWSNoAtqfCUC1BA333gZQJyA95ye4gFnCaDgWxDP9sY7dG",
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
