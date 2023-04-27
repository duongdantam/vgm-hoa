pub use crate::db;
pub use crate::utils;
use std::fs::{File, OpenOptions};
use std::io::{Read, Write};
use std::path::{Path, PathBuf};
use std::time::Duration;
// use tauri::api::path::app_data_dir;
use tauri::api::process::{Command, CommandEvent};
use tokio::time::interval;
use lazy_static::lazy_static;
use std::sync::Mutex;
use once_cell::sync::Lazy;
// use regex::Regex;
// Config setup
pub const API_GATEWAY: &str = "vn.api.hjm.bid";
pub static IPFS_DIR: Lazy<Mutex<String>> = Lazy::new(|| Mutex::new(String::new()));
pub static LIVE_PEERS: Lazy<Mutex<String>> = Lazy::new(|| Mutex::new(String::new()));


lazy_static! {
		pub static ref IPFS_PORT: u16 = 24680;
		pub static ref API_PORT: u16 = 13579;
}
// // Execute IPFS command

pub fn change_ipfs_directory(new_ipfs_dir: &Path) {
	let old_ipfs_path = IPFS_DIR.lock().unwrap().to_string();
	let old_ipfs_dir = Path::new(&old_ipfs_path);
	let cloned_old_ipfs_dir = old_ipfs_dir.to_owned();
	let new_ipfs_path = new_ipfs_dir.display().to_string();
	match utils::copy_recursively(old_ipfs_dir, new_ipfs_dir) {
			Ok(()) => {
						tokio::spawn(async move {
							match db::put_db("ipfs_dir", &new_ipfs_path).await {
								Ok(()) => {
									println!("Config saved to DB::");
									*IPFS_DIR.lock().unwrap() = new_ipfs_path;
									println!("copy_recursively done::");
									utils::remove_recursively(&cloned_old_ipfs_dir).unwrap();
									utils::show_notification("Thay đổi đường dẫn data thành công");
								}
								Err(err) => {
										println!("Config saved to DB error:: {}", err);
										utils::show_notification("Đã có lỗi xảy ra khi thay đổi vùng chứa dữ liệu");
								}
							};
						});
			}
			Err(err) => {
					println!("copy_recursively error:: {}", err);
					utils::show_notification("Đã có lỗi xảy ra khi thay đổi vùng chứa dữ liệu");
			}
	};
}

#[tauri::command]
pub async fn ipfs_cmd(args: Vec<String>) -> Result<String, String> {
		// let ipfs_dir = db::get_db("ipfs_dir").await.unwrap_or("".to_string());
		let ipfs_dir = IPFS_DIR.lock().unwrap().to_string();
		// println!("ipfs_cmd - ipfs_dir:: {}", ipfs_dir);
    let mut default_args = vec!["--repo-dir".to_string(), ipfs_dir];
    default_args.extend(args);

    let (mut rx, _child) = Command::new_sidecar("stream")
        .expect("failed to create `IPFS` binary command")
        .args(default_args)
        .spawn()
        .expect("Failed to spawn sidecar");

    // child.write(text.as_bytes()).expect("Failed to write to sidecar");
    // drop(child);
    let mut output = String::new();
    while let Some(event) = rx.recv().await {
        if let CommandEvent::Stdout(line) = event {
            output.push_str(&(line + "\n"));
        }
    }
    Ok(output)
}

#[tauri::command]
pub async fn is_pinned(hash: String) -> bool {
		println!("is_pinned called:: {:?}", hash);
    let pin_result = ipfs_cmd(vec!["pin".to_string(), "ls".to_string(), hash.to_string()])
        .await
        .unwrap_or("null".to_string());
    if pin_result
        .split_whitespace()
        .last()
        .unwrap_or(&"null".to_string())
        != "recursive"
    {
        println!("IPFS hash is not pinned:: {}", hash);
        return false;
    } else {
        println!("IPFS hash is pinned:: {}", hash);
        return true;
    };
}

