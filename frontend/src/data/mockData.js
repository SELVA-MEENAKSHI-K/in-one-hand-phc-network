// Master Unified Medicine Catalog (All 6 Essential Medicines tracked across PHC network)
export const MASTER_MEDICINE_CATALOG = [
  {
    id: 'med-pcm-500',
    name: 'Paracetamol 500mg',
    tamilName: 'பாராசிட்டமால் 500மி.கி',
    category: 'Analgesic / Antipyretic',
    unit: 'Strips',
    defaultQty: 600,
    defaultMinThreshold: 250,
    dailyUsageRate: 40,
    source: 'TNMSC Central Warehouse'
  },
  {
    id: 'med-amx-500',
    name: 'Amoxicillin 500mg',
    tamilName: 'அமாக்ஸிசிலின் 500மி.கி',
    category: 'Antibiotic',
    unit: 'Strips',
    defaultQty: 350,
    defaultMinThreshold: 200,
    dailyUsageRate: 30,
    source: 'TNMSC Warehouse'
  },
  {
    id: 'med-met-500',
    name: 'Metformin 500mg',
    tamilName: 'மெட்ஃபோர்மின் 500மி.கி',
    category: 'Antidiabetic',
    unit: 'Strips',
    defaultQty: 450,
    defaultMinThreshold: 200,
    dailyUsageRate: 25,
    source: 'Direct Central Depot'
  },
  {
    id: 'med-ors-sachet',
    name: 'Oral Rehydration Salts (ORS)',
    tamilName: 'ஓ.ஆர்.எஸ் உப்பு கரைசல்',
    category: 'Electrolytes',
    unit: 'Sachets',
    defaultQty: 650,
    defaultMinThreshold: 300,
    dailyUsageRate: 40,
    source: 'District Medical Depot'
  },
  {
    id: 'med-rab-vial',
    name: 'Anti-Rabies Vaccine (ARV)',
    tamilName: 'வெறிநாய்க்கடி தடுப்பூசி (ARV)',
    category: 'Emergency Vaccine',
    unit: 'Vials',
    defaultQty: 30,
    defaultMinThreshold: 25,
    dailyUsageRate: 4,
    source: 'State Cold Chain Hub'
  },
  {
    id: 'med-ins-glar',
    name: 'Insulin Glargine',
    tamilName: 'இன்சுலின் கிளார்கின்',
    category: 'Cold Chain Hormone',
    unit: 'Cartridges',
    defaultQty: 50,
    defaultMinThreshold: 40,
    dailyUsageRate: 6,
    source: 'State Cold Chain Hub'
  }
];

