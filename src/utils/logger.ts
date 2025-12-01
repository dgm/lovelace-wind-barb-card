export class Logger {
  private static DEBUG = false;

  static setDebug(enabled: boolean): void {
    Logger.DEBUG = enabled;
  }

  static debug(component: string, ...args: any[]): void {
    if (Logger.DEBUG) {
      console.log(`[${component}]`, ...args);
    }
  }

  static warn(component: string, ...args: any[]): void {
    console.warn(`[${component}]`, ...args);
  }

  static error(component: string, ...args: any[]): void {
    console.error(`[${component}]`, ...args);
  }
}