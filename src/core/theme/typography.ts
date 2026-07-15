import { TextStyle } from 'react-native';

const fontFamily = 'Nunito';

export const Typography = {
  h1: { fontFamily, fontSize: 28, fontWeight: '700', lineHeight: 36 } as TextStyle,
  h2: { fontFamily, fontSize: 22, fontWeight: '700', lineHeight: 28 } as TextStyle,
  h3: { fontFamily, fontSize: 18, fontWeight: '600', lineHeight: 24 } as TextStyle,

  body: { fontFamily, fontSize: 15, fontWeight: '400', lineHeight: 22 } as TextStyle,
  bodySmall: { fontFamily, fontSize: 13, fontWeight: '400', lineHeight: 18 } as TextStyle,
  caption: { fontFamily, fontSize: 11, fontWeight: '400', lineHeight: 16 } as TextStyle,

  button: { fontFamily, fontSize: 16, fontWeight: '600', lineHeight: 22 } as TextStyle,
  buttonSmall: { fontFamily, fontSize: 14, fontWeight: '600', lineHeight: 20 } as TextStyle,
  tabLabel: { fontFamily, fontSize: 11, fontWeight: '600', lineHeight: 14 } as TextStyle,

  badge: { fontFamily, fontSize: 10, fontWeight: '700', lineHeight: 14 } as TextStyle,
  sectionTitle: { fontFamily, fontSize: 18, fontWeight: '600', lineHeight: 24 } as TextStyle,
  cardTitle: { fontFamily, fontSize: 16, fontWeight: '600', lineHeight: 22 } as TextStyle,
} as const;
