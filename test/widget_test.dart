import 'package:flutter_test/flutter_test.dart';
import 'package:carenest_mobile/app.dart';

void main() {
  testWidgets('CareNest app smoke test', (WidgetTester tester) async {
    await tester.pumpWidget(const CareNestApp());
    expect(find.text('CareNest — Coming Soon'), findsOneWidget);
  });
}
