export const APPROVAL_NOTIFICATION_TYPES = new Set([
  'deal_approval_requested',
  'quotation_approval_requested',
  'lead_approval_requested',
  'purchase_order_approval_requested',
]);

export const notificationEntityLink = (payload) => {
  const type = payload?.entityType || payload?.entity_type;
  const id = payload?.entityId ?? payload?.entity_id;
  if (!type || id == null) return null;

  switch (type) {
    case 'deal':
      return `/erp/deals/view/${id}`;
    case 'lead':
      return `/erp/leads/edit/${id}`;
    case 'quotation':
      return `/erp/quotations/view/${id}`;
    case 'purchase_order':
      return `/erp/purchase-orders/view/${id}`;
    case 'inspection_request':
      return `/erp/inspection-requests/${id}`;
    default:
      return null;
  }
};
