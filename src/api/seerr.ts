import { loadConfig } from './pangolin';

// Media availability status
export enum MediaStatus {
  UNKNOWN = 1,
  PENDING = 2,
  PROCESSING = 3,
  PARTIALLY_AVAILABLE = 4,
  AVAILABLE = 5,
  DELETED = 6,
}

// Genre types
export type SeerrGenre = {
  id: number;
  name: string;
  backdrops?: string[];
};

// Types based on Seerr discover response
export type SeerrUser = {
  id: number;
  email: string;
  username: string;
  plexUsername?: string | null;
  plexToken?: string | null;
  jellyfinAuthToken?: string | null;
  userType: number;
  permissions: number;
  avatar?: string | null;
  createdAt: string;
  updatedAt: string;
  requestCount?: number;
};

export type SeerrRequest = {
  id: number;
  status: number;
  media: string;
  createdAt: string;
  updatedAt: string;
  requestedBy: SeerrUser;
  modifiedBy?: SeerrUser | null;
  is4k?: boolean;
  serverId?: number | null;
  profileId?: number | null;
  rootFolder?: string | null;
};

export type SeerrMediaInfo = {
  id: number;
  tmdbId?: number | null;
  tvdbId?: number | null;
  status?: MediaStatus;
  requests?: SeerrRequest[];
  createdAt?: string;
  updatedAt?: string;
};

export type SeerrResult = {
  id: number;
  type: 'movie' | 'tv';
  mediaType?: string;
  popularity?: number;
  posterPath?: string | null;
  backdropPath?: string | null;
  voteCount?: number;
  voteAverage?: number;
  genreIds?: number[];
  overview?: string;
  originalLanguage?: string;
  title?: string;
  originalTitle?: string;
  releaseDate?: string;
  originCountry?: string[];
  adult?: boolean;
  video?: boolean;
  mediaInfo?: SeerrMediaInfo | null;
};

export type SeerrDiscoverResponse = {
  page: number;
  totalPages: number;
  totalResults: number;
  results: SeerrResult[];
};

// List configuration for dynamic loading
export type SeerrListConfig = {
  id: string;
  label: string;
  endpoint: 'movies' | 'tv' | 'upcoming' | 'popular' | 'trending';
  page?: number;
};

// Query parameters for discover endpoints
export type SeerrDiscoverParams = {
  page?: number;
  language?: string;
  genre?: string;
  watchProviders?: string;
};

// Normalize a single result from API response
export function normalizeSeerrResult(raw: any): SeerrResult {
  // Determine if it's a movie or TV based on which fields are present
  const isTV = raw.name !== undefined || raw.firstAirDate !== undefined;
  const isMovie = raw.title !== undefined || raw.releaseDate !== undefined;
  
  return {
    id: raw.id,
    type: isTV ? 'tv' : 'movie',
    mediaType: raw.mediaType,
    popularity: raw.popularity,
    posterPath: raw.posterPath,
    backdropPath: raw.backdropPath,
    voteCount: raw.voteCount,
    voteAverage: raw.voteAverage,
    genreIds: raw.genreIds,
    overview: raw.overview,
    originalLanguage: raw.originalLanguage,
    // Use title for both movies and TV (map name to title for TV)
    title: raw.title || raw.name,
    // Use originalTitle for both movies and TV (map originalName to originalTitle for TV)
    originalTitle: raw.originalTitle || raw.originalName,
    // Use releaseDate for both movies and TV (map firstAirDate to releaseDate for TV)
    releaseDate: raw.releaseDate || raw.firstAirDate,
    // TV-specific fields
    originCountry: raw.originCountry,
    // Movie-specific fields
    adult: raw.adult,
    video: raw.video,
    mediaInfo: raw.mediaInfo ? {
      id: raw.mediaInfo.id,
      tmdbId: raw.mediaInfo.tmdbId,
      tvdbId: raw.mediaInfo.tvdbId,
      status: raw.mediaInfo.status,
      requests: raw.mediaInfo.requests,
      createdAt: raw.mediaInfo.createdAt,
      updatedAt: raw.mediaInfo.updatedAt,
    } : null,
  };
}

