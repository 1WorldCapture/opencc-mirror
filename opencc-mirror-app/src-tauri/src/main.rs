#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    opencc_mirror_lib::run();
}
