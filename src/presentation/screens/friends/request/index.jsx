import React from 'react';
import { View, Text, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';

import { COLORS, TAB_BAR_SPACE } from '../../../theme';
import styles from './styles';

const POSTS = [
  {
    id: '1',
    user: 'nova',
    time: '2h ago',
    tone: '#141414',
    caption: 'Late night builds hit different. Shipping the new feed tomorrow.',
    likes: 128,
    comments: 12,
  },
  {
    id: '2',
    user: 'kairo',
    time: '5h ago',
    tone: '#1c1c1c',
    caption: 'Monochrome mood board for the week ✦',
    likes: 342,
    comments: 47,
  },
  {
    id: '3',
    user: 'lumen',
    time: '8h ago',
    tone: '#0f0f0f',
    caption: 'Found this quiet corner of the internet. Staying a while.',
    likes: 76,
    comments: 5,
  },
  {
    id: '4',
    user: 'echo',
    time: '1d ago',
    tone: '#242424',
    caption: 'PreQuit is the eye of the internet. Watching, always.',
    likes: 903,
    comments: 210,
  },
];

const PostCard = ({ post }) => (
  <View style={styles.post}>
    <View style={styles.postHeader}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {post.user.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View style={styles.postMeta}>
        <Text style={styles.postUser}>@{post.user}</Text>
        <Text style={styles.postTime}>{post.time}</Text>
      </View>
      <Ionicons name="ellipsis-horizontal" size={20} color={COLORS.textMuted} />
    </View>

    <View style={[styles.postImage, { backgroundColor: post.tone }]}>
      <Ionicons name="image-outline" size={40} color={COLORS.textMuted} />
    </View>

    <View style={styles.postBody}>
      <Text style={styles.postCaption}>{post.caption}</Text>
      <View style={styles.postActions}>
        <View style={styles.actionItem}>
          <Ionicons name="heart-outline" size={20} color={COLORS.white} />
          <Text style={styles.actionText}>{post.likes}</Text>
        </View>
        <View style={styles.actionItem}>
          <Ionicons name="chatbubble-outline" size={19} color={COLORS.white} />
          <Text style={styles.actionText}>{post.comments}</Text>
        </View>
        <View style={styles.actionItem}>
          <Ionicons name="paper-plane-outline" size={19} color={COLORS.white} />
        </View>
      </View>
    </View>
  </View>
);

const Social = () => {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: insets.top + 12,
          paddingBottom: insets.bottom + TAB_BAR_SPACE,
        }}>
        <Text style={styles.header}>Social</Text>
        {POSTS.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </ScrollView>
    </View>
  );
};

export default Social;
