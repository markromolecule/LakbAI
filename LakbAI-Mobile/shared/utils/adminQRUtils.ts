/**
 * Admin QR Code Generation Utilities
 * 
 * This file contains utilities for generating location-based QR codes
 * that administrators can place at jeepney stops and checkpoints.
 * 
 * In a production environment, this would be part of the admin backend system.
 */

export interface AdminLocationQR {
  type: 'admin_location';
  locationId: string;
  locationName: string;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  timestamp: string;
  adminId?: string;
  category?: 'terminal' | 'checkpoint' | 'stop' | 'landmark';
  metadata?: {
    expectedPassengerVolume?: 'low' | 'medium' | 'high';
    timeRestrictions?: string;
    notes?: string;
  };
}

// Predefined locations for Cebu jeepney routes
export const PREDEFINED_LOCATIONS: Array<Omit<AdminLocationQR, 'timestamp' | 'adminId'>> = [
  {
    type: 'admin_location',
    locationId: 'terminal_robinson_galleria',
    locationName: 'Robinson Galleria Cebu',
    coordinates: { latitude: 10.3157, longitude: 123.9054 },
    category: 'terminal',
    metadata: {
      expectedPassengerVolume: 'high',
      notes: 'Main terminal with high passenger traffic'
    }
  },
  {
    type: 'admin_location',
    locationId: 'terminal_ayala_center',
    locationName: 'Ayala Center Cebu',
    coordinates: { latitude: 10.3181, longitude: 123.9068 },
    category: 'terminal',
    metadata: {
      expectedPassengerVolume: 'high',
      notes: 'Central business district terminal'
    }
  },
  {
    type: 'admin_location',
    locationId: 'stop_sm_city_cebu',
    locationName: 'SM City Cebu',
    coordinates: { latitude: 10.3089, longitude: 123.8914 },
    category: 'stop',
    metadata: {
      expectedPassengerVolume: 'high',
      notes: 'Major shopping center'
    }
  },
  {
    type: 'admin_location',
    locationId: 'checkpoint_colon_street',
    locationName: 'Colon Street',
    coordinates: { latitude: 10.2952, longitude: 123.9019 },
    category: 'checkpoint',
    metadata: {
      expectedPassengerVolume: 'medium',
      notes: 'Historic downtown area'
    }
  },
  {
    type: 'admin_location',
    locationId: 'stop_usc_main',
    locationName: 'University of San Carlos - Main Campus',
    coordinates: { latitude: 10.2921, longitude: 123.9019 },
    category: 'stop',
    metadata: {
      expectedPassengerVolume: 'high',
      timeRestrictions: 'Peak hours: 7-9 AM, 4-6 PM',
      notes: 'University with heavy student traffic'
    }
  },
  {
    type: 'admin_location',
    locationId: 'stop_it_park',
    locationName: 'Cebu IT Park',
    coordinates: { latitude: 10.3270, longitude: 123.9070 },
    category: 'stop',
    metadata: {
      expectedPassengerVolume: 'high',
      timeRestrictions: 'Business hours: 8 AM - 6 PM',
      notes: 'Business district with office workers'
    }
  },
  {
    type: 'admin_location',
    locationId: 'checkpoint_fuente_circle',
    locationName: 'Fuente Circle',
    coordinates: { latitude: 10.3156, longitude: 123.8994 },
    category: 'checkpoint',
    metadata: {
      expectedPassengerVolume: 'medium',
      notes: 'Central rotunda and landmark'
    }
  },
  {
    type: 'admin_location',
    locationId: 'stop_lahug',
    locationName: 'Lahug Terminal',
    coordinates: { latitude: 10.3347, longitude: 123.9143 },
    category: 'terminal',
    metadata: {
      expectedPassengerVolume: 'medium',
      notes: 'Residential area terminal'
    }
  }
];

/**
 * Generate a location QR code for admin placement
 */
export function generateAdminLocationQR(
  locationId: string,
  adminId: string = 'admin_001'
): string {
  const location = PREDEFINED_LOCATIONS.find(loc => loc.locationId === locationId);
  
  if (!location) {
    throw new Error(`Location with ID ${locationId} not found`);
  }

  const qrData: AdminLocationQR = {
    ...location,
    timestamp: new Date().toISOString(),
    adminId
  };

  return JSON.stringify(qrData);
}

/**
 * Generate QR codes for all predefined locations
 */
