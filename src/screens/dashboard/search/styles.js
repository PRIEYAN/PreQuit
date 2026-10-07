import { StyleSheet } from 'react-native';
import { COLORS, IMPACT_FONT } from '../../../theme';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Centered app title in Impact.
  title: {
    fontFamily: IMPACT_FONT,
    fontSize: 44,
    letterSpacing: 2,
    color: COLORS.white,
    textAlign: 'center',
    marginBottom: 15,
  },

  // Glassy search box (no shadow).
  searchWrap: {
    width: '100%',
    marginTop: 5,
    borderRadius: 16,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 54,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: COLORS.white,
    fontSize: 16,
    padding: 0,
  },

  list: {
    marginTop: 18,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    letterSpacing: 1.2,
    marginBottom: 12,
  },
  postsSectionLabel: {
    marginTop: 22,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 18,
    backgroundColor: COLORS.glass,
    borderWidth: 1,
    borderColor: COLORS.glassBorder,
  },
  tagIcon: {
    marginRight: 6,
  },
  tagLabel: {
    color: COLORS.white,
    fontSize: 13,
    fontWeight: '600',
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 44,
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
});

export default styles;