// In One Hand — Seed & Mock Data
export const INITIAL_PHCS = [
  {
    id: 'phc-medavakkam',
    name: 'Medavakkam Primary Health Centre',
    tamilName: 'மேடவாக்கம் ஆரம்ப சுகாதார நிலையம்',
    district: 'Chengalpattu',
    location: 'Medavakkam Main Road, Chennai 600100',
    contactPerson: 'Dr. K. Ramesh (Chief Medical Officer)',
    phone: '+91 98401 23456',
    email: 'medavakkam.phc@tnhealth.gov.in',
    status: 'Approved', // 'Approved' | 'Pending Verification'
    verifiedAt: '2026-03-10T09:00:00Z',
    verifiedBy: 'Dr. V. Sundaram (District Health Officer)',
    regularPatientCount: 450,
    dailyFootfall: 142,
    bedCapacity: 24,
    occupiedBeds: 16,
    staffingThreshold: 60, // alert if attendance < 60%
    lastUpdated: new Date(Date.now() - 1000 * 60 * 12).toISOString(), // 12 mins ago
    medicines: [
      {
        id: 'med-pcm-500',
        name: 'Paracetamol 500mg',
        tamilName: 'பாராசிட்டமால் 500மி.கி',
        category: 'Analgesic / Antipyretic',
        quantity: 850,
        minThreshold: 300,
        unit: 'Strips',
        batchNumber: 'PCM-2026-A1',
        expiryDate: '2027-08-15',
        source: 'TNMSC Central Warehouse',
        dailyUsageRate: 65,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 35).toISOString()
      },
      {
        id: 'med-amx-500',
        name: 'Amoxicillin 500mg',
        tamilName: 'அமாக்ஸிசிலின் 500மி.கி',
        category: 'Antibiotic',
        quantity: 180,
        minThreshold: 250,
        unit: 'Strips',
        batchNumber: 'AMX-2026-03',
        expiryDate: '2027-04-10',
        source: 'TNMSC Warehouse',
        dailyUsageRate: 45,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 50).toISOString()
      },
      {
        id: 'med-met-500',
        name: 'Metformin 500mg',
        tamilName: 'மெட்ஃபோர்மின் 500மி.கி',
        category: 'Antidiabetic',
        quantity: 540,
        minThreshold: 250,
        unit: 'Strips',
        batchNumber: 'MET-2026-08',
        expiryDate: '2028-01-20',
        source: 'Direct Central Depot',
        dailyUsageRate: 35,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 120).toISOString()
      },
      {
        id: 'med-ors-sachet',
        name: 'Oral Rehydration Salts (ORS)',
        tamilName: 'ஓ.ஆர்.எஸ் உப்பு கரைசல்',
        category: 'Electrolytes',
        quantity: 920,
        minThreshold: 400,
        unit: 'Sachets',
        batchNumber: 'ORS-2026-11',
        expiryDate: '2027-12-30',
        source: 'District Medical Depot',
        dailyUsageRate: 50,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 180).toISOString()
      },
      {
        id: 'med-rab-vial',
        name: 'Anti-Rabies Vaccine (ARV)',
        tamilName: 'வெறிநாய்க்கடி தடுப்பூசி (ARV)',
        category: 'Emergency Vaccine',
        quantity: 22,
        minThreshold: 35,
        unit: 'Vials',
        batchNumber: 'RAB-2026-02',
        expiryDate: '2026-11-15',
        source: 'State Cold Chain Hub',
        dailyUsageRate: 6,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 15).toISOString()
      },
      {
        id: 'med-ins-glar',
        name: 'Insulin Glargine',
        tamilName: 'இன்சுலின் கிளார்கின்',
        category: 'Cold Chain Hormone',
        quantity: 65,
        minThreshold: 50,
        unit: 'Cartridges',
        batchNumber: 'INS-2026-09',
        expiryDate: '2027-03-30',
        source: 'State Cold Chain Hub',
        dailyUsageRate: 8,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 90).toISOString()
      }
    ],
    staff: [
      {
        id: 'stf-med-01',
        name: 'Dr. Priya Raman',
        role: 'Medical Officer',
        phone: '+91 94441 12345',
        qrCode: 'STAFF:MEDAVAKKAM:stf-med-01:Dr. Priya Raman',
        status: 'Present',
        checkInTime: '08:30 AM',
        checkOutTime: null
      },
      {
        id: 'stf-med-02',
        name: 'Nurse Deepa V',
        role: 'Staff Nurse',
        phone: '+91 94442 23456',
        qrCode: 'STAFF:MEDAVAKKAM:stf-med-02:Nurse Deepa V',
        status: 'Present',
        checkInTime: '08:15 AM',
        checkOutTime: null
      },
      {
        id: 'stf-med-03',
        name: 'Senthil Kumar',
        role: 'Pharmacist',
        phone: '+91 94443 34567',
        qrCode: 'STAFF:MEDAVAKKAM:stf-med-03:Senthil Kumar',
        status: 'Present',
        checkInTime: '08:45 AM',
        checkOutTime: null
      },
      {
        id: 'stf-med-04',
        name: 'Revathi M',
        role: 'Lab Technician',
        phone: '+91 94444 45678',
        qrCode: 'STAFF:MEDAVAKKAM:stf-med-04:Revathi M',
        status: 'Not Checked In',
        checkInTime: null,
        checkOutTime: null
      },
      {
        id: 'stf-med-05',
        name: 'Dr. Arun Sundaram',
        role: 'Duty Medical Officer',
        phone: '+91 94445 56789',
        qrCode: 'STAFF:MEDAVAKKAM:stf-med-05:Dr. Arun Sundaram',
        status: 'Checked Out',
        checkInTime: '07:30 AM',
        checkOutTime: '02:00 PM'
      }
    ]
  },
  {
    id: 'phc-sholinganallur',
    name: 'Sholinganallur Primary Health Centre',
    tamilName: 'சோழிங்கநல்லூர் ஆரம்ப சுகாதார நிலையம்',
    district: 'Chennai',
    location: 'OMR Junction, Sholinganallur, Chennai 600119',
    contactPerson: 'Dr. Anita Rajan (Chief Medical Officer)',
    phone: '+91 98402 34567',
    email: 'sholinganallur.phc@tnhealth.gov.in',
    status: 'Approved',
    verifiedAt: '2026-03-08T10:00:00Z',
    verifiedBy: 'Dr. V. Sundaram (District Health Officer)',
    regularPatientCount: 620,
    dailyFootfall: 210,
    bedCapacity: 30,
    occupiedBeds: 27, // 90% full! Low bed alert!
    staffingThreshold: 60,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    medicines: [
      {
        id: 'med-pcm-500',
        name: 'Paracetamol 500mg',
        tamilName: 'பாராசிட்டமால் 500மி.கி',
        category: 'Analgesic / Antipyretic',
        quantity: 1400,
        minThreshold: 400,
        unit: 'Strips',
        batchNumber: 'PCM-2026-S4',
        expiryDate: '2027-09-20',
        source: 'TNMSC Warehouse',
        dailyUsageRate: 90,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 20).toISOString()
      },
      {
        id: 'med-amx-500',
        name: 'Amoxicillin 500mg',
        tamilName: 'அமாக்ஸிசிலின் 500மி.கி',
        category: 'Antibiotic',
        quantity: 750, // Big surplus! Safe to transfer!
        minThreshold: 250,
        unit: 'Strips',
        batchNumber: 'AMX-2026-S1',
        expiryDate: '2027-05-18',
        source: 'TNMSC Warehouse',
        dailyUsageRate: 50,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 30).toISOString()
      },
      {
        id: 'med-met-500',
        name: 'Metformin 500mg',
        tamilName: 'மெட்ஃபோர்மின் 500மி.கி',
        category: 'Antidiabetic',
        quantity: 800,
        minThreshold: 300,
        unit: 'Strips',
        batchNumber: 'MET-2026-S8',
        expiryDate: '2028-02-15',
        source: 'Direct Central Depot',
        dailyUsageRate: 45,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 60).toISOString()
      },
      {
        id: 'med-ors-sachet',
        name: 'Oral Rehydration Salts (ORS)',
        tamilName: 'ஓ.ஆர்.எஸ் உப்பு கரைசல்',
        category: 'Electrolytes',
        quantity: 1100,
        minThreshold: 450,
        unit: 'Sachets',
        batchNumber: 'ORS-2026-S2',
        expiryDate: '2027-11-20',
        source: 'District Medical Depot',
        dailyUsageRate: 65,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 110).toISOString()
      },
      {
        id: 'med-rab-vial',
        name: 'Anti-Rabies Vaccine (ARV)',
        tamilName: 'வெறிநாய்க்கடி தடுப்பூசி (ARV)',
        category: 'Emergency Vaccine',
        quantity: 90, // Big surplus!
        minThreshold: 35,
        unit: 'Vials',
        batchNumber: 'RAB-2026-S9',
        expiryDate: '2027-01-10',
        source: 'State Cold Chain Hub',
        dailyUsageRate: 8,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 45).toISOString()
      },
      {
        id: 'med-ins-glar',
        name: 'Insulin Glargine',
        tamilName: 'இன்சுலின் கிளார்கின்',
        category: 'Cold Chain Hormone',
        quantity: 42,
        minThreshold: 50, // Low stock!
        unit: 'Cartridges',
        batchNumber: 'INS-2026-S3',
        expiryDate: '2027-04-12',
        source: 'State Cold Chain Hub',
        dailyUsageRate: 10,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 95).toISOString()
      }
    ],
    staff: [
      {
        id: 'stf-sho-01',
        name: 'Dr. Anita Rajan',
        role: 'Chief Medical Officer',
        phone: '+91 94446 67890',
        qrCode: 'STAFF:SHOLINGANALLUR:stf-sho-01:Dr. Anita Rajan',
        status: 'Present',
        checkInTime: '08:20 AM',
        checkOutTime: null
      },
      {
        id: 'stf-sho-02',
        name: 'Nurse Malarvizhi K',
        role: 'Staff Nurse',
        phone: '+91 94447 78901',
        qrCode: 'STAFF:SHOLINGANALLUR:stf-sho-02:Nurse Malarvizhi K',
        status: 'Present',
        checkInTime: '08:10 AM',
        checkOutTime: null
      },
      {
        id: 'stf-sho-03',
        name: 'Vigneshwaran S',
        role: 'Pharmacist',
        phone: '+91 94448 89012',
        qrCode: 'STAFF:SHOLINGANALLUR:stf-sho-03:Vigneshwaran S',
        status: 'Present',
        checkInTime: '08:35 AM',
        checkOutTime: null
      },
      {
        id: 'stf-sho-04',
        name: 'Banumathi K',
        role: 'ANM / Staff Nurse',
        phone: '+91 94449 90123',
        qrCode: 'STAFF:SHOLINGANALLUR:stf-sho-04:Banumathi K',
        status: 'Present',
        checkInTime: '08:50 AM',
        checkOutTime: null
      }
    ]
  },
  {
    id: 'phc-kovalam',
    name: 'Kovalam Coastal Primary Health Centre',
    tamilName: 'கோவளம் கடற்கரை ஆரம்ப சுகாதார நிலையம்',
    district: 'Chengalpattu',
    location: 'East Coast Road, Kovalam, Chengalpattu 603112',
    contactPerson: 'Dr. G. Balaji (Medical Officer)',
    phone: '+91 98403 45678',
    email: 'kovalam.phc@tnhealth.gov.in',
    status: 'Approved',
    verifiedAt: '2026-03-05T11:30:00Z',
    verifiedBy: 'Dr. V. Sundaram (District Health Officer)',
    regularPatientCount: 280,
    dailyFootfall: 85,
    bedCapacity: 15,
    occupiedBeds: 5,
    staffingThreshold: 60,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 40).toISOString(),
    medicines: [
      {
        id: 'med-pcm-500',
        name: 'Paracetamol 500mg',
        tamilName: 'பாராசிட்டமால் 500மி.கி',
        category: 'Analgesic / Antipyretic',
        quantity: 520,
        minThreshold: 200,
        unit: 'Strips',
        batchNumber: 'PCM-2026-K1',
        expiryDate: '2027-07-10',
        source: 'TNMSC Warehouse',
        dailyUsageRate: 30,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 70).toISOString()
      },
      {
        id: 'med-amx-500',
        name: 'Amoxicillin 500mg',
        tamilName: 'அமாக்ஸிசிலின் 500மி.கி',
        category: 'Antibiotic',
        quantity: 340,
        minThreshold: 150,
        unit: 'Strips',
        batchNumber: 'AMX-2026-K2',
        expiryDate: '2027-06-25',
        source: 'TNMSC Warehouse',
        dailyUsageRate: 22,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 95).toISOString()
      },
      {
        id: 'med-met-500',
        name: 'Metformin 500mg',
        tamilName: 'மெட்ஃபோர்மின் 500மி.கி',
        category: 'Antidiabetic',
        quantity: 410,
        minThreshold: 150,
        unit: 'Strips',
        batchNumber: 'MET-2026-K7',
        expiryDate: '2028-03-01',
        source: 'Direct Central Depot',
        dailyUsageRate: 20,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 80).toISOString()
      },
      {
        id: 'med-ors-sachet',
        name: 'Oral Rehydration Salts (ORS)',
        tamilName: 'ஓ.ஆர்.எஸ் உப்பு கரைசல்',
        category: 'Electrolytes',
        quantity: 750,
        minThreshold: 250,
        unit: 'Sachets',
        batchNumber: 'ORS-2026-K3',
        expiryDate: '2027-10-15',
        source: 'District Medical Depot',
        dailyUsageRate: 35,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 110).toISOString()
      },
      {
        id: 'med-rab-vial',
        name: 'Anti-Rabies Vaccine (ARV)',
        tamilName: 'வெறிநாய்க்கடி தடுப்பூசி (ARV)',
        category: 'Emergency Vaccine',
        quantity: 48,
        minThreshold: 20,
        unit: 'Vials',
        batchNumber: 'RAB-2026-K5',
        expiryDate: '2027-02-28',
        source: 'State Cold Chain Hub',
        dailyUsageRate: 3,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 50).toISOString()
      },
      {
        id: 'med-ins-glar',
        name: 'Insulin Glargine',
        tamilName: 'இன்சுலின் கிளார்கின்',
        category: 'Cold Chain Hormone',
        quantity: 85,
        minThreshold: 35,
        unit: 'Cartridges',
        batchNumber: 'INS-2026-K8',
        expiryDate: '2027-06-14',
        source: 'State Cold Chain Hub',
        dailyUsageRate: 5,
        lastUpdated: new Date(Date.now() - 1000 * 60 * 65).toISOString()
      }
    ],
    staff: [
      {
        id: 'stf-kov-01',
        name: 'Dr. G. Balaji',
        role: 'Medical Officer',
        phone: '+91 94440 01234',
        qrCode: 'STAFF:KOVALAM:stf-kov-01:Dr. G. Balaji',
        status: 'Present',
        checkInTime: '08:40 AM',
        checkOutTime: null
      },
      {
        id: 'stf-kov-02',
        name: 'Nurse Saranya P',
        role: 'Staff Nurse',
        phone: '+91 94441 12340',
        qrCode: 'STAFF:KOVALAM:stf-kov-02:Nurse Saranya P',
        status: 'Present',
        checkInTime: '08:25 AM',
        checkOutTime: null
      },
      {
        id: 'stf-kov-03',
        name: 'Karthik N',
        role: 'Pharmacist',
        phone: '+91 94442 23451',
        qrCode: 'STAFF:KOVALAM:stf-kov-03:Karthik N',
        status: 'Present',
        checkInTime: '08:50 AM',
        checkOutTime: null
      }
    ]
  },
  {
    id: 'phc-tambaram',
    name: 'Tambaram Rural Primary Health Centre',
    tamilName: 'தாம்பரம் ஊரக ஆரம்ப சுகாதார நிலையம்',
    district: 'Chengalpattu',
    location: 'Mudichur Road, West Tambaram, Chennai 600045',
    contactPerson: 'Dr. S. Vijay (Medical Officer)',
    phone: '+91 98404 56789',
    email: 'tambaram.rural.phc@tnhealth.gov.in',
    status: 'Pending Verification', // For Onboarding & Admin verification demo!
    verifiedAt: null,
    verifiedBy: null,
    regularPatientCount: 510,
    dailyFootfall: 110,
    bedCapacity: 20,
    occupiedBeds: 8,
    staffingThreshold: 60,
    lastUpdated: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    medicines: [
      {
        id: 'med-pcm-500',
        name: 'Paracetamol 500mg',
        tamilName: 'பாராசிட்டமால் 500மி.கி',
        category: 'Analgesic / Antipyretic',
        quantity: 600,
        minThreshold: 250,
        unit: 'Strips',
        batchNumber: 'PCM-2026-T1',
        expiryDate: '2027-08-30',
        source: 'TNMSC Warehouse',
        dailyUsageRate: 40,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'med-amx-500',
        name: 'Amoxicillin 500mg',
        tamilName: 'அமாக்ஸிசிலின் 500மி.கி',
        category: 'Antibiotic',
        quantity: 400,
        minThreshold: 200,
        unit: 'Strips',
        batchNumber: 'AMX-2026-T2',
        expiryDate: '2027-05-15',
        source: 'TNMSC Warehouse',
        dailyUsageRate: 30,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'med-met-500',
        name: 'Metformin 500mg',
        tamilName: 'மெட்ஃபோர்மின் 500மி.கி',
        category: 'Antidiabetic',
        quantity: 450,
        minThreshold: 200,
        unit: 'Strips',
        batchNumber: 'MET-2026-T4',
        expiryDate: '2028-02-10',
        source: 'Direct Central Depot',
        dailyUsageRate: 25,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'med-ors-sachet',
        name: 'Oral Rehydration Salts (ORS)',
        tamilName: 'ஓ.ஆர்.எஸ் உப்பு கரைசல்',
        category: 'Electrolytes',
        quantity: 650,
        minThreshold: 300,
        unit: 'Sachets',
        batchNumber: 'ORS-2026-T5',
        expiryDate: '2027-11-05',
        source: 'District Medical Depot',
        dailyUsageRate: 40,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'med-rab-vial',
        name: 'Anti-Rabies Vaccine (ARV)',
        tamilName: 'வெறிநாய்க்கடி தடுப்பூசி (ARV)',
        category: 'Emergency Vaccine',
        quantity: 30,
        minThreshold: 25,
        unit: 'Vials',
        batchNumber: 'RAB-2026-T7',
        expiryDate: '2026-12-20',
        source: 'State Cold Chain Hub',
        dailyUsageRate: 4,
        lastUpdated: new Date().toISOString()
      },
      {
        id: 'med-ins-glar',
        name: 'Insulin Glargine',
        tamilName: 'இன்சுலின் கிளார்கின்',
        category: 'Cold Chain Hormone',
        quantity: 50,
        minThreshold: 40,
        unit: 'Cartridges',
        batchNumber: 'INS-2026-T9',
        expiryDate: '2027-05-20',
        source: 'State Cold Chain Hub',
        dailyUsageRate: 6,
        lastUpdated: new Date().toISOString()
      }
    ],
    staff: [
      {
        id: 'stf-tam-01',
        name: 'Dr. S. Vijay',
        role: 'Medical Officer',
        phone: '+91 94443 34560',
        qrCode: 'STAFF:TAMBARAM:stf-tam-01:Dr. S. Vijay',
        status: 'Present',
        checkInTime: '08:30 AM',
        checkOutTime: null
      }
    ]
  }
];

