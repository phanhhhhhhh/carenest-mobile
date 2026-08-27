import { Dimensions, type ImageSourcePropType } from 'react-native';

const { width } = Dimensions.get('window');

// Teal palette matching the Welcome Flow mockup
export const Teal = '#12A79C';
export const TealDark = '#0E8A81';
export const SubtitleGray = '#8E8E8E';
export const SkipGray = '#5C5C5C';
export const DotInactive = '#D7DBDE';
export const White = '#FFFFFF';

// The mockup shows 5 dots for 3 slides: active positions are the 1st, 3rd and 5th dot.
export const TOTAL_DOTS = 5;
export const DOT_SIZE = 9;
export const DOT_ACTIVE_WIDTH = 26;

export interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  imageSize: number;
}

export const slides: SlideData[] = [
  {
    id: '1',
    title: `Chăm sóc sức khỏe từ xa\nmọi lúc, mọi nơi`,
    subtitle: `Kết nối với bác sĩ, theo dõi sức khỏe\nvà cập nhập tình trạng nhanh chóng`,
    image: require('../../../../../assets/mascot/mascot_dashboard.jpg'),
    imageSize: Math.round(width * 0.88),
  },
  {
    id: '2',
    title: `Đa tiện ích\nchăm sóc sức khỏe`,
    subtitle: `Theo dõi, quản lý và cải thiện\nsức khỏe mỗi ngày`,
    image: require('../../../../../assets/icons/health_icon_grid.jpg'),
    imageSize: Math.round(width * 0.8),
  },
  {
    id: '3',
    title: `Chủ động theo dõi\nsức khỏe mỗi ngày`,
    subtitle: `Nhắc nhở thông minh, kết nối bác sĩ\nvà người thân luôn bên cạnh`,
    image: require('../../../../../assets/mascot/mascot_bigphone.jpg'),
    imageSize: Math.round(width * 0.92),
  },
];
