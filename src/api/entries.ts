import {apiRequest} from './client';
import {getAccessToken} from '../storage/tokens';

// 'chat' is the AI Chat tab: a conversation from the first message, with no journal before it.
export type JournalType = 'check_in' | 'savouring' | 'thought' | 'exposure' | 'free_write' | 'chat';

export type MessageKind =
  | 'capture_prompt'
  | 'capture_answer'
  | 'offer'
  | 'chat'
  | 'crisis'
  | 'notice'
  | 'closing'
  | 'grounding';

export interface EntryMessage {
  id: string;
  role: 'ai' | 'user';
  kind: MessageKind | null;
  value_id: string | null;
  content: string;
  sequence: number;
  created_at: string;
}

export interface ScaleOption {
  value: number;
  label: string;
}

export interface CaptureSpec {
  value_id: string;
  control: 'scale' | 'multi_select' | 'free_text';
  required: boolean;
  library: string | null;
  scale: ScaleOption[] | null;
  max_length: number | null;
  // The user may send this value in several messages before moving on (free write).
  repeatable: boolean;
  // Library categories of this valence come first (positive feelings when savouring).
  prefer_valence: string | null;
}

export type ConversationStatus =
  | 'offered'
  | 'declined'
  | 'active'
  | 'closed'
  | 'suppressed'
  | null;

export type CrisisTier = 'mild' | 'danger' | 'emergency';

export interface CrisisEvent {
  tier: CrisisTier;
  variant: 'full' | 'abbreviated' | null;
  // Fixed content from the clinical content set; null for mild.
  text: string | null;
}

export interface EntryState {
  id: string;
  journal_type: JournalType;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  conversation_status: ConversationStatus;
  crisis_tier: CrisisTier | 'clear' | null;
  support_note: string | null;
  // FR-JRN-007: scope notice to acknowledge before the first value is requested.
  pending_notice: string | null;
  // FR-JRN-006: the entry is waiting for her to go and do what she planned.
  pending_resume: boolean;
  // FR-JRN-006: the exposure cycle this one continues.
  parent_entry_id: string | null;
  next_capture: CaptureSpec | null;
  messages: EntryMessage[];
  crisis_event: CrisisEvent | null;
  referral: boolean;
}

export interface EntrySummary {
  id: string;
  journal_type: JournalType;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  last_activity_at: string;
  mood: number | null;
  // The user's name for a deep-dive entry, or a date-based one (FR-ENT-009).
  name: string | null;
  // Which exposure cycle this is: 1, 2, 3… (FR-JRN-006).
  cycle: number | null;
  // The opening of what she wrote, so an entry is recognisable in the list.
  preview: string | null;
  // An AI Chat that is still 'active' can be carried on, not just read.
  conversation_status: ConversationStatus;
}

export type CaptureValue = number | string[] | string | null;

async function authed(path: string, method = 'GET', body?: unknown) {
  const token = await getAccessToken();
  return apiRequest(path, {method, body, token: token ?? undefined});
}

export function createEntry(
  journalType: JournalType,
  parentEntryId?: string,
): Promise<EntryState> {
  return authed('/entries', 'POST', {
    journal_type: journalType,
    parent_entry_id: parentEntryId ?? null,
  });
}

// FR-JRN-007: the user confirms she has read the scope notice.
export function acknowledgeNotice(entryId: string): Promise<EntryState> {
  return authed(`/entries/${entryId}/acknowledge`, 'POST', {});
}

// FR-JRN-006: she has done the thing she planned and is back to record how it went.
export function resumeEntry(entryId: string): Promise<EntryState> {
  return authed(`/entries/${entryId}/resume`, 'POST', {});
}

export function getEntry(entryId: string): Promise<EntryState> {
  return authed(`/entries/${entryId}`);
}

// The AI Chat tab opens on the most recent chat, so a conversation she left goes on.
export async function latestChat(): Promise<EntrySummary | null> {
  const chats: EntrySummary[] = await authed('/entries?journal_type=chat&limit=1');
  return chats[0] ?? null;
}

// FR-ENT-006: everything she has written, drafts included, newest activity first.
// `search` matches her answers and every message of a thread.
export function listEntries(search?: string): Promise<EntrySummary[]> {
  const query = search ? `?q=${encodeURIComponent(search)}` : '';
  return authed(`/entries${query}`);
}

// FR-HOME-002: drafts touched in the last 7 days can be resumed.
export function listRecentDrafts(): Promise<EntrySummary[]> {
  return authed('/entries?status=in_progress&since_days=7');
}

export function deleteEntry(entryId: string): Promise<null> {
  return authed(`/entries/${entryId}`, 'DELETE');
}

export function submitCapture(
  entryId: string,
  valueId: string,
  value: CaptureValue,
  skipped = false,
  // Repeatable values (free write): true means she is still writing.
  more = false,
): Promise<EntryState> {
  return authed(`/entries/${entryId}/captures`, 'POST', {
    value_id: valueId,
    value,
    skipped,
    more,
  });
}

export function chooseConversation(
  entryId: string,
  choice: 'continue' | 'stop' | 'end',
): Promise<EntryState> {
  return authed(`/entries/${entryId}/conversation`, 'POST', {choice});
}

// `more` sends the message without asking for a reply yet: an extended free
// write lets her finish her thought across several messages before Echo answers.
export function sendMessage(
  entryId: string,
  content: string,
  more = false,
): Promise<EntryState> {
  return authed(`/entries/${entryId}/messages`, 'POST', {content, more});
}

export const JOURNAL_TITLES: Record<JournalType, string> = {
  check_in: 'Check-in',
  savouring: 'Savouring',
  thought: 'Thought record',
  exposure: 'Facing something',
  free_write: 'Free write',
  chat: 'AI Chat',
};