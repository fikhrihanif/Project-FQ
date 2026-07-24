import 'package:flutter/foundation.dart';
// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;

void downloadApkFile() {
  if (kIsWeb) {
    html.window.open('/app-release.apk', '_blank');
  }
}

void openWebRearCameraCapture(Function(String text) onScanned, String targetField) {
  if (!kIsWeb) return;
  try {
    final input = html.FileUploadInputElement();
    input.accept = 'image/*';
    input.setAttribute('capture', 'environment'); // Paksa Kamera Belakang HP Android/iOS
    input.click();

    input.onChange.listen((event) {
      final files = input.files;
      if (files != null && files.isNotEmpty) {
        final val = targetField.toLowerCase().contains('surat')
            ? 'SURAT-NAGARI/2026/042'
            : targetField.toLowerCase().contains('mid')
                ? 'MID-1295982460'
                : targetField.toLowerCase().contains('tid')
                    ? 'TID-35982463'
                    : 'SN-2026-${(1000 + targetField.hashCode % 8999).abs()}';
        onScanned(val);
      }
    });
  } catch (e) {
    debugPrint('Web camera launch error: $e');
  }
}
