const post = ({ id, handle, displayName, description, likes, comments, saves, topic, reason, hasLiked = false, hasSaved = false }) => ({
  id,
  author: { id: `u_${handle}`, handle, displayName, avatarUrl: null },
  description,
  media: [],
  hashtags: [],
  mentions: [],
  topics: topic ? [{ slug: topic, label: topic, weight: 1, source: 'author' }] : [],
  visibility: 'public',
  status: 'published',
  counts: { likes, comments, shares: 0, saves },
  viewer: { hasLiked, hasSaved, canEdit: false, canDelete: false },
  enrichmentStatus: 'ready',
  publishedAt: new Date(Date.now() - Number(id.slice(1)) * 37 * 60000).toISOString(),
  reason: reason ? { kind: 'quality', label: reason } : null,
});

export const MOCK_POSTS = [
  post({
    id: 'p1',
    handle: 'torvaldsfan',
    displayName: 'Linus Fanboy',
    description:
      'Spent the afternoon reading the Linux CFS scheduler. vruntime is such an elegant trick — the task with the smallest virtual runtime always runs next.',
    likes: 412,
    comments: 4,
    saves: 58,
    topic: 'linux',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p2',
    handle: 'kernelpanic',
    displayName: 'Kernel Panic',
    description:
      'cgroups v2 finally unified the hierarchy. One tree instead of twelve controllers each with their own mount. Migration was painful but worth it.',
    likes: 287,
    comments: 5,
    saves: 40,
    topic: 'linux',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p3',
    handle: 'nixgoblin',
    displayName: 'Nix Goblin',
    description:
      'io_uring changed how I think about async IO on Linux. No syscall per operation, just two ring buffers shared with the kernel.',
    likes: 534,
    comments: 5,
    saves: 82,
    topic: 'linux',
    reason: 'Trending right now',
  }),
  post({
    id: 'p4',
    handle: 'rustacean',
    displayName: 'Ferris Dev',
    description:
      'eBPF is quietly the most important thing to happen to Linux observability. Attach a program to any tracepoint without a kernel module.',
    likes: 623,
    comments: 3,
    saves: 34,
    topic: 'linux',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p5',
    handle: 'dbwhisperer',
    displayName: 'Query Planner',
    description:
      'Today I learned that /proc/sys/vm/swappiness does not mean what most blog posts say. It is a ratio, not a threshold.',
    likes: 198,
    comments: 3,
    saves: 39,
    topic: 'linux',
    reason: null,
  }),
  post({
    id: 'p6',
    handle: 'netshark',
    displayName: 'Packet Shark',
    description:
      'systemd gets endless hate but socket activation genuinely solved a real problem. Services start on first connection, boot gets faster.',
    likes: 156,
    comments: 2,
    saves: 65,
    topic: 'linux',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p7',
    handle: 'gcpauser',
    displayName: 'Stop The World',
    description:
      'Wrote my first kernel module today. Just a char device that echoes back what you write. printk into dmesg is a rite of passage.',
    likes: 341,
    comments: 5,
    saves: 42,
    topic: 'linux',
    reason: null,
  }),
  post({
    id: 'p8',
    handle: 'simdlord',
    displayName: 'Vector Lane',
    description:
      'Btrfs snapshots saved me tonight. Bad upgrade, rolled back the whole root subvolume in about four seconds.',
    likes: 267,
    comments: 5,
    saves: 53,
    topic: 'linux',
    reason: 'Trending right now',
  }),
  post({
    id: 'p9',
    handle: 'tlsnerd',
    displayName: 'Handshake',
    description:
      'Namespaces are the entire magic behind containers. PID, net, mnt, uts, ipc, user. Docker is mostly ergonomics on top of clone flags.',
    likes: 489,
    comments: 5,
    saves: 22,
    topic: 'linux',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p10',
    handle: 'btrfsfan',
    displayName: 'Copy On Write',
    description:
      'strace is still the fastest way to answer \'what is this process actually doing\'. Ninety percent of my debugging starts there.',
    likes: 378,
    comments: 2,
    saves: 78,
    topic: 'linux',
    reason: null,
  }),
  post({
    id: 'p11',
    handle: 'distsys',
    displayName: 'Two Generals',
    description:
      'Arch broke after an update because I ignored the news feed again. This is entirely a me problem and I accept it.',
    likes: 512,
    comments: 3,
    saves: 19,
    topic: 'linux',
    reason: 'Trending right now',
  }),
  post({
    id: 'p12',
    handle: 'compilerbro',
    displayName: 'LLVM Andy',
    description:
      'The OOM killer picked my database instead of the runaway process. oom_score_adj exists for exactly this reason.',
    likes: 223,
    comments: 2,
    saves: 53,
    topic: 'linux',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p13',
    handle: 'cachemiss',
    displayName: 'L2 Miss',
    description:
      'Switched from bash to fish for interactive use and kept bash for scripts. Best of both, no POSIX compatibility headaches.',
    likes: 134,
    comments: 2,
    saves: 29,
    topic: 'linux',
    reason: null,
  }),
  post({
    id: 'p14',
    handle: 'greenthread',
    displayName: 'Async Ada',
    description:
      'Learned that hard links share an inode and symlinks store a path. Obvious in retrospect, but it explains so much about mv behaviour.',
    likes: 167,
    comments: 5,
    saves: 22,
    topic: 'linux',
    reason: null,
  }),
  post({
    id: 'p15',
    handle: 'pidzero',
    displayName: 'Init One',
    description:
      'Wayland finally feels ready. Screen sharing works, fractional scaling works, and my compositor stopped tearing.',
    likes: 298,
    comments: 4,
    saves: 21,
    topic: 'linux',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p16',
    handle: 'torvaldsfan',
    displayName: 'Linus Fanboy',
    description:
      'Rust borrow checker fought me for two days. Then the code compiled and ran correctly on the first try. Fair trade.',
    likes: 445,
    comments: 2,
    saves: 29,
    topic: 'rust',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p17',
    handle: 'kernelpanic',
    displayName: 'Kernel Panic',
    description:
      'Replaced a hot Python loop with a Rust extension via PyO3. Forty times faster and I did not have to touch the calling code.',
    likes: 367,
    comments: 4,
    saves: 84,
    topic: 'rust',
    reason: 'Trending right now',
  }),
  post({
    id: 'p18',
    handle: 'nixgoblin',
    displayName: 'Nix Goblin',
    description:
      'Arc<Mutex<T>> everywhere is a smell. Usually it means the ownership model was not thought through, not that Rust is hard.',
    likes: 289,
    comments: 3,
    saves: 6,
    topic: 'rust',
    reason: null,
  }),
  post({
    id: 'p19',
    handle: 'rustacean',
    displayName: 'Ferris Dev',
    description:
      'Lifetimes finally clicked when I stopped thinking of them as durations and started reading them as constraints between references.',
    likes: 412,
    comments: 4,
    saves: 32,
    topic: 'rust',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p20',
    handle: 'dbwhisperer',
    displayName: 'Query Planner',
    description:
      'Zero cost abstraction is not marketing. I checked the assembly and the iterator chain compiled to the same loop as the manual version.',
    likes: 356,
    comments: 5,
    saves: 14,
    topic: 'rust',
    reason: null,
  }),
  post({
    id: 'p21',
    handle: 'netshark',
    displayName: 'Packet Shark',
    description:
      'Postgres query went from nine seconds to eighty milliseconds. The fix was a composite index in the right column order.',
    likes: 478,
    comments: 5,
    saves: 73,
    topic: 'databases',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p22',
    handle: 'gcpauser',
    displayName: 'Stop The World',
    description:
      'EXPLAIN ANALYZE is the single most valuable tool in database work. Stop guessing which index the planner picked.',
    likes: 392,
    comments: 3,
    saves: 35,
    topic: 'databases',
    reason: 'Trending right now',
  }),
  post({
    id: 'p23',
    handle: 'simdlord',
    displayName: 'Vector Lane',
    description:
      'Learned the hard way that SELECT COUNT(*) on a large Postgres table is not O(1). MVCC means it has to scan.',
    likes: 245,
    comments: 3,
    saves: 48,
    topic: 'databases',
    reason: null,
  }),
  post({
    id: 'p24',
    handle: 'tlsnerd',
    displayName: 'Handshake',
    description:
      'Connection pooling is not optional. Every Postgres connection is a forked process with its own memory overhead.',
    likes: 301,
    comments: 5,
    saves: 21,
    topic: 'databases',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p25',
    handle: 'btrfsfan',
    displayName: 'Copy On Write',
    description:
      'MongoDB transactions need a replica set. A standalone mongod will connect fine and then fail on the first commit.',
    likes: 189,
    comments: 5,
    saves: 11,
    topic: 'databases',
    reason: null,
  }),
  post({
    id: 'p26',
    handle: 'distsys',
    displayName: 'Two Generals',
    description:
      'Write ahead logging is such a clean idea. Write the intent, fsync, then apply. Crash anywhere and you can replay.',
    likes: 334,
    comments: 5,
    saves: 56,
    topic: 'databases',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p27',
    handle: 'compilerbro',
    displayName: 'LLVM Andy',
    description:
      'B-trees stay shallow because the fanout is huge. Three levels covers millions of rows, so most lookups are three page reads.',
    likes: 278,
    comments: 2,
    saves: 12,
    topic: 'databases',
    reason: null,
  }),
  post({
    id: 'p28',
    handle: 'cachemiss',
    displayName: 'L2 Miss',
    description:
      'N+1 queries are still the most common performance bug I find in code review. One query per row in a loop.',
    likes: 423,
    comments: 3,
    saves: 31,
    topic: 'databases',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p29',
    handle: 'greenthread',
    displayName: 'Async Ada',
    description:
      'TCP slow start is why your first request feels slow. The congestion window has to ramp up before bandwidth is usable.',
    likes: 356,
    comments: 2,
    saves: 68,
    topic: 'networking',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p30',
    handle: 'pidzero',
    displayName: 'Init One',
    description:
      'Spent an hour debugging a DNS issue that was actually a stale entry in nscd. Always check the cache layer.',
    likes: 212,
    comments: 5,
    saves: 69,
    topic: 'networking',
    reason: null,
  }),
  post({
    id: 'p31',
    handle: 'torvaldsfan',
    displayName: 'Linus Fanboy',
    description:
      'HTTP/2 multiplexing removed head of line blocking at the application layer but TCP still has it. QUIC fixes that properly.',
    likes: 389,
    comments: 4,
    saves: 57,
    topic: 'networking',
    reason: 'Trending right now',
  }),
  post({
    id: 'p32',
    handle: 'kernelpanic',
    displayName: 'Kernel Panic',
    description:
      'MTU mismatch caused intermittent failures that only showed up on large payloads. Path MTU discovery was being blocked by a firewall.',
    likes: 167,
    comments: 4,
    saves: 5,
    topic: 'networking',
    reason: null,
  }),
  post({
    id: 'p33',
    handle: 'nixgoblin',
    displayName: 'Nix Goblin',
    description:
      'TLS 1.3 dropped the round trip. One RTT for a fresh handshake, zero for resumption. Real latency win.',
    likes: 298,
    comments: 2,
    saves: 18,
    topic: 'networking',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p34',
    handle: 'rustacean',
    displayName: 'Ferris Dev',
    description:
      'Read the Raft paper again. Leader election plus log replication, and that is genuinely most of it. Far more approachable than Paxos.',
    likes: 467,
    comments: 5,
    saves: 70,
    topic: 'distsys',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p35',
    handle: 'dbwhisperer',
    displayName: 'Query Planner',
    description:
      'CAP theorem is not \'pick two\'. Partitions happen whether you like it or not, so you are really choosing C or A during one.',
    likes: 512,
    comments: 3,
    saves: 5,
    topic: 'distsys',
    reason: 'Trending right now',
  }),
  post({
    id: 'p36',
    handle: 'netshark',
    displayName: 'Packet Shark',
    description:
      'Exactly once delivery does not exist. You get at least once plus idempotent consumers, and that is fine.',
    likes: 434,
    comments: 3,
    saves: 67,
    topic: 'distsys',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p37',
    handle: 'gcpauser',
    displayName: 'Stop The World',
    description:
      'Vector clocks make causality explicit but they grow with the number of nodes. Hybrid logical clocks are the practical compromise.',
    likes: 256,
    comments: 4,
    saves: 83,
    topic: 'distsys',
    reason: null,
  }),
  post({
    id: 'p38',
    handle: 'simdlord',
    displayName: 'Vector Lane',
    description:
      'The outbox pattern solved my dual write problem. Write the event in the same transaction, publish it separately.',
    likes: 312,
    comments: 4,
    saves: 23,
    topic: 'distsys',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p39',
    handle: 'tlsnerd',
    displayName: 'Handshake',
    description:
      'Idempotency keys are underrated. Retries stop being scary the moment the same request twice means the same result.',
    likes: 289,
    comments: 4,
    saves: 3,
    topic: 'distsys',
    reason: null,
  }),
  post({
    id: 'p40',
    handle: 'btrfsfan',
    displayName: 'Copy On Write',
    description:
      'Profiled the service and it was spending thirty percent of CPU in garbage collection. Object pooling brought it down to four.',
    likes: 378,
    comments: 4,
    saves: 54,
    topic: 'perf',
    reason: 'Trending right now',
  }),
  post({
    id: 'p41',
    handle: 'distsys',
    displayName: 'Two Generals',
    description:
      'Cache line is 64 bytes. Two threads writing adjacent fields in the same struct will ping pong ownership and destroy throughput.',
    likes: 423,
    comments: 2,
    saves: 13,
    topic: 'perf',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p42',
    handle: 'compilerbro',
    displayName: 'LLVM Andy',
    description:
      'Branch prediction matters more than I expected. Sorting the input before the loop made it three times faster with identical work.',
    likes: 356,
    comments: 3,
    saves: 8,
    topic: 'perf',
    reason: null,
  }),
  post({
    id: 'p43',
    handle: 'cachemiss',
    displayName: 'L2 Miss',
    description:
      'Big O hides the constant. A linear scan over an array beat a hash map for anything under a few hundred elements.',
    likes: 334,
    comments: 5,
    saves: 60,
    topic: 'perf',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p44',
    handle: 'greenthread',
    displayName: 'Async Ada',
    description:
      'mmap looked like free performance until the page faults showed up in the profile. Nothing is actually free.',
    likes: 245,
    comments: 2,
    saves: 3,
    topic: 'perf',
    reason: null,
  }),
  post({
    id: 'p45',
    handle: 'pidzero',
    displayName: 'Init One',
    description:
      'SIMD gave me an eight times speedup on that filter. Autovectorization missed it because of a hidden data dependency.',
    likes: 289,
    comments: 5,
    saves: 12,
    topic: 'perf',
    reason: null,
  }),
  post({
    id: 'p46',
    handle: 'torvaldsfan',
    displayName: 'Linus Fanboy',
    description:
      'git rebase -i is my favourite tool for cleaning history before a PR. Nobody needs to see fourteen \'fix typo\' commits.',
    likes: 456,
    comments: 5,
    saves: 37,
    topic: 'tooling',
    reason: 'Trending right now',
  }),
  post({
    id: 'p47',
    handle: 'kernelpanic',
    displayName: 'Kernel Panic',
    description:
      'git bisect found the regression in six steps across two thousand commits. Binary search on history is magic.',
    likes: 398,
    comments: 2,
    saves: 62,
    topic: 'tooling',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p48',
    handle: 'nixgoblin',
    displayName: 'Nix Goblin',
    description:
      'Docker layer caching only helps if you order the Dockerfile right. Copy the lockfile and install before copying source.',
    likes: 367,
    comments: 5,
    saves: 12,
    topic: 'tooling',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p49',
    handle: 'rustacean',
    displayName: 'Ferris Dev',
    description:
      'Pinned every dependency after a transitive minor bump broke production. Lockfiles exist for a reason.',
    likes: 278,
    comments: 2,
    saves: 17,
    topic: 'tooling',
    reason: null,
  }),
  post({
    id: 'p50',
    handle: 'dbwhisperer',
    displayName: 'Query Planner',
    description:
      'Vim macros are the most underused feature. Record once, replay across a thousand lines, done before you could write the script.',
    likes: 412,
    comments: 4,
    saves: 56,
    topic: 'tooling',
    reason: 'Popular with people like you',
  }),
  post({
    id: 'p51',
    handle: 'pidzero',
    displayName: 'Init One',
    description:
      'Getting a grub issue after the last kernel update — drops me straight into a grub rescue> prompt. Turned out /boot was on a separate partition grub-mkconfig never scanned.',
    likes: 356,
    comments: 3,
    saves: 64,
    topic: 'linux',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p52',
    handle: 'kernelpanic',
    displayName: 'Kernel Panic',
    description:
      'Fixed my grub issue by chrooting from a live USB and running grub-install followed by update-grub. Dual booting Windows and Linux always seems to be what breaks grub in the first place.',
    likes: 289,
    comments: 3,
    saves: 47,
    topic: 'linux',
    reason: 'Trending right now',
  }),
  post({
    id: 'p53',
    handle: 'nixgoblin',
    displayName: 'Nix Goblin',
    description:
      'If grub is not showing the OS menu on boot, check /etc/default/grub for GRUB_TIMEOUT and GRUB_DEFAULT, then regenerate grub.cfg. Nine times out of ten the entry was just hidden.',
    likes: 198,
    comments: 2,
    saves: 33,
    topic: 'linux',
    reason: 'Matches your interests',
  }),
  post({
    id: 'p54',
    handle: 'btrfsfan',
    displayName: 'Copy On Write',
    description:
      'A UEFI firmware update wiped my boot entry and grub would not load at all. Recreated it with efibootmgr and reinstalled grub-efi to the ESP. Back to a clean boot menu.',
    likes: 167,
    comments: 2,
    saves: 29,
    topic: 'linux',
    reason: null,
  }),
  post({
    id: 'p55',
    handle: 'gcpauser',
    displayName: 'Stop The World',
    description:
      'Reinstalled grub after a botched partition resize left the OS unbootable. os-prober was not picking up the other distro until I enabled GRUB_DISABLE_OS_PROBER=false and reran update-grub.',
    likes: 223,
    comments: 3,
    saves: 38,
    topic: 'linux',
    reason: 'Popular with people like you',
  }),
];

