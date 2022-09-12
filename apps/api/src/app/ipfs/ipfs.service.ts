import { Injectable } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
@Injectable()
export class IpfsService {
	baseURL: string;
	constructor(
		private readonly httpService: HttpService
	) {
		this.baseURL = process.env.IPFS_GATEWAY
	}
	async get(cid: string): Promise<string | any> {
		try {
			const data = await this.httpService.get(`${this.baseURL}/${cid}`, { 'responseType': 'arraybuffer' }).toPromise();
			console.log('data from IPFS', data.statusText, data.data.length);
			if (data.statusText === 'OK') return data.data; else return false;
		} catch (error) {
			return false;
		}
	}

}
