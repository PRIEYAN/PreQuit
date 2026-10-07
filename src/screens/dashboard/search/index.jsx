import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, Keyboard } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import styles from './styles';
import { suggestTopics } from './mockTopics';
import { searchPosts } from '../feed/mockPosts';
import PostCard from '../../../components/PostCard';

const Tag = ({ topic, onPress }) => (
  <Pressable
    style={styles.tag}
    android_ripple={{ color: COLORS.glass }}
    onPress={() => onPress(topic)}>
    <Ionicons
      name="pricetag-outline"
      size={13}
      color={COLORS.white}
      style={styles.tagIcon}
    />
    <Text style={styles.tagLabel}>{topic.label}</Text>
  </Pressable>
);

const Search = () => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  const topics = useMemo(() => suggestTopics(query), [query]);
  const posts = useMemo(() => searchPosts(query), [query]);
  const searching = query.trim().length > 0;
  const nothingFound = searching && topics.length === 0 && posts.length === 0;

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top + 24 }]}>
        <Text style={styles.title}>PreQuit</Text>

        <View style={styles.searchWrap}>
          <View style={styles.searchBox}>
            <Ionicons
              name="search"
              size={20}
              color={COLORS.placeholder}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search PreQuit"
              placeholderTextColor={COLORS.placeholder}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searching ? (
              <Pressable onPress={() => setQuery('')} hitSlop={10}>
                <Ionicons name="close-circle" size={18} color={COLORS.placeholder} />
              </Pressable>
            ) : null}
          </View>
        </View>

        <ScrollView
          style={styles.list}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: insets.bottom + TAB_BAR_SPACE }}>
          <Text style={styles.sectionLabel}>
            {searching ? 'TOPICS' : 'TRENDING TOPICS'}
          </Text>

          {topics.length > 0 ? (
            <View style={styles.tagRow}>
              {topics.map(topic => (
                <Tag key={topic.id} topic={topic} onPress={Keyboard.dismiss} />
              ))}
            </View>
          ) : null}

          {searching && posts.length > 0 ? (
            <>
              <Text style={[styles.sectionLabel, styles.postsSectionLabel]}>POSTS</Text>
              {posts.map(post => (
                <PostCard key={post.id} post={post} />
              ))}
            </>
          ) : null}

          {nothingFound ? (
            <View style={styles.empty}>
              <Ionicons name="search-outline" size={34} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>No results match “{query.trim()}”</Text>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
};

export default Search;
