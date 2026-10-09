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
import {Brain, CloudSun, Heart, LucideIcon, NotebookPen, Search, Sparkles} from 'lucide-react-native';

import BackButton from '../components/BackButton';

import {ArticleCard, LibraryListing, listArticles, setFavourite} from '../api/library';
import {
  cardTints,
  colors,
  font,
  glass,
  gradient,
  heart,
  onTint,
  radius,
  shadow,
  space,
  type,
} from '../theme';

type Props = {
  onOpenArticle: (slug: string) => void;
  onBack: () => void;
};

// Wait this long after the last keystroke before searching.
const SEARCH_DELAY_MS = 300;
const {width: SCREEN} = Dimensions.get('window');
const FEATURE_WIDTH = SCREEN - space.screen * 2;

// One picture per category, so a card is recognisable before it is read.
const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Thinking: Brain,
  Coping: CloudSun,
  Journalling: NotebookPen,
};

function Feature({
  article,
  onOpen,
}: {
  article: ArticleCard;
  onOpen: () => void;
}) {
  const Icon = CATEGORY_ICONS[article.category] ?? Sparkles;
  return (
    <Pressable
      onPress={onOpen}
      style={{
        width: FEATURE_WIDTH,
        marginRight: 12,
        borderRadius: radius.image,
        overflow: 'hidden',
        backgroundImage: gradient.landscape,
        padding: 18,
        justifyContent: 'flex-end',
        minHeight: 190,
        ...shadow.md,
      }}>
      <View
        style={{
          ...glass,
          width: 44,
          height: 44,
          borderRadius: radius.pill,
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 10,
        }}>
        <Icon size={22} color={colors.accent} />
      </View>
      <Text style={type.title}>{article.title}</Text>
      <Text style={{...type.body, color: colors.ink, marginTop: 6}}>{article.summary}</Text>
      <Text style={{...type.small, fontFamily: font.semibold, marginTop: 8, color: colors.accent}}>
        {article.minutes} min read
      </Text>
    </Pressable>
  );
}

function Card({
  article,
  tint,
  onOpen,
  onToggleSave,
}: {
  article: ArticleCard;
  tint: {bg: string; icon: string};
  onOpen: () => void;
  onToggleSave: () => void;
}) {
  const Icon = CATEGORY_ICONS[article.category] ?? Sparkles;
  return (
    <View
      style={{
        width: '47.5%',
        flexGrow: 1,
        backgroundColor: tint.bg,
        borderWidth: 1,
        borderColor: colors.glassEdge,
        borderRadius: radius.card,
        padding: 14,
        ...shadow.sm,
      }}>
      <View
        style={{
          width: 46,
          height: 46,
          borderRadius: radius.pill,
          backgroundColor: tint.icon,
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        <Icon size={22} color={onTint} />
      </View>

      <Text style={{...type.label, color: onTint, marginTop: 12}}>
        {article.title}
      </Text>
      <Text style={{...type.small, color: onTint, opacity: 0.75, marginTop: 4}} numberOfLines={3}>
        {article.summary}
      </Text>

      <View style={{flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 14}}>
        <Pressable
          onPress={onToggleSave}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel={article.favourite ? 'Remove from saved' : 'Save'}>
          <Heart size={20} color={heart} fill={article.favourite ? heart : 'transparent'} />
        </Pressable>
        <Pressable
          onPress={onOpen}
          style={{
            flex: 1,
            alignItems: 'center',
            paddingVertical: 8,
            borderRadius: radius.pill,
            backgroundImage: gradient.primary,
          }}>
          <Text style={{...type.small, fontFamily: font.semibold, color: colors.onAccent}}>Read</Text>
        </Pressable>
      </View>
    </View>
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
        <Text style={{...type.heading, flex: 1, textAlign: 'center'}}>Learning library</Text>
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
              placeholder="Search articles"
              placeholderTextColor={colors.inkFaint}
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
              style={{
                paddingHorizontal: 16,
                paddingVertical: 8,
                marginRight: 8,
                borderRadius: radius.pill,
                ...(filter.on
                  ? {backgroundImage: gradient.primary}
                  : {backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line}),
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

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: 12,
                paddingHorizontal: space.screen,
                marginTop: 18,
              }}>
              {data.articles.map((article, index) => (
                <Card
                  key={article.slug}
                  article={article}
                  tint={cardTints[index % cardTints.length]}
                  onOpen={() => onOpenArticle(article.slug)}
                  onToggleSave={() => toggleSave(article)}
                />
              ))}
            </View>

            {!data.articles.length ? (
              <Text style={{...type.body, textAlign: 'center', marginTop: 30}}>
                {savedOnly ? 'Nothing saved yet.' : `Nothing matches “${query}”.`}
              </Text>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
