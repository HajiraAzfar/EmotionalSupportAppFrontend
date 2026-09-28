import React, {useEffect, useState} from 'react';
import {ActivityIndicator, Pressable, ScrollView, Text, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Article, readArticle, setFavourite} from '../api/library';
import {colors, heart, radius, space, type} from '../theme';

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
              style={{...type.label, fontWeight: '600', marginTop: 22, marginBottom: 8}}>
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
    <SafeAreaView style={{flex: 1, backgroundColor: colors.bg}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.screen,
          paddingVertical: 12,
        }}>
        <Pressable onPress={onBack} hitSlop={12}>
          <Text style={{...type.small, color: colors.inkSoft}}>Back</Text>
        </Pressable>
        <View style={{flex: 1}} />
        {article ? (
          <Pressable onPress={toggleSave} hitSlop={12}>
            <Text style={{fontSize: 20, color: heart, opacity: article.favourite ? 1 : 0.4}}>
              {article.favourite ? '♥' : '♡'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {error ? (
        <Text style={{...type.small, color: colors.alert, padding: space.screen}}>{error}</Text>
      ) : !article ? (
        <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />
      ) : (
        <ScrollView contentContainerStyle={{padding: space.screen, paddingBottom: 60}}>
          <View
            style={{
              alignSelf: 'flex-start',
              paddingHorizontal: 12,
              paddingVertical: 5,
              borderRadius: radius.pill,
              backgroundColor: colors.surface,
              marginBottom: 12,
            }}>
            <Text style={{...type.small, fontSize: 12}}>
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
