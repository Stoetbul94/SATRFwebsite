/**
 * Optional organisation defaults for Call for Entries.
 * Values come from verified env configuration only — never fabricated.
 */
export type OrganisationBankingDefaults = {
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  branchCode?: string;
  electronicBranchCode?: string;
  paymentNotes?: string;
};

export type OrganisationContactDefaults = {
  name?: string;
  phone?: string;
  email?: string;
};

export function getOrganisationBankingDefaults(): OrganisationBankingDefaults {
  const bankName = process.env.SATRF_ORG_BANK_NAME?.trim();
  const accountName = process.env.SATRF_ORG_BANK_ACCOUNT_NAME?.trim();
  const accountNumber = process.env.SATRF_ORG_BANK_ACCOUNT_NUMBER?.trim();
  const branchCode = process.env.SATRF_ORG_BANK_BRANCH_CODE?.trim();
  const electronicBranchCode = process.env.SATRF_ORG_BANK_ELECTRONIC_CODE?.trim();
  const paymentNotes = process.env.SATRF_ORG_PAYMENT_NOTES?.trim();

  return {
    ...(bankName && { bankName }),
    ...(accountName && { accountName }),
    ...(accountNumber && { accountNumber }),
    ...(branchCode && { branchCode }),
    ...(electronicBranchCode && { electronicBranchCode }),
    ...(paymentNotes && { paymentNotes }),
  };
}

export function getOrganisationContactDefaults(): OrganisationContactDefaults {
  const name = process.env.SATRF_ORG_CONTACT_NAME?.trim();
  const phone = process.env.SATRF_ORG_CONTACT_PHONE?.trim();
  const email = process.env.SATRF_ORG_CONTACT_EMAIL?.trim() || 'support@satrf.org.za';

  return {
    ...(name && { name }),
    ...(phone && { phone }),
    ...(email && { email }),
  };
}
