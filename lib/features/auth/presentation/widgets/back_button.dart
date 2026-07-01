import 'package:flutter/material.dart';
import '../../../../core/constants/app_colors.dart';

/// Gray circle back button matching the Miro design reference.
class CircleBackButton extends StatelessWidget {
  final VoidCallback onPressed;
  const CircleBackButton({super.key, required this.onPressed});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onPressed,
      child: Container(
        width: 40,
        height: 40,
        decoration: BoxDecoration(
          color: Colors.grey.shade100,
          shape: BoxShape.circle,
        ),
        child: const Icon(
          Icons.chevron_left_rounded,
          color: AppColors.textSecondary,
          size: 24,
        ),
      ),
    );
  }
}