export const INITIAL_TRANSFERS = [
  {
    id: 'trf-2026-001',
    requestingPhcId: 'phc-medavakkam',
    requestingPhcName: 'Medavakkam Primary Health Centre',
    sourcePhcId: 'phc-sholinganallur',
    sourcePhcName: 'Sholinganallur Primary Health Centre',
    medicineId: 'med-amx-500',
    medicineName: 'Amoxicillin 500mg',
    quantity: 120,
    unit: 'Strips',
    urgency: 'Urgent', // 'Routine' | 'Urgent' | 'Emergency'
    status: 'Pending DHO Approval', // 'Pending DHO Approval' | 'Approved' | 'Dispatched' | 'Completed' | 'Rejected'
    reason: 'Stock below critical minimum threshold (180 strips remaining vs 250 min threshold)',
    requestedBy: 'Senthil Kumar (Pharmacist)',
    requestedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    dhoApprovedBy: null,
    dhoApprovedAt: null,
    dispatchedBy: null,
    dispatchedAt: null,
    receivedBy: null,
    receivedAt: null,
    dispatchNotes: ''
  },
  {
    id: 'trf-2026-000',
    requestingPhcId: 'phc-kovalam',
    requestingPhcName: 'Kovalam Coastal Primary Health Centre',
    sourcePhcId: 'phc-sholinganallur',
    sourcePhcName: 'Sholinganallur Primary Health Centre',
    medicineId: 'med-pcm-500',
    medicineName: 'Paracetamol 500mg',
    quantity: 200,
    unit: 'Strips',
    urgency: 'Routine',
    status: 'Completed',
    reason: 'Routine seasonal replenishment ahead of monsoon festival',
    requestedBy: 'Karthik N (Pharmacist)',
    requestedAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    dhoApprovedBy: 'Dr. V. Sundaram (DHO)',
    dhoApprovedAt: new Date(Date.now() - 1000 * 60 * 60 * 20).toISOString(),
    dispatchedBy: 'Vigneshwaran S',
    dispatchedAt: new Date(Date.now() - 1000 * 60 * 60 * 16).toISOString(),
    receivedBy: 'Karthik N',
    receivedAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
    dispatchNotes: 'Delivered via District Health Logistics Van #TN-09-G-4412'
  }
];

