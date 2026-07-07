import 'package:flutter/foundation.dart' show kIsWeb;
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';
import 'app.dart';
import 'core/services/fcm_service.dart';
import 'features/medication/services/medication_reminder_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await dotenv.load(fileName: '.env');
  if (!kIsWeb) {
    await Firebase.initializeApp();
    await FcmService.instance.initialize();
    await MedicationReminderService.instance.initialize();
  }
  runApp(const ProviderScope(child: CareNestApp()));
}
