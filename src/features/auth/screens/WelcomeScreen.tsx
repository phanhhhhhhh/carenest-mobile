import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Animated,
  Dimensions,
  Image,
  ImageSourcePropType,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { AppStrings } from '../../../core/constants/strings';

const { width } = Dimensions.get('window');

// Teal palette matching the Welcome Flow mockup
const Teal = '#12A79C';
const TealDark = '#0E8A81';
const SubtitleGray = '#8E8E8E';
const SkipGray = '#5C5C5C';
const DotInactive = '#D7DBDE';
const White = '#FFFFFF';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  image: ImageSourcePropType;
  imageSize: number;
  showButton: boolean;
}

const slides: SlideData[] = [
  {
    id: '1',
    title: `Chăm sóc sức khỏe từ xa\nmọi lúc, mọi nơi`,
    subtitle: `Kết nối với bác sĩ, theo dõi sức khỏe\nvà cập nhật tình trạng nhanh chóng`,
    image: require('../../../../assets/mascot/mascot_dashboard.jpg'),
    imageSize: 280,
    showButton: false,
  },
  {
    id: '2',
    title: `Đa tiện ích\nchăm sóc sức khỏe`,
    subtitle: `Theo dõi, quản lý và cải thiện\nsức khỏe mỗi ngày`,
    image: require('../../../../assets/icons/health_icon_grid.jpg'),
    imageSize: 280,
    showButton: true,
  },
  {
    id: '3',
    title: `Chủ động theo dõi\nsức khỏe mỗi ngày`,
    subtitle: `Nhắc nhở thông minh, kết nối bác sĩ\nvà người thân luôn bên cạnh`,
    image: require('../../../../assets/mascot/mascot_bigphone.jpg'),
    imageSize: 300,
    showButton: true,
  },
];