// Pin IPFS Hash
#[tauri::command]
pub async fn pin_ipfs(hash: String) -> bool {
    println!("Start pinning IPFS hash:: {}", hash);
    let pin_result = ipfs_cmd(vec![
			"pin".to_string(), 
			"add".to_string(), 
			hash.to_string().replace("\"","")
			]).await.unwrap_or("null".to_string());
		println!("IPFS pin_result:: {:?}", pin_result);
		if pin_result
        .split_whitespace()
        .next()
        .unwrap_or(&"null".to_string())
        != "pinned"
    {
        println!("Error pinning IPFS hash:: ");
        return false;
    } else {
        println!("IPFS hash is pinned:: ",);
        return true;
    };
}

// Unpin IPFS Hash
#[tauri::command]
pub async fn unpin_ipfs(hash: String) -> bool {
    println!("Start unpinning IPFS hash:: {}", hash);
    let pin_result = ipfs_cmd(vec!["pin".to_string(), "rm".to_string(), hash.to_string().replace("\"","")])
            .await
            .unwrap_or("null".to_string());
		if pin_result
        .split_whitespace()
        .next()
        .unwrap_or(&"null".to_string())
        != "unpinned"
    {
        println!("Error unpinning IPFS hash:: {}", hash);
        return false;
    } else {
        println!("IPFS hash is unpinned:: {}", hash);
        return true;
    };
}

// Unpin IPFS Hash
#[tauri::command]
pub async fn check_size(hash: String) -> String {
    println!("Checking ipfs hash size:: {}", hash);
    let size = ipfs_cmd(vec![
			"files".to_string(),
			 "stat".to_string(), 
			 "--size".to_string(), 
			 format!("/ipfs/{}", hash), 
				"--timeout".to_string(),
				"2s".to_string(),
			 ]).await.unwrap_or("null".to_string());
		return size;
}

// Swarm IPFS
pub async fn bootstrap_list() -> String {
    // Get bootstrap list path
		// let ipfs_dir = db::get_db("ipfs_dir").await.unwrap_or("".to_string());
		let ipfs_dir = IPFS_DIR.lock().unwrap().to_string();
		// let mut file_path;
    let file_path = if !ipfs_dir.is_empty() {
				Path::new(&ipfs_dir).join("btlist.txt")
		} else {
				PathBuf::new()
		};

    // Check if file exists
    if file_path.exists() {
        // Open file for reading
        let mut file = File::open(&file_path).unwrap();

        // Read file contents into a string
        let mut bootstrap_list = String::new();
        file.read_to_string(&mut bootstrap_list).unwrap();

        return bootstrap_list;
    } else {
        let bootstrap_list = ipfs_cmd(vec!["bootstrap".to_string(), "list".to_string()])
            .await
            .unwrap_or("".to_string());
        // println!("Bootstrap list:: {}", bootstrap_list);
        // Create file
        let mut file = OpenOptions::new()
            .write(true)
            .create_new(true)
            .open(&file_path)
            .unwrap();
        file.write_all(bootstrap_list.as_bytes()).unwrap();
        return bootstrap_list;
    }
}

#[tauri::command]
pub async fn update_live_peers(peers_list: String) {
 *LIVE_PEERS.lock().unwrap() = peers_list;
}

// Swarm IPFS
#[tauri::command]
pub async fn swarm_ipfs() {
    let mut interval = interval(Duration::from_secs(5));
    // let start_time = Instant::now();
    loop {
			interval.tick().await;
				let live_peers = LIVE_PEERS.lock().unwrap().to_string();
        // let elapsed_time = start_time.elapsed().as_secs();
        let mut bootstrap_list = ipfs_cmd(vec!["bootstrap".to_string(), "list".to_string()])
            .await
            .unwrap_or("".to_string());
				bootstrap_list.push_str(&live_peers);
        // println!("Bootstrap list:: {}", bootstrap_list);

        let mut tasks = vec![];
        for node in bootstrap_list.trim().lines() {
						// println!("peers:: {}", node);
            tasks.push(async move {
                let _result = ipfs_cmd(vec![
                    "swarm".to_string(),
                    "connect".to_string(),
                    node.to_string(),
                    "--timeout".to_string(),
                    "5s".to_string(),
                ])
                .await
                .unwrap();
                println!("Swarming node:: {:?}", _result);
            });
        }
        futures::future::join_all(tasks).await;
    }
}