export const INITIAL_ALERTS = [
  {
    id: 'alt-01',
    phcId: 'phc-medavakkam',
    phcName: 'Medavakkam Primary Health Centre',
    type: 'critical', // 'critical' | 'warning' | 'info'
    category: 'Predicted stock-out risk',
    title: 'Anti-Rabies Vaccine Stock-Out Risk',
    tamilTitle: 'வெறிநாய்க்கடி தடுப்பூசி தீரும் அபாயம்',
    message: 'Current stock is 22 Vials (safety threshold: 35). Projected zero stock in 3.6 days at current burn rate of 6 vials/day.',
    timestamp: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    status: 'Active', // 'Active' | 'Acknowledged' | 'Resolved'
    acknowledgedBy: null
  },
  {
    id: 'alt-02',
    phcId: 'phc-medavakkam',
    phcName: 'Medavakkam Primary Health Centre',
    type: 'warning',
    category: 'Low medicine stock',
    title: 'Amoxicillin 500mg Below Minimum Stock',
    tamilTitle: 'அமாக்ஸிசிலின் குறைந்த இருப்பு நிலை',
    message: 'Stock at 180 Strips (minimum threshold: 250 Strips). Inter-PHC transfer recommendation generated.',
    timestamp: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
    status: 'Active',
    acknowledgedBy: null
  },
  {
    id: 'alt-03',
    phcId: 'phc-sholinganallur',
    phcName: 'Sholinganallur Primary Health Centre',
    type: 'critical',
    category: 'Low bed availability',
    title: 'High Bed Occupancy Alert (90%)',
    tamilTitle: 'படுக்கை நிரம்பல் எச்சரிக்கை (90%)',
    message: '27 of 30 beds occupied. Only 3 available beds remaining. Divert elective admissions to nearby centers.',
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    status: 'Active',
    acknowledgedBy: null
  },
  {
    id: 'alt-04',
    phcId: 'phc-medavakkam',
    phcName: 'Medavakkam Primary Health Centre',
    type: 'warning',
    category: 'Staff availability gap',
    title: 'Staff Duty Coverage Below 60%',
    tamilTitle: 'பணியாளர் இருப்பு குறைவு எச்சரிக்கை',
    message: 'Only 3 of 5 sanctioned staff currently checked in (60% threshold). Lab Technician is absent today.',
    timestamp: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    status: 'Active',
    acknowledgedBy: null
  },
  {
    id: 'alt-05',
    phcId: 'phc-medavakkam',
    phcName: 'Medavakkam Primary Health Centre',
    type: 'info',
    category: 'Transfer request updates',
    title: 'Transfer Request #trf-2026-001 Under DHO Review',
    tamilTitle: 'பரிமாற்ற கோரிக்கை மாவட்ட அதிகாரி பரிசீலனை',
    message: 'Request for 120 strips Amoxicillin sent to Sholinganallur PHC is currently awaiting District Health Officer approval.',
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    status: 'Active',
    acknowledgedBy: null
  },
  {
    id: 'alt-06',
    phcId: 'phc-tambaram',
    phcName: 'Tambaram Rural Primary Health Centre',
    type: 'warning',
    category: 'PHC data that needs updating',
    title: 'PHC Data & Cold Chain Audit Overdue',
    tamilTitle: 'ஆரம்ப சுகாதார நிலைய தரவு புதுப்பிப்பு தேவை',
    message: 'Monthly vaccine refrigerator temperature logs and emergency contact details have not been re-verified in over 30 days.',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    status: 'Active',
    acknowledgedBy: null
  }
];

