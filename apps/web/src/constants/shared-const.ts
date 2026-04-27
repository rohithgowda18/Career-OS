export const COOKIE_NAME = "app_session_id";
export const ONE_YEAR_MS = 1000 * 60 * 60 * 24 * 365;
export const AXIOS_TIMEOUT_MS = 30_000;
export const UNAUTHED_ERR_MSG = 'Please login (10001)';
export const NOT_ADMIN_ERR_MSG = 'You do not have required permission (10002)';

// Feature 1: Recommendation Weights
export const REC_SKILL_WEIGHT = 0.35;
export const REC_EXPERIENCE_WEIGHT = 0.25;
export const REC_INTEREST_WEIGHT = 0.20;
export const REC_HISTORY_WEIGHT = 0.20;

// Feature 4: Success Scoring Weights
export const SCORE_EVENT_TYPE_WEIGHT = 0.30;
export const SCORE_EXPERIENCE_WEIGHT = 0.25;
export const SCORE_ACCEPTANCE_WEIGHT = 0.20;
export const SCORE_TIMELINE_WEIGHT = 0.15;
export const SCORE_TREND_WEIGHT = 0.10;

// Limits
export const TEAMS_MAX_MEMBERS = 10;
export const TEAMS_DEFAULT_MAX = 5;
export const RECOMMENDATIONS_MAX_RESULTS = 5;
