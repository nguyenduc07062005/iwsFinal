/**
 * @fileoverview Unified services barrel export.
 *
 * Import all API functions and the HTTP client from this single entry point.
 * This resolves the historical split between `service/` (domain API modules)
 * and `services/` (HTTP client), providing a clean unified import surface.
 *
 * @example
 * // Before (inconsistent):
 * import { getDocuments } from '../service/documentAPI.js';
 * import apiClient from '../services/apiClient.js';
 *
 * // After (unified):
 * import { getDocuments, apiClient } from '../services/index.js';
 */

// HTTP client
export { default as apiClient } from './apiClient.js';

// Auth API
export * from './authApi.js';

// Domain APIs (re-exported from legacy `service/` directory)
export * from '../service/documentAPI.js';
export * from '../service/folderAPI.js';
export * from '../service/tagAPI.js';
export * from '../service/ragAPI.js';
export * from '../service/adminAPI.js';
