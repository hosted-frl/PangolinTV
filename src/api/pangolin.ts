import AsyncStorage from '@react-native-async-storage/async-storage';
import { Resource } from '../types/pangolin';

export type Config = {
  baseUrl: string; // e.g. https://api.example.com/v1
  apiKey: string;
  orgId?: string;
  // Seerr integration (optional)
  seerrUrl?: string;
  seerrApiKey?: string;
};


const CONFIG_KEY = 'PANGOLIN_CONFIG_V1';

export async function saveConfig(cfg: Config) {
  await AsyncStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

export async function loadConfig(): Promise<Config | null> {
  const s = await AsyncStorage.getItem(CONFIG_KEY);
  return s ? JSON.parse(s) : null;
}

export async function listPublicResources(): Promise<Resource[]> {
  const cfg = await loadConfig();
  if (!cfg) throw new Error('No Pangolin config loaded');
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

export type AddRuleOptions = {
  action?: 'ACCEPT' | 'DROP' | 'PASS';
  match?: 'CIDR' | 'IP' | 'PATH' | 'COUNTRY' | 'ASN';
  priority?: number;
  enabled?: boolean;
};

export async function addClientToResource(siteResourceId: string, value: string, opts: AddRuleOptions = {}) {
  const cfg = await loadConfig();
  if (!cfg) throw new Error('No Pangolin config loaded');
  if (!cfg.orgId) throw new Error('orgId is required to add a client to a resource');
  const base = cfg.baseUrl.replace(/\/$/, '');
  const url = `${base}/resource/${siteResourceId}/rule`;

  const body = {
    action: opts.action ?? 'ACCEPT',
    match: opts.match ?? 'IP',
    value,
    priority: opts.priority ?? 100,
    enabled: opts.enabled ?? true,
  } as const;

  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${cfg.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`Add rule failed: ${res.status} for ${url}\nResponse: ${text}`);
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

export async function listResourceRules(resourceId: string) {
  const cfg = await loadConfig();
  if (!cfg) throw new Error('No Pangolin config loaded');
  if (!cfg.orgId) throw new Error('orgId is required to list resource rules');
  const base = cfg.baseUrl.replace(/\/$/, '');
  const url = `${base}/resource/${resourceId}/rules`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${cfg.apiKey}` } });
  const text = await res.text();
  if (!res.ok) {
    throw new Error(`List rules failed: ${res.status} for ${url}\nResponse: ${text}`);
  }
  try {
    return JSON.parse(text);
  } catch {
    return text as any;
  }
}

