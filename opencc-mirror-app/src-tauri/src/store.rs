use std::sync::Arc;

use crate::database::Database;

pub struct AppState {
    pub db: Arc<Database>,
}

impl AppState {
    pub fn new(db: Database) -> Self {
        Self {
            db: Arc::new(db),
        }
    }
}
