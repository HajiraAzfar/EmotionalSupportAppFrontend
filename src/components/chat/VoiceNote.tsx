import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Animated,
  AppState,
  PermissionsAndroid,
  Platform,
  Pressable,
  Text,
  View,
} from 'react-native';
import {Dirs, FileSystem} from 'react-native-file-access';
import Sound, {
  AudioEncoderAndroidType,
  AudioSet,
  AudioSourceAndroidType,
  AVEncoderAudioQualityIOSType,
  OutputFormatAndroidType,
} from 'react-native-nitro-sound';
import Svg, {Path, Rect} from 'react-native-svg';

import {transcribeVoice} from '../../api/voice';
import {colors, radius, type} from '../../theme';

// Voice messages: she speaks, the recording is turned into text, and the text
// lands in the composer for her to read and correct before sending. What she
// sends is always text she has seen, so every safeguard that reads text
// (crisis screening included) treats a spoken message exactly like a typed one.

const MAX_SECONDS = 180;
// Shorter than this is a stray tap, not something said.
const MIN_SECONDS = 1;

// One fixed file in the app's cache, overwritten by each recording and deleted
// as soon as it has been transcribed or discarded: no recordings pile up on the phone.
const RECORDING_PATH = `${Dirs.CacheDir}/voice-note.m4a`;

// Speech, not music: mono AAC at a low rate keeps a 3-minute upload small.
const AUDIO_SET: AudioSet = {
  AudioSourceAndroid: AudioSourceAndroidType.MIC,
  OutputFormatAndroid: OutputFormatAndroidType.MPEG_4,
  AudioEncoderAndroid: AudioEncoderAndroidType.AAC,
  AVFormatIDKeyIOS: 'aac',
  AVEncoderAudioQualityKeyIOS: AVEncoderAudioQualityIOSType.medium,
  AVNumberOfChannelsKeyIOS: 1,
  AudioChannels: 1,
  AudioSamplingRate: 16000,
  AudioEncodingBitRate: 48000,
};

export type VoicePhase = 'idle' | 'starting' | 'recording' | 'transcribing';

function discardRecording() {
  FileSystem.unlink(RECORDING_PATH).catch(() => {});
}

async function microphoneAllowed(): Promise<'granted' | 'denied' | 'blocked'> {
  // iOS asks by itself the first time the recorder starts (NSMicrophoneUsageDescription).
  if (Platform.OS !== 'android') {
    return 'granted';
  }
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO, {
    title: 'Use the microphone?',
    message:
      'Echo turns what you say into text, for you to check before sending. ' +
      'The recording itself is not kept.',
    buttonPositive: 'Allow',
    buttonNegative: 'Not now',
  });
  if (result === PermissionsAndroid.RESULTS.GRANTED) {
    return 'granted';
  }
  return result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'denied';
}

export function useVoiceNote(onText: (text: string) => void) {
  const [phase, setPhaseState] = useState<VoicePhase>('idle');
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState('');
  // Refs, because the timer, the AppState listener and the unmount cleanup all
  // need the current phase, not the one from the render that created them.
  const phaseRef = useRef<VoicePhase>('idle');
  const startedAt = useRef(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const mounted = useRef(true);
  const onTextRef = useRef(onText);
  onTextRef.current = onText;

  const setPhase = useCallback((next: VoicePhase) => {
    phaseRef.current = next;
    if (mounted.current) {
      setPhaseState(next);
    }
  }, []);

  const stopTimer = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const finish = useCallback(async () => {
    if (phaseRef.current !== 'recording') {
      return;
    }
    stopTimer();
    const length = (Date.now() - startedAt.current) / 1000;
    setPhase('transcribing');
    try {
      await Sound.stopRecorder();
    } catch {
      discardRecording();
      setPhase('idle');
      setError("The recording didn't save. Please try again.");
      return;
    }
    if (length < MIN_SECONDS) {
      discardRecording();
      setPhase('idle');
      setError('That was too short to hear. Tap the mic, speak, then tap Done.');
      return;
    }
    try {
      const text = await transcribeVoice(`file://${RECORDING_PATH}`);
      if (mounted.current) {
        onTextRef.current(text);
      }
    } catch (e) {
      if (mounted.current) {
        setError((e as Error).message);
      }
    } finally {
      discardRecording();
      setPhase('idle');
    }
  }, [setPhase, stopTimer]);

  const start = useCallback(async () => {
    if (phaseRef.current !== 'idle') {
      return;
    }
    setError('');
    const permission = await microphoneAllowed();
    if (permission !== 'granted') {
      setError(
        permission === 'blocked'
          ? "Microphone access is off for this app. You can turn it on in your phone's Settings."
          : 'Voice messages need the microphone. You can still type.',
      );
      return;
    }
    setPhase('starting');
    try {
      await Sound.startRecorder(RECORDING_PATH, AUDIO_SET);
    } catch {
      setPhase('idle');
      setError("The microphone couldn't start. Please try again.");
      return;
    }
    // Cancelled, or the composer closed, while the recorder was starting.
    // (The cast: TypeScript still thinks the phase is the one checked above the await.)
    if ((phaseRef.current as VoicePhase) !== 'starting' || !mounted.current) {
      Sound.stopRecorder()
        .catch(() => {})
        .finally(discardRecording);
      return;
    }
    startedAt.current = Date.now();
    setSeconds(0);
    timer.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt.current) / 1000);
      setSeconds(elapsed);
      if (elapsed >= MAX_SECONDS) {
        finish();
      }
    }, 250);
    setPhase('recording');
  }, [finish, setPhase]);

  const cancel = useCallback(async () => {
    if (phaseRef.current !== 'recording' && phaseRef.current !== 'starting') {
      return;
    }
    stopTimer();
    setPhase('idle');
    try {
      await Sound.stopRecorder();
    } catch {}
    discardRecording();
  }, [setPhase, stopTimer]);

  // Leaving the app mid-sentence (a call, the home button) keeps what was said:
  // it is transcribed into the box, and nothing is sent.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'background') {
        finish();
      }
    });
    return () => subscription.remove();
  }, [finish]);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      stopTimer();
      if (phaseRef.current === 'recording' || phaseRef.current === 'starting') {
        phaseRef.current = 'idle';
        Sound.stopRecorder()
          .catch(() => {})
          .finally(discardRecording);
      }
    };
  }, [stopTimer]);

  return {phase, seconds, error, clearError: () => setError(''), start, finish, cancel};
}

