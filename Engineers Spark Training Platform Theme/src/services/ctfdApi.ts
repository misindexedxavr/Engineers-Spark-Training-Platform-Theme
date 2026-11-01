/// <reference types="vite/client" />

interface ChallengeSolveEntry {
  account_id: number;
  name: string;
  date: string;
  value?: number;
}

interface PaginationMeta {
  page?: number;
  pages?: number;
  per_page?: number;
  total?: number;
  next?: string | null;
  prev?: string | null;
}

interface CTFdResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    [key: string]: unknown;
  };
}

interface Challenge {
  id: number;
  name: string;
  description: string;
  category: string;
  value: number;
  solved_by_me: boolean;
  requirements?: number[];
  solves?: number;
  type?: string;
  state?: string;
  max_attempts?: number;
  files?: string[];
}

interface WhaleContainer {
  user_access?: string;
  ip?: string;
  host?: string;
  port?: number | string;
  nc?: string;
  expiration?: string;
  expires?: string;
  renew?: string;
  [key: string]: unknown;
}

interface SwarmInstance {
  subdomain: string;
  port?: string | number;
  scheme?: string;
  expires_at: number;
}

interface SwarmResponse {
  success: boolean;
  instance: SwarmInstance | null;
  error?: string;
  message?: string;
}

interface User {
  id: number;
  name: string;
  email: string;
  score: number;
  place: number;
  team_id?: number | null;
}

interface Team {
  id: number;
  name: string;
  score: number;
  place: number;
  members?: Array<TeamMember | number>;
  members_count?: number;
  captain_id?: number;
  captain?: TeamMember | number | null;
  website?: string | null;
  affiliation?: string | null;
  country?: string | null;
  created?: string;
  hidden?: boolean;
  banned?: boolean;
}

interface TeamMember {
  id: number;
  name: string;
  email?: string;
  score?: number;
}

interface TeamSettingsUpdate {
  name?: string;
  password?: string;
  confirm?: string;
  website?: string;
  affiliation?: string;
  country?: string;
}

interface TeamInviteToken {
  token: string;
  url?: string;
}

interface ScoreboardEntry {
  account_id: number;
  name: string;
  score: number;
  place: number;
}

interface Token {
  id: number;
  value: string;
  description: string;
  created: string;
  expiration: string | null;
}

interface UserSolve {
  challenge_id?: number;
  challenge?: {
    id?: number;
    name?: string;
    category?: string;
    value?: number;
  };
  value?: number;
  date?: string;
}

interface UserAward {
  id?: number;
  name?: string;
  description?: string;
  category?: string;
  icon?: string;
  value?: number;
  date?: string;
}

interface TeamSolve {
  challenge_id?: number;
  value?: number;
  date?: string;
  challenge?: {
    id?: number;
    name?: string;
    category?: string;
    value?: number;
  };
}

interface TeamAward {
  id?: number;
  name?: string;
  description?: string;
  category?: string;
  icon?: string;
  value?: number;
  date?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const isDev = (import.meta as any).env?.DEV === true;
const debugLog = (...args: unknown[]) => {
  if (isDev) {
    console.log(...args);
  }
};

const debugWarn = (...args: unknown[]) => {
  if (isDev) {
    console.warn(...args);
  }
};

class CTFdAPI {
  private baseURL = "/api/v1";
  private csrfToken: string | null = null;

  private toErrorMessage(errorData: unknown, status: number): string {
    if (!errorData || typeof errorData !== "object") {
      return `API request failed: ${status}`;
    }

    const payload = errorData as Record<string, unknown>;

    if (typeof payload.message === "string" && payload.message.trim()) {
      return payload.message.trim();
    }

    const directData = payload.data;
    if (typeof directData === "string" && directData.trim()) {
      return directData.trim();
    }

    const errors = payload.errors;
    if (errors && typeof errors === "object") {
      // Handle errors as object (CTFd format: { field: ["error1", "error2"] })
      const entries = Object.entries(errors);
      for (const [field, messages] of entries) {
        if (Array.isArray(messages)) {
          for (const msg of messages) {
            if (typeof msg === "string" && msg.trim()) {
              return `${field}: ${msg.trim()}`;
            }
          }
        } else if (typeof messages === "string" && messages.trim()) {
          return `${field}: ${messages.trim()}`;
        }
      }

      if (Array.isArray(errors)) {
        const firstString = errors.find(
          (entry): entry is string =>
            typeof entry === "string" && entry.trim().length > 0,
        );
        if (firstString) {
          return firstString.trim();
        }

        const firstObjMessage = errors
          .map((entry) =>
            entry && typeof entry === "object"
              ? (entry as Record<string, unknown>).message
              : null,
          )
          .find(
            (value): value is string =>
              typeof value === "string" && value.trim().length > 0,
          );
        if (firstObjMessage) {
          return firstObjMessage.trim();
        }
      }
    }

    return `API request failed: ${status}`;
  }

