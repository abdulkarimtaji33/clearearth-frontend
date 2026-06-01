export const getClientLabel = (deal) => {
  if (!deal) return '—';
  const lead = deal.lead;
  if (lead?.company?.company_name) return lead.company.company_name;
  if (deal.company?.company_name) return deal.company.company_name;
  if (lead?.contact) {
    return [lead.contact.first_name, lead.contact.last_name].filter(Boolean).join(' ') || lead.lead_number || '—';
  }
  if (deal.contact) {
    return [deal.contact.first_name, deal.contact.last_name].filter(Boolean).join(' ') || '—';
  }
  return lead?.lead_number || '—';
};

export const getContactDetails = (deal) => {
  if (!deal) return { name: null, phone: null, email: null };
  const lead = deal.lead;
  const companyName = lead?.company?.company_name || deal.company?.company_name;
  let name = null;
  if (lead?.contact && companyName) {
    name = [lead.contact.first_name, lead.contact.last_name].filter(Boolean).join(' ');
  } else if (deal.contact && deal.company?.company_name) {
    name = [deal.contact.first_name, deal.contact.last_name].filter(Boolean).join(' ');
  } else if (lead?.contact) {
    name = [lead.contact.first_name, lead.contact.last_name].filter(Boolean).join(' ');
  } else if (deal.contact) {
    name = [deal.contact.first_name, deal.contact.last_name].filter(Boolean).join(' ');
  }
  const phone = lead?.phone || lead?.contact?.phone || deal.contact?.phone || null;
  const email = lead?.email || lead?.contact?.email || deal.contact?.email || null;
  return { name, phone, email };
};

export const getSalesPerson = (deal) => {
  const u = deal?.assignedUser || deal?.assigned_user;
  if (!u) return null;
  return {
    name: [u.first_name, u.last_name].filter(Boolean).join(' ') || u.email || '—',
    phone: u.phone || null,
  };
};
