import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Linking, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import PrimaryButton from '../components/PrimaryButton';
import {getCrisisResources, CrisisResource} from '../api/crisis';
import {colors, radius, space, type} from '../theme';

// FR-CRIS-009 / FR-CRIS-010: must be reachable without sign-in or app unlock.
// getCrisisResources() calls apiRequest with no token, so this works even
// with no active session.

type Props = {
  onClose: () => void;
};

export default function CrisisResourcesScreen({onClose}: Props) {
  const [resources, setResources] = useState<CrisisResource[] | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getCrisisResources()
      .then(data => setResources(data.resources))
      .catch(e => setError((e as Error).message));
  }, []);

  function call(phone: string) {
    Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: colors.bg}}>
      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: space.screen,
          paddingTop: 40,
          paddingBottom: 32,
        }}>
        <Text style={type.title}>Support is available</Text>
        <Text style={{...type.body, marginTop: 10, marginBottom: 24}}>
          These services are free and separate from Echo. You can call any of
          them right now.
        </Text>

        {!resources && !error && <ActivityIndicator color={colors.sage} />}

        {error ? (
          <Text style={{...type.small, color: colors.alert}}>
            Couldn't load the resource list. If this is urgent, dial 1122 for
            emergency services.
          </Text>
        ) : null}

        {resources?.map(r => (
          <View
            key={r.id}
            style={{
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.card,
              padding: 14,
              marginBottom: 10,
            }}>
            <Text style={{...type.body, color: colors.ink, fontWeight: '600'}}>
              {r.name}
            </Text>
            <Text
              style={{...type.small, color: colors.inkSoft, marginVertical: 6}}>
              {r.description}
            </Text>
            <PrimaryButton
              label={`Call ${r.phone}`}
              onPress={() => call(r.phone)}
            />
          </View>
        ))}

        <View style={{marginTop: 12}}>
          <PrimaryButton label="Close" onPress={onClose} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}