const db = require('./database');
const logger = require('./logger');
const fs = require('fs');
const path = require('path');

class BackupManager {
  constructor() {
    this.backupDir = path.join(__dirname, '..', 'backups');
    this.ensureBackupDirectory();
  }

  /**
   * Ensure backup directory exists
   */
  ensureBackupDirectory() {
    if (!fs.existsSync(this.backupDir)) {
      fs.mkdirSync(this.backupDir, { recursive: true });
      logger.info('Created backups directory');
    }
  }

  /**
   * Create a backup of the database
   * @returns {Object} Backup result with success status and details
   */
  createBackup() {
    try {
      const timestamp = new Date()
        .toISOString()
        .replace(/:/g, '-')
        .split('.')[0];
      const filename = `backup-${timestamp}.db`;
      const backupPath = path.join(this.backupDir, filename);

      const success = db.backup(backupPath);

      if (success) {
        const stats = fs.statSync(backupPath);
        const sizeInMB = (stats.size / (1024 * 1024)).toFixed(2);

        logger.success(`Database backup created: ${backupPath}`);
        this.cleanOldBackups();

        return {
          success: true,
          filename,
          path: backupPath,
          size: `${sizeInMB} MB`,
          timestamp: new Date(),
        };
      }

      return { success: false };
    } catch (error) {
      logger.error('Failed to create backup:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Clean old backups (keep last 7 days)
   */
  cleanOldBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      const backupFiles = files
        .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          time: fs.statSync(path.join(this.backupDir, file)).mtime.getTime(),
        }))
        .sort((a, b) => b.time - a.time);

      // Keep last 7 backups, delete the rest
      if (backupFiles.length > 7) {
        const toDelete = backupFiles.slice(7);
        toDelete.forEach(file => {
          fs.unlinkSync(file.path);
          logger.info(`Deleted old backup: ${file.name}`);
        });
      }
    } catch (error) {
      logger.error('Failed to clean old backups:', error);
    }
  }

  /**
   * Start automatic backup schedule (every 6 hours)
   */
  startAutoBackup() {
    // Create initial backup
    this.createBackup();

    // Schedule backups every 6 hours
    setInterval(
      () => {
        this.createBackup();
      },
      6 * 60 * 60 * 1000
    );

    logger.success('Auto-backup scheduled (every 6 hours)');
  }

  /**
   * List all available backups
   * @returns {Array} List of backup files
   */
  listBackups() {
    try {
      const files = fs.readdirSync(this.backupDir);
      return files
        .filter(file => file.startsWith('backup-') && file.endsWith('.db'))
        .map(file => ({
          name: file,
          path: path.join(this.backupDir, file),
          size: fs.statSync(path.join(this.backupDir, file)).size,
          created: fs.statSync(path.join(this.backupDir, file)).mtime,
        }))
        .sort((a, b) => b.created - a.created);
    } catch (error) {
      logger.error('Failed to list backups:', error);
      return [];
    }
  }
}

module.exports = new BackupManager();
