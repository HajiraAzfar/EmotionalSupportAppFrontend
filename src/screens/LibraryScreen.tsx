import React, {useCallback, useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Heart, Search} from 'lucide-react-native';

import BackButton from '../components/BackButton';
import Illustration from '../components/illustrations/Illustration';
import {articleArt} from '../components/illustrations/articleArt';

import {ArticleCard, LibraryListing, listArticles, setFavourite} from '../api/library';
import {colors, font, heart, radius, shadow, space, type} from '../theme';

type Props = {
  onOpenArticle: (slug: string) => void;
  onBack: () => void;
};

// Wait this long after the last keystroke before searching.
const SEARCH_DELAY_MS = 300;
const {width: SCREEN} = Dimensions.get('window');
const FEATURE_WIDTH = SCREEN - space.screen * 2;

function SaveButton({article, onToggleSave}: {article: ArticleCard; onToggleSave: () => void}) {
  return (
    <Pressable
      onPress={onToggleSave}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={article.favourite ? 'Remove from saved' : 'Save'}>
      <Heart size={20} color={heart} fill={article.favourite ? heart : 'transparent'} />
    </Pressable>
  );
}

function SectionTitle({children}: {children: string}) {
  return (
    <Text accessibilityRole="header" style={{...type.heading, paddingHorizontal: space.screen, marginBottom: 10}}>
      {children}
    </Text>
  );
}

// A featured article: its scene above, then the words, editorial style.
function Feature({article, onOpen}: {article: ArticleCard; onOpen: () => void}) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={article.title}
      style={({pressed}) => ({
        width: FEATURE_WIDTH,
        marginRight: 12,
        borderRadius: radius.image,
        overflow: 'hidden',
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.line,
        opacity: pressed ? 0.9 : 1,
        ...shadow.md,
      })}>
      <Illustration name={articleArt(article.slug, article.category)} height={140} />
      <View style={{padding: 16}}>
        <Text style={{...type.tiny, letterSpacing: 1}}>
          {article.category.toUpperCase()} · {article.minutes} MIN READ
        </Text>
        <Text style={{...type.title, fontSize: 22, marginTop: 6}}>{article.title}</Text>
        <Text style={{...type.body, marginTop: 6}} numberOfLines={2}>
          {article.summary}
        </Text>
      </View>
    </Pressable>
  );
}

// One article in the list: a small scene, the title, a line of summary, and
// its category and reading time.
function Row({
  article,
  onOpen,
  onToggleSave,
}: {
  article: ArticleCard;
  onOpen: () => void;
  onToggleSave: () => void;
}) {
  return (
    <Pressable
      onPress={onOpen}
      accessibilityRole="button"
      accessibilityLabel={`${article.title}, ${article.minutes} minute read`}
      style={({pressed}) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap: 14,
        padding: 10,
        marginBottom: 12,
        borderRadius: radius.card,
        borderWidth: 1,
        borderColor: colors.line,
        backgroundColor: pressed ? colors.surfaceRaised : colors.surface,
        ...shadow.sm,
      })}>
      <View style={{width: 92, height: 72, borderRadius: radius.tile, overflow: 'hidden'}}>
        <Illustration name={articleArt(article.slug, article.category)} height={72} />
      </View>
      <View style={{flex: 1}}>
        <Text style={type.label} numberOfLines={2}>
          {article.title}
        </Text>
        <Text style={{...type.small, marginTop: 2}} numberOfLines={2}>
          {article.summary}
        </Text>
        <View style={{flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8}}>
          <View
            style={{
              paddingHorizontal: 8,
              paddingVertical: 2,
              borderRadius: radius.pill,
              backgroundColor: colors.sageWash,
            }}>
            <Text style={{...type.tiny, color: colors.accent}}>{article.category}</Text>
          </View>
          <Text style={type.tiny}>{article.minutes} min read</Text>
        </View>
      </View>
      <SaveButton article={article} onToggleSave={onToggleSave} />
    </Pressable>
  );
}

