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
import { Colors, Typography, Spacing, BorderRadius } from '../../../core/theme';
import { AppStrings } from '../../../core/constants/strings';

const { width, height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// ── Slide data ───────────────────────────────────────────────────────────────

interface SlideData {
  id: string;
  title: string;
  subtitle: string;
  mascotImage: ImageSourcePropType;
  isFinal: boolean;
}

const slides: SlideData[] = [
  {
    id: '1',
    title: 'Chăm s\xf3c sức khỏe từ xa\nmọi l\xfac, mọi nơi',
    subtitle:
      'Kết nối v\xe0 theo d\xf5i sức khỏe\nngười th\xe2n dễ d\xe0ng qua ứng dụng',
    mascotImage: require('../../../../assets/mascot/mascot_dashboard.jpg'),
    isFinal: false,
  },
  {
    id: '2',
    title: 'Đa tiện \xedch chăm s\xf3c sức khỏe',
    subtitle:
      'Quản l\xfd thuốc, lịch hẹn v\xe0 c\xe1c\nchỉ số sức khỏe to\xe0n diện',
    mascotImage: require('../../../../assets/icons/health_icon_grid.jpg'),
    isFinal: false,
  },
  {
    id: '3',
    title: 'Chủ động theo d\xf5i\nsức khỏe mỗi ng\xe0y',
    subtitle:
      'Nhận th\xf4ng b\xe1o v\xe0 b\xe1o c\xe1o\nsức khỏe chi tiết h\xe0ng ng\xe0y',
    mascotImage: require('../../../../assets/mascot/mascot_bigphone.jpg'),
    isFinal: false,
  },
  {
    id: '4',
    title: 'Chủ động theo d\xf5i\nsức khỏe mỗi ng\xe0y',
    subtitle:
      'Nhận th\xf4ng b\xe1o v\xe0 b\xe1o c\xe1o\nsức khỏe chi tiết h\xe0ng ng\xe0y',
    mascotImage: require('../../../../assets/mascot/mascot_notifications.jpg'),
    isFinal: true,
  },
];

// ── Component ────────────────────────────────────────────────────────────────

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showSplash, setShowSplash] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);

  // Animation values
  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(1)).current;
  const mascotBounce = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // ── Splash timer & transition ─────────────────────────────────────────
  useEffect(() => {
    // Mascot bounce animation during splash
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
    }, 2000);

    return () => clearTimeout(timer);
  }, [splashOpacity, splashScale, mascotBounce, contentOpacity]);

  // ── FlatList pagination ───────────────────────────────────────────────
  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const index = Math.round(e.nativeEvent.contentOffset.x / width);
      setCurrentIndex(index);
    },
    []
  );

  // ── Navigation handlers ───────────────────────────────────────────────
  const handleNext = useCallback(() => {
    if (currentIndex < slides.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  }, [currentIndex]);

  const handleSkip = useCallback(() => {
    flatListRef.current?.scrollToIndex({
      index: slides.length - 1,
      animated: true,
    });
  }, []);

  // ── Render helpers ────────────────────────────────────────────────────
  const bounceInterpolate = mascotBounce.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -8],
  });

  const renderSlide = useCallback(
    ({ item, index }: ListRenderItemInfo<SlideData>) => {
      return (
        <View style={styles.slide}>
          {/* Mascot / illustration area */}
          <View style={styles.mascotWrapper}>
            <Image
              source={item.mascotImage}
              style={styles.mascotImage}
              resizeMode="contain"
            />
          </View>

          {/* Title */}
          <Text style={styles.slideTitle}>{item.title}</Text>

          {/* Subtitle */}
          <Text style={styles.slideSubtitle}>{item.subtitle}</Text>

          {/* Action button(s) */}
          <View style={styles.buttonContainer}>
            {index === 0 && (
              <TouchableOpacity
                style={styles.textButton}
                onPress={handleNext}
                activeOpacity={0.7}
              >
                <Text style={styles.textButtonLabel}>
                  Tiếp tục →
                </Text>
              </TouchableOpacity>
            )}

            {(index === 1 || index === 2) && (
              <TouchableOpacity
                style={styles.primaryButton}
                onPress={handleNext}
                activeOpacity={0.8}
              >
                <Text style={styles.primaryButtonLabel}>
                  Kh\xe1m ph\xe1 ngay
                </Text>
              </TouchableOpacity>
            )}

            {item.isFinal && (
              <View style={styles.finalButtonGroup}>
                <TouchableOpacity
                  style={styles.primaryButton}
                  onPress={() => navigation.navigate('Register')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.primaryButtonLabel}>
                    Bắt đầu ngay
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.secondaryButton}
                  onPress={() => navigation.navigate('Phone')}
                  activeOpacity={0.8}
                >
                  <Text style={styles.secondaryButtonLabel}>
                    Đăng nhập
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      );
    },
    [handleNext, navigation]
  );

  const renderDots = useCallback(() => {
    return (
      <View style={styles.dotContainer}>
        {slides.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              {
                backgroundColor:
                  index === currentIndex ? Colors.primary : Colors.textHint,
                width: index === currentIndex ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>
    );
  }, [currentIndex]);

  // ── Splash screen ─────────────────────────────────────────────────────
  if (showSplash) {
    return (
      <Animated.View
        style={[
          styles.splashContainer,
          { opacity: splashOpacity, transform: [{ scale: splashScale }] },
        ]}
      >
        <SafeAreaView style={styles.splashSafeArea}>
          {/* Mascot image with bounce animation */}
          <Animated.View
            style={[
              styles.splashMascotWrapper,
              { transform: [{ translateY: bounceInterpolate }] },
            ]}
          >
            <Image
              source={require('../../../../assets/mascot/mascot_thumbsup.jpg')}
              style={styles.splashMascotImage}
              resizeMode="contain"
            />
          </Animated.View>

          {/* App logo / name — dùng wordmark thật thay vì text render tay */}
          <Image
            source={require('../../../../assets/brand/logo_wordmark.jpg')}
            style={styles.splashLogo}
            resizeMode="contain"
          />

          {/* Tagline */}
          <Text style={styles.splashTagline}>
            {AppStrings.tagline}
          </Text>
        </SafeAreaView>
      </Animated.View>
    );
  }

  // ── Onboarding screens ────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container}>
      {/* Skip button (hidden on last slide) */}
      {currentIndex < slides.length - 1 && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Bỏ qua</Text>
        </TouchableOpacity>
      )}

      {/* Onboarding slides */}
      <Animated.View style={[styles.flatListWrapper, { opacity: contentOpacity }]}>
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
          onMomentumScrollEnd={onMomentumScrollEnd}
          initialScrollIndex={0}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
        />
      </Animated.View>

      {/* Dot indicators */}
      {renderDots()}
    </SafeAreaView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Splash ────────────────────────────────────────────────────────────
  splashContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  splashSafeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
  },
  splashMascotWrapper: {
    marginBottom: 8,
  },
  splashMascotImage: {
    width: 200,
    height: 200,
  },
  splashLogo: {
    width: 200,
    height: 60,
    marginBottom: 4,
  },
  splashTagline: {
    fontSize: Typography.button.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },

  // ── Onboarding ────────────────────────────────────────────────────────
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  flatListWrapper: {
    flex: 1,
  },

  // ── Skip button ───────────────────────────────────────────────────────
  skipButton: {
    position: 'absolute',
    top: 12,
    right: 20,
    zIndex: 10,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  skipButtonText: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // ── Slide ─────────────────────────────────────────────────────────────
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xxxl,
    paddingBottom: 80,
  },

  // ── Mascot illustration ───────────────────────────────────────────────
  mascotWrapper: {
    marginBottom: 32,
    alignItems: 'center',
  },
  mascotImage: {
    width: 240,
    height: 240,
  },

  // ── Slide text ────────────────────────────────────────────────────────
  slideTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    lineHeight: 34,
    marginBottom: Spacing.md,
  },
  slideSubtitle: {
    fontSize: Typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: Typography.body.lineHeight,
    marginBottom: 40,
  },

  // ── Dot indicators ────────────────────────────────────────────────────
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 48,
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 0,
  },

  // ── Buttons ───────────────────────────────────────────────────────────
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },

  textButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  textButtonLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },

  primaryButton: {
    width: '100%',
    backgroundColor: Colors.primary,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    shadowColor: Colors.primaryDark,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  primaryButtonLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.surface,
  },

  secondaryButton: {
    width: '100%',
    backgroundColor: Colors.surface,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginTop: 14,
  },
  secondaryButtonLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.primary,
  },

  // ── Final slide button group ──────────────────────────────────────────
  finalButtonGroup: {
    width: '100%',
    alignItems: 'center',
  },
});
