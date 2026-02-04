/**
 * Valida si un conductor tiene datos bancarios completos.
 * Usa la misma lógica que el backend (withdrawal-requests).
 */
export interface ProfileBankFields {
  bank_account_type?: string | null;
  bank_cbu?: string | null;
  bank_cvu?: string | null;
  bank_alias?: string | null;
  bank_name?: string | null;
  bank_account_number?: string | null;
  bank_account_holder_name?: string | null;
}

export function hasCompleteBankData(profile: ProfileBankFields | null | undefined): boolean {
  if (!profile) return false;

  const accountType = (profile.bank_account_type || '').trim().toLowerCase();
  const holder = (profile.bank_account_holder_name || '').trim();

  if (!holder) return false;
  if (!accountType) return false;

  switch (accountType) {
    case 'cbu':
      return !!(profile.bank_cbu || '').trim();
    case 'cvu':
      return !!(profile.bank_cvu || '').trim();
    case 'alias':
      return !!(profile.bank_alias || '').trim();
    case 'checking':
    case 'savings':
      return (
        !!(profile.bank_name || '').trim() &&
        !!(profile.bank_account_number || '').trim()
      );
    default:
      return false;
  }
}
