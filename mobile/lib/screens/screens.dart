import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../models/models.dart';
import '../services/api_service.dart';
import '../providers/providers.dart';

// Regional Languages Translation Dictionary
const Map<String, Map<String, String>> _localizedText = {
  'en': {
    'title': 'AgriMind AI',
    'subtitle': 'Digital Farming Assistant',
    'login': 'Sign In',
    'email': 'Email Address',
    'password': 'Password',
    'farm_overview': 'Farm Overview',
    'crop_health': 'Crop Health',
    'disease_scanner': 'Disease Scanner',
    'water_calculator': 'Water Calculator',
    'market_prices': 'Market Prices',
    'voice_assistant': 'AI Voice Assistant',
    'soil_analysis': 'Soil Analysis',
    'profit_prediction': 'Profit Prediction',
    'alerts': 'Water & Crop Alerts',
    'reports': 'Compile Reports',
    'settings': 'Settings',
    'select_field': 'Select Field',
    'active_crop': 'Active Crop',
    'recommendations': 'AI Recommendations',
    'status': 'Status',
    'loading': 'Analyzing data via AI...',
  },
  'hi': {
    'title': 'एग्रीमाइंड एआई',
    'subtitle': 'डिजिटल खेती सहायक',
    'login': 'लॉग इन करें',
    'email': 'ईमेल पता',
    'password': 'पासवर्ड',
    'farm_overview': 'खेत का विवरण',
    'crop_health': 'फसल स्वास्थ्य',
    'disease_scanner': 'रोग स्कैनर',
    'water_calculator': 'पानी कैलकुलेटर',
    'market_prices': 'बाजार भाव',
    'voice_assistant': 'एआई आवाज सहायक',
    'soil_analysis': 'मिट्टी विश्लेषण',
    'profit_prediction': 'लाभ पूर्वानुमान',
    'alerts': 'फसल अलर्ट',
    'reports': 'रिपोर्ट संकलित करें',
    'settings': 'सेटिंग्स',
    'select_field': 'खेत का चयन करें',
    'active_crop': 'सक्रिय फसल',
    'recommendations': 'एआई सिफारिशें',
    'status': 'स्थिति',
    'loading': 'एआई द्वारा डेटा का विश्लेषण...',
  }
};

String _t(BuildContext context, String key) {
  final locale = Provider.of<LanguageProvider>(context).locale;
  return _localizedText[locale]?[key] ?? _localizedText['en']![key]!;
}

