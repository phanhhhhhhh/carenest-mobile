import 'package:flutter/material.dart';
import 'core/theme/app_theme.dart';

class CareNestApp extends StatelessWidget {
  const CareNestApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'CareNest',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light,
      home: const Scaffold(
        body: Center(
          child: Text('CareNest — Coming Soon'),
        ),
      ),
    );
  }
}
