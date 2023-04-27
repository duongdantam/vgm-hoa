#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]
pub mod db;
pub mod ipfs;
pub mod utils;
// mod server;
use ipfs::IPFS_PORT;
use lazy_static::lazy_static;
use std::fs;
use std::path::Path;
use std::time::Duration;
use tauri::{utils::config::AppUrl, WindowUrl, Manager,CustomMenuItem, Menu, MenuItem, Submenu};
use tauri_plugin_window_state::{AppHandleExt, StateFlags};
use tauri::api::dialog::*;
use tauri::api::path::app_data_dir;
use tauri_plugin_autostart::MacosLauncher;
// use wait_for_them::{wait_for_them, ToCheck};
// use std::collections::HashMap;
lazy_static! {
	pub static ref WEB_PORT: u16 = portpicker::pick_unused_port().unwrap_or(4200);
}

#[tokio::main]
async fn main() {
	
		// // Uncommnet to start Proxy Server, otherwise use web service-worker
		// tokio::spawn(async move {
		// 		println!("Starting Proxy Server::");
		// 		server::start_server().await;
		// });
		
    // // Init tauri main_app context
    let mut context = tauri::generate_context!();
		let context_config = context.config().clone();
		let app_version = context_config.package.version.clone();
		
		// Check if ipfs_dist exist in database, if yes use newest ipfs_dist, else use built-in or previous version
		let ipfs_dist = db::get_db("ipfs_dist").await.unwrap_or("".to_string());
		println!("ipfs_dist:: {:?}", ipfs_dist);
		
		let local_window_url = format!("http://localhost:{}", *WEB_PORT).parse().unwrap_or("".to_string());
		println!("local_web_url:: {:?}", local_window_url);
		let ipfs_window_url = format!("http://localhost:{}/ipfs/{}", *IPFS_PORT, &ipfs_dist).parse().unwrap_or("".to_string());
		println!("ipfs_web_url:: {:?}", ipfs_window_url);

		let window_url = if os_info::get().os_type().to_string() != "Mac OS" && !ipfs_dist.is_empty() { 
			ipfs_window_url 
		} else { 
			local_window_url 
		};
		let cloned_window_url = window_url.clone();
		
										
		// // Create tauri menu
		// here `"quit".to_string()` defines the menu item id, and the second parameter is the menu item label.
		// let file = CustomMenuItem::new("file".to_string(), "File");
		// let quit = CustomMenuItem::new("quit".to_string(), "Thoát");
		let storage = CustomMenuItem::new("storage".to_string(), "Vùng chứa");
		let about = CustomMenuItem::new("about".to_string(), "Thông tin");

		// let file_submenu = Submenu::new("File", Menu::new().add_item(quit));
		let file_submenu = Submenu::new("File", Menu::new().add_native_item(MenuItem::Quit));
		let storage_submenu = Submenu::new("Dữ liệu", Menu::new().add_item(storage));
		let help_submenu = Submenu::new("Hỗ trợ", Menu::new().add_item(about));
		

		let menu = Menu::new()
			// .add_native_item(MenuItem::Copy)
			// .add_item(file, Menu::new().add_item(quit))
			.add_submenu(file_submenu)
			.add_submenu(storage_submenu)
			.add_submenu(help_submenu);
		
		// // Init tauri builder & plugin
		fix_path_env::fix().unwrap();
    let main_app = tauri::Builder::default()
		.menu(menu)
		.plugin(tauri_plugin_window_state::Builder::default().build())
    .plugin(tauri_plugin_localhost::Builder::new(*WEB_PORT).build())
		.plugin(tauri_plugin_autostart::init(MacosLauncher::LaunchAgent, Some(vec!["--flag1", "--flag2"]) /* arbitrary number of args to pass to your app */))
		.setup(move |app| { // Start tauri main_app
					println!("Initializing tauri...");
						let resource_path = app.path_resolver()
							.resolve_resource("resources")
							.expect("failed to resolve resource");
						println!("Tauri resource path:: {:?}", resource_path.display());
						// let file = std::fs::File::open(&resource_path.join("config.json")).unwrap();
						// let ipfs_config: serde_json::Value = serde_json::from_reader(file).unwrap();
						// println!("IPFS default config:: {}", ipfs_config);

            let splashscreen_window = app.get_window("splashscreen").unwrap();
            let main_window = app.get_window("main").unwrap();
						let main_window_clone = main_window.clone();
						main_window.on_menu_event( move |event| {
							match event.menu_item_id() {
								"quit" => {
									std::process::exit(0);
								}
								"storage" => {
										let data_dir = ipfs::IPFS_DIR.lock().unwrap();
										let main_window_clone_cloned = main_window_clone.clone();
											ask(Some(&main_window_clone), "Bạn muốn thay đổi vùng chứa dữ liệu ngoại tuyến?".to_string(), format!("Vùng chứa hiện tại là: {:?}", data_dir), |answer| {
												// do something with `answer`
												if answer {
													println!("Changing directory::");
													FileDialogBuilder::new()
													 .set_title("Change Data Directory")
													 .pick_folder(move |new_ipfs_dir| {
															match new_ipfs_dir {
																Some(new_ipfs_dir) => {
																	let new_ipfs_path = Path::new(&new_ipfs_dir).join("vgm");
																	if utils::check_dir_permission(&new_ipfs_path) {
																		println!("got new_ipfs_dir WRITABLE:: {:?}", new_ipfs_path);
																		ipfs::change_ipfs_directory(&new_ipfs_path);
																	} else {
																		let new_context = tauri::generate_context!();
																		let new_app_version = &new_context.config().package.version;
																		message(Some(&main_window_clone_cloned), format!("VGM Desktop v{}", new_app_version.as_deref().unwrap_or("_unknown")), "Không được phép ghi vào thư mục này".to_string());
																	}
																},
																_ => println!("Canceled called::"),
															} 
													 });
												};
											});
								}
								"about" => {
									message(Some(&main_window_clone), format!("VGM Desktop v{}", app_version.as_deref().unwrap_or("_unknown")), "Chương trình rao truyền phúc âm và lẽ thật".to_string());
								}
								// "close" => {
								//   event.window().close().unwrap();
								// }
								_ => {}
							}
						});
						
						// Listen to windows events and save window state
						let app_handle = app.handle().clone();
						main_window.on_window_event( move |_event| {
							app_handle.save_window_state(StateFlags::all()).unwrap();
						});
						
						// Start IPFS Server
						tokio::spawn(async move {
								let mut ipfs_dir = db::get_db("ipfs_dir").await.unwrap_or("".to_string());
								println!("IPFS Dir Path:: {}", ipfs_dir);
								if ipfs_dir.is_empty() {
									println!("IPFS Dir is empty:: use default path");
									ipfs_dir = app_data_dir(&context_config).unwrap().join("vgm").display().to_string();
									match db::put_db("ipfs_dir", &ipfs_dir).await {
										Ok(()) => {
												println!("Config saved to DB::");
											}
											Err(err) => {
												println!("Config saved to DB error:: {}", err);
											}
										};
									}
								fs::create_dir_all(&ipfs_dir).unwrap();
								*ipfs::IPFS_DIR.lock().unwrap() = ipfs_dir;
								println!("Starting IPFS Server::");
								ipfs::start_ipfs(&resource_path.join("config.json").display().to_string()).await;
						});

						// Swarm IPFS nodes
						tokio::spawn(async move {
								println!("Swarming IPFS::");
								ipfs::swarm_ipfs().await;
						});
						// Swarm IPFS nodes
						tokio::spawn(async move {
							// // Check if download_queue is not empty, then start download in background
								println!("download_offline_list::");
								ipfs::download_offline_list().await;
						});

          //  WindowBuilder::new(app, "mainapp".to_string(), WindowUrl::App("index.html".into()))
          //       .title("Localhost Example")
          //       .on_web_resource_request(|request, response| {
					// 				println!("Request:: {}", request.uri());
					// 				println!("Response:: {:?}", response);
          //           if request.uri().starts_with("tauri://") {
          //   					println!("Request URI:: {:?}", request.uri());
          //               // if we have a CSP header, Tauri is loading an HTML file
          //               //  for this example, let's dynamically change the CSP
          //               if let Some(csp) = response.headers_mut().get_mut("Content-Security-Policy")
          //               {
          //                   // use the tauri helper to parse the CSP policy to a map
          //                   let mut csp_map: HashMap<String, CspDirectiveSources> =
          //                       Csp::Policy(csp.to_str().unwrap().to_string()).into();
          //                   csp_map
          //                       .entry("script-src".to_string())
          //                       .or_insert_with(Default::default)
          //                       .push("'unsafe-inline'");
          //                   // use the tauri helper to get a CSP string from the map
          //                   let csp_string = Csp::from(csp_map).to_string();
          //                   *csp = HeaderValue::from_str(&csp_string).unwrap();
          //               }
          //           }
          //       })
          //       .build()?;
            tauri::async_runtime::spawn(async move {
								main_window.hide().unwrap();
								splashscreen_window.menu_handle().hide().unwrap();
                // // initialize your app here instead of sleeping
                println!("Starting tauri UI...");
								// When port is ready, wait 3s more for ipfs daemon to finish
								match utils::reqwest_retry(&format!("http://localhost:{}/ipfs/QmQPeNsJPyVWPFDVHb77w8G42Fvo15z4bG2X8D2GhfbSXc/readme", *IPFS_PORT), 10, Duration::from_secs(1),  Duration::from_secs(2)).await
								{
										Ok(response) if response.status().is_success() => {
											println!("IPFS is ready:: Getting config");
											ipfs::get_config().await.unwrap_or(serde_json::Value::String("".to_string()));
										},
										_ => println!("IPFS is ready:: Getting config")
								};

								// std::thread::sleep(std::time::Duration::from_secs(2));
								// Web UI from IPFS
								// println!("Tauri Package Info:: {:?}", context.package_info());

								// Start UI from external url instead of built-in, External Url currently cannot coummunicate with tauri
								println!("Tauri initialization finish:: Starting UI at {}", &cloned_window_url);
                // Uncomment to open devtools
                // main_window.open_devtools();
                // After it's done, close the splashscreen and display the main window
                main_window
                    .eval(&format!("window.location.replace('{}')", WindowUrl::External(cloned_window_url.parse().unwrap())))
                    .unwrap();
								std::thread::sleep(std::time::Duration::from_secs(1));
                splashscreen_window.close().unwrap();
                main_window.show().unwrap();
            });

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
					ipfs::is_pinned,
					ipfs::pin_ipfs,
					ipfs::unpin_ipfs,
					ipfs::check_size,
					ipfs::update_live_peers,
					ipfs::store_offline_list,
					// ipfs::download_offline_list,
					]);
			// // rewrite context config so the IPC is enabled on local window_url
			println!("Changing Tauri Context:: {}", window_url);
			context.config_mut().build.dist_dir = AppUrl::Url(WindowUrl::External(window_url.parse().unwrap()));
			context.config_mut().build.dev_path = AppUrl::Url(WindowUrl::External(window_url.parse().unwrap()));
			main_app
        .run(context)
        .expect("error while running tauri application");
}