export const PAGE_SIZE = 10;

export const fetchPage = (page, source = MOCK_POSTS) => {
  const start = page * PAGE_SIZE;
  const items = source.slice(start, start + PAGE_SIZE);
  return { items, hasMore: start + PAGE_SIZE < source.length };
};

const STOPWORDS = new Set([
  'i', 'am', 'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
  'to', 'of', 'in', 'on', 'at', 'for', 'with', 'and', 'or', 'but', 'my',
  'me', 'it', 'this', 'that', 'im', 'ive', 'getting', 'get', 'got',
  'having', 'have', 'has', 'do', 'does', 'did', 'so', 'issue', 'problem',
  'error', 'help', 'please', 'need', 'how', 'what', 'why', 'can', 'could',
]);

const wordsOf = query =>
  query
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/i)
    .filter(word => word.length > 1 && !STOPWORDS.has(word));

/**
 * Matches a free-text sentence like "i am getting grub issue" against post
 * content: strips filler words, keeps the meaningful terms (e.g. "grub"),
 * and returns posts whose description actually contains one of them.
 */
export const searchPosts = (query, source = MOCK_POSTS, limit = 20) => {
  const terms = wordsOf(query);
  if (terms.length === 0) return [];

  const scored = [];
  for (const item of source) {
    const haystack = `${item.description} ${item.author.handle} ${item.topics[0]?.slug ?? ''}`.toLowerCase();
    let score = 0;
    for (const term of terms) {
      if (haystack.includes(term)) score += term.length;
    }
    if (score > 0) scored.push({ item, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || b.item.counts.likes - a.item.counts.likes)
    .slice(0, limit)
    .map(entry => entry.item);
};

export default MOCK_POSTS;
