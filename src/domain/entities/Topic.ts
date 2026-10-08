export interface Topic {
  readonly id: string;
  readonly slug: string;
  readonly label: string;
  readonly postCount: number;
}

export interface TopicPayload {
  readonly id?: string;
  readonly topicId?: string;
  readonly slug?: string;
  readonly label?: string;
  readonly postCount?: number;
  readonly posts?: number;
}

export const createTopic = (raw: TopicPayload = {}): Topic => ({
  id: raw.id ?? raw.topicId ?? raw.slug ?? '',
  slug: raw.slug ?? '',
  label: raw.label ?? raw.slug ?? '',
  postCount: raw.postCount ?? raw.posts ?? 0,
});
