import { AssetType } from '../types';

/**
 * Returns the total platform commission rate.
 * We charge a flat 10% (0.10) platform fee across all asset types.
 * 
 * @param type The type of the asset
 * @returns The decimal commission rate (e.g. 0.10 for 10%)
 */
export const getCommissionRate = (type?: AssetType | string): number => {
    return 0.10; // Flat 10% fee across the board
};

/**
 * The percentage of the total commission that is paid by the Renter.
 * Currently set so Renter pays the full 10% on top of the base price.
 */
export const RENTER_COMMISSION_SHARE = 1.0;

/**
 * The percentage of the total commission that is deducted from the Fleet Owner.
 * Currently set so the Owner also pays a 10% deduction out of the base price.
 */
export const OWNER_COMMISSION_SHARE = 1.0;