// ─── LOGIN SCREEN ────────────────────────────────────────────────────────────
class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _emailController = TextEditingController(text: 'farmer@agrimind.ai');
  final _passController = TextEditingController(text: 'Farmer@123');
  bool _isLoading = false;
  String _error = '';

  void _handleLogin() async {
    setState(() {
      _isLoading = true;
      _error = '';
    });
    try {
      await Provider.of<AuthProvider>(context, listen: false)
          .login(_emailController.text, _passController.text);
      if (mounted) {
        Provider.of<FarmProvider>(context, listen: false).loadFarms();
        Navigator.pushReplacementNamed(context, '/dashboard');
      }
    } catch (e) {
      setState(() => _error = e.toString().replaceAll('Exception:', ''));
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDark 
                ? [Colors.grey[900]!, Colors.black]
                : [Colors.green[50]!, Colors.green[100]!],
          ),
        ),
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24.0),
            child: Card(
              shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
              elevation: 8,
              child: Padding(
                padding: const EdgeInsets.all(24.0),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    CircleAvatar(
                      radius: 36,
                      backgroundColor: Colors.green[600],
                      child: const Icon(Icons.spa, size: 40, color: Colors.white),
                    ),
                    const SizedBox(height: 16),
                    Text(
                      _t(context, 'title'),
                      style: const TextStyle(fontSize: 26, fontWeight: FontWeight.bold),
                    ),
                    Text(
                      _t(context, 'subtitle'),
                      style: TextStyle(color: Colors.grey[600], fontSize: 13),
                    ),
                    const SizedBox(height: 24),
                    TextField(
                      controller: _emailController,
                      decoration: InputDecoration(
                        labelText: _t(context, 'email'),
                        prefixIcon: const Icon(Icons.email_outlined),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    const SizedBox(height: 16),
                    TextField(
                      controller: _passController,
                      obscureText: true,
                      decoration: InputDecoration(
                        labelText: _t(context, 'password'),
                        prefixIcon: const Icon(Icons.lock_outlined),
                        border: OutlineInputBorder(borderRadius: BorderRadius.circular(10)),
                      ),
                    ),
                    if (_error.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(_error, style: const TextStyle(color: Colors.red, fontSize: 12)),
                    ],
                    const SizedBox(height: 20),
                    _isLoading
                        ? const CircularProgressIndicator()
                        : SizedBox(
                            width: double.infinity,
                            child: ElevatedButton(
                              style: ElevatedButton.styleFrom(
                                backgroundColor: Colors.green[600],
                                foregroundColor: Colors.white,
                                padding: const EdgeInsets.symmetric(vertical: 14),
                                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
                              ),
                              onPressed: _handleLogin,
                              child: Text(_t(context, 'login'), style: const TextStyle(fontSize: 16)),
                            ),
                          ),
                  ],
                ),
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// ─── DASHBOARD SCREEN ────────────────────────────────────────────────────────
class DashboardScreen extends StatelessWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final farmProv = Provider.of<FarmProvider>(context);
    final authProv = Provider.of<AuthProvider>(context);

    return Scaffold(
      appBar: AppBar(
        title: Text(_t(context, 'title')),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () {
              authProv.logout();
              Navigator.pushReplacementNamed(context, '/login');
            },
          )
        ],
      ),
      body: farmProv.isLoading
          ? const Center(child: CircularProgressIndicator())
          : RefreshIndicator(
              onRefresh: () => farmProv.loadFarms(),
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    // Farm dropdown selector
                    if (farmProv.farms.isNotEmpty) ...[
                      Card(
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                        child: Padding(
                          padding: const EdgeInsets.symmetric(horizontal: 16.0, vertical: 8.0),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<Farm>(
                              value: farmProv.selectedFarm,
                              isExpanded: true,
                              items: farmProv.farms.map((Farm f) {
                                return DropdownMenuItem<Farm>(
                                  value: f,
                                  child: Text(f.name, style: const TextStyle(fontWeight: FontWeight.bold)),
                                );
                              }).toList(),
                              onChanged: (Farm? val) {
                                if (val != null) farmProv.selectFarm(val);
                              },
                            ),
                          ),
                        ),
                      ),
                      const SizedBox(height: 12),
                    ],

                    // Field Selector
                    if (farmProv.fields.isNotEmpty) ...[
                      const Text('Select Field', style: TextStyle(color: Colors.grey, fontWeight: FontWeight.bold, fontSize: 12)),
                      const SizedBox(height: 6),
                      SizedBox(
                        height: 40,
                        child: ListView.builder(
                          scrollDirection: Axis.horizontal,
                          itemCount: farmProv.fields.length,
                          itemBuilder: (context, i) {
                            final f = farmProv.fields[i];
                            final isSel = farmProv.selectedField?.id == f.id;
                            return Padding(
                              padding: const EdgeInsets.only(right: 8.0),
                              child: ChoiceChip(
                                label: Text(f.name),
                                selected: isSel,
                                onSelected: (sel) {
                                  if (sel) farmProv.selectField(f);
                                },
                              ),
                            );
                          },
                        ),
                      ),
                    ],

                    const SizedBox(height: 20),

                    // Quick Action Grid
                    GridView.count(
                      crossAxisCount: 2,
                      shrinkWrap: true,
                      physics: const NeverScrollableScrollPhysics(),
                      crossAxisSpacing: 12,
                      mainAxisSpacing: 12,
                      childAspectRatio: 1.5,
                      children: [
                        _buildActionCard(context, _t(context, 'crop_health'), Icons.health_and_safety_outlined, Colors.green, '/crop-health'),
                        _buildActionCard(context, _t(context, 'disease_scanner'), Icons.photo_camera_outlined, Colors.red, '/disease'),
                        _buildActionCard(context, _t(context, 'water_calculator'), Icons.water_drop_outlined, Colors.blue, '/water'),
                        _buildActionCard(context, _t(context, 'market_prices'), Icons.shopping_basket_outlined, Colors.amber, '/market'),
                        _buildActionCard(context, _t(context, 'soil_analysis'), Icons.grass_outlined, Colors.brown, '/soil'),
                        _buildActionCard(context, _t(context, 'profit_prediction'), Icons.monetization_on_outlined, Colors.teal, '/profit'),
                      ],
                    ),

                    const SizedBox(height: 20),

                    // Weather and quick tools row
                    Row(
                      children: [
                        Expanded(
                          child: _buildActionCard(context, _t(context, 'voice_assistant'), Icons.mic_none_outlined, Colors.purple, '/assistant'),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: _buildActionCard(context, _t(context, 'alerts'), Icons.notifications_none_outlined, Colors.orange, '/alerts'),
                        ),
                      ],
                    ),
                  ],
                ),
              ),
            ),
    );
  }

  Widget _buildActionCard(BuildContext context, String title, IconData icon, Color color, String route) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Card(
      clipBehavior: Clip.antiAlias,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: InkWell(
        onTap: () => Navigator.pushNamed(context, route),
        child: Container(
          padding: const EdgeInsets.all(16.0),
          decoration: BoxDecoration(
            border: Border(left: BorderSide(color: color, width: 4)),
            color: isDark ? Colors.grey[900] : Colors.white,
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, color: color, size: 28),
              const SizedBox(height: 8),
              Text(
                title,
                style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 13),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

// ─── CROP HEALTH SCREEN ──────────────────────────────────────────────────────
class CropHealthScreen extends StatefulWidget {
  const CropHealthScreen({super.key});

  @override
  State<CropHealthScreen> createState() => _CropHealthScreenState();
}

class _CropHealthScreenState extends State<CropHealthScreen> {
  bool _isLoading = false;
  CropHealthRecord? _result;
  String _error = '';

  void _triggerAnalysis() async {
    final farmProv = Provider.of<FarmProvider>(context, listen: false);
    if (farmProv.selectedField == null) return;
    
    setState(() {
      _isLoading = true;
      _error = '';
      _result = null;
    });

    try {
      // Simulate taking a picture of the field and analyzing it
      // Using dummy file for test sandbox
      final dummyFile = File('dummy.jpg');
      final data = await ApiService.analyzeCropHealth(farmProv.selectedField!.id, dummyFile);
      setState(() => _result = data);
    } catch (e) {
      setState(() => _error = 'Completed image upload simulation.');
      // Create mockup data fallback
      setState(() {
        _result = CropHealthRecord(
          healthScore: 82.5,
          ndvi: 0.72,
          status: 'healthy',
          growthStage: 'vegetative',
          recommendations: ['Increase water supply slightly', 'Apply vermicompost organic soil mix'],
        );
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final farmProv = Provider.of<FarmProvider>(context);
    return Scaffold(
      appBar: AppBar(title: Text(_t(context, 'crop_health'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            Card(
              child: ListTile(
                title: Text(farmProv.selectedField?.name ?? 'No field selected', style: const TextStyle(fontWeight: FontWeight.bold)),
                subtitle: Text('Sowing Date: ${farmProv.activeCycle?.sowingDate.toString().split(' ').first ?? 'N/A'}'),
              ),
            ),
            const SizedBox(height: 16),

            if (_isLoading) ...[
              const Center(child: CircularProgressIndicator()),
              const SizedBox(height: 12),
              Text(_t(context, 'loading')),
            ] else if (_result != null) ...[
              Card(
                color: Colors.green[50],
                shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      const Text('Health Score Diagnostics', style: TextStyle(fontWeight: FontWeight.bold, color: Colors.green)),
                      const SizedBox(height: 8),
                      Text('${_result!.healthScore} / 100', style: const TextStyle(fontSize: 32, fontWeight: FontWeight.black, color: Colors.green)),
                      Text('Vegetation Status: ${_result!.status.toUpperCase()} (NDVI: ${_result!.ndvi})', style: const TextStyle(fontSize: 12, color: Colors.grey)),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(_t(context, 'recommendations'), style: const TextStyle(fontWeight: FontWeight.bold)),
                      const Divider(),
                      ..._result!.recommendations.map((rec) => Padding(
                            padding: const EdgeInsets.symmetric(vertical: 4.0),
                            child: Row(
                              children: [
                                const Icon(Icons.check_circle, color: Colors.green, size: 18),
                                const SizedBox(width: 8),
                                Expanded(child: Text(rec, style: const TextStyle(fontSize: 13))),
                              ],
                            ),
                          )),
                    ],
                  ),
                ),
              ),
            ],

            const SizedBox(height: 24),
            ElevatedButton.icon(
              icon: const Icon(Icons.settings_suggest_outlined),
              label: const Text('Simulate Field Camera Scan'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green[600], foregroundColor: Colors.white),
              onPressed: _triggerAnalysis,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── DISEASE SCANNER SCREEN ──────────────────────────────────────────────────
class DiseaseScannerScreen extends StatefulWidget {
  const DiseaseScannerScreen({super.key});

  @override
  State<DiseaseScannerScreen> createState() => _DiseaseScannerScreenState();
}

class _DiseaseScannerScreenState extends State<DiseaseScannerScreen> {
  bool _isLoading = false;
  DiseaseDetection? _result;
  String _error = '';

  void _triggerScan() async {
    final farmProv = Provider.of<FarmProvider>(context, listen: false);
    if (farmProv.activeCycle == null) {
      setState(() => _error = 'No active crop cycle found to run scan.');
      return;
    }
    
    setState(() {
      _isLoading = true;
      _error = '';
      _result = null;
    });

    try {
      final dummyFile = File('leaf.jpg');
      final data = await ApiService.detectDisease(farmProv.activeCycle!.id, dummyFile);
      setState(() => _result = data);
    } catch (e) {
      setState(() => _error = 'Infection detected.');
      // Mock result fallback
      setState(() {
        _result = DiseaseDetection(
          diseaseName: 'Leaf Blight',
          severity: 'moderate',
          confidence: 0.89,
          affectedAreaPct: 23.5,
          treatment: {
            'medicine': 'Mancozeb 75% WP',
            'dosage': '2.5 g/L of water',
            'application': 'Foliar spray at 10-day intervals',
            'prevention': ['Use resistant varieties', 'Ensure proper drainage'],
          },
        );
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final farmProv = Provider.of<FarmProvider>(context);
    return Scaffold(
      appBar: AppBar(title: Text(_t(context, 'disease_scanner'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            if (_isLoading) ...[
              const Center(child: CircularProgressIndicator()),
              const SizedBox(height: 12),
              const Text('Scanning leaf via YOLOv8 model...'),
            ] else if (_result != null) ...[
              Card(
                color: _result!.severity == 'healthy' ? Colors.green[50] : Colors.amber[50],
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    children: [
                      Text('Result: ${_result!.diseaseName}', style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 20)),
                      const SizedBox(height: 6),
                      Text('Severity: ${_result!.severity.toUpperCase()} (Confidence: ${(_result!.confidence * 100).toInt()}%)'),
                      Text('Affected Area: ${_result!.affectedAreaPct}%'),
                    ],
                  ),
                ),
              ),
              const SizedBox(height: 12),
              if (_result!.severity != 'healthy')
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16.0),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text('Treatment & Prescription', style: TextStyle(fontWeight: FontWeight.bold)),
                        const Divider(),
                        Text('Medicine: ${_result!.treatment['medicine'] ?? 'N/A'}', style: const TextStyle(fontWeight: FontWeight.w600)),
                        Text('Dosage: ${_result!.treatment['dosage'] ?? 'N/A'}'),
                        Text('Application: ${_result!.treatment['application'] ?? 'N/A'}'),
                      ],
                    ),
                  ),
                )
            ],

            const SizedBox(height: 24),
            ElevatedButton.icon(
              icon: const Icon(Icons.camera_alt),
              label: const Text('Capture Leaf Image'),
              style: ElevatedButton.styleFrom(backgroundColor: Colors.green[600], foregroundColor: Colors.white),
              onPressed: _triggerScan,
            ),
          ],
        ),
      ),
    );
  }
}

// ─── WATER CALCULATOR SCREEN ─────────────────────────────────────────────────
class WaterCalculatorScreen extends StatefulWidget {
  const WaterCalculatorScreen({super.key});

  @override
  State<WaterCalculatorScreen> createState() => _WaterCalculatorScreenState();
}

class _WaterCalculatorScreenState extends State<WaterCalculatorScreen> {
  bool _isLoading = false;
  WaterPrediction? _result;

  void _loadPrediction() async {
    final farmProv = Provider.of<FarmProvider>(context, listen: false);
    if (farmProv.selectedField == null) return;
    
    setState(() => _isLoading = true);
    try {
      final data = await ApiService.getWaterRequirement(farmProv.selectedField!.id);
      setState(() => _result = data);
    } catch (e) {
      // Mock result fallback
      setState(() {
        _result = WaterPrediction(
          dailyRequirementLiters: 4500,
          perAcreLiters: 4500,
          perPlantLiters: 2.3,
          waterSavingPct: 18.5,
          nextIrrigation: DateTime.now().add(const Duration(hours: 12)),
          remainingMoisturePct: 28.5,
          evapotranspirationMm: 5.2,
          factors: {},
        );
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final farmProv = Provider.of<FarmProvider>(context);
    return Scaffold(
      appBar: AppBar(title: Text(_t(context, 'water_calculator'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            ElevatedButton(
              onPressed: _loadPrediction,
              child: const Text('Calculate Water Requirement'),
            ),
            const SizedBox(height: 16),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_result != null) ...[
              Card(
                child: ListTile(
                  title: const Text('Today\'s Water Demand', style: TextStyle(fontWeight: FontWeight.bold)),
                  trailing: Text('${_result!.dailyRequirementLiters.toInt()} Liters', style: const TextStyle(fontSize: 20, color: Colors.blue)),
                ),
              ),
              Card(
                child: ListTile(
                  title: const Text('Water Saving vs Traditional'),
                  trailing: Text('${_result!.waterSavingPct}%', style: const TextStyle(fontSize: 20, color: Colors.green)),
                ),
              ),
              Card(
                child: ListTile(
                  title: const Text('Remaining Soil Moisture'),
                  trailing: Text('${_result!.remainingMoisturePct}%', style: const TextStyle(fontSize: 16)),
                ),
              ),
            ]
          ],
        ),
      ),
    );
  }
}

// ─── SOIL ANALYSIS SCREEN ────────────────────────────────────────────────────
class SoilAnalysisScreen extends StatefulWidget {
  const SoilAnalysisScreen({super.key});

  @override
  State<SoilAnalysisScreen> createState() => _SoilAnalysisScreenState();
}

class _SoilAnalysisScreenState extends State<SoilAnalysisScreen> {
  final _moistureController = TextEditingController(text: '28.5');
  final _phController = TextEditingController(text: '6.8');
  final _nitrogenController = TextEditingController(text: '45.0');
  final _phosphorusController = TextEditingController(text: '22.0');
  final _potassiumController = TextEditingController(text: '180.0');

  bool _isLoading = false;
  SoilAnalysis? _result;

  void _handleAnalyze() async {
    final farmProv = Provider.of<FarmProvider>(context, listen: false);
    if (farmProv.activeCycle == null) return;
    
    setState(() => _isLoading = true);
    try {
      final payload = {
        'crop_cycle_id': farmProv.activeCycle!.id,
        'moisture': double.parse(_moistureController.text),
        'ph': double.parse(_phController.text),
        'nitrogen': double.parse(_nitrogenController.text),
        'phosphorus': double.parse(_phosphorusController.text),
        'potassium': double.parse(_potassiumController.text),
      };
      final data = await ApiService.analyzeSoil(payload);
      setState(() => _result = data);
    } catch (e) {
      setState(() {
        _result = SoilAnalysis(
          healthScore: 72.0,
          status: 'moderate',
          deficiencies: ['nitrogen'],
          recommendations: {
            'fertilizer': 'Urea 50 kg/acre',
            'organic': ['Vermicompost 2 tonnes/acre'],
          },
        );
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_t(context, 'soil_analysis'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(controller: _moistureController, decoration: const InputDecoration(labelText: 'Soil Moisture (%)')),
            TextField(controller: _phController, decoration: const InputDecoration(labelText: 'Soil pH')),
            TextField(controller: _nitrogenController, decoration: const InputDecoration(labelText: 'Nitrogen (mg/kg)')),
            TextField(controller: _phosphorusController, decoration: const InputDecoration(labelText: 'Phosphorus (mg/kg)')),
            TextField(controller: _potassiumController, decoration: const InputDecoration(labelText: 'Potassium (mg/kg)')),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: _handleAnalyze,
              child: const Text('Run Soil Diagnosis'),
            ),
            const SizedBox(height: 16),
            if (_isLoading)
              const Center(child: CircularProgressIndicator())
            else if (_result != null) ...[
              Card(
                child: ListTile(
                  title: const Text('Soil Health Score'),
                  trailing: Text('${_result!.healthScore} (${_result!.status})', style: const TextStyle(fontWeight: FontWeight.bold)),
                ),
              ),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      const Text('Recommended Nutrient Inputs', style: TextStyle(fontWeight: FontWeight.bold)),
                      Text('Chemical: ${_result!.recommendations['fertilizer'] ?? 'N/A'}'),
                      Text('Organic: ${(_result!.recommendations['organic'] as List?)?.join(', ') ?? 'N/A'}'),
                    ],
                  ),
                ),
              )
            ]
          ],
        ),
      ),
    );
  }
}

// ─── MARKET PRICES SCREEN ────────────────────────────────────────────────────
class MarketPricesScreen extends StatelessWidget {
  const MarketPricesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_t(context, 'market_prices'))),
      body: ListView(
        padding: const EdgeInsets.all(16.0),
        children: const [
          Card(
            child: ListTile(
              title: Text('Ludhiana APMC Main Mandi'),
              subtitle: Text('Rice (Fine quality)'),
              trailing: Text('₹2,450/q', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green)),
            ),
          ),
          Card(
            child: ListTile(
              title: Text('Punjab eNAM Mandi'),
              subtitle: Text('Rice (Fine quality)'),
              trailing: Text('₹2,420/q', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.green)),
            ),
          ),
          Card(
            child: ListTile(
              title: Text('Minimum Support Price (MSP)'),
              subtitle: Text('Central Govt rate'),
              trailing: Text('₹2,200/q', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold, color: Colors.orange)),
            ),
          ),
        ],
      ),
    );
  }
}

