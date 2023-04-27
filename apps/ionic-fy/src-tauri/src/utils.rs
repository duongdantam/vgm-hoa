use reqwest::{Client, Response, Error};
use std::fs;
use std::path::Path;
use std::time::Duration;
use std::io;
use tauri::api::notification::Notification;
use again::RetryPolicy;


// pub async fn reqwest_timeout(url: &str) -> Result<Response, Error> {
//     let client = Client::builder().timeout(Duration::from_secs(5)).build()?;
//     let resp = client.get(url).send().await?;
//     Ok(resp)
// }

pub async fn reqwest_retry(url: &str, retry_time:usize, wait_time: Duration, timeout: Duration) -> Result<Response, Error> {
	let client = Client::builder().timeout(timeout).build()?;
	let policy = RetryPolicy::fixed(wait_time)
    .with_max_retries(retry_time)
    .with_jitter(false);
  let resp = policy.retry(|| client.get(url).send()).await?;
	Ok(resp)
}

pub fn show_notification(msg: &str) {
		let context = tauri::generate_context!();
		// shows a notification with the given title and body
		match Notification::new(&context.config().tauri.bundle.identifier)
			.title(format!("VGM Desktop v{}", &context.config().package.version.as_deref().unwrap_or("_unknown")))
			.body(msg)
			.show() {
            Ok(_res) => "Message notified".to_string(),
            Err(_) => "".to_string(),
		};
}

#[cfg(unix)]
pub fn check_dir_permission(dir_path: &Path) -> bool {
		use std::os::unix::fs::PermissionsExt;
    if let Ok(metadata) = dir_path.metadata() {
        if (metadata.permissions().mode() & 0o200) != 0 {
            return true // check if user has write permission
        } 
    }
    return false
}

#[cfg(windows)]
pub fn check_dir_permission(dir_path: &Path) -> bool {
    // Windows doesn't have the same concept of user/group/world permissions
    // as Unix-like systems, but we can try to open a file in write mode and
    // see if it succeeds
		use std::io::{Write};
    let file_path = dir_path.join("temp");
    if let Ok(mut file) = fs::File::create(&file_path) {
        if let Ok(_) = writeln!(file, "test") {
            if let Ok(_) = fs::remove_file(&file_path) {
                return true;
            }
        }
    }
    return false
}

pub fn remove_recursively(dir_path: &Path) -> io::Result<()> {
    fs::remove_dir_all(dir_path)?;
    Ok(())
}

pub fn copy_recursively(source: impl AsRef<Path>, destination: impl AsRef<Path>) -> io::Result<()> {
    fs::create_dir_all(&destination)?;
    for entry in fs::read_dir(source)? {
        let entry = entry?;
        let filetype = entry.file_type()?;
        if filetype.is_dir() {
            copy_recursively(entry.path(), destination.as_ref().join(entry.file_name()))?;
        } else {
            fs::copy(entry.path(), destination.as_ref().join(entry.file_name()))?;
        }
    }
    Ok(())
}


pub fn remove_element_from_json_array(json_array: &serde_json::Value, element: &str) -> serde_json::Value {
    if let Some(arr) = json_array.as_array() {
        let vec = arr
            .iter()
            .filter_map(|val| val.as_str().map(String::from))
            .filter(|str_val| str_val != element)
            .collect::<Vec<String>>();
        return serde_json::json!(vec);
    }
    json_array.clone()
}