const ONE_HOUR_MS = 1000 * 60 * 60;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

export const INITIAL_AUDIT_LOGS = [
  // --- TODAY (5 records) ---
  {
    id: 'log-01',
    timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 mins ago
    phcId: 'phc-medavakkam',
    phcName: 'Medavakkam Primary Health Centre',
    district: 'Chengalpattu',
    user: 'Senthil Kumar',
    role: 'Pharmacist',
    action: 'Medicine Check-Out',
    resource: 'Medicine',
    details: 'Issued 15 strips of Paracetamol 500mg (Batch #PCM-2026-A1). Stock updated: 865 -> 850.',
    processingTimeMs: 420
  },
  {
    id: 'log-02',
    timestamp: new Date(Date.now() - 45 * 60 * 1000).toISOString(), // 45 mins ago
    phcId: 'phc-sholinganallur',
    phcName: 'Sholinganallur Primary Health Centre',
    district: 'Chennai',
    user: 'Nurse Malarvizhi K',
    role: 'Staff Nurse',
    action: 'Bed Occupancy Update',
    resource: 'Bed',
    details: 'Admitted 2 patients to Inpatient Ward. Occupied beds increased: 25 -> 27. Available beds: 3 of 30.',
    processingTimeMs: 310
  },
  {
    id: 'log-03',
    timestamp: new Date(Date.now() - 90 * 60 * 1000).toISOString(), // 1.5 hours ago
    phcId: 'phc-medavakkam',
    phcName: 'Medavakkam Primary Health Centre',
    district: 'Chengalpattu',
    user: 'Senthil Kumar',
    role: 'Pharmacist',
    action: 'Transfer Request Created',
    resource: 'Transfer',
    details: 'Requested 120 strips Amoxicillin 500mg from Sholinganallur PHC (#trf-2026-001). Urgency: Urgent.',
    processingTimeMs: 650
  },
  {
    id: 'log-04',
    timestamp: new Date(Date.now() - 150 * 60 * 1000).toISOString(), // 2.5 hours ago
    phcId: 'phc-kovalam',
    phcName: 'Kovalam Coastal Primary Health Centre',
    district: 'Chengalpattu',
    user: 'Dr. G. Balaji',
    role: 'Medical Officer',
    action: 'QR Staff Attendance',
    resource: 'Staff',
    details: 'Dr. G. Balaji logged arrival check-in via unique optical QR passport. Verified on-duty.',
    processingTimeMs: 280
  },
  {
    id: 'log-05',
    timestamp: new Date(Date.now() - 240 * 60 * 1000).toISOString(), // 4 hours ago
    phcId: 'phc-medavakkam',
    phcName: 'Medavakkam Primary Health Centre',
    district: 'Chengalpattu',
    user: 'Senthil Kumar',
    role: 'Pharmacist',
    action: 'Medicine Check-In',
    resource: 'Medicine',
    details: 'Received delivery of 100 sachets ORS (Batch #ORS-2026-11). Stock restocked: 820 -> 920.',
    processingTimeMs: 510
  },

  // --- PAST 2 - 6 DAYS (Included in Past 7 Days & Past 30 Days) (5 records) ---
  {
    id: 'log-06',
    timestamp: new Date(Date.now() - 2 * ONE_DAY_MS - 2 * ONE_HOUR_MS).toISOString(), // 2 days ago
    phcId: 'phc-sholinganallur',
    phcName: 'Sholinganallur Primary Health Centre',
    district: 'Chennai',
    user: 'Vigneshwaran S',
    role: 'Pharmacist',
    action: 'Medicine Check-In',
    resource: 'Medicine',
    details: 'Received scheduled delivery of 200 vials Anti-Rabies Vaccine (Batch #RAB-2026-S9) from TNMSC Cold Chain Hub.',
    processingTimeMs: 440
  },
  {
    id: 'log-07',
    timestamp: new Date(Date.now() - 3 * ONE_DAY_MS - 4 * ONE_HOUR_MS).toISOString(), // 3 days ago
    phcId: 'phc-kovalam',
    phcName: 'Kovalam Coastal Primary Health Centre',
    district: 'Chengalpattu',
    user: 'Karthik N',
    role: 'Pharmacist',
    action: 'Stock Shortage Alert',
    resource: 'Medicine',
    details: 'Automated threshold alert: Paracetamol 500mg dropped below 200 strips safety threshold (Current: 185).',
    processingTimeMs: 310
  },
  {
    id: 'log-08',
    timestamp: new Date(Date.now() - 4 * ONE_DAY_MS - 1 * ONE_HOUR_MS).toISOString(), // 4 days ago
    phcId: 'phc-tambaram',
    phcName: 'Tambaram Rural Primary Health Centre',
    district: 'Chengalpattu',
    user: 'Dr. S. Vijay',
    role: 'Medical Officer',
    action: 'Bed Discharge Update',
    resource: 'Bed',
    details: 'Discharged 3 recovered maternity ward patients. Occupied beds: 11 -> 8. Available beds: 12.',
    processingTimeMs: 270
  },
  {
    id: 'log-09',
    timestamp: new Date(Date.now() - 5 * ONE_DAY_MS - 5 * ONE_HOUR_MS).toISOString(), // 5 days ago
    phcId: 'phc-medavakkam',
    phcName: 'Medavakkam Primary Health Centre',
    district: 'Chengalpattu',
    user: 'Dr. K. Ramesh',
    role: 'Chief Medical Officer',
    action: 'Patient Footfall Count',
    resource: 'Footfall',
    details: 'Recorded daily outpatient census: 158 aggregate consultations completed with zero PII retention.',
    processingTimeMs: 230
  },
  {
    id: 'log-10',
    timestamp: new Date(Date.now() - 6 * ONE_DAY_MS - 3 * ONE_HOUR_MS).toISOString(), // 6 days ago
    phcId: 'phc-kanchipuram-hq',
    phcName: 'Kanchipuram District Health Office',
    district: 'Kanchipuram',
    user: 'Dr. V. Sundaram',
    role: 'District Health Officer',
    action: 'Transfer Approved by DHO',
    resource: 'Transfer',
    details: 'DHO Dr. V. Sundaram authorized transfer #trf-2026-000: 200 strips Paracetamol from Sholinganallur to Kovalam.',
    processingTimeMs: 480
  },

  // --- PAST 8 - 28 DAYS (Included in Past 30 Days, excluded from Past 7 Days) (4 records) ---
  {
    id: 'log-11',
    timestamp: new Date(Date.now() - 10 * ONE_DAY_MS - 2 * ONE_HOUR_MS).toISOString(), // 10 days ago
    phcId: 'phc-kovalam',
    phcName: 'Kovalam Coastal Primary Health Centre',
    district: 'Chengalpattu',
    user: 'Karthik N',
    role: 'Pharmacist',
    action: 'Transfer Receipt Confirmed',
    resource: 'Transfer',
    details: 'Confirmed delivery receipt of 200 strips Paracetamol 500mg via Van #TN-09-G-4412. Stock restocked to 750.',
    processingTimeMs: 360
  },
  {
    id: 'log-12',
    timestamp: new Date(Date.now() - 14 * ONE_DAY_MS - 6 * ONE_HOUR_MS).toISOString(), // 14 days ago
    phcId: 'phc-sholinganallur',
    phcName: 'Sholinganallur Primary Health Centre',
    district: 'Chennai',
    user: 'Dr. Anita Rajan',
    role: 'Chief Medical Officer',
    action: 'Patient Footfall Count',
    resource: 'Footfall',
    details: 'Special immunization outreach: recorded 268 aggregate patient visits. Footfall surge handled successfully.',
    processingTimeMs: 250
  },
  {
    id: 'log-13',
    timestamp: new Date(Date.now() - 20 * ONE_DAY_MS - 1 * ONE_HOUR_MS).toISOString(), // 20 days ago
    phcId: 'phc-kanchipuram-hq',
    phcName: 'Kanchipuram District Health Office',
    district: 'Kanchipuram',
    user: 'Dr. V. Sundaram',
    role: 'District Health Officer',
    action: 'PHC Verification Approved',
    resource: 'Staff',
    details: 'Official state onboarding verification granted to Tambaram Rural PHC after physical inspection.',
    processingTimeMs: 620
  },
  {
    id: 'log-14',
    timestamp: new Date(Date.now() - 26 * ONE_DAY_MS - 3 * ONE_HOUR_MS).toISOString(), // 26 days ago
    phcId: 'phc-medavakkam',
    phcName: 'Medavakkam Primary Health Centre',
    district: 'Chengalpattu',
    user: 'Senthil Kumar',
    role: 'Pharmacist',
    action: 'Medicine Check-In',
    resource: 'Medicine',
    details: 'Quarterly state quota restock: received 500 strips Metformin 500mg and 400 sachets ORS.',
    processingTimeMs: 530
  },

  // --- OLDER THAN 30 DAYS (Included only in All Records) (2 records) ---
  {
    id: 'log-15',
    timestamp: new Date(Date.now() - 36 * ONE_DAY_MS - 4 * ONE_HOUR_MS).toISOString(), // 36 days ago
    phcId: 'phc-sholinganallur',
    phcName: 'Sholinganallur Primary Health Centre',
    district: 'Chennai',
    user: 'Central State Admin',
    role: 'Platform Administrator',
    action: 'Bed Capacity Update',
    resource: 'Bed',
    details: 'Sanctioned ward expansion: Inpatient bed capacity increased from 25 to 30 beds by State Health Mission.',
    processingTimeMs: 410
  },
  {
    id: 'log-16',
    timestamp: new Date(Date.now() - 48 * ONE_DAY_MS - 8 * ONE_HOUR_MS).toISOString(), // 48 days ago
    phcId: 'phc-medavakkam',
    phcName: 'Medavakkam Primary Health Centre',
    district: 'Chengalpattu',
    user: 'Dr. K. Ramesh',
    role: 'Chief Medical Officer',
    action: 'System Initialization',
    resource: 'Staff',
    details: 'PHC node connected to In One Hand clinical network mesh. Initial catalog and census established.',
    processingTimeMs: 780
  }
];

