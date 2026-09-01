import { Dimensions, StyleSheet } from 'react-native';
import { ErrorRed, LabelGray, Teal, TealDark, TextDark, White } from './theme';
import { Shadows } from '../../../../core/theme/spacing';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: White },
  scroll: { paddingHorizontal: 28, paddingTop: 12, paddingBottom: 40 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mascotWrapper: { alignItems: 'center', marginBottom: 12, marginTop: 4 },
  mascot: { width: width * 0.48, height: width * 0.48 },

  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  leftIcon: { marginRight: 8 },
  phonePrefix: { fontSize: 15, fontWeight: '600', color: TextDark },
  prefixDivider: { width: 1, height: 20, backgroundColor: '#CBD5E1', marginHorizontal: 10 },
  input: { flex: 1, fontSize: 15, color: TextDark, paddingVertical: 0 },
  fieldError: { fontSize: 12.5, color: ErrorRed, marginTop: 4, marginLeft: 12 },

  roleRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
    backgroundColor: '#F1F5F9',
    padding: 4,
    borderRadius: 9999,
  },
  roleBtn: {
    flex: 1,
    borderRadius: 9999,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  roleBtnActive: {
    backgroundColor: White,
    ...Shadows.md,
  },
  roleText: { fontSize: 14, fontWeight: '600', color: LabelGray },
  roleTextActive: { color: Teal, fontWeight: '700' },

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 6, marginBottom: 4 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
    backgroundColor: '#F8FAFC',
  },
  checkboxChecked: { backgroundColor: Teal, borderColor: Teal },
  termsText: { flex: 1, fontSize: 13.5, color: '#475569', lineHeight: 20 },
  termsLink: { textDecorationLine: 'underline', fontWeight: '700', color: Teal },
  termsError: { marginLeft: 32, marginBottom: 4 },

  registerBtn: {
    backgroundColor: Teal,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: TealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  registerBtnDisabled: { opacity: 0.6 },
  registerBtnText: { fontSize: 16.5, fontWeight: '700', color: White, letterSpacing: 0.2 },

  loginRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginTop: 20 },
  loginHint: { fontSize: 14, color: '#64748B' },
  loginLink: { fontSize: 14, fontWeight: '700', color: Teal },
});
