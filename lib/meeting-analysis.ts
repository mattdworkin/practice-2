export const MAX_MEETING_NOTES_LENGTH = 12000;
export const SENTIMENTS = ["positive", "neutral", "negative"] as const;

export type MeetingSentiment = (typeof SENTIMENTS)[number];

export interface MeetingInsights {
  summary: string;
  key_points: string[];
  action_items: string[];
  sentiment: MeetingSentiment;
}

export interface AnalyzeMeetingRequest {
  notes: string;
}

export interface Database {
  public: {
    Tables: {
      meeting_analyses: {
        Row: {
          id: string;
          user_id: string;
          original_notes: string;
          summary: string;
          key_points: string[];
          action_items: string[];
          sentiment: MeetingSentiment;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          original_notes: string;
          summary: string;
          key_points: string[];
          action_items: string[];
          sentiment: MeetingSentiment;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          original_notes?: string;
          summary?: string;
          key_points?: string[];
          action_items?: string[];
          sentiment?: MeetingSentiment;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type MeetingAnalysis = Database["public"]["Tables"]["meeting_analyses"]["Row"];
export type MeetingAnalysisInsert =
  Database["public"]["Tables"]["meeting_analyses"]["Insert"];

function isMeetingSentiment(value: unknown): value is MeetingSentiment {
  return SENTIMENTS.includes(value as MeetingSentiment);
}

function parseNonEmptyString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function parseStringArray(value: unknown): string[] | null {
  if (!Array.isArray(value)) {
    return null;
  }

  const parsedItems = value.map(parseNonEmptyString);
  return parsedItems.every(Boolean) ? (parsedItems as string[]) : null;
}

export function parseMeetingInsights(payload: unknown): MeetingInsights | null {
  if (!payload || typeof payload !== "object") {
    return null;
  }

  const candidate = payload as Record<string, unknown>;
  const summary = parseNonEmptyString(candidate.summary);
  const keyPoints = parseStringArray(candidate.key_points);
  const actionItems = parseStringArray(candidate.action_items);
  const sentiment = candidate.sentiment;

  if (!summary || !keyPoints || !actionItems || !isMeetingSentiment(sentiment)) {
    return null;
  }

  return {
    summary,
    key_points: keyPoints,
    action_items: actionItems,
    sentiment,
  };
}

export function parseMeetingNotesInput(payload: unknown): {
  notes: string | null;
  error: string | null;
} {
  if (!payload || typeof payload !== "object") {
    return {
      notes: null,
      error: "Request body must be a JSON object.",
    };
  }

  const notes = parseNonEmptyString((payload as AnalyzeMeetingRequest).notes);

  if (!notes) {
    return {
      notes: null,
      error: "Meeting notes are required.",
    };
  }

  if (notes.length > MAX_MEETING_NOTES_LENGTH) {
    return {
      notes: null,
      error: `Meeting notes must be ${MAX_MEETING_NOTES_LENGTH.toLocaleString()} characters or fewer.`,
    };
  }

  return {
    notes,
    error: null,
  };
}
