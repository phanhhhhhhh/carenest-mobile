import { Dimensions, StyleSheet } from 'react-native';
import {
  BorderGray,
  ErrorRed,
  LabelGray,
  Teal,
  TealDark,
  TextDark,
  White,
} from '../register/theme';

const { width } = Dimensions.get('window');

export const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: { flex: 1, backgroundColor: White },
  scroll: { paddingHorizontal: 28, paddingTop: 8, paddingBottom: 40 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  mascotWrapper: { alignItems: 'center', marginBottom: 22 },
  mascot: { width: width * 0.55, height: width * 0.55 },

  roleRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  roleBtn: {
    flex: 1,
    borderWidth: 1.2,
    borderColor: BorderGray,
    borderRadius: 9999,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: White,
  },
  roleBtnActive: { borderColor: Teal, backgroundColor: '#E8F7F5' },
  roleText: { fontSize: 14.5, fontWeight: '600', color: LabelGray },
  roleTextActive: { color: Teal },

  fieldBlock: { marginBottom: 16 },
  label: { fontSize: 14.5, fontWeight: '600', color: LabelGray, marginBottom: 7 },
  labelError: { color: ErrorRed },
  inputPill: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.2,
    borderColor: BorderGray,
    borderRadius: 9999,
    paddingHorizontal: 18,
    height: 54,
    backgroundColor: White,
  },
  inputPillError: { borderColor: ErrorRed },
  leftIcon: { marginRight: 8 },
  phonePrefix: { fontSize: 15.5, fontWeight: '600', color: TextDark },
  prefixDivider: { width: 1, height: 20, backgroundColor: BorderGray, marginHorizontal: 8 },
  input: { flex: 1, fontSize: 15.5, color: TextDark, paddingVertical: 0 },
  fieldError: { fontSize: 13, color: ErrorRed, marginTop: 5, marginLeft: 16 },

  forgotBtn: { alignSelf: 'flex-end', marginBottom: 18 },
  forgotText: { fontSize: 14, color: TextDark },

  loginBtn: {
    backgroundColor: Teal,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: TealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  loginBtnDisabled: { opacity: 0.6 },
  loginBtnText: { fontSize: 17, fontWeight: '700', color: White },

  dividerRow: { flexDirection: 'row', alignItems: 'center', marginTop: 22, marginBottom: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E3E6E9' },
  dividerText: { fontSize: 13.5, color: LabelGray, marginHorizontal: 10 },

  socialRow: { flexDirection: 'row', justifyContent: 'center', gap: 28, marginBottom: 22 },
  socialBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#E3E6E9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: White,
  },

  registerRow: { flexDirection: 'row', justifyContent: 'center' },
  registerHint: { fontSize: 14, color: TextDark },
  registerLink: { fontSize: 14, fontWeight: '700', color: TextDark },
});
