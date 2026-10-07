export const TOPICS = [
  { id: 't1', slug: 'linux-kernel', label: 'Linux Kernel', posts: 18420, keywords: ['linux', 'kernel', 'scheduler', 'syscall'] },
  { id: 't2', slug: 'arch-linux', label: 'Arch Linux', posts: 12180, keywords: ['linux', 'arch', 'pacman', 'aur', 'rolling'] },
  { id: 't3', slug: 'nixos', label: 'NixOS', posts: 7340, keywords: ['linux', 'nix', 'nixos', 'declarative', 'reproducible'] },
  { id: 't4', slug: 'debian', label: 'Debian', posts: 9610, keywords: ['linux', 'debian', 'apt', 'stable'] },
  { id: 't5', slug: 'systemd', label: 'systemd', posts: 6890, keywords: ['linux', 'systemd', 'init', 'services', 'journald'] },
  { id: 't6', slug: 'ebpf', label: 'eBPF', posts: 5240, keywords: ['linux', 'ebpf', 'bpf', 'tracing', 'observability'] },
  { id: 't7', slug: 'bash-scripting', label: 'Bash Scripting', posts: 15330, keywords: ['linux', 'bash', 'shell', 'scripting', 'posix'] },
  { id: 't8', slug: 'neovim', label: 'Neovim', posts: 11470, keywords: ['linux', 'vim', 'neovim', 'editor', 'lua'] },
  { id: 't9', slug: 'wayland', label: 'Wayland', posts: 4980, keywords: ['linux', 'wayland', 'compositor', 'x11', 'display'] },
  { id: 't10', slug: 'btrfs', label: 'Btrfs', posts: 3120, keywords: ['linux', 'btrfs', 'filesystem', 'snapshots', 'zfs'] },
  { id: 't11', slug: 'containers', label: 'Containers', posts: 16750, keywords: ['linux', 'docker', 'podman', 'containers', 'namespaces', 'cgroups'] },
  { id: 't12', slug: 'kubernetes', label: 'Kubernetes', posts: 21340, keywords: ['linux', 'kubernetes', 'k8s', 'orchestration', 'containers'] },
  { id: 't13', slug: 'gentoo', label: 'Gentoo', posts: 2870, keywords: ['linux', 'gentoo', 'portage', 'compile'] },
  { id: 't14', slug: 'fedora', label: 'Fedora', posts: 8250, keywords: ['linux', 'fedora', 'rpm', 'dnf', 'redhat'] },
  { id: 't15', slug: 'linux-networking', label: 'Linux Networking', posts: 7690, keywords: ['linux', 'networking', 'iptables', 'nftables', 'tcp', 'dns'] },
  { id: 't16', slug: 'window-managers', label: 'Tiling Window Managers', posts: 6410, keywords: ['linux', 'i3', 'sway', 'hyprland', 'tiling', 'ricing'] },
  { id: 't17', slug: 'zfs', label: 'ZFS', posts: 4360, keywords: ['linux', 'zfs', 'filesystem', 'raid', 'storage'] },
  { id: 't18', slug: 'selinux', label: 'SELinux', posts: 2140, keywords: ['linux', 'selinux', 'apparmor', 'security', 'hardening'] },
  { id: 't19', slug: 'rust-lang', label: 'Rust', posts: 19880, keywords: ['rust', 'cargo', 'borrow', 'memory', 'systems'] },
  { id: 't20', slug: 'postgresql', label: 'PostgreSQL', posts: 17260, keywords: ['postgres', 'postgresql', 'sql', 'database', 'index'] },
  { id: 't21', slug: 'distributed-systems', label: 'Distributed Systems', posts: 13540, keywords: ['distributed', 'raft', 'consensus', 'cap', 'replication'] },
  { id: 't22', slug: 'performance', label: 'Performance Engineering', posts: 10920, keywords: ['performance', 'profiling', 'perf', 'latency', 'cache', 'simd'] },
  { id: 't23', slug: 'git', label: 'Git', posts: 22610, keywords: ['git', 'rebase', 'bisect', 'version control', 'tooling'] },
  { id: 't24', slug: 'open-source', label: 'Open Source', posts: 14380, keywords: ['linux', 'open source', 'foss', 'gpl', 'licensing'] },
  { id: 't25', slug: 'grub-bootloader', label: 'GRUB Bootloader', posts: 5680, keywords: ['linux', 'grub', 'bootloader', 'boot', 'dual boot', 'efi', 'uefi', 'os-prober'] },
];

export const DEFAULT_TOPICS = [
  TOPICS[0],
  TOPICS[1],
  TOPICS[10],
  TOPICS[5],
  TOPICS[7],
  TOPICS[6],
];

export const suggestTopics = (query, limit = 14) => {
  const q = query.trim().toLowerCase();
  if (!q) return DEFAULT_TOPICS;

  const scored = [];
  for (const topic of TOPICS) {
    const label = topic.label.toLowerCase();
    const slug = topic.slug.toLowerCase();
    let score = 0;

    if (label.startsWith(q) || slug.startsWith(q)) score = 100;
    else if (label.includes(q) || slug.includes(q)) score = 70;
    else {
      for (const keyword of topic.keywords) {
        if (keyword.startsWith(q)) {
          score = Math.max(score, 50);
        } else if (keyword.includes(q)) {
          score = Math.max(score, 30);
        }
      }
    }

    if (score > 0) scored.push({ topic, score });
  }

  return scored
    .sort((a, b) => b.score - a.score || b.topic.posts - a.topic.posts)
    .slice(0, limit)
    .map(entry => entry.topic);
};

export default TOPICS;
