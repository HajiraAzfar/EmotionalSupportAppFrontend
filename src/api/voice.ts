import {apiRequest} from './client';
import {getAccessToken} from '../storage/tokens';

// A recording goes up and only its text comes back: nothing is added to the
// entry until she sends the text herself, and the server keeps no audio.
export async function transcribeVoice(fileUri: string): Promise<string> {
  const form = new FormData();
  form.append('audio', {uri: fileUri, name: 'voice.m4a', type: 'audio/mp4'});
  const token = await getAccessToken();
  const data = await apiRequest('/voice/transcribe', {
    method: 'POST',
    body: form,
    token: token ?? undefined,
  });
  return data.text;
}