function MicIcon({color}: {color: string}) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={3} width={6} height={11} rx={3} stroke={color} strokeWidth={1.8} />
      <Path
        d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function MicButton({disabled, onPress}: {disabled: boolean; onPress: () => void}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel="Record a voice message"
      hitSlop={6}
      style={({pressed}) => ({
        width: 46,
        height: 46,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        opacity: disabled ? 0.5 : 1,
      })}>
      <MicIcon color={colors.ink} />
    </Pressable>
  );
}

function clock(total: number) {
  const s = total % 60;
  return `${Math.floor(total / 60)}:${s < 10 ? '0' : ''}${s}`;
}

function PulsingDot() {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {toValue: 0.25, duration: 700, useNativeDriver: true}),
        Animated.timing(opacity, {toValue: 1, duration: 700, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);
  return (
    <Animated.View
      style={{width: 10, height: 10, borderRadius: 5, backgroundColor: colors.coral, opacity}}
    />
  );
}

// Takes the place of the text box while she is speaking, then while her words
// are being written down.
export function RecordingBar({
  phase,
  seconds,
  onCancel,
  onDone,
}: {
  phase: VoicePhase;
  seconds: number;
  onCancel: () => void;
  onDone: () => void;
}) {
  const transcribing = phase === 'transcribing';
  const nearLimit = seconds >= MAX_SECONDS - 15;
  return (
    <View
      style={{
        flex: 1,
        minHeight: 46,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        borderRadius: radius.card,
        paddingLeft: 14,
        paddingRight: 6,
        paddingVertical: 6,
      }}>
      {transcribing ? (
        <>
          <ActivityIndicator color={colors.accent} />
          <Text style={{...type.small, color: colors.inkSoft, flex: 1}}>
            Writing down what you said…
          </Text>
        </>
      ) : (
        <>
          <PulsingDot />
          <Text style={{...type.label, flex: 1}} accessibilityLiveRegion="polite">
            {phase === 'starting' ? 'Starting…' : 'Listening'}
            <Text style={{color: nearLimit ? colors.accent : colors.inkFaint}}>
              {'  '}
              {clock(seconds)}
              {nearLimit ? ` / ${clock(MAX_SECONDS)}` : ''}
            </Text>
          </Text>
          <Pressable onPress={onCancel} hitSlop={8} accessibilityRole="button">
            <Text style={{...type.small, color: colors.inkSoft, paddingHorizontal: 6}}>Cancel</Text>
          </Pressable>
          <Pressable
            onPress={onDone}
            disabled={phase !== 'recording'}
            accessibilityRole="button"
            accessibilityLabel="Stop recording and turn it into text"
            style={{
              backgroundColor: phase === 'recording' ? colors.forest : colors.sage,
              borderRadius: radius.pill,
              paddingHorizontal: 16,
              paddingVertical: 9,
            }}>
            <Text style={{...type.label, color: colors.onAccent}}>Done</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}
