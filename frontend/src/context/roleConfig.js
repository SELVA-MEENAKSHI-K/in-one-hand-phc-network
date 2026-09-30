export const VALID_TABS = [
  'dashboard',
  'phc-details',
  'resources',
  'medicines',
  'attendance',
  'alerts',
  'transfers',
  'forecast',
  'federated',
  'reports',
  'auth'
];

// Where each role lands right after sign-in
export const ROLE_HOME = {
  phc_staff: 'medicines',
  phc_admin: 'dashboard',
  district_officer: 'transfers',
  platform_admin: 'auth'
};

// Tabs each role can open (everything else is hidden from nav and redirected)
export const ROLE_TABS = {
  phc_staff: ['dashboard', 'phc-details', 'resources', 'medicines', 'attendance', 'alerts', 'transfers', 'forecast', 'reports'],
  phc_admin: ['dashboard', 'phc-details', 'resources', 'medicines', 'attendance', 'alerts', 'transfers', 'forecast', 'reports', 'auth'],
  district_officer: ['dashboard', 'phc-details', 'alerts', 'transfers', 'forecast', 'federated', 'reports'],
  platform_admin: VALID_TABS
};

export const getUserNameForRole = (role) => {
  switch (role) {
    case 'phc_staff':
      return 'Senthil Kumar (Pharmacist)';
    case 'phc_admin':
      return 'Dr. K. Ramesh (CMO & Admin)';
    case 'district_officer':
      return 'Dr. V. Sundaram (District Health Officer)';
    case 'platform_admin':
      return 'Central State Admin (Platform Ops)';
    default:
      return 'Authorised Officer';
  }
};

export const getRoleTitle = (role) => {
  switch (role) {
    case 'phc_staff':
      return 'PHC Staff';
    case 'phc_admin':
      return 'PHC Administrator';
    case 'district_officer':
      return 'District Health Officer';
    case 'platform_admin':
      return 'Platform Administrator';
    default:
      return 'User';
  }
};
