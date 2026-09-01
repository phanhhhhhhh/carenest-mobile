import { Dimensions, StyleSheet } from 'react-native';
import { ErrorRed, LabelGray, Teal, TealDark, TextDark, White } from '../register/theme';
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
  mascotWrapper: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 4,
  },
  mascot: {
    width: width * 0.52,
    height: width * 0.52,
  },

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
  roleText: { fontSize: 14.5, fontWeight: '600', color: LabelGray },
  roleTextActive: { color: Teal, fontWeight: '700' },

  fieldBlock: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#334155', marginBottom: 6 },
  labelError: { color: ErrorRed },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 52,
    backgroundColor: '#F8FAFC',
  },
  inputPillError: { borderColor: ErrorRed, backgroundColor: '#FFF5F5' },
  leftIcon: { marginRight: 8 },
  phonePrefix: { fontSize: 15, fontWeight: '600', color: TextDark },
  prefixDivider: { width: 1, height: 20, backgroundColor: '#CBD5E1', marginHorizontal: 10 },
  input: { flex: 1, fontSize: 15, color: TextDark, paddingVertical: 0 },
  fieldError: { fontSize: 12.5, color: ErrorRed, marginTop: 4, marginLeft: 12 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 20, marginTop: 2 },
  forgotText: { fontSize: 13.5, fontWeight: '600', color: Teal },

  loginBtn: {
    backgroundColor: Teal,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: TealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 5,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 16.5, fontWeight: '700', color: White, letterSpacing: 0.2 },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 24, marginBottom: 18 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 13, color: '#94A3B8', marginHorizontal: 12, fontWeight: '500' },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginBottom: 24 },
  socialBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },

  registerRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  registerHint: { fontSize: 14, color: '#64748B' },
  registerLink: { fontSize: 14, fontWeight: '700', color: Teal },
});
