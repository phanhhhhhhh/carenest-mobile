import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Animated,
  Dimensions,
  Image,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../core/navigation/AppNavigator';
import { AppStrings } from '../../../core/constants/strings';
import {
  DOT_ACTIVE_WIDTH,
  DOT_SIZE,
  DotInactive,
  TOTAL_DOTS,
  Teal,
  slides,
  type SlideData,
} from './welcome/slides';
import { styles } from './welcome/styles';

const { width } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export default function WelcomeScreen() {
  const navigation = useNavigation<NavigationProp>();
  const [showSplash, setShowSplash] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentIndexRef = useRef(0);
  const flatListRef = useRef<FlatList<SlideData>>(null);

  const updateIndex = useCallback((offsetX: number) => {
    const idx = Math.max(0, Math.min(slides.length - 1, Math.round(offsetX / width)));
    if (idx !== currentIndexRef.current) {
      currentIndexRef.current = idx;
      setCurrentIndex(idx);
    }
  }, []);

  const splashOpacity = useRef(new Animated.Value(1)).current;
  const splashScale = useRef(new Animated.Value(1)).current;
  const mascotBounce = useRef(new Animated.Value(0)).current;
  const contentOpacity = useRef(new Animated.Value(0)).current;

  // Tracks horizontal scroll offset so dots & buttons animate while dragging
  const scrollX = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(mascotBounce, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(mascotBounce, { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
      { iterations: 2 },
    ).start();

    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(splashOpacity, { toValue: 0, duration: 400, useNativeDriver: true }),
        Animated.timing(splashScale, { toValue: 0.95, duration: 400, useNativeDriver: true }),
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

  const onScroll = Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
    useNativeDriver: false,
    // onMomentumScrollEnd never fires on react-native-web, so the current
    // index is derived here -- onScroll works everywhere.
    listener: (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateIndex(e.nativeEvent.contentOffset.x);
    },
  });

  // Kept as a native fallback; harmless duplicate of the onScroll listener.
  const onMomentumScrollEnd = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      updateIndex(e.nativeEvent.contentOffset.x);
    },
    [updateIndex],
  );

  const handleSkip = useCallback(() => {
    // Update state immediately: programmatic scrolls don't reliably fire
    // scroll events on every platform before the animation settles.
    currentIndexRef.current = slides.length - 1;
    setCurrentIndex(slides.length - 1);
    flatListRef.current?.scrollToIndex({ index: slides.length - 1, animated: true });
  }, []);

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
            style={[styles.slideInner, { opacity: slideOpacity, transform: [{ translateX }] }]}
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
    [scrollX],
  );

  // Dots: the active "pill" glides between positions 1 -> 3 -> 5 as you swipe
  const renderDots = () => (
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
            style={[styles.splashMascotWrapper, { transform: [{ translateY: bounceInterpolate }] }]}
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

  // Two buttons fade in on the last slide
  const lastSlideButtonsOpacity = scrollX.interpolate({
    inputRange: [(slides.length - 2) * width, (slides.length - 1) * width],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const lastSlideButtonsTranslateY = scrollX.interpolate({
    inputRange: [(slides.length - 2) * width, (slides.length - 1) * width],
    outputRange: [16, 0],
    extrapolate: 'clamp',
  });
  const isLastSlide = currentIndex === slides.length - 1;

  return (
    <SafeAreaView style={styles.container}>
      {/* "Bỏ qua" chỉ hiện khi chưa ở trang cuối */}
      {!isLastSlide && (
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Text style={styles.skipButtonText}>Bỏ qua</Text>
        </TouchableOpacity>
      )}

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
          onScroll={onScroll}
          scrollEventThrottle={16}
          onMomentumScrollEnd={onMomentumScrollEnd}
          initialScrollIndex={0}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
        />
      </Animated.View>

      <View style={styles.footer}>
        {renderDots()}

        <View style={styles.buttonSlot} pointerEvents={isLastSlide ? 'auto' : 'none'}>
          <Animated.View
            style={[
              styles.buttonGroup,
              {
                opacity: lastSlideButtonsOpacity,
                transform: [{ translateY: lastSlideButtonsTranslateY }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('Register')}
              activeOpacity={0.85}
            >
              <Text style={styles.primaryButtonLabel}>Bắt đầu ngay →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.navigate('Phone')}
              activeOpacity={0.85}
            >
              <Text style={styles.secondaryButtonLabel}>Đăng nhập</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    </SafeAreaView>
  );
}
