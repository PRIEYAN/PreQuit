import React, { useState } from 'react';
import { View, Text, TextInput } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import styles from './styles';

const Search = () => {
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <View style={[styles.content, { paddingTop: insets.top, paddingBottom: insets.bottom + TAB_BAR_SPACE }]}>
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
          </View>
        </View>
      </View>
    </View>
  );
};

export default Search;
