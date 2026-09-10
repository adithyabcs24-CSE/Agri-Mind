import 'package:flutter/material.dart';
import '../models/models.dart';
import '../services/api_service.dart';

class AuthProvider extends ChangeNotifier {
  User? _user;
  bool _isLoading = false;

  User? get user => _user;
  bool get isAuthenticated => _user != null;
  bool get isLoading => _isLoading;

  Future<void> checkAuth() async {
    _isLoading = true;
    notifyListeners();
    try {
      await ApiService.init();
      _user = await ApiService.getMe();
    } catch (e) {
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> login(String email, String password) async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await ApiService.login(email, password);
    } catch (e) {
      _user = null;
      rethrow;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> logout() async {
    await ApiService.clearToken();
    _user = null;
    notifyListeners();
  }
}

class FarmProvider extends ChangeNotifier {
  List<Farm> _farms = [];
  List<Field> _fields = [];
  Farm? _selectedFarm;
  Field? _selectedField;
  CropCycle? _activeCycle;
  bool _isLoading = false;

  List<Farm> get farms => _farms;
  List<Field> get fields => _fields;
  Farm? get selectedFarm => _selectedFarm;
  Field? get selectedField => _selectedField;
  CropCycle? get activeCycle => _activeCycle;
  bool get isLoading => _isLoading;

  Future<void> loadFarms() async {
    _isLoading = true;
    notifyListeners();
    try {
      _farms = await ApiService.getFarms();
      if (_farms.isNotEmpty) {
        _selectedFarm = _farms.first;
        await loadFields(_farms.first.id);
      }
    } catch (e) {
      print('Load farms error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadFields(String farmId) async {
    _isLoading = true;
    notifyListeners();
    try {
      _fields = await ApiService.getFields(farmId);
      if (_fields.isNotEmpty) {
        _selectedField = _fields.first;
        await loadActiveCycle(_fields.first.id);
      } else {
        _selectedField = null;
        _activeCycle = null;
      }
    } catch (e) {
      print('Load fields error: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadActiveCycle(String fieldId) async {
    try {
      _activeCycle = await ApiService.getActiveCycle(fieldId);
    } catch (e) {
      _activeCycle = null;
      print('Load active cycle error: $e');
    }
    notifyListeners();
  }

  void selectFarm(Farm farm) {
    _selectedFarm = farm;
    loadFields(farm.id);
  }

  void selectField(Field field) {
    _selectedField = field;
    loadActiveCycle(field.id);
  }
}

class LanguageProvider extends ChangeNotifier {
  String _locale = 'en';

  String get locale => _locale;

  void setLocale(String langCode) {
    _locale = langCode;
    notifyListeners();
  }
}

class ThemeProvider extends ChangeNotifier {
  ThemeMode _themeMode = ThemeMode.light;

  ThemeMode get themeMode => _themeMode;
  bool get isDarkMode => _themeMode == ThemeMode.dark;

  void toggleTheme(bool isDark) {
    _themeMode = isDark ? ThemeMode.dark : ThemeMode.light;
    notifyListeners();
  }
}