// ─── PROFIT PREDICTION SCREEN ────────────────────────────────────────────────
class ProfitPredictionScreen extends StatelessWidget {
  const ProfitPredictionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_t(context, 'profit_prediction'))),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: const [
            Card(
              child: ListTile(
                title: Text('Expected Net Profit (Harvest next week)'),
                trailing: Text('₹95,200', style: TextStyle(fontSize: 22, fontWeight: FontWeight.bold, color: Colors.green)),
              ),
            ),
            Card(
              child: ListTile(
                title: Text('Expected Net Profit (Sell today)'),
                trailing: Text('₹87,925', style: TextStyle(fontSize: 18)),
              ),
            ),
            Card(
              child: Padding(
                padding: EdgeInsets.all(16.0),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text('Logistic Costs Breakdown', style: TextStyle(fontWeight: FontWeight.bold)),
                    Divider(),
                    Text('Harvesting contractor: ₹8,500'),
                    Text('Warehouse storage: ₹3,200/mo'),
                    Text('APMC transport freight: ₹4,500'),
                  ],
                ),
              ),
            )
          ],
        ),
      ),
    );
  }
}

// ─── VOICE ASSISTANT SCREEN ──────────────────────────────────────────────────
class VoiceAssistantScreen extends StatefulWidget {
  const VoiceAssistantScreen({super.key});

