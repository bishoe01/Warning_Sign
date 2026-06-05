export const CONTRACT_TYPES = [
  {
    value: 'manufacturing_construction_service',
    labelKey: 'manufacturingConstructionService',
  },
  {
    value: 'agriculture_livestock_fishery',
    labelKey: 'agricultureLivestockFishery',
  },
] as const;

export type ContractType = (typeof CONTRACT_TYPES)[number]['value'];

export const DEFAULT_CONTRACT_TYPE: ContractType = 'manufacturing_construction_service';

export function isContractType(value: string | null | undefined): value is ContractType {
  return CONTRACT_TYPES.some((option) => option.value === value);
}

export function normalizeContractType(value: string | null | undefined): ContractType {
  return isContractType(value) ? value : DEFAULT_CONTRACT_TYPE;
}
