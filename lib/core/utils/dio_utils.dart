/// Helper functions to safely parse Dio response data on web.
///
/// On Flutter web, Dio returns JS interop types (JsArray, JsObject) that
/// cannot be directly cast to Dart List/Map. The spread operator `[...]`
/// and `{...}` are used because they ALWAYS produce native Dart collections,
/// even on web.
List<dynamic> asList(dynamic data) {
  if (data == null) return <dynamic>[];
  if (data is List) return [...data];
  return <dynamic>[];
}

Map<String, dynamic> asMap(dynamic data) {
  if (data == null) return <String, dynamic>{};
  if (data is Map) return {...data.cast<String, dynamic>()};
  return <String, dynamic>{};
}

List<Map<String, dynamic>> asListOfMaps(dynamic data) {
  if (data == null) return <Map<String, dynamic>>[];
  if (data is List) {
    return [...data.map((e) {
      if (e is Map) return {...e.cast<String, dynamic>()};
      return <String, dynamic>{};
    })];
  }
  return <Map<String, dynamic>>[];
}
