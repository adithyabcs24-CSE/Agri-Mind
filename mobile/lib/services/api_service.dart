import 'dart:convert';
import 'dart:io';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';

class ApiService {
  // Use 10.0.2.2 for Android emulator loopback, localhost for iOS
  static final String baseUrl = Platform.isAndroid 
      ? 'http://10.0.2.2:8000/api/v1' 
      : 'http://localhost:8000/api/v1';

  static String? _token;

  static Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _token = prefs.getString('token');
  }

  static Future<void> saveToken(String token) async {
    _token = token;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('token', token);
  }

  static Future<void> clearToken() async {
    _token = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove('token');
  }

  static Map<String, String> get _headers => {
        'Content-Type': 'application/json',
        if (_token != null) 'Authorization': 'Bearer $_token',
      };

  static Future<User> login(String email, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'email': email, 'password': password}),
    );

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      await saveToken(data['access_token'] as String);
      return getMe();
    } else {
      throw Exception(jsonDecode(response.body)['detail'] ?? 'Login failed');
    }
  }

  static Future<User> getMe() async {
    final response = await http.get(
      Uri.parse('$baseUrl/auth/me'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      return User.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to fetch user profile');
    }
  }

  static Future<List<Farm>> getFarms() async {
    final response = await http.get(
      Uri.parse('$baseUrl/farms/'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((f) => Farm.fromJson(f)).toList();
    } else {
      throw Exception('Failed to load farms');
    }
  }

  static Future<List<Field>> getFields(String farmId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/farms/$farmId/fields'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((f) => Field.fromJson(f)).toList();
    } else {
      throw Exception('Failed to load fields');
    }
  }

  static Future<CropCycle?> getActiveCycle(String fieldId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/farms/fields/$fieldId/active-cycle'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      return CropCycle.fromJson(jsonDecode(response.body));
    } else if (response.statusCode == 404) {
      return null;
    } else {
      throw Exception('Failed to load active crop cycle');
    }
  }

  static Future<CropHealthRecord> analyzeCropHealth(String fieldId, File imageFile) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/crop-health/analyze'),
    );
    if (_token != null) {
      request.headers['Authorization'] = 'Bearer $_token';
    }
    request.fields['field_id'] = fieldId;
    request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      // CropHealthRecord can parse health score, ndvi, status, etc.
      // In the frontend, the response schema maps to CropHealthResult. We will parse it.
      final data = jsonDecode(response.body);
      return CropHealthRecord(
        healthScore: (data['health_score'] as num).toDouble(),
        ndvi: (data['ndvi'] as num?)?.toDouble() ?? 0.0,
        status: data['status'] as String,
        growthStage: data['growth_stage'] as String,
        recommendations: List<String>.from(data['recommendations'] as List? ?? []),
      );
    } else {
      throw Exception('Crop health image analysis failed');
    }
  }

  static Future<DiseaseDetection> detectDisease(String cropCycleId, File imageFile) async {
    final request = http.MultipartRequest(
      'POST',
      Uri.parse('$baseUrl/disease/detect'),
    );
    if (_token != null) {
      request.headers['Authorization'] = 'Bearer $_token';
    }
    request.fields['crop_cycle_id'] = cropCycleId;
    request.files.add(await http.MultipartFile.fromPath('file', imageFile.path));

    final streamedResponse = await request.send();
    final response = await http.Response.fromStream(streamedResponse);

    if (response.statusCode == 200) {
      return DiseaseDetection.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Disease scanner image detection failed');
    }
  }

  static Future<SoilAnalysis> analyzeSoil(Map<String, dynamic> soilData) async {
    final response = await http.post(
      Uri.parse('$baseUrl/soil/analyze'),
      headers: _headers,
      body: jsonEncode(soilData),
    );

    if (response.statusCode == 200) {
      return SoilAnalysis.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Soil analysis diagnostics failed');
    }
  }

  static Future<WaterPrediction> getWaterRequirement(String fieldId) async {
    final response = await http.get(
      Uri.parse('$baseUrl/water/predict/$fieldId'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      return WaterPrediction.fromJson(jsonDecode(response.body));
    } else {
      throw Exception('Failed to load water prediction');
    }
  }

  static Future<List<Alert>> getAlerts({bool unreadOnly = false}) async {
    final response = await http.get(
      Uri.parse('$baseUrl/alerts/?unread_only=$unreadOnly'),
      headers: _headers,
    );

    if (response.statusCode == 200) {
      final List data = jsonDecode(response.body);
      return data.map((a) => Alert.fromJson(a)).toList();
    } else {
      throw Exception('Failed to fetch alerts');
    }
  }

  static Future<void> markAlertAsRead(String alertId) async {
    final response = await http.patch(
      Uri.parse('$baseUrl/alerts/$alertId/read'),
      headers: _headers,
    );

    if (response.statusCode != 200) {
      throw Exception('Failed to mark alert as read');
    }
  }

  static Future<String> askAssistant(String query, {String? fieldId, String language = 'en'}) async {
    final response = await http.post(
      Uri.parse('$baseUrl/assistant/query'),
      headers: _headers,
      body: jsonEncode({
        'query': query,
        if (fieldId != null) 'field_id': fieldId,
        'language': language,
      }),
    );

    if (response.statusCode == 200) {
      return jsonDecode(response.body)['answer'] as String;
    } else {
      throw Exception('AI Assistant error');
    }
  }
}

// Custom model for crop health analysis responses
class CropHealthRecord {
  final double healthScore;
  final double ndvi;
  final String status;
  final String growthStage;
  final List<String> recommendations;

  CropHealthRecord({
    required this.healthScore,
    required this.ndvi,
    required this.status,
    required this.growthStage,
    required this.recommendations,
  });
}
