use std::path::{Path, PathBuf};

use crate::database::dao::CreateInstanceInput;
use crate::error::AppError;

use super::steps;

pub struct BuildContext {
    pub input: CreateInstanceInput,
    pub instance_dir: PathBuf,
    pub config_dir: PathBuf,
    pub wrapper_path: PathBuf,
}

impl BuildContext {
    pub fn new(
        input: &CreateInstanceInput,
        instance_dir: &Path,
        config_dir: &Path,
        wrapper_path: &Path,
    ) -> Self {
        Self {
            input: input.clone(),
            instance_dir: instance_dir.to_path_buf(),
            config_dir: config_dir.to_path_buf(),
            wrapper_path: wrapper_path.to_path_buf(),
        }
    }
}

pub fn build(ctx: BuildContext) -> Result<(), AppError> {
    // Step 1: Prepare directories
    steps::prepare_dirs(&ctx)?;

    // Step 2: Check openclaude is installed and get binary path
    let openclaude_path = steps::check_openclaude()?;

    // Step 3: Write config files
    steps::write_config(&ctx)?;

    // Step 4: Generate wrapper script (with absolute binary path)
    steps::write_wrapper(&ctx, &openclaude_path)?;

    Ok(())
}
