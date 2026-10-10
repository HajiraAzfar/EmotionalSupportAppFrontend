import React, {useEffect, useMemo, useState} from 'react';
import {ActivityIndicator, Modal, Pressable, Text, TextInput, View} from 'react-native';

import Chip from './Chip';
import ArticleScreen from '../../screens/ArticleScreen';
import {CrisisEvent} from '../../api/entries';
import {addTerm, getLibrary, Library, LibraryItem, TERM_MAX_LENGTH} from '../../api/libraries';
import {listArticles} from '../../api/library';
import {colors, radius, type} from '../../theme';

// FR-PICK-010: how many items each category shows before it is expanded.
const INITIAL_PER_CATEGORY = 4;
// FR-PICK-011: libraries larger than this get a search box.
const SEARCH_THRESHOLD = 20;

type Props = {
  library: string;
  preferValence?: string | null;
  entryId: string;
  // The selection lives with the thread, whose Continue bar stays on screen
  // however long the list grows (submit always reachable).
  selected: string[];
  onChange: (ids: string[]) => void;
  // FR-PICK-007: a user's own term is screened like any other text.
  onCrisisEvent: (event: CrisisEvent) => void;
};

export default function LibraryPicker({library, preferValence, entryId, selected, onChange, onCrisisEvent}: Props) {
  const [data, setData] = useState<Library | null>(null);
  const [error, setError] = useState('');
  const [expanded, setExpanded] = useState<string[]>([]);
  const [query, setQuery] = useState('');
  const [openInfo, setOpenInfo] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [newTerm, setNewTerm] = useState('');
  const [saving, setSaving] = useState(false);
  // A thinking trap's article, read over the thread; closing it returns to the same question.
  const [articleSlug, setArticleSlug] = useState<string | null>(null);
  const [noArticle, setNoArticle] = useState(false);

  useEffect(() => {
    getLibrary(library, preferValence)
      .then(setData)
      .catch(e => setError((e as Error).message));
  }, [library, preferValence]);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!data || !q) {
      return null;
    }
    return data.categories
      .flatMap(c => c.items)
      .filter(item => item.name.toLowerCase().includes(q));
  }, [data, query]);

  async function saveTerm() {
    const name = newTerm.trim();
    if (!name) {
      return;
    }
    setSaving(true);
    setError('');
    try {
      const result = await addTerm(library, name, entryId);
      setData(await getLibrary(library, preferValence));
      onChange(selected.includes(result.term.id) ? selected : [...selected, result.term.id]);
      setNewTerm('');
      setAdding(false);
      if (result.crisis_event) {
        onCrisisEvent(result.crisis_event);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  function toggle(id: string) {
    onChange(selected.includes(id) ? selected.filter(x => x !== id) : [...selected, id]);
  }

  async function openArticle(trap: string) {
    setNoArticle(false);
    try {
      const found = await listArticles({trap});
      if (found.articles.length) {
        setArticleSlug(found.articles[0].slug);
      } else {
        setNoArticle(true);
      }
    } catch {
      setNoArticle(true);
    }
  }

  function chip(item: LibraryItem) {
    return (
      <Chip
        key={item.id}
        label={item.name}
        on={selected.includes(item.id)}
        onPress={() => toggle(item.id)}
        onLongPress={() => item.definition && setOpenInfo(item.id)}
      />
    );
  }

  if (error && !data) {
    return <Text style={{...type.small, color: colors.alert}}>{error}</Text>;
  }
  if (!data) {
    return <ActivityIndicator color={colors.sage} />;
  }

  const info = openInfo
    ? data.categories.flatMap(c => c.items).find(i => i.id === openInfo)
    : null;

  return (
    <View>
      {data.total > SEARCH_THRESHOLD && (
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder="Search"
          placeholderTextColor={colors.inkFaint}
          style={{
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.line,
            borderRadius: radius.input,
            paddingHorizontal: 14,
            paddingVertical: 10,
            marginBottom: 10,
            ...type.input,
            color: colors.ink,
          }}
        />
      )}

      {matches ? (
        <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
          {matches.length ? matches.map(chip) : (
            <Text style={type.small}>Nothing matches “{query}”.</Text>
          )}
        </View>
      ) : (
        data.categories.map(category => {
          const isOpen = expanded.includes(category.id) || data.categories.length === 1;
          const shown = isOpen ? category.items : category.items.slice(0, INITIAL_PER_CATEGORY);
          // Selected items stay visible even when their category is collapsed.
          const hiddenSelected = category.items.filter(
            i => selected.includes(i.id) && !shown.includes(i),
          );
          const hiddenCount = category.items.length - shown.length;

          return (
            <View key={category.id} style={{marginBottom: 6}}>
              {category.name ? (
                <Text style={{...type.small, marginBottom: 6}}>{category.name}</Text>
              ) : null}
              <View style={{flexDirection: 'row', flexWrap: 'wrap'}}>
                {[...shown, ...hiddenSelected].map(chip)}
                {hiddenCount > 0 && (
                  <Pressable
                    onPress={() => setExpanded(e => [...e, category.id])}
                    style={{paddingHorizontal: 10, paddingVertical: 8}}>
                    <Text style={type.link}>
                      +{hiddenCount} more
                    </Text>
                  </Pressable>
                )}
              </View>
            </View>
          );
        })
      )}

      {info ? (
        <Pressable
          onPress={() => setOpenInfo(null)}
          style={{
            backgroundColor: colors.accentWash,
            borderRadius: radius.card,
            padding: 12,
            marginBottom: 10,
          }}>
          <Text style={type.label}>{info.name}</Text>
          <Text style={{...type.body, marginTop: 4}}>{info.definition}</Text>
          {info.example ? (
            <Text style={{...type.small, marginTop: 4, fontStyle: 'italic'}}>
              “{info.example}”
            </Text>
          ) : null}
          {library === 'thinking_traps' ? (
            <Pressable onPress={() => openArticle(info.id)} hitSlop={8} style={{marginTop: 8}}>
              <Text style={type.link}>{noArticle ? "Couldn't open the article. Tap to try again" : 'Read more'}</Text>
            </Pressable>
          ) : null}
        </Pressable>
      ) : data.categories.some(c => c.items.some(i => i.definition)) ? (
        <Text style={{...type.small, marginBottom: 10}}>
          Press and hold an item to see what it means.
        </Text>
      ) : null}

      {data.extendable &&
        (adding ? (
          <View style={{flexDirection: 'row', gap: 8, marginBottom: 10}}>
            <TextInput
              value={newTerm}
              onChangeText={setNewTerm}
              maxLength={TERM_MAX_LENGTH}
              autoFocus
              placeholder="Your own word"
              placeholderTextColor={colors.inkFaint}
              onSubmitEditing={saveTerm}
              style={{
                flex: 1,
                backgroundColor: colors.surface,
                borderWidth: 1,
                borderColor: colors.line,
                borderRadius: radius.input,
                paddingHorizontal: 14,
                paddingVertical: 10,
                ...type.input,
                color: colors.ink,
              }}
            />
            <Pressable
              onPress={saveTerm}
              disabled={saving || !newTerm.trim()}
              style={{justifyContent: 'center', paddingHorizontal: 8}}>
              {saving ? (
                <ActivityIndicator color={colors.sage} />
              ) : (
                <Text style={{...type.label, color: colors.accent}}>Add</Text>
              )}
            </Pressable>
          </View>
        ) : (
          <Pressable onPress={() => setAdding(true)} style={{paddingBottom: 10}}>
            <Text style={type.link}>+ Add your own</Text>
          </Pressable>
        ))}

      {error ? (
        <Text style={{...type.small, color: colors.alert, marginBottom: 8}}>{error}</Text>
      ) : null}

      <Modal visible={articleSlug !== null} animationType="slide" onRequestClose={() => setArticleSlug(null)}>
        {articleSlug ? <ArticleScreen slug={articleSlug} onBack={() => setArticleSlug(null)} /> : null}
      </Modal>
    </View>
  );
}