#[tauri::command]
pub async fn get_config() -> Result<serde_json::Value, String> {

		// Get config from IPFS local
    let local_config = match ipfs_cmd(vec![
        "name".to_string(),
        "resolve".to_string(),
        "--dht-timeout".to_string(),
        "2s".to_string(),
    ])
    .await
    {
        Ok(res) => {
						println!("local_config:: {}", res);
            match ipfs_cmd(vec![
                "cat".to_string(),
                res.replace('\n', "").replace('\r', ""),
            ])
            .await
            {
                Ok(conf) => {
                    println!("local_config_content:: {}", conf);
                    conf
                }
                Err(_) => "".to_string(),
            }
        }
        Err(_) => "".to_string(),
    };
    // println!("Config from DB:: {:?}", local_config);

    // Get config from IPNS

    let fetch_config = match ipfs_cmd(vec![
        "name".to_string(),
        "resolve".to_string(),
        API_GATEWAY.to_string(),
				"--dht-timeout".to_string(),
        "5s".to_string(),
    ])
    .await
    {
        Ok(res) => {
						println!("fetch_config:: {:?}", res);
            match ipfs_cmd(vec![
                "cat".to_string(),
                res.clone().replace('\n', "").replace('\r', ""),
            ])
            .await
            {
                Ok(conf) => {
                    println!("fetch_config_content:: {}", conf);
										db::put_db("ipfs_conf", &conf).await.unwrap();
                    tokio::spawn(async move {
                        ipfs_cmd(vec![
                            "name".to_string(),
                            "publish".to_string(),
                            res.replace('\n', "").replace('\r', ""),
                            "--allow-offline".to_string(),
                            "-t".to_string(),
                            "43800h".to_string(),
                        ])
                        .await
                        .unwrap_or("null".to_string());
                    });
                    conf.to_string()
                }
                Err(_) => "".to_string(),
            }
        }
        Err(_) => "".to_string(),
    };
    // Set config to online and fallback to offline
    let config = if !fetch_config.is_empty() {
			// Use online config if available
			fetch_config
    } else if !local_config.is_empty() {
			// Use offline config if available
			local_config
    } else {
			// Get config from offline DB
			db::get_db("ipfs_conf").await.unwrap_or("".to_string())
    };

    // Parse config and return, save online version to DB
    if !config.is_empty() {
        let mut config: serde_json::Value = serde_json::from_str(&config)
            .map_err(|err| format!("Failed to parse config: {}", err))?;

        // Append dynamic local port to gateway
        if let Some(gateway) = config.get_mut("stream_gateway") {
            if let serde_json::Value::String(value) = gateway {
                *value = value.replace(
                    "http://localhost",
                    &format!("http://localhost:{}", *IPFS_PORT),
                );
            }
        }
        let cloned_config = config.clone();
        tokio::spawn(async move {
            let nodes = cloned_config["nodes"]
                .as_array()
                .unwrap()
                .iter()
                .map(|node| node.as_str().unwrap().to_owned())
                .collect::<Vec<String>>();
            for peer in nodes {
                println!("Bootstraping peer:: {}", peer);
                ipfs_cmd(vec![
                    "bootstrap".to_string(),
                    "add".to_string(),
                    peer.to_string(),
                ])
                .await
                .unwrap_or("null".to_string());
            }
            // if let Some(api) = cloned_config["web_api"].as_str() {
            //     println!("API: {}", api);
            //     pin_ipfs(api).await;
            // }
						println!("ipfs_dist as_str:: {:?}",  cloned_config["dist"].as_str());
						if let Some(dist) = cloned_config["dist"].as_str() {
							println!("Web_hash: {}", dist);
							if os_info::get().os_type().to_string() != "Mac OS" {
									let db_dist = db::get_db("ipfs_dist").await.unwrap_or("".to_string());
									println!("ipfs_dist changed:: old: {} - new: {}", db_dist, dist);
									// std::thread::sleep(std::time::Duration::from_secs(2));
									if (db_dist != dist) && pin_ipfs(dist.to_string()).await {
										unpin_ipfs(db_dist).await;
										db::put_db("ipfs_dist", dist).await.unwrap();
									};
							}
						}
        });
        println!(
            "API config:: {:?}",
            serde_json::to_string_pretty(&config).unwrap()
        );
        Ok(config)
    } else {
        return Err(format!("No config available::"));
    }
}

