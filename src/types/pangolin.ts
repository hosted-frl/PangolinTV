export interface ResourceTarget {
  targetId: number;
  ip: string;
  port: number;
  enabled: boolean;
  healthStatus: string;
}

export interface Resource {
  resourceId: number;
  niceId: string;
  name: string;
  ssl: boolean;
  fullDomain: string;
  passwordId: string | null;
  sso: boolean;
  pincodeId: string | null;
  whitelist: boolean;
  http: boolean;
  protocol: 'tcp' | 'http' | string;
  proxyPort: number | null;
  enabled: boolean;
  domainId: string;
  headerAuthId: string | null;
  targets: ResourceTarget[];
}
