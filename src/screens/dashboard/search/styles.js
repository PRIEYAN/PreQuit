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
    alignItems: 'center',
    justifyContent: 'center',
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
});

export default styles;