export const TIME_SERIES_STOCK_HISTORY = [
  { day: 'Day -6', 'Paracetamol 500mg': 1100, 'Amoxicillin 500mg': 320, 'Anti-Rabies ARV': 45, 'Insulin Glargine': 80 },
  { day: 'Day -5', 'Paracetamol 500mg': 1050, 'Amoxicillin 500mg': 290, 'Anti-Rabies ARV': 40, 'Insulin Glargine': 76 },
  { day: 'Day -4', 'Paracetamol 500mg': 980, 'Amoxicillin 500mg': 260, 'Anti-Rabies ARV': 36, 'Insulin Glargine': 74 },
  { day: 'Day -3', 'Paracetamol 500mg': 940, 'Amoxicillin 500mg': 230, 'Anti-Rabies ARV': 31, 'Insulin Glargine': 71 },
  { day: 'Day -2', 'Paracetamol 500mg': 910, 'Amoxicillin 500mg': 210, 'Anti-Rabies ARV': 28, 'Insulin Glargine': 69 },
  { day: 'Yesterday', 'Paracetamol 500mg': 880, 'Amoxicillin 500mg': 195, 'Anti-Rabies ARV': 25, 'Insulin Glargine': 67 },
  { day: 'Today', 'Paracetamol 500mg': 850, 'Amoxicillin 500mg': 180, 'Anti-Rabies ARV': 22, 'Insulin Glargine': 65 }
];