// Normalize a complete discover response
export function normalizeSeerrResponse(raw: any): SeerrDiscoverResponse {
  return {
    page: raw.page,
    totalPages: raw.totalPages,
    totalResults: raw.totalResults,
    results: (raw.results || []).map(normalizeSeerrResult),
  };
}

async function getBaseAndKey() {
  const cfg = await loadConfig();
  if (!cfg || !cfg.seerrUrl) throw new Error('No Seerr URL configured');
  const base = cfg.seerrUrl.replace(/\/$/, '');
  const key = cfg.seerrApiKey;
  return { base, key };
}

// Generic discover function that handles different endpoints
async function discover(endpoint: string, params?: SeerrDiscoverParams): Promise<SeerrDiscoverResponse> {
  const { base, key } = await getBaseAndKey();
  
  // Build query string from params
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append('page', String(params.page));
  if (params?.language) queryParams.append('language', params.language);
  if (params?.genre) queryParams.append('genre', params.genre);
  if (params?.watchProviders) queryParams.append('watchProviders', params.watchProviders);
  
  const queryString = queryParams.toString();
  const url = `${base}/api/v1/discover/${endpoint}${queryString ? '?' + queryString : ''}`;
  
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (key) headers['X-Api-Key'] = key;
  const res = await fetch(url, { headers });
  const text = await res.text();
  if (!res.ok) throw new Error(`Seerr discover ${endpoint} failed: ${res.status} ${text}`);
  const raw = JSON.parse(text);
  return normalizeSeerrResponse(raw);
}

export async function discoverMovies(params?: SeerrDiscoverParams): Promise<SeerrDiscoverResponse> {
  return discover('movies', params);
}

export async function discoverTv(params?: SeerrDiscoverParams): Promise<SeerrDiscoverResponse> {
  return discover('tv', params);
}

// Load multiple lists based on configuration
export async function loadDiscoverLists(configs: SeerrListConfig[]): Promise<Map<string, SeerrDiscoverResponse>> {
  const results = new Map<string, SeerrDiscoverResponse>();
  await Promise.all(
    configs.map(async (config) => {
      try {
        const data = await discover(config.endpoint, { page: config.page || 1 });
        results.set(config.id, data);
      } catch (error) {
        console.warn(`Failed to load list ${config.id}:`, error);
        // Return empty response on error instead of crashing
        results.set(config.id, {
          page: 1,
          totalPages: 0,
          totalResults: 0,
          results: [],
        });
      }
    })
  );
  return results;
}

// In-memory genre cache with timestamp
let genreCache: { movies: SeerrGenre[]; tv: SeerrGenre[]; timestamp: number } | null = null;
const GENRE_CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

// Fetch genres for movies or TV
export async function fetchGenres(type: 'movie' | 'tv'): Promise<SeerrGenre[]> {
  // Check cache
  const now = Date.now();
  if (genreCache && (now - genreCache.timestamp) < GENRE_CACHE_DURATION) {
    return type === 'movie' ? genreCache.movies : genreCache.tv;
  }

  try {
    const { base, key } = await getBaseAndKey();
    const url = `${base}/api/v1/discover/genreslider/${type}`;
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (key) headers['X-Api-Key'] = key;
    
    const res = await fetch(url, { headers });
    const text = await res.text();
    if (!res.ok) throw new Error(`Seerr genres fetch failed: ${res.status} ${text}`);
    
    const genres = JSON.parse(text) as SeerrGenre[];
    
    // Update cache
    if (!genreCache) {
      genreCache = { movies: [], tv: [], timestamp: now };
    }
    if (type === 'movie') {
      genreCache.movies = genres;
    } else {
      genreCache.tv = genres;
    }
    genreCache.timestamp = now;
    
    return genres;
  } catch (error) {
    console.warn(`Failed to fetch ${type} genres:`, error);
    return [];
  }
}

// Get genre names from IDs
export function getGenreNames(genreIds: number[], genres: SeerrGenre[]): string[] {
  if (!genreIds || genreIds.length === 0) return [];
  const genreMap = new Map(genres.map(g => [g.id, g.name]));
  return genreIds.map(id => genreMap.get(id)).filter((name): name is string => name !== undefined);
}

export default {
  discover,
  discoverMovies,
  discoverTv,
  loadDiscoverLists,
  normalizeSeerrResult,
  normalizeSeerrResponse,
  fetchGenres,
  getGenreNames,
};
