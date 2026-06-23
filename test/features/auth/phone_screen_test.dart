import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:carenest_mobile/features/auth/presentation/providers/auth_provider.dart';
import 'package:carenest_mobile/features/auth/presentation/screens/phone_screen.dart';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/// A do-nothing notifier used to prevent real Dio/Firebase calls in tests.
class _FakePhoneNotifier extends StateNotifier<PhoneState>
    implements PhoneNotifier {
  _FakePhoneNotifier(super.state);

  // ignore: avoid_renaming_method_parameters
  @override
  Future<void> sendOtp(String phoneNumber) async {}

  // ignore: avoid_renaming_method_parameters
  @override
  Future<void> loginDev(String phoneNumber) async {}
}

/// Builds [PhoneScreen] inside a minimal widget tree that satisfies its deps:
/// - ProviderScope with a stubbed [phoneProvider] so no real Dio/Firebase calls
///   are made.
/// - MaterialApp so [Theme], [Directionality], and [Navigator] are available.
///   GoRouter is NOT needed because we never trigger navigation in these tests.
Widget _buildSubject({PhoneState initialState = const PhoneState()}) {
  return ProviderScope(
    overrides: [
      phoneProvider.overrideWith(
        (ref) => _FakePhoneNotifier(initialState),
      ),
    ],
    child: const MaterialApp(
      home: PhoneScreen(),
    ),
  );
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

void main() {
  group('PhoneScreen', () {
    testWidgets('renders greeting text and phone input field',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildSubject());

      // Greeting text visible
      expect(find.text('Xin chào!'), findsOneWidget);

      // Phone input label present
      expect(find.text('Số điện thoại'), findsOneWidget);

      // OTP button present
      expect(find.text('Gửi mã OTP'), findsOneWidget);
    });

    testWidgets('shows validation error when submitting empty phone number',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildSubject());

      // Tap the OTP button without entering a phone number
      await tester.tap(find.text('Gửi mã OTP'));
      await tester.pump();

      // Validator should surface an error message
      expect(find.text('Vui lòng nhập số điện thoại'), findsOneWidget);
    });

    testWidgets('shows validation error for invalid phone number',
        (WidgetTester tester) async {
      await tester.pumpWidget(_buildSubject());

      // Enter an obviously invalid number
      await tester.enterText(find.byType(TextFormField), '123');
      await tester.tap(find.text('Gửi mã OTP'));
      await tester.pump();

      expect(find.text('Số điện thoại không hợp lệ'), findsOneWidget);
    });

    testWidgets('shows error banner when state.error is set',
        (WidgetTester tester) async {
      const errorMessage =
          'Firebase Phone Auth không hỗ trợ trên web. Dùng DEV mode.';
      await tester.pumpWidget(
        _buildSubject(
          initialState: const PhoneState(error: errorMessage),
        ),
      );

      expect(find.text(errorMessage), findsOneWidget);
    });

    testWidgets('shows CircularProgressIndicator while loading',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        _buildSubject(
          initialState: const PhoneState(isLoading: true),
        ),
      );

      // When loading the text button child is replaced by a spinner.
      expect(find.byType(CircularProgressIndicator), findsOneWidget);

      // At least one ElevatedButton must be disabled (onPressed == null).
      final elevatedButtons = tester.widgetList<ElevatedButton>(
        find.byType(ElevatedButton),
      );
      expect(
        elevatedButtons.any((b) => b.onPressed == null),
        isTrue,
        reason: 'At least one ElevatedButton should be disabled while loading',
      );
    });
  });
}
