/**
 * Automated single source of truth version synchronization.
 * The version is injected at build and test time from package.json via __PACKAGE_VERSION__.
 */

declare const __PACKAGE_VERSION__: string;

export const VERSION: string =
  typeof __PACKAGE_VERSION__ !== 'undefined' ? __PACKAGE_VERSION__ : '1.0.0';
