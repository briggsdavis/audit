/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as lib_access from "../lib/access.js";
import type * as lib_projects from "../lib/projects.js";
import type * as lib_rateLimits from "../lib/rateLimits.js";
import type * as lib_sessions from "../lib/sessions.js";
import type * as lib_validators from "../lib/validators.js";
import type * as reports from "../reports.js";
import type * as swot from "../swot.js";
import type * as translations from "../translations.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  "lib/access": typeof lib_access;
  "lib/projects": typeof lib_projects;
  "lib/rateLimits": typeof lib_rateLimits;
  "lib/sessions": typeof lib_sessions;
  "lib/validators": typeof lib_validators;
  reports: typeof reports;
  swot: typeof swot;
  translations: typeof translations;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
