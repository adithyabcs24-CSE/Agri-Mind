import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/providers.dart';
import 'screens/screens.dart';
import 'services/api_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await ApiService.init();
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..checkAuth()),
        ChangeNotifierProvider(create: (_) => FarmProvider()),
        ChangeNotifierProvider(create: (_) => LanguageProvider()),
        ChangeNotifierProvider(create: (_) => ThemeProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeProv = Provider.of<ThemeProvider>(context);
    
    return MaterialApp(
      title: 'AgriMind AI',
      debugShowCheckedModeBanner: false,
      themeMode: themeProv.themeMode,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2E7D32), // Emerald Green
          brightness: Brightness.light,
        ),
      ),
      darkTheme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF2E7D32),
          brightness: Brightness.dark,
        ),
      ),
      initialRoute: '/login',
      routes: {
        '/login': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/crop-health': (context) => const CropHealthScreen(),
        '/disease': (context) => const DiseaseScannerScreen(),
        '/water': (context) => const WaterCalculatorScreen(),
        '/market': (context) => const MarketPricesScreen(),
        '/soil': (context) => const SoilAnalysisScreen(),
        '/profit': (context) => const ProfitPredictionScreen(),
        '/assistant': (context) => const VoiceAssistantScreen(),
        '/alerts': (context) => const AlertsScreen(),
      },
    );
  }
}
