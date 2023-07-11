'use strict';
// const wrtc = require('wrtc');
// const { WebRTCStar } = require('libp2p-webrtc-star');
// import { precacheAndRoute } from 'workbox-precaching';
import pAny from 'p-any';
const { create } = require('ipfs-core');
const { Server, IPFSService } = require('ipfs-message-port-server');
const main = async () => {
  console.info('Running SharedWorker...');
  try {
    const filterManifest = self.__WB_MANIFEST.filter((entry) => {
      return entry.url.endsWith('.js');
    });
    // precacheAndRoute(filterManifest);
    // start listening to all incoming connections - they will be from browsing
    // contexts that run `new SharedWorker(...)`
    // Note: It is important to start listening before we do any async work to
    //  ensure that connections aren't missed while awaiting
    const connections = listen(self, 'connect');

    // Start an IPFS node & create server that will expose its API to all clients
    // over message channel
    const ipfs = await create({
      // repo: 'ok' + Math.random(), // random so we get a new peerid every time, useful for testing
      // config: {
      //   Addresses: {
      //     Swarm: [
      //       '/dns4/wrtc-ipfs-sgp.hjm.bid/tcp/443/wss/p2p-webrtc-star',
      //       '/dns4/wrtc-ipfs-vn.hjm.bid/tcp/443/wss/p2p-webrtc-star',
      //     ],
      //     libp2p: {
      //       modules: {
      //         transport: [WebRTCStar],
      //       },
      //       config: {
      //         peerDiscovery: {
      //           webRTCStar: {
      //             // <- note the lower-case w - see https://github.com/libp2p/js-libp2p/issues/576
      //             enabled: true,
      //           },
      //         },
      //         transport: {
      //           WebRTCStar: {
      //             // <- note the upper-case w- see https://github.com/libp2p/js-libp2p/issues/576
      //             wrtc,
      //           },
      //         },
      //       },
      //     },
      //   },
      // },
    });
    console.log('worker: IPFS client:', ipfs);

    // async function processAnnounce(addr) {
    //   // get our peerid
    //   let me = await ipfs.id();
    //   me = me.id;

    //   // not really an announcement if it's from us
    //   if (addr.from == me) {
    //     return;
    //   }

    //   // if we got a keep-alive, nothing to do
    //   if (addr == 'keep-alive') {
    //     console.log(addr);
    //     return;
    //   }

    //   let peer = addr.split('/')[9];
    //   console.log('Peer: ' + peer);
    //   console.log('Me: ' + me);
    //   if (peer == me) {
    //     // return if the peer being announced is us
    //     return;
    //   }

    //   // get a list of peers
    //   peers = await ipfs.swarm.peers();
    //   for (i in peers) {
    //     // if we're already connected to the peer, don't bother doing a
    //     // circuit connection
    //     if (peers[i].peer == peer) {
    //       return;
    //     }
    //   }
    //   // log the address to console as we're about to attempt a connection
    //   console.log(addr);

    //   // connection almost always fails the first time, but almost always
    //   // succeeds the second time, so we do this:
    //   try {
    //     await ipfs.swarm.connect(addr);
    //   } catch (err) {
    //     console.log(err);
    //     await ipfs.swarm.connect(addr);
    //   }
    // }
    const peerList = [
      '/dns4/cdn-ipfs-sgp.hjm.bid/tcp/4001/p2p/12D3KooWR49QchZDCtfaYsfnznKNAhdcXJHg94PFqw4Efk4kioFi',
      '/dns4/cdn-ipfs-vn.hjm.bid/tcp/4001/p2p/12D3KooWJVA45ydfCAqRTjJ4SHxdsbyGehvK5EgPwvEM5ifsLPeY',
    ];

    for await (const peer of peerList) {
      await ipfs.bootstrap.add(peer);
      setInterval(async () => {
        try {
          // const swarmPeers = await ipfs.swarm.peers();
          // console.log('ipfs peers list:', swarmPeers);
          await ipfs.swarm.connect(peer);
        } catch (error) {
          console.log(error);
        }
      }, 1000 * 60);
    }

    const res = await ipfs.bootstrap.list();
    console.log('worker: IPFS bootstrap list', res.Peers);
    const testConfig = await ipfs.config.getAll();
    console.log('worker: IPFS config', testConfig);

    const testFileIPFS = await ipfs.files.stat(
      '/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc/readme'
    );
    console.log('worker: test Stat IPFS:', testFileIPFS);

    // @ts-ignore
    const service = new IPFSService(ipfs);
    const server = new Server(service);
    self.server = server;
    self.ipfs = ipfs;

    // connect every queued and future connection to the server
    for await (const event of connections) {
      const port = event.ports[0];
      if (port) {
        server.connect(port);
      }
    }
  } catch (err) {
    console.log(err);
  }
};

/**
 * Creates an AsyncIterable<Event> for all the events on the given `target` for
 * the given event `type`. It is like `target.addEventListener(type, listener, options)`
 * but instead of passing listener you get `AsyncIterable<Event>` instead.
 * @param {EventTarget} target
 * @param {string} type
 * @param {AddEventListenerOptions} [options]
 */
const listen = function (target, type, options) {
  const events = [];
  let resume;
  let ready = new Promise((resolve) => (resume = resolve));

  const write = (event) => {
    events.push(event);
    resume();
  };
  const read = async () => {
    await ready;
    ready = new Promise((resolve) => (resume = resolve));
    return events.splice(0);
  };

  const reader = async function* () {
    try {
      while (true) {
        yield* await read();
      }
    } finally {
      target.removeEventListener(type, write, options);
    }
  };

  target.addEventListener(type, write, options);
  return reader();
};

main();
