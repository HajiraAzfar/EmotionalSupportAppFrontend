import React, {useCallback, useEffect, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Download} from 'lucide-react-native';

import BackButton from '../components/BackButton';
import ScreenBackground from '../components/ScreenBackground';
import CrisisResourcesScreen from './CrisisResourcesScreen';
import {
  CheckInReportItem,
  CheckInReports,
  downloadCheckInReport,
  getCheckInReports,
} from '../api/insights';
import {colors, radius, shadow, space, type} from '../theme';

type Props = {
  onBack: () => void;
};

const key = (item: CheckInReportItem) => `${item.kind}-${item.start}`;
const counted = (n: number) => `${n} ${n === 1 ? 'entry' : 'entries'}`;

/**
 * The reports, each a PDF of all four journals saved to Downloads:
 * yesterday's on top (until today is over), then every finished week, month
 * and day. A report appears only once its period is over, so it never changes
 * afterwards.
 */
export default function CheckInReportsScreen({onBack}: Props) {
  const [reports, setReports] = useState<CheckInReports | null>(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [saved, setSaved] = useState<{key: string; text: string} | null>(null);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const load = useCallback(() => {
    setError('');
    getCheckInReports()
      .then(setReports)
      .catch(e => setError((e as Error).message));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function save(item: CheckInReportItem) {
    setBusy(key(item));
    setSaved(null);
    try {
      const name = await downloadCheckInReport(item.kind, item.start);
      setSaved({key: key(item), text: `Saved to your Downloads as ${name}.`});
    } catch (e) {
      setSaved({key: key(item), text: (e as Error).message});
    } finally {
      setBusy(null);
    }
  }

  function row(item: CheckInReportItem) {
    const id = key(item);
    return (
      <View key={id} style={{marginBottom: 8}}>
        <Pressable
          onPress={() => save(item)}
          disabled={busy !== null}
          accessibilityRole="button"
          accessibilityLabel={`Download the report for ${item.title}`}
          style={({pressed}) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 12,
            minHeight: 56,
            paddingHorizontal: 14,
            borderRadius: radius.card,
            borderWidth: 1,
            borderColor: colors.line,
            backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
          })}>
          <View style={{flex: 1}}>
            <Text style={type.label}>{item.title}</Text>
            <Text style={type.small}>{counted(item.entries)}</Text>
          </View>
          {busy === id ? <ActivityIndicator color={colors.accent} /> : <Download size={18} color={colors.accent} />}
        </Pressable>
        {saved?.key === id ? <Text style={{...type.small, marginTop: 6}}>{saved.text}</Text> : null}
      </View>
    );
  }

  function section(title: string, items: CheckInReportItem[], empty: string) {
    return (
      <View style={{marginTop: 24}}>
        <Text accessibilityRole="header" style={{...type.small, marginBottom: 8}}>
          {title}
        </Text>
        {items.length ? items.map(row) : <Text style={type.small}>{empty}</Text>}
      </View>
    );
  }

  const latest = reports?.latest_daily;
  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View
        style={{flexDirection: 'row', alignItems: 'center', paddingHorizontal: space.screen, paddingVertical: 12}}>
        <BackButton onPress={onBack} />
        <View style={{flex: 1}} />
        {/* FR-CRIS-009: crisis resources on every screen. */}
        <Pressable onPress={() => setResourcesOpen(true)} hitSlop={12} accessibilityRole="button">
          <Text style={{...type.link, color: colors.alert}}>Get help</Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={{paddingHorizontal: space.screen, paddingBottom: 32}}>
        <Text accessibilityRole="header" style={type.title}>
          Reports
        </Text>
        <Text style={{...type.body, marginTop: 6}}>
          One PDF for all your journals: check-ins, good moments, thought records and exposures,
          with charts and what stood out. A day's report is ready the next morning at 5, a week's
          on Monday, a month's on the 1st. Each is saved to your Downloads.
        </Text>

        {error ? (
          <Pressable onPress={load} style={{marginTop: 20}}>
            <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
          </Pressable>
        ) : !reports || !latest ? (
          <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />
        ) : (
          <>
            {/* Yesterday's report leads until today is over. */}
            <View
              style={{
                marginTop: 20,
                padding: 18,
                borderRadius: radius.card,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
                ...shadow.md,
              }}>
              <Text style={type.tiny}>YESTERDAY</Text>
              <Text style={{...type.heading, marginTop: 4}}>{latest.title}</Text>
              {latest.entries ? (
                <>
                  <Text style={{...type.small, marginTop: 4}}>{counted(latest.entries)}</Text>
                  <Pressable
                    onPress={() => save(latest)}
                    disabled={busy !== null}
                    accessibilityRole="button"
                    accessibilityLabel="Download yesterday's report"
                    style={({pressed}) => ({
                      marginTop: 14,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 8,
                      minHeight: 46,
                      borderRadius: radius.pill,
                      borderWidth: 1.5,
                      borderColor: colors.accent,
                      backgroundColor: pressed ? colors.accentWash : colors.surface,
                      opacity: busy !== null ? 0.6 : 1,
                    })}>
                    {busy === key(latest) ? (
                      <ActivityIndicator color={colors.accent} />
                    ) : (
                      <>
                        <Download size={18} color={colors.accent} />
                        <Text style={{...type.label, color: colors.accent}}>Download PDF</Text>
                      </>
                    )}
                  </Pressable>
                  {saved?.key === key(latest) ? (
                    <Text style={{...type.small, marginTop: 10}}>{saved.text}</Text>
                  ) : null}
                </>
              ) : (
                <Text style={{...type.small, marginTop: 4}}>Nothing was written that day, so there is no report.</Text>
              )}
            </View>

            {section(
              'Weekly',
              reports.weekly,
              'The first one comes the Monday after a week with an entry.',
            )}
            {section(
              'Monthly',
              reports.monthly,
              'The first one comes on the 1st after a month with an entry.',
            )}
            {section(
              'Daily',
              reports.daily.filter(item => item.start !== latest.start),
              'Earlier days with an entry will be listed here.',
            )}
            <Text style={{...type.small, marginTop: 20}}>
              These are patterns in what you wrote, not a diagnosis.
            </Text>
          </>
        )}
      </ScrollView>

      <Modal visible={resourcesOpen} animationType="slide" onRequestClose={() => setResourcesOpen(false)}>
        <CrisisResourcesScreen onClose={() => setResourcesOpen(false)} />
      </Modal>
    </SafeAreaView>
  );
}
