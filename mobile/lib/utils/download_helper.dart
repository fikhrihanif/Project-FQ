import 'package:flutter/foundation.dart';
// ignore: avoid_web_libraries_in_flutter
import 'dart:html' as html;

void downloadApkFile() {
  if (kIsWeb) {
    html.window.open('/app-release.apk', '_blank');
  }
}