  private setCSRFToken(token: string | null): void {
    this.csrfToken = token;
    (window as any).init = (window as any).init || {};
    if (token) {
      (window as any).init.csrfNonce = token;
    }
  }

  private authErrorFromHtml(html: string): string | null {
    const match = html.match(/class="[^"]*(?:alert-danger|text-danger|invalid-feedback)[^"]*"[^>]*>\s*([\s\S]*?)\s*<\//i);
    if (!match) return null;
    const message = match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    return message || null;
  }

  private async getNonce(): Promise<string | null> {
    try {
      const noncePath = (import.meta as any).env?.DEV ? "/ctfd-page" : "/";
      const response = await fetch(noncePath, {
        method: "GET",
        credentials: "include",
      });
      
      // Try to get nonce from response headers first (CTFd may set it)
      const headerNonce = response.headers.get("X-CSRF-Token") || response.headers.get("CSRF-Token");
      if (headerNonce) {
        this.setCSRFToken(headerNonce);
        return headerNonce;
      }

      const html = await response.text();
      const nonceMatch = html.match(/csrfNonce:\s*"([^"]+)"/);
      if (nonceMatch && nonceMatch[1]) {
        this.setCSRFToken(nonceMatch[1]);
        return nonceMatch[1];
      }
    } catch (error) {
      debugWarn("[ctfdApi] Failed to fetch fresh nonce:", error);
    }

    const fallback = (window as any).init?.csrfNonce || this.csrfToken || null;
    if (fallback) {
      this.setCSRFToken(fallback);
    }
    return fallback;
  }

  // Proactively refresh nonce in background
  private nonceRefreshInterval: ReturnType<typeof setInterval> | null = null;

  public startNonceRefresher(intervalMs = 60000): void {
    if (this.nonceRefreshInterval) return;
    this.nonceRefreshInterval = setInterval(() => {
      this.getNonce().catch(() => {});
    }, intervalMs);
  }

  public stopNonceRefresher(): void {
    if (this.nonceRefreshInterval) {
      clearInterval(this.nonceRefreshInterval);
      this.nonceRefreshInterval = null;
    }
  }

  // Initialize CSRF on app load
  public async initializeCSRF(): Promise<void> {
    await this.getNonce();
    this.startNonceRefresher();
  }

  private async requestWebForm<T>(
    endpoint: string,
    data: Record<string, string>,
  ): Promise<CTFdResponse<T>> {
    const nonce = (await this.getNonce()) || "";
    const formData = new URLSearchParams();

    Object.entries(data).forEach(([key, value]) => {
      if (typeof value === "string" && value.trim().length > 0) {
        formData.append(key, value);
      }
    });

    if (nonce) {
      formData.append("nonce", nonce);
    }

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
      credentials: "include",
    });

    if (!response.ok && !response.redirected) {
      const text = await response.text();
      const errorMatch =
        text.match(/class="alert[^"]*alert-danger[^"]*"[^>]*>([^<]+)/i) ||
        text.match(/error[^>]*>([^<]+)/i);

      throw new Error(
        errorMatch?.[1]?.trim() ||
          `Request failed: ${response.status} ${response.statusText}`,
      );
    }