// The mockup shows 5 dots while there are 3 slides:
// active positions are the 1st, 3rd and 5th dot.
const TOTAL_DOTS = 5;
const DOT_SIZE = 8;
const DOT_ACTIVE_WIDTH = 22;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showSplash, setShowSplash] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);

  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(1)).current;
  const mascotBounce = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Tracks horizontal scroll offset so dots & button animate while dragging
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotBounce, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(mascotBounce, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      { iterations: 2 }
    ).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(splashOpacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(splashScale, {
          toValue: 0.95,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => {
        setShowSplash(false);
        Animated.timing(contentOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }).start();
      });
    }, 2200);

    return () => clearTimeout(timer);
  }, [splashOpacity, splashScale, mascotBounce, contentOpacity]);

  const onScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { x: scrollX } } }],
    { useNativeDriver: false }
  );

  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setCurrentIndex(index);
    },
    []
  );

  const handleSkip = useCallback(() => {
    navigation.navigate('GetStarted');
  }, [navigation]);

  const bounceInterpolate = mascotBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const renderSlide = useCallback(
    ({ item, index }: ListRenderItemInfo<SlideData>) => {
      // Subtle parallax: content drifts & fades slightly while swiping
      const inputRange = [(index - 1) * width, index * width, (index + 1) * width];
      const slideOpacity = scrollX.interpolate({
        inputRange,
        outputRange: [0.35, 1, 0.35],
        extrapolate: 'clamp',
      });
      const translateX = scrollX.interpolate({
        inputRange,
        outputRange: [width * 0.08, 0, -width * 0.08],
        extrapolate: 'clamp',
      });

      return (
        <View style={styles.slide}>
          <Animated.View
            style={[
              styles.slideInner,
              { opacity: slideOpacity, transform: [{ translateX }] },
            ]}
          >
            <Text style={styles.slideTitle}>{item.title}</Text>
            <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

            <View style={styles.imageWrapper}>
              <Image
                source={item.image}
                style={{ width: item.imageSize, height: item.imageSize }}
                resizeMode="contain"
              />
            </View>
          </Animated.View>
        </View>
      );
    },
    [scrollX]
  );

  // Dots: the active "pill" glides between positions 1 -> 3 -> 5 as you swipe
  const renderDots = () => {
    return (
      <View style={styles.dotContainer}>
        {Array.from({ length: TOTAL_DOTS }).map((_, dotIndex) => {
          // Which slide (if any) activates this dot: dot 0 -> slide 0, dot 2 -> slide 1, dot 4 -> slide 2
          const owningSlide = dotIndex % 2 === 0 ? dotIndex / 2 : -1;

          if (owningSlide === -1) {
            return <View key={dotIndex} style={[styles.dot, styles.dotInactive]} />;
          }

          const inputRange = [
            (owningSlide - 1) * width,
            owningSlide * width,
            (owningSlide + 1) * width,
          ];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [DOT_SIZE, DOT_ACTIVE_WIDTH, DOT_SIZE],
            extrapolate: 'clamp',
          });
          const dotColor = scrollX.interpolate({
            inputRange,
            outputRange: [DotInactive, Teal, DotInactive],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={dotIndex}
              style={[styles.dot, { width: dotWidth, backgroundColor: dotColor }]}
            />
          );
        })}
      </View>
    );
  };

  if (showSplash) {
    return (
      <Animated.View
        style={[
          styles.splashContainer,
          { opacity: splashOpacity, transform: [{ scale: splashScale }] },
        ]}
      >
        <SafeAreaView style={styles.splashSafeArea}>
          <Animated.View
            style={[
              styles.splashMascotWrapper,
              { transform: [{ translateY: bounceInterpolate }] },
            ]}
          >
            <Image
              source={require('../../../../assets/mascot/mascot_cap_thumbsup.jpg')}
              style={styles.splashMascotImage}
              resizeMode="contain"
            />
          </Animated.View>

          <Image
            source={require('../../../../assets/brand/logo_wordmark.jpg')}
            style={styles.splashLogo}
            resizeMode="contain"
          />

          <Text style={styles.splashTagline}>{AppStrings.tagline}</Text>
        </SafeAreaView>
      </Animated.View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.skipButton}
        onPress={handleSkip}
        activeOpacity={0.7}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
      >
        <Text style={styles.skipButtonText}>Bỏ qua</Text>
      </TouchableOpacity>

      <Animated.View
        style={[styles.flatListWrapper, { opacity: contentOpacity }]}
      >
        <FlatList
          ref={flatListRef}
          data={slides}
          renderItem={renderSlide}
          keyExtractor={(item) => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          snapToInterval={width}
          decelerationRate="fast"
          bounces={false}
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          initialScrollIndex={0}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </Animated.View>

      <View style={styles.footer}>
        {renderDots()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    backgroundColor: White,
  },
  splashSafeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  splashMascotWrapper: {
    marginBottom: 4,
  },
  splashMascotImage: {
    width: 230,
    height: 230,
  },
  splashLogo: {
    width: 210,
    height: 62,
    marginBottom: 2,
  },
  splashTagline: {
    fontSize: 15,
    color: Teal,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 22,
  },
  container: {
    flex: 1,
    backgroundColor: White,
  },
  flatListWrapper: {
    flex: 1,
  },
  skipButton: {
    position: 'absolute',
    top: 14,
    right: 20,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: 15,
    color: SkipGray,
    fontStyle: 'italic',
    fontWeight: '400',
  },
  slide: {
    width,
    flex: 1,
  },
  slideInner: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 72,
  },
  slideTitle: {
    fontSize: 21,
    fontWeight: '700',
    color: Teal,
    textAlign: 'center',
    lineHeight: 30,
    marginBottom: 10,
  },
  slideSubtitle: {
    fontSize: 14,
    color: SubtitleGray,
    textAlign: 'center',
    lineHeight: 21,
  },
  imageWrapper: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 28,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    height: DOT_SIZE,
    width: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
  },
  dotInactive: {
    backgroundColor: DotInactive,
  },
  buttonSlot: {
    height: 52,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    minWidth: width * 0.55,
    backgroundColor: Teal,
    paddingVertical: 14,
    paddingHorizontal: 36,
    borderRadius: 9999,
    alignItems: 'center',
    shadowColor: TealDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: White,
  },
});