import AsyncStorage from '@react-native-async-storage/async-storage';
import { Resource } from '../types/pangolin';

export type Config = {
  baseUrl: string; // e.g. https://api.example.com/v1
  apiKey: string;
  name: string;
  orgId?: string;
};


const CONFIG_KEY = 'PANGOLIN_CONFIG_V1';

export async function saveConfig(cfg: Config) {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export async function loadConfig(): Promise<Config | null> {
  const s = await AsyncStorage.getItem(CONFIG_KEY);
  return s ? JSON.parse(s) : null;
}

export async function listPublicResources(cfg: Config): Promise<Resource[]> {
  if (!cfg.orgId) throw new Error('orgId is required to list resources');
  const base = cfg.baseUrl.replace(/\/$/, '');
  const url = `${base}/org/${cfg.orgId}/resources?public=true`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
  const resJson = await res.json();
  if (!res.ok) {
    throw new Error(`List failed: ${res.status} for ${url}\nResponse: ${resJson}`);
  }
  try {
    return resJson?.data?.resources || [];
  } catch {
    return [] as Resource[];
  }
}

export async function addClientToResource(cfg: Config, siteResourceId: string, ip: string) {
  // Prefer org-scoped endpoint: POST /org/{orgId}/site-resource/{siteResourceId}/clients
  if (!cfg.orgId) throw new Error('orgId is required to add a client to a resource');
  const base = cfg.baseUrl.replace(/\/$/, '');
  const url = `${base}/org/${cfg.orgId}/site-resource/${siteResourceId}/clients`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ip, name: cfg.name }),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Add client failed: ${res.status} for ${url}\nResponse: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text as any;
  }
}

export async function fetchPublicIp() {
  // Use a simple public IP service
  const res = await fetch('https://api.ipify.org?format=json');
  if (!res.ok) throw new Error('Failed to fetch public IP');
  const j = await res.json();
  return j.ip as string;
}

