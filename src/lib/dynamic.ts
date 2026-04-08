/**
 * src/lib/dynamic.ts
 *
 * Provides runtime-dynamic data (projects/SPOCs/invites added during session)
 * that supplements the static mock data. This bridges the gap between
 * the mock-based frontend and the real Supabase backend until Supabase
 * is fully configured.
 */

import type { Project, ClientSPOC } from './types';
import { MOCK_PROJECTS, MOCK_SPOCS } from './mock-data';

// ─── In-memory stores ────────────────────────────────────────────────────────

const dynamicSpocs: ClientSPOC[] = [];
const dynamicProjects: Project[] = [];

// Simple invite store: token → { project_id, expiresAt }
const inviteStore: Map<string, { project_id: string; expiresAt: number }> = new Map();

// ─── SPOCs ───────────────────────────────────────────────────────────────────

export function getDynamicSpocs(): ClientSPOC[] {
  return [...MOCK_SPOCS, ...dynamicSpocs];
}

export function addDynamicSpoc(spoc: ClientSPOC) {
  const exists = dynamicSpocs.some((s) => s.email === spoc.email);
  if (!exists) {
    dynamicSpocs.push(spoc);
  }
}

export function clearDynamicSpocs() {
  dynamicSpocs.length = 0;
}

// ─── Projects ────────────────────────────────────────────────────────────────

export function getDynamicProjects(): Project[] {
  return dynamicProjects;
}

export function getMergedProjects(): Project[] {
  return [...MOCK_PROJECTS, ...dynamicProjects];
}

export function saveDynamicProject(project: Project) {
  const idx = dynamicProjects.findIndex((p) => p.id === project.id);
  if (idx >= 0) {
    dynamicProjects[idx] = project;
  } else {
    dynamicProjects.push(project);
  }
}

export function getProjectByIdMerged(id: string): Project | undefined {
  return [...MOCK_PROJECTS, ...dynamicProjects].find((p) => p.id === id);
}

// ─── Invite tokens ───────────────────────────────────────────────────────────

/**
 * Creates a short-lived invite token for a project.
 * @param project_id - The project ID to associate with this invite.
 * @param hours - How many hours before the invite expires (default: 72).
 */
export function createInviteToken(project_id: string, hours = 72): string {
  const token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  const expiresAt = Date.now() + hours * 60 * 60 * 1000;
  inviteStore.set(token, { project_id, expiresAt });
  return token;
}

/**
 * Reads an invite by token. Returns null if expired or not found.
 */
export function readInvite(token: string): { project_id: string } | null {
  const entry = inviteStore.get(token);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    inviteStore.delete(token);
    return null;
  }
  return { project_id: entry.project_id };
}

/**
 * Marks an invite as consumed (deletes it so it can't be reused).
 */
export function consumeInvite(token: string) {
  inviteStore.delete(token);
}
