import React from 'react';
import { Text, Pressable, ScrollView } from 'react-native';

import styles from './styles';
import { POST_SORTS, POST_SORT_LABELS, type PostSort } from '../../../domain/repositories/ProfileRepository';

export interface PostSortBarProps {
  readonly value: PostSort;
  readonly disabled?: boolean;
  onChange(sort: PostSort): void;
}

const PostSortBar = ({ value, disabled = false, onChange }: PostSortBarProps) => (
  <ScrollView
    horizontal
    showsHorizontalScrollIndicator={false}
    contentContainerStyle={styles.container}>
    {POST_SORTS.map(sort => {
      const active = sort === value;
      return (
        <Pressable
          key={sort}
          style={[styles.chip, active && styles.chipActive, disabled && styles.chipDisabled]}
          disabled={disabled}
          onPress={() => onChange(sort)}>
          <Text style={[styles.label, active && styles.labelActive]}>
            {POST_SORT_LABELS[sort]}
          </Text>
        </Pressable>
      );
    })}
  </ScrollView>
);

export default PostSortBar;
