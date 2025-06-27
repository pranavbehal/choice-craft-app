/**
 * State Manager for Tab Visibility Persistence
 *
 * Helps prevent app state loss when browser optimizes memory
 * by storing critical state in sessionStorage
 */

interface AppState {
  user: { id: string; email?: string } | null;
  dataLoaded: boolean;
  lastActive: number;
}

const STATE_KEY = "choice-craft-app-state";
const MAX_STATE_AGE = 5 * 60 * 1000; // 5 minutes

export class StateManager {
  static saveState(state: Partial<AppState>) {
    try {
      const existingState = this.getState();
      const newState = {
        ...existingState,
        ...state,
        lastActive: Date.now(),
      };

      sessionStorage.setItem(STATE_KEY, JSON.stringify(newState));
      console.log("💾 App state saved to session storage");
    } catch (error) {
      console.warn("Failed to save app state:", error);
    }
  }

  static getState(): AppState | null {
    try {
      const stored = sessionStorage.getItem(STATE_KEY);
      if (!stored) return null;

      const state = JSON.parse(stored) as AppState;

      // Check if state is too old
      if (Date.now() - state.lastActive > MAX_STATE_AGE) {
        console.log("🗑️ App state expired, clearing...");
        this.clearState();
        return null;
      }

      console.log("📋 App state restored from session storage");
      return state;
    } catch (error) {
      console.warn("Failed to restore app state:", error);
      return null;
    }
  }

  static clearState() {
    try {
      sessionStorage.removeItem(STATE_KEY);
      console.log("🧹 App state cleared from session storage");
    } catch (error) {
      console.warn("Failed to clear app state:", error);
    }
  }

  static isStateValid(): boolean {
    const state = this.getState();
    return state !== null;
  }
}