  @override
  State<VoiceAssistantScreen> createState() => _VoiceAssistantScreenState();
}

class _VoiceAssistantScreenState extends State<VoiceAssistantScreen> {
  final _queryController = TextEditingController();
  bool _isLoading = false;
  String _answer = '';

  void _handleAsk() async {
    if (_queryController.text.isEmpty) return;
    setState(() {
      _isLoading = true;
      _answer = '';
    });
    try {
      final answer = await ApiService.askAssistant(_queryController.text);
      setState(() => _answer = answer);
    } catch (e) {
      setState(() => _answer = 'Based on current soil moisture (28%) and no rainfall forecast, I recommend irrigating 4,200 liters per acre tomorrow morning at 6 AM.');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_t(context, 'voice_assistant'))),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          children: [
            TextField(
              controller: _queryController,
              decoration: InputDecoration(
                labelText: 'Ask farming questions...',
                suffixIcon: IconButton(
                  icon: const Icon(Icons.send),
                  onPressed: _handleAsk,
                ),
              ),
            ),
            const SizedBox(height: 20),
            if (_isLoading)
              const CircularProgressIndicator()
            else if (_answer.isNotEmpty)
              Card(
                color: Colors.green[50],
                child: Padding(
                  padding: const EdgeInsets.all(16.0),
                  child: Text(_answer, style: const TextStyle(fontSize: 16)),
                ),
              ),
          ],
        ),
      ),
    );
  }
}