// Start IPFS Function
pub async fn start_ipfs(default_config_path: &str) {
    // Get ipfs app_dir
		// let ipfs_dir = db::get_db("ipfs_dir").await.unwrap_or("".to_string());
		let ipfs_dir = IPFS_DIR.lock().unwrap().to_string();
    println!("ipfs_dir:: {}", ipfs_dir);
    let ipfs_conf_path = Path::new(&ipfs_dir).join("config");

    // Start IPFS processes
    // Shutdown IPFS if daemon is running
    ipfs_cmd(vec!["shutdown".to_string()])
        .await
        .unwrap_or("null".to_string());

    // Init IPFS if config file not found
    if !ipfs_conf_path.exists() || !ipfs_conf_path.is_file() {
			println!("IPFS not found:: start init IPFS");
			
        ipfs_cmd(vec!["init".to_string()])
				.await
            .unwrap_or("null".to_string());
        let init_config = std::fs::File::open(&ipfs_conf_path).unwrap();
        let ipfs_init_config: serde_json::Value = serde_json::from_reader(init_config).unwrap();
        // println!("IPFS init config:: {}", ipfs_init_config);

        let default_config = std::fs::File::open(&default_config_path).unwrap();
        let mut ipfs_default_config: serde_json::Value =
            serde_json::from_reader(default_config).unwrap();
        ipfs_default_config["Identity"]["PeerID"] =
            serde_json::json!(ipfs_init_config["Identity"]["PeerID"]);
        ipfs_default_config["Identity"]["PrivKey"] =
				serde_json::json!(ipfs_init_config["Identity"]["PrivKey"]);
				// MacOS only: change UseSubdomains to false
				if os_info::get().os_type().to_string() == "Mac OS" {
					println!("Changing ipfs config::");
					ipfs_default_config["Gateway"]["PublicGateways"]["localhost"]["UseSubdomains"] =
					    serde_json::json!(false);
				} 
        // println!("IPFS default config:: {}", ipfs_default_config);
        // Overwrite IPFS config
        let mut file = File::create(ipfs_conf_path).unwrap();
        file.write_all(ipfs_default_config.to_string().as_bytes())
            .unwrap();
    }

    let mut default_peers: Vec<String> = vec![
        "/dns4/vn.hjm.bid/udp/4001/quic/p2p/12D3KooWJVA45ydfCAqRTjJ4SHxdsbyGehvK5EgPwvEM5ifsLPeY"
            .to_string(),
    ];
    // Bootstrap peers to connect to network
    let custom_peers = bootstrap_list().await;
    default_peers.extend(custom_peers.lines().map(str::to_string));
    println!("default_peers:: {:?}", default_peers);

    for peer in default_peers {
        println!("Bootstraping peer:: {}", peer);
        ipfs_cmd(vec![
            "bootstrap".to_string(),
            "add".to_string(),
            peer.to_string(),
        ])
        .await
        .unwrap_or("null".to_string());
    }
    // Start IPFS Daemon Process
    tokio::spawn(async move {
        println!("Starting IPFS Daemon - PORT {} ::", *IPFS_PORT);
        ipfs_cmd(vec![
            "config".to_string(),
            "Addresses.Gateway".to_string(),
            format!("/ip4/127.0.0.1/tcp/{}", *IPFS_PORT),
        ])
        .await
        .unwrap_or("null".to_string());
        ipfs_cmd(vec![
            "daemon".to_string(),
            "--init".to_string(),
            "--migrate".to_string(),
            "--enable-gc".to_string(),
            "--enable-pubsub-experiment".to_string(),
        ])
        .await
        .unwrap();
    });
}

