/** Purchase bills linked to a work order (document_type = bill). */
export const getWorkOrderPurchaseBills = (wo) => {
  if (!wo) return { clientBill: null, vendorBill: null, all: [] };
  const all = wo.purchase_bills || wo.purchaseBills || [];
  return {
    all,
    clientBill: all.find((b) => b.company_id) || null,
    vendorBill: all.find((b) => b.supplier_id) || null,
  };
};

export const getPoSourceWorkOrderBills = (po) => {
  const wo = po?.sourceWorkOrder || po?.source_work_order;
  return getWorkOrderPurchaseBills(wo);
};

export const billListPath = (bill) => {
  if (bill?.company_id) return '/erp/client-purchase-orders';
  return '/erp/supplier-purchase-orders';
};

export const buildBillCreateUrl = ({ dealId, workOrderId, companyId, supplierId }) => {
  const params = new URLSearchParams({ bill: '1' });
  if (dealId) params.set('dealId', String(dealId));
  if (workOrderId) params.set('workOrderId', String(workOrderId));
  if (companyId) params.set('companyId', String(companyId));
  if (supplierId) params.set('supplierId', String(supplierId));
  return `/erp/purchase-orders/create?${params.toString()}`;
};
