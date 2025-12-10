export type Platform = "fabric" | "forge" | "neoforge" | "extension" | "ts" | "other" | "python";
export type Loader = "fabric" | "forge" | "neoforge";
export type ReleaseType = "release" | "beta" | "nightly";
export type Status = "supported" | "deprecated" | "experimental";

export interface Download {
  name: string;
  platform: Platform | Platform[];
  url: string;
  checksum?: string;
  notes?: string;
}

export interface Build {
  id: string;
  repo: string;
  fork: string;
  commit: string;
  jsMacrosVersion: string;
  modLoader: Loader[];
  extensions: string[];
  downloads: Download[];
  releaseType: ReleaseType;
  status?: Status;
  publishedAt?: string;
  notes?: string;
}

export interface BuildsData {
  updatedAt: string;
  versions: Record<string, Build[]>;
}

export interface EnrichedBuild extends Build {
  mcVersion: string;
}