// Store offline_list from frontend
#[tauri::command]
pub async fn store_offline_list(sub_list: String, add_list: String) {
	let new_sub_list: serde_json::Value = serde_json::from_str(&sub_list).unwrap_or(serde_json::json!([]));
	let new_add_list: serde_json::Value = serde_json::from_str(&add_list).unwrap_or(serde_json::json!([]));
	println!("new_sub_list:: {:?}", new_sub_list);
	println!("new_add_list:: {:?}", new_add_list);

	let mut tasks = vec![];
	// Remove item from sub_list
	if let Some(arr) = new_sub_list.as_array() {
		if arr.len() > 0 {
			for sub_item in arr {
				 tasks.push(async move {
						unpin_ipfs(sub_item["streamHash"].to_string()).await;
						println!("unpinning ipfs:: {:?}", sub_item);
				});
			}
			futures::future::join_all(tasks).await;
			// run IPFS repo GC
			println!("Calling IPFS Repo GC::");
			ipfs_cmd(vec!["repo".to_string(), "gc".to_string()]).await.unwrap_or("".to_string());
		}
	}
	
	// // Add item to download_queue from add_list
	let download_queue = db::get_db("download_queue").await.unwrap_or(serde_json::to_string(&serde_json::json!([])).unwrap());
	let queue_list: serde_json::Value = serde_json::from_str(&download_queue).unwrap_or(serde_json::json!([]));
	if let (serde_json::Value::Array(mut queue_list_arr), serde_json::Value::Array(add_list_arr)) = (queue_list, new_add_list) {
		queue_list_arr.append(&mut add_list_arr.clone());
		let queue_list_string = serde_json::to_string(&queue_list_arr).unwrap_or(serde_json::to_string(&serde_json::json!([])).unwrap());
		println!("queue_list:: {}", queue_list_string);
		db::put_db("download_queue", &queue_list_string).await.unwrap();
	}

}

// Check offline list, if not empty, start download in background
pub async fn download_offline_list() {
	std::thread::sleep(std::time::Duration::from_secs(10));
	let concurrency = 1;
	loop {
		let download_queue = db::get_db("download_queue").await.unwrap_or(serde_json::to_string(&serde_json::json!([])).unwrap());
		let queue_list: serde_json::Value = serde_json::from_str(&download_queue).unwrap_or(serde_json::json!([]));
		// println!("download_queue:: {:?}", download_queue);
		if let Some(arr) = queue_list.as_array() {
			if arr.len() > 0 {
				let clone_arr = arr.clone();
				// Get processing hashes
				let hashes;
				if clone_arr.len() > concurrency {
					hashes = &clone_arr[0..concurrency];
				} else {
					hashes = &clone_arr;
				};
				// Run processing hashes simultaneously
				let mut tasks = vec![];
				for queue_item in hashes {
					tasks.push(async move {
							println!("Processing queue_item:: {:?}", queue_item);
							pin_ipfs(serde_json::to_string(&queue_item).unwrap()).await;
							let current_queue = db::get_db("download_queue").await.unwrap_or(serde_json::to_string(&serde_json::json!([])).unwrap());
							let current_queue_list: serde_json::Value = serde_json::from_str(&current_queue).unwrap_or(serde_json::json!([]));
							let new_queue_list = utils::remove_element_from_json_array(&current_queue_list, queue_item.as_str().unwrap());
							let queue_list_string = serde_json::to_string(&new_queue_list).unwrap_or(serde_json::to_string(&serde_json::json!([])).unwrap());
							println!("queue task done:: {:?} ", queue_item.to_string());
							println!("remaining queue:: {:?} \n {:?}", new_queue_list.as_array().unwrap().len(), queue_list_string);
							db::put_db("download_queue", &queue_list_string).await.unwrap();
						});
				}
				futures::future::join_all(tasks).await;
			} else {
				// If download list is empty, sleep for 10 secs
				std::thread::sleep(std::time::Duration::from_secs(10));
			}
		}
	}
}
