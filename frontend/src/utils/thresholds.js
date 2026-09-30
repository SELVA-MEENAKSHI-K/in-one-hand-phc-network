/**
 * In One Hand — Shared Thresholds & Risk Calculation Engine
 * 
 * Enforces unified thresholds across:
 * - Demand Forecasting (Module 7)
 * - Alerts Center (Module 9)
 * - PHC Network Dashboard (Module 2)
 * - Inter-PHC Transfer Recommender (Module 8)
 * - Medicine Inventory (Module 5)
 */

export const RISK_THRESHOLDS = {
  CRITICAL_DAYS: 3.0, // Stockout expected within < 3.0 days or stock < 50% minThreshold
  WARNING_DAYS: 7.0,  // Caution: depleting within 3.0 to 7.0 days or stock < minThreshold
  MODERATE_DAYS: 10.0 // Moderate buffer: 7.1 to 10.0 days
  // Adequate Reserve: > 10.0 days
};

export const THRESHOLD_RULE_DESCRIPTION = 
  'Configured Risk Thresholds: Critical Hazard (< 3.0 Days) | Depleting Caution (3.0 – 7.0 Days) | Moderate Buffer (7.1 – 10.0 Days) | Adequate Reserve (> 10.0 Days)';

/**
 * Calculates standardized risk metrics for any medicine SKU
 * @param {Object} medicine
 * @param {number} medicine.quantity
 * @param {number} [medicine.dailyUsageRate]
 * @param {number} [medicine.minThreshold]
 * @returns {Object} Standardized risk object
 */
export function calculateMedicineRisk(medicine) {
  if (!medicine) {
    return {
      daysRemaining: 0,
      riskLevel: 'SAFE',
      statusLabel: 'No Data',
      badgeClass: 'badge-muted',
      thresholdRule: THRESHOLD_RULE_DESCRIPTION
    };
  }

  const quantity = Number(medicine.quantity) || 0;
  const dailyRate = Number(medicine.dailyUsageRate) || 20;
  const minThreshold = Number(medicine.minThreshold) || 100;
  const daysRemaining = dailyRate > 0 ? Number((quantity / dailyRate).toFixed(1)) : 999;

  let riskLevel = 'SAFE';
  let statusLabel = `Adequate Reserve (> ${RISK_THRESHOLDS.MODERATE_DAYS} Days)`;
  let badgeClass = 'badge-success';

  if (daysRemaining < RISK_THRESHOLDS.CRITICAL_DAYS || quantity < minThreshold * 0.5) {
    riskLevel = 'CRITICAL';
    statusLabel = `Critical Shortage (< ${RISK_THRESHOLDS.CRITICAL_DAYS} Days)`;
    badgeClass = 'badge-danger';
  } else if (daysRemaining <= RISK_THRESHOLDS.WARNING_DAYS || quantity < minThreshold) {
    riskLevel = 'WARNING';
    statusLabel = `Caution: Depleting (${RISK_THRESHOLDS.CRITICAL_DAYS} – ${RISK_THRESHOLDS.WARNING_DAYS} Days)`;
    badgeClass = 'badge-warning';
  } else if (daysRemaining <= RISK_THRESHOLDS.MODERATE_DAYS) {
    riskLevel = 'MODERATE';
    statusLabel = `Moderate Buffer (${(RISK_THRESHOLDS.WARNING_DAYS + 0.1).toFixed(1)} – ${RISK_THRESHOLDS.MODERATE_DAYS} Days)`;
    badgeClass = 'badge-info';
  } else {
    riskLevel = 'SAFE';
    statusLabel = `Adequate Reserve (> ${RISK_THRESHOLDS.MODERATE_DAYS} Days)`;
    badgeClass = 'badge-success';
  }

  return {
    daysRemaining,
    riskLevel,
    statusLabel,
    badgeClass,
    thresholdRule: THRESHOLD_RULE_DESCRIPTION
  };
}

/**
 * Standard calculation for bed availability across the application
 * Formula: available beds = total beds - occupied beds
 * Clamps occupied beds to [0, totalCapacity]
 * @param {number} totalCapacity 
 * @param {number} occupiedBeds 
 * @returns {{ validOccupied: number, availableBeds: number, occupancyRate: number }}
 */
export function calculateBedMetrics(totalCapacity, occupiedBeds) {
  const total = Math.max(0, Number(totalCapacity) || 0);
  const rawOccupied = Number(occupiedBeds) || 0;
  const validOccupied = Math.max(0, Math.min(rawOccupied, total));
  const availableBeds = Math.max(0, total - validOccupied);
  const occupancyRate = total > 0 ? Math.round((validOccupied / total) * 100) : 0;

  return {
    totalBeds: total,
    validOccupied,
    availableBeds,
    occupancyRate
  };
}
