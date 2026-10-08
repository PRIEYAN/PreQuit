import React, { memo, useState } from 'react';
import { View, Text, Image, Pressable } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

import styles from './styles';
import { COLORS } from '../../theme';
import type { Post, PostAuthor } from '../../../domain/entities/Post';

const LIKE_COLOR = '#FF375F';

const formatCount = (value: number | undefined): string => {
  const count = value ?? 0;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
  return String(count);
};

export interface PostCardProps {
  readonly post: Post;
  onToggleLike?(postId: string): void;
  onToggleSave?(postId: string): void;
  onPressAuthor?(author: PostAuthor): void;
  onPressComments?(post: Post): void;
}

const PostCard = ({
  post,
  onToggleLike,
  onToggleSave,
  onPressAuthor,
  onPressComments,
}: PostCardProps) => {
  const [mediaFailed, setMediaFailed] = useState(false);
  const { author, counts, viewer } = post;
  const image = post.media[0];
  const initial = (author.displayName || author.handle || '?').charAt(0).toUpperCase();

  return (
    <View style={styles.card}>
      <Pressable style={styles.header} onPress={() => onPressAuthor?.(author)}>
        {author.avatarUrl ? (
          <Image source={{ uri: author.avatarUrl }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarFallback]}>
            <Text style={styles.avatarInitial}>{initial}</Text>
          </View>
        )}
        <View style={styles.headerText}>
          <Text style={styles.displayName} numberOfLines={1}>
            {author.displayName}
          </Text>
          <Text style={styles.handle} numberOfLines={1}>
            @{author.handle}
          </Text>
        </View>
      </Pressable>

      {post.reason?.label ? (
        <View style={styles.reasonPill}>
          <Text style={styles.reasonText}>{post.reason.label}</Text>
        </View>
      ) : null}

      {post.description ? <Text style={styles.description}>{post.description}</Text> : null}

      {image?.urls.feed && !mediaFailed ? (
        <Image
          source={{ uri: image.urls.feed }}
          style={styles.media}
          resizeMode="cover"
          accessibilityLabel={image.altText ?? undefined}
          onError={() => setMediaFailed(true)}
        />
      ) : null}

      {post.topics.length > 0 ? (
        <View style={styles.topics}>
          {post.topics.map(topic => (
            <Text key={topic.slug} style={styles.topic}>
              #{topic.slug}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => onToggleLike?.(post.id)} hitSlop={8}>
          <Ionicons
            name={viewer.hasLiked ? 'heart' : 'heart-outline'}
            size={22}
            color={viewer.hasLiked ? LIKE_COLOR : COLORS.white}
          />
          <Text style={styles.actionCount}>{formatCount(counts.likes)}</Text>
        </Pressable>

        <Pressable style={styles.action} onPress={() => onPressComments?.(post)} hitSlop={8}>
          <Ionicons name="chatbubble-outline" size={20} color={COLORS.white} />
          <Text style={styles.actionCount}>{formatCount(counts.comments)}</Text>
        </Pressable>

        <View style={styles.spacer} />

        <Pressable style={styles.action} onPress={() => onToggleSave?.(post.id)} hitSlop={8}>
          <Ionicons
            name={viewer.hasSaved ? 'bookmark' : 'bookmark-outline'}
            size={20}
            color={COLORS.white}
          />
        </Pressable>
      </View>
    </View>
  );
};

export default memo(PostCard);