export const TIME_SERIES_BED_HISTORY = [
  { day: 'Day -6', occupied: 11, available: 13 },
  { day: 'Day -5', occupied: 12, available: 12 },
  { day: 'Day -4', occupied: 14, available: 10 },
  { day: 'Day -3', occupied: 13, available: 11 },
  { day: 'Day -2', occupied: 15, available: 9 },
  { day: 'Yesterday', occupied: 15, available: 9 },
  { day: 'Today', occupied: 16, available: 8 }
];

export const TIME_SERIES_FOOTFALL_HISTORY = [
  { day: 'Mon', footfall: 118, regularRegistered: 450 },
  { day: 'Tue', footfall: 134, regularRegistered: 450 },
  { day: 'Wed', footfall: 122, regularRegistered: 450 },
  { day: 'Thu', footfall: 145, regularRegistered: 450 },
  { day: 'Fri', footfall: 158, regularRegistered: 450 },
  { day: 'Sat', footfall: 104, regularRegistered: 450 },
  { day: 'Today', footfall: 142, regularRegistered: 450 }
];

export const TIME_SERIES_TRANSFERS_HISTORY = [
  { month: 'Oct', requests: 8, completed: 8, avgDays: 1.2 },
  { month: 'Nov', requests: 12, completed: 11, avgDays: 1.4 },
  { month: 'Dec', requests: 15, completed: 14, avgDays: 0.9 },
  { month: 'Jan', requests: 10, completed: 10, avgDays: 1.1 },
  { month: 'Feb', requests: 14, completed: 13, avgDays: 1.0 },
  { month: 'Current', requests: 9, completed: 7, avgDays: 0.8 }
];

