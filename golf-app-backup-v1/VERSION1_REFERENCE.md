# Version 1 Reference

This file documents the state of the Golf App project as of Version 1.

## Git Information
- **Tag**: v1.0.0
- **Commit Hash**: def5678 (replace with the actual commit hash from Step 3)
- **Repository**: https://github.com/JackMack007/golf-app
- **Branch**: main

## Database Backup
- **Schema File**: golf_app_schema_v1.sql
- **Data Files**:

- **Storage Location**: c:/golf-app/golf-app-backup-v1/ 

## Notes
- This backup includes all source code, configurations, and database state up to the completion of Step 8.2.2.4.
- To revert to this state:
  1. Checkout the tag: `git checkout v1.0.0`
  2. Restore the database schema using `golf_app_schema_v1.sql`.
  3. Import the data from the CSV files into the respective tables in Supabase.(no data was stored in this version)