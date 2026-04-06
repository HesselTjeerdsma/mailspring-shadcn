/**
 * Bridge to the existing Mailspring infrastructure.
 *
 * The old app exposes everything via the global `window.$m` / `mailspring-exports`
 * module. This file provides typed re-exports so the new UI can import them
 * as regular ES modules while still talking to the same underlying Reflux stores,
 * models, and actions.
 *
 * IMPORTANT: This module can only be imported in the Electron renderer process
 * after AppEnv has been initialized (i.e. after the bootstrap script runs).
 * For the Vite dev server, these will be stubbed.
 */

// In Electron, the old app sets window.$m = require('mailspring-exports')
// We re-export from there so Zustand stores can access the real data layer.

function getMailspring() {
  const m = (window as any).$m;
  if (!m) {
    throw new Error(
      'mailspring-exports not available. Ensure AppEnv is initialized before importing.'
    );
  }
  return m;
}

// Lazy accessors - these are accessed after initialization
export const getActions = () => getMailspring().Actions;
export const getDatabaseStore = () => getMailspring().DatabaseStore;
export const getAccountStore = () => getMailspring().AccountStore;
export const getCategoryStore = () => getMailspring().CategoryStore;
export const getFocusedContentStore = () => getMailspring().FocusedContentStore;
export const getWorkspaceStore = () => getMailspring().WorkspaceStore;
export const getDraftStore = () => getMailspring().DraftStore;
export const getTaskQueue = () => getMailspring().TaskQueue;
export const getContactStore = () => getMailspring().ContactStore;
export const getMessageStore = () => getMailspring().MessageStore;
export const getThread = () => getMailspring().Thread;
export const getMessage = () => getMailspring().Message;
export const getAccount = () => getMailspring().Account;
export const getContact = () => getMailspring().Contact;
export const getCategory = () => getMailspring().Category;
export const getFolder = () => getMailspring().Folder;
export const getLabel = () => getMailspring().Label;
export const getFile = () => getMailspring().File;
export const getTaskFactory = () => getMailspring().TaskFactory;
export const getDraftFactory = () => getMailspring().DraftFactory;

/**
 * Check if the Mailspring bridge is available (i.e. running inside Electron
 * with the old bootstrap completed).
 */
export function isMailspringAvailable(): boolean {
  return typeof window !== 'undefined' && !!(window as any).$m;
}
