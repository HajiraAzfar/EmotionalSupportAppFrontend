import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Heart} from 'lucide-react-native';

import BackButton from '../components/BackButton';
import ScreenBackground from '../components/ScreenBackground';

import {Article, readArticle, setFavourite} from '../api/library';
import {colors, gradient, heart, radius, shadow, space, type} from '../theme';

type Props = {
  slug: string;
  onBack: () => void;
};

/**
 * Just enough Markdown for the library: headings, bullets, and paragraphs.
 * A full Markdown engine would be another dependency for six articles.
 */
function Body({text}: {text: string}) {
  const blocks = text.split(/\n{2,}/);
  return (
    <View>
      {blocks.map((block, index) => {
        const trimmed = block.trim();
        if (trimmed.startsWith('## ')) {
          return (
            <Text
              key={index}
              style={{...type.heading, marginTop: 22, marginBottom: 8}}>
              {trimmed.slice(3)}
            </Text>
          );
        }
        if (trimmed.startsWith('- ') || /^\d+\.\s/.test(trimmed)) {
          return (
            <View key={index} style={{marginBottom: 10}}>
              {trimmed.split('\n').map((line, lineIndex) => (
                <View key={lineIndex} style={{flexDirection: 'row', marginBottom: 6}}>
                  <Text style={{...type.body, color: colors.accent, width: 18}}>•</Text>
                  <Text style={{...type.body, flex: 1}}>
                    {line.replace(/^[-*]\s+/, '').replace(/^\d+\.\s+/, '').replace(/\*\*/g, '')}
                  </Text>
                </View>
              ))}
            </View>
          );
        }
        return (
          <Text key={index} style={{...type.body, marginBottom: 12}}>
            {trimmed.replace(/\*\*/g, '')}
          </Text>
        );
      })}
    </View>
  );
}

// SRS 4.11: one article, as written in content/library. Nothing is generated,
// so what she reads is what the Clinical Advisor approved.
export default function ArticleScreen({slug, onBack}: Props) {
  const [article, setArticle] = useState<Article | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
    readArticle(slug)
      .then(setArticle)
      .catch(e => setError((e as Error).message));
  }, [slug]);

  async function toggleSave() {
    if (!article) {
      return;
    }
    const next = !article.favourite;
    setArticle({...article, favourite: next});
    try {
      await setFavourite(article.slug, next);
    } catch (e) {
      setArticle({...article, favourite: !next});
      setError((e as Error).message);
    }
  }

  return (
    <SafeAreaView style={{flex: 1}}>
      <ScreenBackground />
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.screen,
          paddingVertical: 12,
        }}>
        <BackButton onPress={onBack} />
        <View style={{flex: 1}} />
        {article ? (
          <Pressable
            onPress={toggleSave}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={article.favourite ? 'Remove from saved' : 'Save'}>
            <Heart size={22} color={heart} fill={article.favourite ? heart : 'transparent'} />
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={{...type.small, color: colors.alert, padding: space.screen}}>{error}</Text>
      ) : !article ? (
        <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />
      ) : (
        <ScrollView contentContainerStyle={{padding: space.screen, paddingBottom: 60}}>
          {/* Where the design has its illustration. */}
          <View
            style={{
              height: 180,
              borderRadius: radius.image,
              backgroundImage: gradient.landscape,
              marginBottom: 18,
              ...shadow.md,
            }}
          />
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: radius.pill,
              backgroundColor: colors.accentWash,
              marginBottom: 12,
            }}>
            <Text style={{...type.tiny, color: colors.accent}}>
              {article.category} · {article.minutes} min read
            </Text>
          </View>

          <Text style={{...type.title, marginBottom: 16}}>{article.title}</Text>
          <Body text={article.body} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
