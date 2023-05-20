use tauri::api::path::app_data_dir;

// Init localDB
async fn init_db() -> Result<sled::Db, Box<dyn std::error::Error>> {
    let context = tauri::generate_context!();
    // Get db_path
    let db_path = app_data_dir(context.config()).unwrap().join("db");
		// Using SledDB
		let db: sled::Db = sled::open(db_path).unwrap();
    Ok(db)
}

// Store Key Value to local
pub async fn put_db(key: &str, value: &str) -> Result<(), Box<dyn std::error::Error>> {
    let db = init_db()
        .await
        .map_err(|err| format!("Failed to init DB: {}", err))?;
    db.insert(key, &*value)?;
    Ok(())
}

// Get Key Value from local
pub async fn get_db(key: &str) -> Result<String, Box<dyn std::error::Error>> {
    let db = init_db()
        .await
        .map_err(|err| format!("Failed to init DB: {}", err))?;
    if let Some(value) = db.get(key).unwrap() {
        return Ok(String::from_utf8(value.to_vec()).unwrap());
    } else {
        return Err("Key not found".into());
    }
}