// SRS 4.11: short articles she can search, save and read. Nothing here is
// generated and nothing is recommended to her — she chooses what to open.
export default function LibraryScreen({onOpenArticle, onBack}: Props) {
  const [data, setData] = useState<LibraryListing | null>(null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<string | null>(null);
  const [savedOnly, setSavedOnly] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(0);

  const load = useCallback(
    (search: string, chosen: string | null, saved: boolean) => {
      setError('');
      listArticles({q: search.trim() || undefined, category: chosen ?? undefined, savedOnly: saved})
        .then(setData)
        .catch(e => setError((e as Error).message));
    },
    [],
  );

  useEffect(() => {
    const timer = setTimeout(() => load(query, category, savedOnly), query ? SEARCH_DELAY_MS : 0);
    return () => clearTimeout(timer);
  }, [load, query, category, savedOnly]);

  async function toggleSave(article: ArticleCard) {
    // Flip it straight away; the list is reloaded from the server afterwards.
    setData(current =>
      current
        ? {
            ...current,
            articles: current.articles.map(a =>
              a.slug === article.slug ? {...a, favourite: !a.favourite} : a,
            ),
          }
        : current,
    );
    try {
      await setFavourite(article.slug, !article.favourite);
      load(query, category, savedOnly);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const filters: {key: string; label: string; on: boolean; onPress: () => void}[] = [
    {
      key: 'all',
      label: 'All',
      on: !category && !savedOnly,
      onPress: () => {
        setCategory(null);
        setSavedOnly(false);
      },
    },
    ...(data?.categories ?? []).map(name => ({
      key: name,
      label: name,
      on: category === name,
      onPress: () => {
        setSavedOnly(false);
        setCategory(current => (current === name ? null : name));
      },
    })),
    {
      key: 'saved',
      label: `Saved${data?.saved_count ? ` (${data.saved_count})` : ''}`,
      on: savedOnly,
      onPress: () => {
        setCategory(null);
        setSavedOnly(current => !current);
      },
    },
  ];

  return (
    <SafeAreaView style={{flex: 1}}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: space.screen,
          paddingVertical: 12,
        }}>
        <BackButton onPress={onBack} />
        <Text accessibilityRole="header" style={{...type.heading, flex: 1, textAlign: 'center'}}>
          Reading library
        </Text>
        <View style={{width: 40}} />
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 40}}>
        <View style={{paddingHorizontal: space.screen}}>
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 10,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.line,
              borderRadius: radius.input,
              paddingHorizontal: 14,
              ...shadow.sm,
            }}>
            <Search size={18} color={colors.inkFaint} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Search articles, topics…"
              placeholderTextColor={colors.inkFaint}
              accessibilityLabel="Search articles"
              style={{flex: 1, paddingVertical: 12, ...type.input, color: colors.ink}}
            />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{paddingHorizontal: space.screen, paddingVertical: 8}}
          style={{marginTop: 12}}>
          {filters.map(filter => (
            <Pressable
              key={filter.key}
              onPress={filter.onPress}
              accessibilityRole="button"
              accessibilityState={{selected: filter.on}}
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
                borderRadius: radius.pill,
                // Same properties in both states: swapping a border for a
                // backgroundImage on tap closed the app (see Chip.tsx).
                borderWidth: 1.5,
                borderColor: filter.on ? colors.accent : colors.muted,
                backgroundColor: filter.on ? colors.accent : colors.surface,
              }}>
              <Text
                style={{
                  ...type.small,
                  fontFamily: filter.on ? font.semibold : font.medium,
                  color: filter.on ? colors.onAccent : colors.inkSoft,
                }}>
                {filter.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {error ? (
          <Pressable onPress={() => load(query, category, savedOnly)} style={{padding: space.screen}}>
            <Text style={{...type.small, color: colors.alert}}>{error} — tap to retry</Text>
          </Pressable>
        ) : !data ? (
          <ActivityIndicator color={colors.accent} style={{marginTop: 40}} />
        ) : (
          <>
            {data.featured.length ? (
              <View style={{marginTop: 10}}>
                <SectionTitle>Featured</SectionTitle>
                <ScrollView
                  horizontal
                  pagingEnabled
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{paddingHorizontal: space.screen}}
                  onMomentumScrollEnd={event =>
                    setPage(Math.round(event.nativeEvent.contentOffset.x / (FEATURE_WIDTH + 12)))
                  }>
                  {data.featured.map(article => (
                    <Feature
                      key={article.slug}
                      article={article}
                      onOpen={() => onOpenArticle(article.slug)}
                    />
                  ))}
                </ScrollView>

                <View style={{flexDirection: 'row', justifyContent: 'center', gap: 6, marginTop: 10}}>
                  {data.featured.map((article, index) => (
                    <View
                      key={article.slug}
                      style={{
                        width: index === page ? 18 : 6,
                        height: 6,
                        borderRadius: radius.pill,
                        backgroundColor: index === page ? colors.accent : colors.muted,
                      }}
                    />
                  ))}
                </View>
              </View>
            ) : null}

            <View style={{marginTop: 18}}>
              {data.articles.length ? <SectionTitle>More to explore</SectionTitle> : null}
            </View>
            <View style={{paddingHorizontal: space.screen}}>
              {data.articles.map(article => (
                <Row
                  key={article.slug}
                  article={article}
                  onOpen={() => onOpenArticle(article.slug)}
                  onToggleSave={() => toggleSave(article)}
                />
              ))}
            </View>

            {!data.articles.length ? (
              <View style={{alignItems: 'center', paddingHorizontal: space.screen, marginTop: 10}}>
                <Illustration name="empty" width={220} />
                <Text style={{...type.body, textAlign: 'center', marginTop: 4}}>
                  {savedOnly
                    ? 'Nothing saved yet. Tap the heart on an article to keep it here.'
                    : `Nothing matches “${query}”.`}
                </Text>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