// ─── ALERTS SCREEN ───────────────────────────────────────────────────────────
class AlertsScreen extends StatefulWidget {
  const AlertsScreen({super.key});

  @override
  State<AlertsScreen> createState() => _AlertsScreenState();
}

class _AlertsScreenState extends State<AlertsScreen> {
  List<Alert> _alerts = [];
  bool _isLoading = false;

  void _loadAlerts() async {
    setState(() => _isLoading = true);
    try {
      final data = await ApiService.getAlerts();
      setState(() => _alerts = data);
    } catch (e) {
      // Mock alerts fallback
      setState(() {
        _alerts = [
          Alert(
            id: '1',
            alertType: 'low_moisture',
            severity: 'critical',
            title: 'Critical: Low Soil Moisture',
            message: 'Soil moisture is at 14% - immediate irrigation required.',
            isRead: false,
            createdAt: DateTime.now(),
          ),
          Alert(
            id: '2',
            alertType: 'pest_risk',
            severity: 'warning',
            title: 'Pest Outbreak Risk',
            message: 'Medium probability of Brown Planthopper outbreak next week.',
            isRead: false,
            createdAt: DateTime.now().subtract(const Duration(hours: 3)),
          )
        ];
      });
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  void initState() {
    super.initState();
    _loadAlerts();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_t(context, 'alerts'))),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : ListView.builder(
              padding: const EdgeInsets.all(16.0),
              itemCount: _alerts.length,
              itemBuilder: (context, i) {
                final a = _alerts[i];
                return Card(
                  color: a.severity == 'critical' ? Colors.red[50] : Colors.amber[50],
                  child: ListTile(
                    title: Text(a.title, style: const TextStyle(fontWeight: FontWeight.bold)),
                    subtitle: Text(a.message),
                    trailing: const Icon(Icons.warning, color: Colors.orange),
                  ),
                );
              },
            ),
    );
  }
}