export function generateAllLocationQRs(adminId: string = 'admin_001'): Array<{
  locationId: string;
  locationName: string;
  qrData: string;
}> {
  return PREDEFINED_LOCATIONS.map(location => ({
    locationId: location.locationId,
    locationName: location.locationName,
    qrData: generateAdminLocationQR(location.locationId, adminId)
  }));
}

/**
 * Create a custom location QR code
 */
export function createCustomLocationQR(
  locationName: string,
  coordinates: { latitude: number; longitude: number },
  options: {
    category?: AdminLocationQR['category'];
    expectedPassengerVolume?: 'low' | 'medium' | 'high';
    notes?: string;
    adminId?: string;
  } = {}
): string {
  const locationId = `custom_${locationName.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;
  
  const qrData: AdminLocationQR = {
    type: 'admin_location',
    locationId,
    locationName,
    coordinates,
    timestamp: new Date().toISOString(),
    adminId: options.adminId || 'admin_001',
    category: options.category || 'stop',
    metadata: {
      expectedPassengerVolume: options.expectedPassengerVolume || 'medium',
      notes: options.notes || `Custom location: ${locationName}`
    }
  };

  return JSON.stringify(qrData);
}

/**
 * Validate an admin location QR code
 */
export function validateAdminLocationQR(qrData: string): {
  isValid: boolean;
  data?: AdminLocationQR;
  error?: string;
} {
  try {
    const parsed = JSON.parse(qrData);
    
    if (parsed.type !== 'admin_location') {
      return {
        isValid: false,
        error: 'Not an admin location QR code'
      };
    }

    const required = ['locationId', 'locationName', 'timestamp'];
    for (const field of required) {
      if (!parsed[field]) {
        return {
          isValid: false,
          error: `Missing required field: ${field}`
        };
      }
    }

    return {
      isValid: true,
      data: parsed as AdminLocationQR
    };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid JSON format'
    };
  }
}

/**
 * Generate test QR codes for development
 */
export const TEST_ADMIN_QR_CODES = {
  ROBINSON_GALLERIA: generateAdminLocationQR('terminal_robinson_galleria'),
  AYALA_CENTER: generateAdminLocationQR('terminal_ayala_center'),
  SM_CITY_CEBU: generateAdminLocationQR('stop_sm_city_cebu'),
  COLON_STREET: generateAdminLocationQR('checkpoint_colon_street'),
  USC_MAIN: generateAdminLocationQR('stop_usc_main'),
  IT_PARK: generateAdminLocationQR('stop_it_park'),
};

/**
 * Log all test QR codes to console for development
 */
export function logTestAdminQRCodes(): void {
  console.log('🏢 Test Admin Location QR Codes:');
  console.log('=====================================');
  
  Object.entries(TEST_ADMIN_QR_CODES).forEach(([name, qrData]) => {
    const parsed = JSON.parse(qrData);
    console.log(`\n📍 ${name}:`);
    console.log(`   Location: ${parsed.locationName}`);
    console.log(`   QR Data: ${qrData}`);
  });
  
  console.log('\n💡 To test: Copy any QR data above and use it in the driver scanner');
}

/**
 * Get QR data for a specific location by name (for easy testing)
 */
export function getLocationQRByName(locationName: string): string | null {
  const location = PREDEFINED_LOCATIONS.find(
    loc => loc.locationName.toLowerCase().includes(locationName.toLowerCase())
  );
  
  if (!location) {
    return null;
  }
  
  return generateAdminLocationQR(location.locationId);
}

/**
 * Generate a printable QR code batch for physical deployment
 */
export function generatePrintableBatch(adminId: string = 'admin_001'): {
  batchId: string;
  generatedAt: string;
  locations: Array<{
    locationId: string;
    locationName: string;
    category: string;
    qrData: string;
    printUrl: string; // URL to QR code image
  }>;
} {
  const batchId = `batch_${Date.now()}`;
  const generatedAt = new Date().toISOString();
  
  const locations = PREDEFINED_LOCATIONS.map(location => {
    const qrData = generateAdminLocationQR(location.locationId, adminId);
    const printUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}`;
    
    return {
      locationId: location.locationId,
      locationName: location.locationName,
      category: location.category || 'stop',
      qrData,
      printUrl
    };
  });

  return {
    batchId,
    generatedAt,
    locations
  };
}
