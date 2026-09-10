import 'dart:convert';

class User {
  final String id;
  final String email;
  final String fullName;
  final String role;
  final String language;
  final String? phone;

  User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.role,
    required this.language,
    this.phone,
  });

  factory User.fromJson(Map<String, dynamic> json) {
    return User(
      id: json['id'] as String,
      email: json['email'] as String,
      fullName: json['full_name'] as String,
      role: json['role'] as String,
      language: json['language'] as String,
      phone: json['phone'] as String?,
    );
  }
}

class Farm {
  final String id;
  final String name;
  final double totalAreaAcres;
  final double? latitude;
  final double? longitude;
  final String? state;
  final String? district;

  Farm({
    required this.id,
    required this.name,
    required this.totalAreaAcres,
    this.latitude,
    this.longitude,
    this.state,
    this.district,
  });

  factory Farm.fromJson(Map<String, dynamic> json) {
    return Farm(
      id: json['id'] as String,
      name: json['name'] as String,
      totalAreaAcres: (json['total_area_acres'] as num).toDouble(),
      latitude: (json['latitude'] as num?)?.toDouble(),
      longitude: (json['longitude'] as num?)?.toDouble(),
      state: json['state'] as String?,
      district: json['district'] as String?,
    );
  }
}

class Field {
  final String id;
  final String name;
  final double areaAcres;
  final String soilType;
  final String status;

  Field({
    required this.id,
    required this.name,
    required this.areaAcres,
    required this.soilType,
    required this.status,
  });

  factory Field.fromJson(Map<String, dynamic> json) {
    return Field(
      id: json['id'] as String,
      name: json['name'] as String,
      areaAcres: (json['area_acres'] as num).toDouble(),
      soilType: json['soil_type'] as String,
      status: json['status'] as String,
    );
  }
}

class CropCycle {
  final String id;
  final String fieldId;
  final String cropTypeId;
  final String cropName;
  final DateTime sowingDate;
  final DateTime? expectedHarvest;
  final String growthStage;
  final double healthScore;
  final String status;

  CropCycle({
    required this.id,
    required this.fieldId,
    required this.cropTypeId,
    required this.cropName,
    required this.sowingDate,
    this.expectedHarvest,
    required this.growthStage,
    required this.healthScore,
    required this.status,
  });

  factory CropCycle.fromJson(Map<String, dynamic> json) {
    return CropCycle(
      id: json['id'] as String,
      fieldId: json['field_id'] as String,
      cropTypeId: json['crop_type_id'] as String,
      cropName: json['crop_name'] as String? ?? 'Rice',
      sowingDate: DateTime.parse(json['sowing_date'] as String),
      expectedHarvest: json['expected_harvest'] != null 
          ? DateTime.parse(json['expected_harvest'] as String)
          : null,
      growthStage: json['growth_stage'] as String,
      healthScore: (json['health_score'] as num).toDouble(),
      status: json['status'] as String,
    );
  }
}

class DiseaseDetection {
  final String diseaseName;
  final String severity;
  final double confidence;
  final double affectedAreaPct;
  final Map<String, dynamic> treatment;

  DiseaseDetection({
    required this.diseaseName,
    required this.severity,
    required this.confidence,
    required this.affectedAreaPct,
    required this.treatment,
  });

  factory DiseaseDetection.fromJson(Map<String, dynamic> json) {
    return DiseaseDetection(
      diseaseName: json['disease_name'] as String,
      severity: json['severity'] as String,
      confidence: (json['confidence'] as num).toDouble(),
      affectedAreaPct: (json['affected_area_pct'] as num).toDouble(),
      treatment: json['treatment'] as Map<String, dynamic>? ?? {},
    );
  }
}

class SoilAnalysis {
  final double healthScore;
  final String status;
  final List<String> deficiencies;
  final Map<String, dynamic> recommendations;

  SoilAnalysis({
    required this.healthScore,
    required this.status,
    required this.deficiencies,
    required this.recommendations,
  });

  factory SoilAnalysis.fromJson(Map<String, dynamic> json) {
    return SoilAnalysis(
      healthScore: (json['health_score'] as num).toDouble(),
      status: json['status'] as String,
      deficiencies: List<String>.from(json['deficiencies'] as List? ?? []),
      recommendations: json['recommendations'] as Map<String, dynamic>? ?? {},
    );
  }
}

class WaterPrediction {
  final double dailyRequirementLiters;
  final double perAcreLiters;
  final double? perPlantLiters;
  final double waterSavingPct;
  final DateTime? nextIrrigation;
  final double? remainingMoisturePct;
  final double? evapotranspirationMm;
  final Map<String, dynamic> factors;

  WaterPrediction({
    required this.dailyRequirementLiters,
    required this.perAcreLiters,
    this.perPlantLiters,
    required this.waterSavingPct,
    this.nextIrrigation,
    this.remainingMoisturePct,
    this.evapotranspirationMm,
    required this.factors,
  });

  factory WaterPrediction.fromJson(Map<String, dynamic> json) {
    return WaterPrediction(
      dailyRequirementLiters: (json['daily_requirement_liters'] as num).toDouble(),
      perAcreLiters: (json['per_acre_liters'] as num).toDouble(),
      perPlantLiters: (json['per_plant_liters'] as num?)?.toDouble(),
      waterSavingPct: (json['water_saving_pct'] as num).toDouble(),
      nextIrrigation: json['next_irrigation'] != null
          ? DateTime.parse(json['next_irrigation'] as String)
          : null,
      remainingMoisturePct: (json['remaining_moisture_pct'] as num?)?.toDouble(),
      evapotranspirationMm: (json['evapotranspiration_mm'] as num?)?.toDouble(),
      factors: json['factors'] as Map<String, dynamic>? ?? {},
    );
  }
}

class MarketPrice {
  final String marketName;
  final double pricePerQuintal;
  final double? msp;
  final DateTime priceDate;
  final String? state;

  MarketPrice({
    required this.marketName,
    required this.pricePerQuintal,
    this.msp,
    required this.priceDate,
    this.state,
  });

  factory MarketPrice.fromJson(Map<String, dynamic> json) {
    return MarketPrice(
      marketName: json['market_name'] as String,
      pricePerQuintal: (json['price_per_quintal'] as num).toDouble(),
      msp: (json['msp'] as num?)?.toDouble(),
      priceDate: DateTime.parse(json['price_date'] as String),
      state: json['state'] as String?,
    );
  }
}

class Alert {
  final String id;
  final String alertType;
  final String severity;
  final String title;
  final String message;
  final bool isRead;
  final DateTime createdAt;

  Alert({
    required this.id,
    required this.alertType,
    required this.severity,
    required this.title,
    required this.message,
    required this.isRead,
    required this.createdAt,
  });

  factory Alert.fromJson(Map<String, dynamic> json) {
    return Alert(
      id: json['id'] as String,
      alertType: json['alert_type'] as String,
      severity: json['severity'] as String,
      title: json['title'] as String,
      message: json['message'] as String,
      isRead: json['is_read'] as bool,
      createdAt: DateTime.parse(json['created_at'] as String),
    );
  }
}