    return {
      success: true,
      data: {} as T,
    };
  }

  private async requestSettingsForm<T>(
    data: Record<string, string>,
  ): Promise<CTFdResponse<T>> {
    return this.requestWebForm<T>("/teams/settings", data);
  }

  private normalizeTokenFromData(data: unknown): string | null {
    if (typeof data === "string" && data.trim().length > 0) {
      return data.trim();
    }

    if (Array.isArray(data)) {
      for (const item of data) {
        const fromItem = this.normalizeTokenFromData(item);
        if (fromItem) {
          return fromItem;
        }
      }
      return null;
    }

    if (data && typeof data === "object") {
      const candidateKeys = [
        "token",
        "value",
        "code",
        "invite",
        "invite_token",
      ];
      for (const key of candidateKeys) {
        const value = (data as Record<string, unknown>)[key];
        if (typeof value === "string" && value.trim().length > 0) {
          return value.trim();
        }
      }
    }

    return null;
  }

  private buildInviteUrl(token: string): string {
    return `${window.location.origin}/team?invite=${encodeURIComponent(token)}`;
  }

  private normalizeConfigMap(data: unknown): Record<string, unknown> {
    if (Array.isArray(data)) {
      return data.reduce<Record<string, unknown>>((acc, entry) => {
        if (entry && typeof entry === "object") {
          const key =
            "key" in entry
              ? entry.key
              : "name" in entry
                ? entry.name
                : undefined;
          const value = "value" in entry ? entry.value : undefined;
          if (typeof key === "string") {
            acc[key] = value;
          }
        }
        return acc;
      }, {});
    }

    if (data && typeof data === "object") {
      return data as Record<string, unknown>;
    }

    return {};
  }

  private async verifyTeamModeEnabled(): Promise<void> {
    const configResponse = await this.getConfig().catch(() => null);
    const config = this.normalizeConfigMap(configResponse?.data);

    const explicitTeamMode = config.team_mode;
    if (typeof explicitTeamMode === "boolean" && !explicitTeamMode) {
      throw new Error("Team mode is disabled in CTFd config.");
    }

    const rawMode = String(
      config.user_mode ?? config.team_mode ?? "",
    ).toLowerCase();
    if (rawMode && rawMode !== "teams" && rawMode !== "team") {
      throw new Error("CTFd is not running in team mode.");
    }
  }

  private async verifyTeamPermissions(teamId: number): Promise<void> {
    const meResponse = await this.getCurrentUser();
    const me = meResponse.data;

    if (!me?.id) {
      throw new Error("You must be authenticated to manage team invites.");
    }

    if (me.team_id !== teamId) {
      throw new Error("You can only generate invites for your own team.");
    }

    const teamResponse = await this.getTeam(teamId);
    const team = teamResponse.data;
    const captainId =
      typeof team?.captain_id === "number"
        ? team.captain_id
        : typeof team?.captain === "number"
          ? team.captain
          : team?.captain &&
              typeof team.captain === "object" &&
              typeof team.captain.id === "number"
            ? team.captain.id
            : null;

    if (captainId !== null && captainId !== me.id) {
      throw new Error("Only the team captain can generate invite tokens.");
    }
  }

  private async verifyInviteEndpointPath(
    teamId: number,
    nonce: string | null,
  ): Promise<string | null> {
    const candidatePaths = [
      `/teams/${teamId}/invites`,
      `/teams/${teamId}/invite`,
      `/teams/${teamId}/tokens`,
    ];

    for (const path of candidatePaths) {
      try {
        const response = await fetch(`${this.baseURL}${path}`, {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
            ...(nonce
              ? {
                  "CSRF-Token": nonce,
                  "X-CSRF-Token": nonce,
                }
              : {}),
          },
          body: JSON.stringify(nonce ? { nonce } : {}),
        });

        if (response.status === 404) {
          continue;
        }

        return path;
      } catch {
        continue;
      }
    }

    return null;
  }

  async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<CTFdResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    let nonce = (window as any).init?.csrfNonce || this.csrfToken;

    const buildHeaders = (currentNonce: string | null) => {
      const merged: Record<string, string> = {
        "Content-Type": "application/json",
        ...((options.headers as Record<string, string>) || {}),
      };

      if (currentNonce) {
        merged["CSRF-Token"] = currentNonce;
        merged["X-CSRF-Token"] = currentNonce;
      }

      return merged;
    };

    debugLog(`[ctfdApi] ${options.method || "GET"} ${endpoint}`, {
      hasCSRF: !!nonce,
      headers: Object.keys(buildHeaders(nonce)),
      url: url,
    });

    // Retry with exponential backoff on 403 (CSRF token expired)
    const maxRetries = 3;
    let attempt = 0;
    let response: Response | null = null;

    while (attempt <= maxRetries) {
      try {
        response = await fetch(url, {
          ...options,
          headers: buildHeaders(nonce),
          credentials: "include",
        });

        // Check for new nonce in response headers
        const headerNonce = response.headers.get("X-CSRF-Token") || response.headers.get("CSRF-Token");
        if (headerNonce && headerNonce !== nonce) {
          this.setCSRFToken(headerNonce);
          nonce = headerNonce;
        }

        if (response.status === 403 && endpoint !== "/users/me" && attempt < maxRetries) {
          debugLog(`[ctfdApi] 403 on ${endpoint}, fetching fresh nonce (attempt ${attempt + 1})`);
          const freshNonce = await this.getNonce();
          if (freshNonce && freshNonce !== nonce) {
            nonce = freshNonce;
            attempt++;
            continue; // retry with new nonce
          }
        }

        break; // success or non-retryable error
      } catch (error) {
        debugWarn(`[ctfdApi] Network error on ${endpoint}:`, error);
        if (attempt >= maxRetries) throw error;
        attempt++;
        await new Promise(r => setTimeout(r, 1000 * attempt)); // exponential backoff
      }
    }

    if (!response) {
      throw new Error(`Network error: failed after ${maxRetries} retries`);
    }

    if (!response.ok) {
      // Try to get error details from response body
      let errorData;
      try {
        errorData = await response.json();
        if (
          !(
            (endpoint === "/users/me" && response.status === 403) ||
            (endpoint === "/configs" && response.status === 403)
          )
        ) {
          console.error(
            `[ctfdApi] Request failed: ${response.status} ${response.statusText}`,
            errorData,
          );
        }
      } catch {
        if (
          !(
            (endpoint === "/users/me" && response.status === 403) ||
            (endpoint === "/configs" && response.status === 403)
          )
        ) {
          console.error(
            `[ctfdApi] Request failed: ${response.status} ${response.statusText}`,
          );
        }
      }
      throw new Error(this.toErrorMessage(errorData, response.status));
    }

    const data = await response.json();
    debugLog(`[ctfdApi] ${endpoint} success:`, data.success);
    return data;
  }

  // Challenges
  async getChallenges(): Promise<CTFdResponse<Challenge[]>> {
    return this.request<Challenge[]>("/challenges");
  }

  async getChallenge(id: number): Promise<CTFdResponse<Challenge>> {
    return this.request<Challenge>(`/challenges/${id}`);
  }

  async getChallengeSolves(id: number): Promise<CTFdResponse<ChallengeSolveEntry[]>> {
    return this.request<ChallengeSolveEntry[]>(`/challenges/${id}/solves`);
  }

  async submitFlag(
    challengeId: number,
    submission: string,
  ): Promise<CTFdResponse<any>> {
    debugLog("[ctfdApi] Submitting flag for challenge:", challengeId);
    return this.request("/challenges/attempt", {
      method: "POST",
      body: JSON.stringify({
        challenge_id: challengeId,
        submission: submission,
      }),
    });
  }

  // Scoreboard
  async getScoreboard(): Promise<CTFdResponse<ScoreboardEntry[]>> {
    return this.request<ScoreboardEntry[]>("/scoreboard");
  }

  async getScoreboardTop(count: number = 10): Promise<
    CTFdResponse<
      Record<
        string,
        {
          id: number;
          name: string;
          solves: Array<{
            challenge_id: number;
            account_id: number;
            value: number;
            date: string;
          }>;
        }
      >
    >
  > {
    return this.request(`/scoreboard/top/${count}`);
  }

  // Teams
  async getTeams(params?: {
    page?: number;
    perPage?: number;
  }): Promise<CTFdResponse<Team[]>> {
    const searchParams = new URLSearchParams();

    if (params?.page) {
      searchParams.set("page", String(params.page));
    }
    if (params?.perPage) {
      searchParams.set("per_page", String(params.perPage));
    }

    const suffix = searchParams.toString();
    return this.request<Team[]>(`/teams${suffix ? `?${suffix}` : ""}`);
  }

  // Users (works in both team and user mode via scoreboard)
  async getUsers(params?: {
    page?: number;
    perPage?: number;
  }): Promise<CTFdResponse<Array<{id: number; name: string; score: number; place: number; account_id: number}>>> {
    // Scoreboard returns all users in both modes
    return this.request<Array<{id: number; name: string; score: number; place: number; account_id: number}>>("/scoreboard");
  }

  // Admin only: get all users (requires admin permissions)
  async getUsersList(params?: {
    page?: number;
    perPage?: number;
  }): Promise<CTFdResponse<Array<{id: number; name: string; email: string; score: number; place: number | null; website: string | null; country: string | null; affiliation: string | null; bracket_id: number | null; bracket_name: string | null; type: string; hidden: boolean; banned: boolean}>>> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set("page", String(params.page));
    if (params?.perPage) searchParams.set("per_page", String(params.perPage));
    const suffix = searchParams.toString();
    return this.request<Array<{id: number; name: string; email: string; score: number; place: number | null; website: string | null; country: string | null; affiliation: string | null; bracket_id: number | null; bracket_name: string | null; type: string; hidden: boolean; banned: boolean}>>(`/users${suffix ? `?${suffix}` : ""}`);
  }

  async getTeam(id: number): Promise<CTFdResponse<Team>> {
    return this.request<Team>(`/teams/${id}`);
  }

  async createTeam(
    name: string,
    password?: string,
  ): Promise<CTFdResponse<Team>> {
    await this.requestWebForm<Team>("/teams/new", {
      name,
      password: password?.trim() || "",
    });
    return { success: true, data: {} as Team };
  }

  async joinTeam(options: {
    teamId?: number;
    teamName?: string;
    password?: string;
    inviteToken?: string;
  }): Promise<CTFdResponse<User>> {
    if (!options.teamName?.trim()) {
      throw new Error("Team name is required to join a team");
    }

    await this.requestWebForm<User>("/teams/join", {
      name: options.teamName.trim(),
      password: options.password?.trim() || "",
    });

    return { success: true, data: {} as User };
  }

  async leaveTeam(teamId: number): Promise<CTFdResponse<any>> {
    const nonce = await this.getNonce();
    await this.requestWebForm("/teams/leave", nonce ? { nonce } : {});
    return { success: true, data: {} };
  }

  async updateTeamSettings(
    teamId: number,
    settings: TeamSettingsUpdate,
  ): Promise<CTFdResponse<Team>> {
    const nonce = await this.getNonce();
    const body: Record<string, string> = {};

    if (settings.name !== undefined) body.name = settings.name;
    if (settings.password !== undefined) body.password = settings.password;
    if (settings.confirm !== undefined) body.confirm = settings.confirm;
    if (settings.website !== undefined) body.website = settings.website;
    if (settings.affiliation !== undefined)
      body.affiliation = settings.affiliation;
    if (settings.country !== undefined) body.country = settings.country;
    if (nonce) body.nonce = nonce;

    try {
      return await this.request<Team>("/teams/me", {
        method: "PATCH",
        body: JSON.stringify(body),
      });
    } catch {
      await this.requestSettingsForm<Team>({
        name: settings.name || "",
        password: settings.password || "",
        confirm: settings.confirm || "",
        website: settings.website || "",
        affiliation: settings.affiliation || "",
        country: settings.country || "",
      });
      return this.getTeam(teamId);
    }
  }

  async transferTeamCaptain(captainId: number): Promise<CTFdResponse<Team>> {
    const nonce = await this.getNonce();
    return this.request<Team>("/teams/me", {
      method: "PATCH",
      body: JSON.stringify(
        nonce ? { captain_id: captainId, nonce } : { captain_id: captainId },
      ),
    });
  }

  async disbandTeam(): Promise<CTFdResponse<any>> {
    const nonce = await this.getNonce();
    return this.request("/teams/me", {
      method: "DELETE",
      body: JSON.stringify(nonce ? { nonce } : {}),
    });
  }

  async generateTeamInviteCode(): Promise<string> {
    const nonce = await this.getNonce();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const response = await this.request<any>("/teams/me/members", {
      method: "POST",
      body: JSON.stringify(nonce ? { nonce } : {}),
    });
    // CTFd returns the invite code in data.code or data
    const code =
      response?.data?.code ||
      response?.data?.invite_code ||
      response?.data?.token ||
      (typeof response?.data === "string" ? response.data : null);
    if (!code) {
      throw new Error("CTFd did not return an invite code.");
    }
    return code as string;
  }

  // Users
  async getCurrentUser(): Promise<CTFdResponse<User>> {
    return this.request<User>("/users/me");
  }

  async updateUserProfile(data: Partial<User>): Promise<CTFdResponse<User>> {
    const nonce = await this.getNonce();
    return this.request<User>("/users/me", {
      method: "PATCH",
      body: JSON.stringify({ ...data, nonce }),
    });
  }

  async login(name: string, password: string): Promise<CTFdResponse<User>> {
    try {
      const nonce = await this.getNonce();

      const formData = new URLSearchParams();
      formData.append("name", name);
      formData.append("password", password);
      if (nonce) {
        formData.append("nonce", nonce);
      }

      const response = await fetch("/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        credentials: "include",
      });

      const html = await response.text();
      const authError = this.authErrorFromHtml(html);
      if (authError) throw new Error(authError);

      await new Promise((resolve) => setTimeout(resolve, 200));

      try {
        const userResponse = await this.getCurrentUser();
        if (userResponse.success && userResponse.data) {
          return { success: true, data: userResponse.data };
        }
      } catch {
        throw new Error("Your username or password is incorrect");
      }

      throw new Error("Your username or password is incorrect");
    } catch (error) {
      console.error("[ctfdApi] Login error:", error);
      throw error;
    }
  }

  async register(
    name: string,
    email: string,
    password: string,
    registrationCode?: string,
    affiliation?: string,
  ): Promise<CTFdResponse<User>> {
    try {
      const nonce = await this.getNonce();

      const formData = new URLSearchParams();
      formData.append("name", name);
      formData.append("email", email);
      formData.append("password", password);
      if (registrationCode) {
        formData.append("registration_code", registrationCode);
      }
      if (affiliation) {
        formData.append("affiliation", affiliation);
      }
      if (nonce) {
        formData.append("nonce", nonce);
      }

      const response = await fetch("/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
        credentials: "include",
      });

      const html = await response.text();
      console.log("[ctfdApi] Register response status:", response.status);
      console.log("[ctfdApi] Register response HTML length:", html.length);
      
      const authError = this.authErrorFromHtml(html);
      if (authError) throw new Error(authError);

      // Check if registration was successful by looking for redirect or success indicators
      if (response.redirected || response.ok) {
        await new Promise((resolve) => setTimeout(resolve, 200));
        try {
          const userResponse = await this.getCurrentUser();
          if (userResponse.success && userResponse.data) {
            return { success: true, data: userResponse.data };
          }
        } catch {}
      }

      // Try to extract error from HTML
      const errorMatch = html.match(/class="alert[^"]*alert-danger[^"]*"[^>]*>([^<]+)/i) ||
                         html.match(/id="error"[^>]*>([^<]+)/i) ||
                         html.match(/class="error"[^>]*>([^<]+)/i);
      if (errorMatch && errorMatch[1]) {
        throw new Error(errorMatch[1].trim());
      }

      throw new Error("Registration failed. Please check your information.");
    } catch (error) {
      console.error("[ctfdApi] Registration error:", error);
      throw error;
    }
  }

  async getUser(id: number): Promise<CTFdResponse<User>> {
    return this.request<User>(`/users/${id}`);
  }

  async getUserSolves(id: number): Promise<CTFdResponse<UserSolve[]>> {
    return this.request<UserSolve[]>(`/users/${id}/solves`);
  }

  async getUserAwards(id: number): Promise<CTFdResponse<UserAward[]>> {
    return this.request<UserAward[]>(`/users/${id}/awards`);
  }

  async getTeamSolves(id: number): Promise<CTFdResponse<TeamSolve[]>> {
    return this.request<TeamSolve[]>(`/teams/${id}/solves`);
  }

  async getTeamAwards(id: number): Promise<CTFdResponse<TeamAward[]>> {
    return this.request<TeamAward[]>(`/teams/${id}/awards`);
  }

  // Config
  async getConfig(): Promise<CTFdResponse<any>> {
    return this.request("/configs");
  }

  async checkAuth(): Promise<(User & { isAdmin: boolean }) | null> {
    try {
      const response = await this.getCurrentUser();
      if (response.success && response.data) {
        const isAdmin = await this.checkIsAdmin();
        return { ...response.data, isAdmin };
      }
      return null;
    } catch {
      return null;
    }
  }

  // Admin check
  async checkIsAdmin(): Promise<boolean> {
    try {
      // Try to access an admin-only endpoint
      const response = await fetch("/admin/statistics", {
        method: "GET",
        credentials: "include",
        redirect: "manual", // Don't follow redirects
      });
      // If we get 200, user is admin
      // If we get 302 (redirect to login), user is not admin
      // If we get 403, user is not admin
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Tokens
  async getTokens(): Promise<CTFdResponse<Token[]>> {
    return this.request<Token[]>("/tokens");
  }

  async generateToken(data: {
    description: string;
    expiration: string | null;
  }): Promise<CTFdResponse<Token>> {
    const isAdmin = await this.checkIsAdmin();
    if (!isAdmin) {
      throw new Error("Only admin users can generate CTF access tokens.");
    }

    const nonce = await this.getNonce();
    return this.request<Token>("/tokens", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        nonce: nonce,
      }),
    });
  }

  async deleteToken(id: number): Promise<CTFdResponse<any>> {
    const nonce = await this.getNonce();
    return this.request(`/tokens/${id}`, {
      method: "DELETE",
      body: JSON.stringify({ nonce: nonce }),
    });
  }

  async logout(): Promise<{ success: boolean }> {
    try {
      await fetch("/logout", {
        method: "GET",
        credentials: "include",
      });
      this.setCSRFToken(null);
      return { success: true };
    } catch (error) {
      console.error("[ctfdApi] Logout error:", error);
      throw error;
    }
  }

  // Whale Plugin - Container Management
  async getWhaleContainer(
    challengeId: number,
  ): Promise<CTFdResponse<WhaleContainer>> {
    return this.request<WhaleContainer>(
      `/plugins/ctfd-whale/container?challenge_id=${challengeId}`,
    );
  }

  async createWhaleContainer(
    challengeId: number,
  ): Promise<CTFdResponse<WhaleContainer>> {
    return this.request<WhaleContainer>(
      `/plugins/ctfd-whale/container?challenge_id=${challengeId}`,
      {
        method: "POST",
      },
    );
  }

  async deleteWhaleContainer(): Promise<CTFdResponse<Record<string, unknown>>> {
    return this.request<Record<string, unknown>>(
      "/plugins/ctfd-whale/container",
      {
        method: "DELETE",
      },
    );
  }

  async renewWhaleContainer(
    challengeId: number,
  ): Promise<CTFdResponse<WhaleContainer>> {
    return this.request<WhaleContainer>(
      `/plugins/ctfd-whale/container?challenge_id=${challengeId}`,
      {
        method: "PATCH",
      },
    );
  }

  // Swarm plugin - per-challenge ephemeral instances.
  // These endpoints are at root level (/swarm/...), not under /api/v1/
  private async swarmRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
    const nonce = (window as any).init?.csrfNonce || this.csrfToken;
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...((options.headers as Record<string, string>) || {}),
    };
    if (nonce) {
      headers["CSRF-Token"] = nonce;
      headers["X-CSRF-Token"] = nonce;
    }

    const response = await fetch(path, {
      ...options,
      headers,
      credentials: "include",
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {}
      throw new Error(this.toErrorMessage(errorData, response.status));
    }

    return response.json();
  }

  async getSwarmInstance(challengeId: number): Promise<SwarmResponse> {
    return this.swarmRequest<any>(`/swarm/status/${challengeId}`) as Promise<SwarmResponse>;
  }

  async spawnSwarmInstance(challengeId: number): Promise<SwarmResponse> {
    return this.swarmRequest<any>(`/swarm/spawn/${challengeId}`, { method: "POST" }) as Promise<SwarmResponse>;
  }

  async stopSwarmInstance(challengeId: number): Promise<SwarmResponse> {
    return this.swarmRequest<any>(`/swarm/stop/${challengeId}`, { method: "POST" }) as Promise<SwarmResponse>;
  }
}

export const ctfdApi = new CTFdAPI();
export type {
  Challenge as ApiChallenge,
  ChallengeSolveEntry,
  ScoreboardEntry,
  Team,
  TeamAward,
  TeamSolve,
  Token,
  User,
  UserAward,
  UserSolve,
  WhaleContainer,
  SwarmInstance,
  SwarmResponse,
};