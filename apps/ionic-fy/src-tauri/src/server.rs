use hyper::server::conn::AddrStream;
use hyper::service::{make_service_fn, service_fn};
use hyper::{Body, Request, Response, Server, StatusCode, Uri};
use hyper_reverse_proxy::ProxyError;
use m3u8_rs::Playlist;
use std::net::IpAddr;
use std::{convert::Infallible, net::SocketAddr};
use lazy_static::lazy_static;
// mod ipfs;
use crate::IPFS_PORT;
lazy_static! {
		pub static ref PROXY_PORT: u16 = 24680;
}

// fn debug_request(req: Request<Body>) -> Result<Response<Body>, Infallible>  {
//     let body_str = format!("{:?}", req);
//     Ok(Response::new(Body::from(body_str)))
// }

async fn decrypt(a: &[u8], code: &str, is_looping: bool) -> Vec<u8> {
    // convert secret code to unit 8 array
    let secret: String = String::from(r#"VGM-"#);
    let b: Vec<u8> = format!("{}{}", secret, code).as_bytes().to_vec();
    let mut _length: usize = 0;
    if is_looping == true {
        _length = b.len();
    } else {
        _length = a.len();
    }
    let mut result = vec![0; _length];
    // println!("{:?}", result);
    // bitwise xor
    for i in 0.._length {
        let mut _j: usize = 0;
        if is_looping == true {
            _j = i % _length;
        } else {
            _j = i;
        }
        if i < b.len() {
            result[i] = a[_j] ^ b[i];
        } else {
            result[i] = a[_j];
        }
    }
    // returning unit 8 array
    //  println!("{:?}{:?}", a, b);
    return result;
}

// Forward requests to this URL
async fn get_iv_from_m3u8(m3u8_body: Body) -> String {
    let m3u8_bytes = hyper::body::to_bytes(m3u8_body)
        .await
        .unwrap_or(Vec::new().into());
    let iv = match m3u8_rs::parse_playlist(&m3u8_bytes) {
        Result::Ok((_i, Playlist::MasterPlaylist(pl))) => {
            // println!("Master playlist:\n{:?}", pl.version);
            pl.version.expect("playlist version").to_string()
        }
        Result::Ok((_i, Playlist::MediaPlaylist(mut pl))) => {
            // println!("Media playlist:\n{:?}", pl.segments[0].key);
            pl.segments[0]
                .key
                .as_mut()
                .unwrap()
                .iv
                .as_mut()
                .expect("playlist IV")
                .to_string()
        }
        Result::Err(_e) => "".to_string(),
    };
    return iv[2..6].to_string();
}

// Forward requests to this URL
async fn forward_request(
    client_ip: &IpAddr,
    req: Request<Body>,
) -> Result<Response<Body>, ProxyError> {
    let ipfs_host = &format!("http://localhost:{}", *IPFS_PORT);
    let resp = hyper_reverse_proxy::call(*client_ip, ipfs_host, req).await;
    return resp;
}

fn convert_protocol(path: &str) -> String {
    let mut parts = path.split('/').collect::<Vec<_>>();
		// println!("hello:: {:?}", parts);
		if let Some(protocol) = parts.get(1) {
				match *protocol {
						"sfpi" => parts[1] = "ipfs",
						"snpi" => parts[1] = "ipns",
						_ => (),
				}
		}
    parts.join("/")
}

async fn handle(client_ip: IpAddr, req: Request<Body>) -> Result<Response<Body>, Infallible> {
    let req_uri = req.uri().clone();
    println!("Request_uri:: {:?}", req_uri);
		// Change protocol to ["ipfs" , "ipns"]
		let converted_uri = convert_protocol(&req_uri.path()).to_string()
		.parse::<Uri>()
            .unwrap();
		println!("converted_uri:: {:?}", converted_uri);
		// Create new request based on new protocol
		let mut new_req = Request::builder()
				.method(req.method().clone())
				.uri(req.uri().clone())
				.version(req.version())
				.body(Body::from("modified request"))
				.unwrap();
		*new_req.headers_mut() = req.headers().clone();
		*new_req.uri_mut() = converted_uri;

		// Decrypt key if match
		let mut iv: String = "".to_string();
		let clone_req_uri = new_req.uri().clone();
    if clone_req_uri.path().ends_with(".vgmk") {
        let m3u8_uri = clone_req_uri
            .path()
            .replace("key.vgmk", "1080p.m3u8")
            .to_string()
            .parse::<Uri>()
            .unwrap();
        let mut m3u8_req = Request::builder()
            .method(req.method().clone())
            .uri(req.uri().clone())
            .version(req.version())
            .body(Body::from("modified request"))
            .unwrap();
        *m3u8_req.headers_mut() = req.headers().clone();
        *m3u8_req.uri_mut() = m3u8_uri;
        // println!("Secret request:: {:?}", m3u8_req.uri());
        let m3u8_body = forward_request(&client_ip, m3u8_req).await.unwrap();
        // println!("Got secret body:: {:?}", m3u8_body);
        iv = get_iv_from_m3u8(m3u8_body.into_body()).await;
        // println!("Got IV:: {:?}", iv);
    }
    // if req.uri().path().starts_with("/ipfs") {
    match forward_request(&client_ip, new_req).await {
        Ok(res) => {
					if clone_req_uri.path().ends_with(".vgmk") {
							//println!("Response:: {:?}", res);
                let mut new_res = Response::builder()
                    .body(Body::empty())
                    .unwrap();
                *new_res.status_mut() = res.status().clone();
                *new_res.headers_mut() = res.headers().clone();
                // println!("Got key - start decrypted:: {:?}", req_uri);
                // create a new response with the modified response
                let origin_res = hyper::body::to_bytes(res.into_body()).await.unwrap();
                // println!("Encrypted Key:: {:?}", origin_res.to_vec());
                let new_body = decrypt(&origin_res.to_vec(), &iv, false).await;
                // println!("Decrypted key:: {:?}", new_body);
                *new_res.body_mut() = hyper::body::Body::from(new_body);
								// println!("New Response:: {:?}", new_res);
                Ok(new_res)
            } else {
                Ok(res)
            }
        }
        Err(_error) => Ok(Response::builder()
            .status(StatusCode::INTERNAL_SERVER_ERROR)
            .body(Body::empty())
            .unwrap()),
    }
    // } else {
    //     debug_request(req)
    // }
}

pub async fn start_server() {
    let bind_addr = &format!("127.0.0.1:{}", *PROXY_PORT);
    let addr: SocketAddr = bind_addr.parse().expect("Could not parse ip:port.");

    let make_svc = make_service_fn(|conn: &AddrStream| {
        let remote_addr = conn.remote_addr().ip();
        async move { Ok::<_, Infallible>(service_fn(move |req| handle(remote_addr, req))) }
    });

    let server = Server::bind(&addr).serve(make_svc);

    println!("Running proxy server on {:?}", addr);

    if let Err(e) = server.await {
        eprintln!("server error: {}", e);
    }
}
