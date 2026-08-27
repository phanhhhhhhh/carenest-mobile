import { Dimensions, StyleSheet } from 'react-native';
import { BorderGray, ErrorRed, LabelGray, Teal, TealDark, TextDark, White } from './theme';

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
  mascotWrapper: { alignItems: 'center', marginBottom: 8 },
  mascot: { width: width * 0.48, height: width * 0.48 },

  label: { fontSize: 14.5, fontWeight: '600', color: LabelGray, marginBottom: 7 },
  leftIcon: { marginRight: 8 },
  phonePrefix: { fontSize: 15.5, fontWeight: '600', color: TextDark },
  prefixDivider: { width: 1, height: 20, backgroundColor: BorderGray, marginHorizontal: 8 },
  input: { flex: 1, fontSize: 15.5, color: TextDark, paddingVertical: 0 },
  fieldError: { fontSize: 13, color: ErrorRed, marginTop: 5, marginLeft: 16 },

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

  termsRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: 4 },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: BorderGray,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    marginTop: 1,
  },
  checkboxChecked: { backgroundColor: Teal, borderColor: Teal },
  termsText: { flex: 1, fontSize: 14, color: TextDark, lineHeight: 21 },
  termsLink: { textDecorationLine: 'underline', fontWeight: '600' },
  termsError: { marginLeft: 28, marginBottom: 4 },

  registerBtn: {
    backgroundColor: Teal,
    borderRadius: 9999,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 14,
    shadowColor: TealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  registerBtnDisabled: { opacity: 0.6 },
  registerBtnText: { fontSize: 17, fontWeight: '700', color: White },

  loginRow: { flexDirection: 'row', justifyContent: 'center', marginTop: 16 },
  loginHint: { fontSize: 14, color: TextDark },
  loginLink: { fontSize: 14, fontWeight: '700', color: TextDark },
});
