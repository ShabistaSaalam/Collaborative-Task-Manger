import fs from "fs";
import path from "path";

interface AuditLogEntry {
  timestamp: string;
  userId: string;
  userEmail: string;
  action: "CREATED" | "UPDATED" | "DELETED" | "STATUS_CHANGED";
  taskId: string;
  taskTitle: string;
  changes?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
}

class AuditLogger {
  private logDir: string;

  constructor() {
    // Create logs directory in project root
    this.logDir = path.join(process.cwd(), "logs");

    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  /**
   * Get today's log file path
   */
  private getLogFilePath(): string {
    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    return path.join(this.logDir, `audit-${today}.log`);
  }

  /**
   * Write audit log entry
   */
  private writeLog(entry: AuditLogEntry): void {
    try {
      const logLine = JSON.stringify(entry) + "\n";
      fs.appendFileSync(this.getLogFilePath(), logLine, "utf8");

      console.log(
        `📝 [AUDIT] ${entry.action} by ${entry.userEmail} - Task: ${entry.taskTitle}`
      );
    } catch (error) {
      console.error("❌ Failed to write audit log:", error);
    }
  }

  /**
   * Log task creation
   */
  logTaskCreated(
    user: { id: string; email: string },
    task: { id: string; title: string }
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      action: "CREATED",
      taskId: task.id,
      taskTitle: task.title,
    });
  }

  /**
   * Log task update
   */
  logTaskUpdated(
    user: { id: string; email: string },
    task: { id: string; title: string },
    changes: { field: string; oldValue: any; newValue: any }[]
  ): void {
    const statusChange = changes.some((c) => c.field === "status");

    this.writeLog({
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      action: statusChange ? "STATUS_CHANGED" : "UPDATED",
      taskId: task.id,
      taskTitle: task.title,
      changes,
    });
  }

  /**
   * Log task deletion
   */
  logTaskDeleted(
    user: { id: string; email: string },
    task: { id: string; title: string }
  ): void {
    this.writeLog({
      timestamp: new Date().toISOString(),
      userId: user.id,
      userEmail: user.email,
      action: "DELETED",
      taskId: task.id,
      taskTitle: task.title,
    });
  }
}

// Export singleton instance
export const auditLogger = new AuditLogger();