export const PRESET_QR_CODES = [
  {
    label: 'Paracetamol 500mg (Batch #PCM-2026-A1)',
    code: 'MED:med-pcm-500:PCM-2026-A1:2027-08-15:Paracetamol 500mg'
  },
  {
    label: 'Amoxicillin 500mg (Batch #AMX-2026-03)',
    code: 'MED:med-amx-500:AMX-2026-03:2027-04-10:Amoxicillin 500mg'
  },
  {
    label: 'Anti-Rabies Vaccine (Batch #RAB-2026-02)',
    code: 'MED:med-rab-vial:RAB-2026-02:2026-11-15:Anti-Rabies Vaccine'
  },
  {
    label: 'Insulin Glargine (Batch #INS-2026-09)',
    code: 'MED:med-ins-glar:INS-2026-09:2027-03-30:Insulin Glargine'
  },
  {
    label: 'Staff: Dr. Priya Raman (Medical Officer)',
    code: 'STAFF:MEDAVAKKAM:stf-med-01:Dr. Priya Raman'
  },
  {
    label: 'Staff: Nurse Deepa V (Staff Nurse)',
    code: 'STAFF:MEDAVAKKAM:stf-med-02:Nurse Deepa V'
  },
  {
    label: 'Staff: Senthil Kumar (Pharmacist)',
    code: 'STAFF:MEDAVAKKAM:stf-med-03:Senthil Kumar'
  }
];
