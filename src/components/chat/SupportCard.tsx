import React, {useEffect, useState} from 'react';
import {Linking, Pressable, Text, View} from 'react-native';

import {CrisisResource, getCrisisResources} from '../../api/crisis';
import {colors, glass, radius, type} from '../../theme';

const digits = (s?: string | null) => (s ?? '').replace(/[^0-9+]/g, '');

// One fetch per app run, however many cards the thread holds.
let loading: Promise<CrisisResource[]> | null = null;
function load(): Promise<CrisisResource[]> {
  if (!loading) {
    loading = getCrisisResources()
      .then(d => d.resources)
      .catch(() => {
        loading = null;
        return [];
      });
  }
  return loading;
}

// What a service offers, in words: "Call · Text · Chat · 24/7 · Urdu, English".
export function offers(r: CrisisResource): string {
  return ['Call', r.sms && 'Text', (r.whatsapp || r.chat_url) && 'Chat', r.hours, r.languages?.join(', ')]
    .filter(Boolean)
    .join(' · ');
}

// Every way to reach a service; text and chat for when a call could be overheard.
export function ResourceLinks({r, call = true}: {r: CrisisResource; call?: boolean}) {
  const link = (label: string, url: string) => (
    <Pressable key={label} onPress={() => Linking.openURL(url)} hitSlop={8}>
      <Text style={type.link}>{label}</Text>
    </Pressable>
  );
  return (
    <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 18, marginTop: 6}}>
      {call ? link(`Call ${r.phone}`, `tel:${digits(r.phone)}`) : null}
      {r.sms ? link('Text', `sms:${digits(r.sms)}`) : null}
      {r.whatsapp ? link('WhatsApp', `https://wa.me/${digits(r.whatsapp).replace('+', '')}`) : null}
      {r.chat_url ? link('Chat online', r.chat_url) : null}
    </View>
  );
}

type Props = {
  prominent: boolean; // present or imminent danger: the same card, more prominent
};

// Display-only, under Echo's reply and never instead of it; the chat stays open below.
export default function SupportCard({prominent: urgent}: Props) {
  const [resources, setResources] = useState<CrisisResource[] | null>(null);

  useEffect(() => {
    load().then(setResources);
  }, []);

  const shown = (resources ?? []).slice(0, urgent ? 4 : 3);

  return (
    <View
      style={{
        ...glass,
        borderColor: urgent ? colors.alert : colors.glassEdge,
        borderWidth: urgent ? 2 : 1,
        borderRadius: radius.card,
        padding: 14,
        marginBottom: 12,
      }}>
      <Text
        style={{
          ...(urgent ? type.label : type.small),
          color: urgent ? colors.alert : colors.inkSoft,
          marginBottom: 8,
        }}>
        {urgent
          ? "If you're in danger right now, you can reach these for free:"
          : "If you'd like to talk to someone, these options are free:"}
      </Text>
      {resources?.length === 0 ? (
        <Text style={type.small}>Couldn't load the helplines. Tap Get help at the top to try again.</Text>
      ) : null}
      {shown.map(r => (
        <View key={r.id} style={{marginBottom: 10}}>
          <Text style={type.label}>{r.name}</Text>
          <Text style={type.small}>{offers(r)}</Text>
          <ResourceLinks r={r} />
        </View>
      ))}
    </View>
  );
}
