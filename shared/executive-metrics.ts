// Amounts use the same minor units (halalas) as PaymentDocument and the wallet API.
export function executiveMetrics(documents?: readonly { amount: number; status: string }[]) {
  const paid = documents?.filter(document => document.status === 'paid') ?? [];
  const totalPaid = paid.reduce((total, document) => total + document.amount, 0);
  return {
    hasDocuments: Boolean(documents?.length),
    paidCount: paid.length,
    totalPaid,
    averageOrderValue: paid.length ? totalPaid / paid.length : 0,
    activeOrders: documents?.filter(document => ['pending', 'published', 'processing', 'active', 'charging', 'review'].includes(document.status)).length ?? 0,
  };
}
