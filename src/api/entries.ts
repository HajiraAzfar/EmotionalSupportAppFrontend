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
  | 'grounding'
  // Thought journal: one other way of reading the thought, offered when she
  // asks. Labelled as Echo's and never saved as her answer.
  | 'perspective';

export interface EntryMessage {
  id: string;
  role: 'ai' | 'user';
  kind: MessageKind | null;
  value_id: string | null;
  content: string;
  // AI Chat: the helplines card drawn under this reply. Its own field, never part of the text.
  card?: 'soft' | 'prominent' | null;
  sequence: number;
  created_at: string;
}

export interface ScaleOption {
  value: number;
  label: string;
}

export interface RatedItem {
  id: string;
  name: string;
}

// rating_set: one rating per item she already chose, on the range the server sets.
export interface RatingSet {
  items: RatedItem[];
  min: number;
  max: number;
  // Ratings she gave the same items earlier, so the second pass starts there.
  carried: Record<string, number> | null;
}

export interface CaptureSpec {
  value_id: string;
  control: 'scale' | 'multi_select' | 'free_text' | 'rating_set';
  required: boolean;
  library: string | null;
  scale: ScaleOption[] | null;
  max_length: number | null;
  // The user may send this value in several messages before moving on (free write).
  repeatable: boolean;
  // Library categories of this valence come first (positive feelings when savouring).
  prefer_valence: string | null;
  // She may speak this answer instead of typing it.
  voice?: boolean;
  rates?: RatingSet | null;
  // Which step of this entry she is on, out of how many it will ask. Counted by
  // the server from her answers: it shrinks when a branch closes, never grows.
  step?: number | null;
  total?: number | null;
  // A published questionnaire item (PHQ-9, GAD-7): shown as worded, never changed later.
  fixed?: boolean;
  // Items to show already ticked: a journal opened from a check-in starts from its feelings.
  preselected?: string[] | null;
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
  // A safety question answered positively: open the crisis resources at once.
  show_resources?: boolean;
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
  // A check-in's slot and the day it belongs to; the check-in a journal was opened from.
  slot?: CheckInSlot | null;
  local_date?: string | null;
  source_entry_id?: string | null;
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

export type CaptureValue = number | string[] | string | Record<string, number> | null;

async function authed(path: string, method = 'GET', body?: unknown) {
  const token = await getAccessToken();
  return apiRequest(path, {method, body, token: token ?? undefined});
}

export type CheckInSlot = 'morning' | 'afternoon' | 'evening';

export const SLOT_TITLES: Record<CheckInSlot, string> = {
  morning: 'Morning check-in',
  afternoon: 'Afternoon check-in',
  evening: 'Evening check-in',
};

// Minutes east of UTC, and the zone's name, as the phone reports them.
export function phoneClock() {
  let timezone: string | null = null;
  try {
    timezone = Intl.DateTimeFormat().resolvedOptions().timeZone ?? null;
  } catch {
    timezone = null;
  }
  return {tz_offset: -new Date().getTimezoneOffset(), timezone};
}

export type CreateOptions = {
  // A check-in's slot, and the day it belongs to (an evening after midnight is
  // still the day before). Only a slot open now can be started.
  slot?: CheckInSlot;
  localDate?: string;
  // The check-in this journal is opened from (its feelings come ticked).
  sourceEntryId?: string;
};

export function createEntry(
  journalType: JournalType,
  parentEntryId?: string,
  options: CreateOptions = {},
): Promise<EntryState> {
  return authed('/entries', 'POST', {
    journal_type: journalType,
    parent_entry_id: parentEntryId ?? null,
    ...(options.slot ? {slot: options.slot, local_date: options.localDate ?? null, ...phoneClock()} : {}),
    ...(options.sourceEntryId ? {source_entry_id: options.sourceEntryId} : {}),
  });
}

// closed: its time has passed without it being finished; nothing can be added.
export type SlotState = 'done' | 'started' | 'open' | 'upcoming' | 'closed';

export interface SlotRow {
  local_date: string;
  slot: CheckInSlot;
  state: SlotState;
  entry_id: string | null;
  // Local wall-clock times, "YYYY-MM-DDTHH:MM".
  opens_at: string;
  closes_at: string;
}

export interface SlotBoard {
  current: {slot: CheckInSlot; local_date: string};
  slots: SlotRow[];
}

// Yesterday's and today's three check-ins, on the phone's clock.
export function getCheckInSlots(): Promise<SlotBoard> {
  return authed(`/entries/check_in/slots?tz_offset=${phoneClock().tz_offset}`);
}

// She has moved on from crisis content deliberately: the safety flag is read.
export function acknowledgeCrisis(entryId: string): Promise<EntryState> {
  return authed(`/entries/${entryId}/crisis/acknowledge`, 'POST', {});
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
  // Made once per answer and reused on retry, so a lost response never records it twice.
  clientId: string = newClientId(),
): Promise<EntryState> {
  return authed(`/entries/${entryId}/captures`, 'POST', {
    value_id: valueId,
    value,
    skipped,
    more,
    client_id: clientId,
  });
}

// RFC 4122 v4 from Math.random: only an idempotency key, never a secret.
export function newClientId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, ch => {
    const r = Math.floor(Math.random() * 16);
    return (ch === 'x' ? r : 8 + (r % 4)).toString(16);
  });
}

// Change an answer she has already given, from the review. /captures only ever
// goes forward (FR-ENT-024); this is the one way back, and it touches only a
// value already recorded. Her first version stays in the thread.
export function reviseCapture(
  entryId: string,
  valueId: string,
  value: CaptureValue,
  skipped = false,
  clientId: string = newClientId(),
): Promise<EntryState> {
  return authed(`/entries/${entryId}/captures/${valueId}`, 'PATCH', {
    value,
    skipped,
    client_id: clientId,
  });
}

// "Help me explore another perspective" — one suggestion, because she pressed
// the button. It arrives as a message of its own kind and is never her answer.
export function askPerspective(entryId: string): Promise<EntryState> {
  return authed(`/entries/${entryId}/perspective`, 'POST', {});
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
  // The brand brief's names.
  savouring: 'Saving Journal',
  thought: 'Thought Journal',
  exposure: 'Exposure Journal',
  free_write: 'Free write',
  chat: 'AI Chat',
};