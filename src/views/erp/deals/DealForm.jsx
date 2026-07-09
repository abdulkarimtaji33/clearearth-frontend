import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Autocomplete,
  Divider,
  Stack,
  Paper,
  IconButton,
  Checkbox,
  FormControlLabel,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import { Formik } from 'formik';
import * as Yup from 'yup';
import { useNavigate, useParams } from 'react-router';
import { useDropzone } from 'react-dropzone';
import { IconArrowLeft, IconPlus, IconTrash, IconPhoto, IconReceipt, IconShoppingCart, IconFileDescription, IconInfoCircle, IconMapPin, IconExternalLink, IconShare, IconCopy, IconCheck } from '@tabler/icons-react';
import LocationPickerDialog from '../../../components/LocationPickerDialog';
import Tooltip from '@mui/material/Tooltip';
import PageContainer from '../../../components/container/PageContainer';
import ApprovalWorkflowDialogs from '../../../components/erp/ApprovalWorkflowDialogs';
import UomSelectField from '../../../components/erp/UomSelectField';
import { parseSupportingDocuments, isImageDocumentPath } from '../../../utils/inspectionRequestHelpers';
import apiService from '../../../services/api';
import { useAuth } from '../../../context/AuthContext';
import { canChangeRecordStatus, formatStatusLabel } from '../../../utils/recordStatus';

const DEAL_APPROVAL_ELIGIBLE_STATUSES = ['new'];
const DEAL_QUOTABLE_STATUSES = ['approved', 'quotation_sent', 'negotiation', 'won'];

const validationSchema = Yup.object({
  leadId: Yup.number().nullable().required('Lead is required'),
  companyId: Yup.number().nullable().required('Company is required'),
  contactId: Yup.number().nullable().required('Contact person is required'),
  dealType: Yup.string().trim().required('Deal type is required'),
  logisticsKind: Yup.string().nullable().when(['dealType', 'wdsRequired'], {
    is: (dealType, wdsRequired) => dealType === 'offer_to_charge' && wdsRequired,
    then: (s) => s.oneOf(['container', 'cargo']).required('Select container or cargo type'),
    otherwise: (s) => s.oneOf(['', 'container', 'cargo']).nullable(),
  }),
  containerType: Yup.string().nullable().when(['dealType', 'wdsRequired', 'logisticsKind'], {
    is: (dealType, wdsRequired, logisticsKind) =>
      dealType === 'offer_to_charge' && wdsRequired && logisticsKind === 'cargo',
    then: (s) => s.oneOf(['LCL', 'FCL']).required('Cargo type (LCL or FCL) is required'),
    otherwise: (s) => s.nullable(),
  }),
  locationType: Yup.string().nullable().when(['dealType', 'wdsRequired', 'logisticsKind'], {
    is: (dealType, wdsRequired, logisticsKind) =>
      dealType === 'offer_to_charge' && wdsRequired
      && (logisticsKind === 'container' || logisticsKind === 'cargo'),
    then: (s) => s.required('Location type is required'),
    otherwise: (s) => s.nullable(),
  }),
  currency: Yup.string().trim().required('Currency is required'),
  status: Yup.string().trim().required('Status is required'),
  dealDate: Yup.date().nullable().required('Date is required'),
  supplierId: Yup.number().nullable(),
  hasDownstreamPartner: Yup.boolean(),
  downstreamPartnerSupplierId: Yup.number().nullable(),
  title: Yup.string().trim().required('Title is required'),
  inspectionRequired: Yup.boolean().required('Inspection required is required'),
  termsAndConditionsIds: Yup.array(),
});

const DealImageDropzone = ({ onDrop }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    multiple: true,
    onDrop: (acceptedFiles) => { if (acceptedFiles.length) onDrop(acceptedFiles); },
  });
  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        p: 4,
        textAlign: 'center',
        cursor: 'pointer',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
      }}
    >
      <input {...getInputProps()} />
      <IconPhoto size={40} style={{ opacity: 0.5, marginBottom: 8 }} />
      <Typography variant="body2" color="text.secondary">
        Drag and drop images here, or click to select
      </Typography>
    </Box>
  );
};

const resolveLogisticsKind = (deal) => {
  if (deal?.deal_type !== 'offer_to_charge' || !deal.wds_required) return '';
  if (deal.container_type === 'LCL' || deal.container_type === 'FCL') return 'cargo';
  if (deal.location_type || deal.custom_inspection || deal.trakhees_inspection || deal.dubai_municipality_inspection) {
    return 'container';
  }
  return '';
};

const hasWdsContent = (wds, attachments = []) => {
  if ((attachments || []).length > 0) return true;
  const fields = [
    'refNo', 'companyName', 'licenseNo', 'wasteDescription', 'containerNo',
    'sourceProcess', 'packageType', 'quantityPerPackage', 'totalWeight', 'purpose', 'blNo', 'borNo',
  ];
  return fields.some((f) => wds[f]?.toString().trim());
};

const WdsAttachmentDropzone = ({ onDrop }) => {
  const { getRootProps, getInputProps } = useDropzone({
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'], 'application/pdf': ['.pdf'] },
    multiple: true,
    onDrop: (acceptedFiles) => { if (acceptedFiles.length) onDrop(acceptedFiles); },
  });
  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: 'divider',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: 'pointer',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
      }}
    >
      <input {...getInputProps()} />
      <IconFileDescription size={32} style={{ opacity: 0.5, marginBottom: 6 }} />
      <Typography variant="body2" color="text.secondary">
        Drag and drop files (PDF, images) or click to select
      </Typography>
    </Box>
  );
};

const INSPECTION_DOC_ACCEPT = {
  'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
  'application/pdf': ['.pdf'],
  'application/msword': ['.doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.ms-excel': ['.xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
};

const InspectionDocumentDropzone = ({ onDrop, uploading }) => {
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: INSPECTION_DOC_ACCEPT,
    multiple: true,
    onDrop: (acceptedFiles) => { if (acceptedFiles.length) onDrop(acceptedFiles); },
  });
  return (
    <Box
      {...getRootProps()}
      sx={{
        border: '2px dashed',
        borderColor: isDragActive ? 'primary.main' : 'divider',
        borderRadius: 2,
        p: 3,
        textAlign: 'center',
        cursor: uploading ? 'wait' : 'pointer',
        opacity: uploading ? 0.7 : 1,
        bgcolor: isDragActive ? 'action.hover' : 'transparent',
        '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
      }}
    >
      <input {...getInputProps()} disabled={uploading} />
      <IconFileDescription size={32} style={{ opacity: 0.5, marginBottom: 6 }} />
      <Typography variant="body2" color="text.secondary">
        {uploading ? 'Uploading…' : 'Drag and drop files here, or click to choose'}
      </Typography>
      <Typography variant="caption" color="text.disabled" display="block" mt={0.5}>
        Images, PDF, Word (.doc/.docx), Excel (.xls/.xlsx)
      </Typography>
    </Box>
  );
};

const canAssignDeals = (roleName) =>
  ['sales_manager', 'admin', 'tenant_admin', 'super_admin'].includes(roleName);

const DealForm = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, hasPermission } = useAuth();
  const roleName = user?.role?.name ?? user?.role;
  const showAssignedTo = canAssignDeals(roleName);
  const canEditDeals = hasPermission('deals.update');
  const canChangeStatus = canChangeRecordStatus(user, hasPermission, 'deals.approve');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [savedDealId, setSavedDealId] = useState(null);
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [approvalError, setApprovalError] = useState('');
  const [pinConfigured, setPinConfigured] = useState(false);

  const [leads, setLeads] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [contacts, setContacts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [termsAndConditions, setTermsAndConditions] = useState([]);
  const [addTermsDialogOpen, setAddTermsDialogOpen] = useState(false);
  const [savingTerms, setSavingTerms] = useState(false);
  const [newTermsValues, setNewTermsValues] = useState({ title: '', content: '', category: '' });
  const [newTermsErrors, setNewTermsErrors] = useState({});
  const setFieldValueRef = useRef(null);
  const valuesRef = useRef({});
  
  const [dropdowns, setDropdowns] = useState({
    dealStatus: [],
    unitsOfMeasure: [],
  });

  const [lineItems, setLineItems] = useState([]);
  const [dealImages, setDealImages] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [vatAmount, setVatAmount] = useState(0);
  const [total, setTotal] = useState(0);
  const [formDealType, setFormDealType] = useState('offer_to_purchase');

  const [initialValues, setInitialValues] = useState({
    leadId: null,
    companyId: null,
    contactId: null,
    supplierId: null,
    hasDownstreamPartner: false,
    downstreamPartnerSupplierId: null,
    title: '',
    description: '',
    dealDate: new Date().toISOString().split('T')[0],
    vatPercentage: 5,
    currency: 'AED',
    status: 'new',
    lossReason: '',
    assignedTo: null,
    termsAndConditionsIds: [],
    dealType: 'offer_to_purchase',
    logisticsKind: '',
    containerType: null,
    locationType: null,
    wdsRequired: false,
    inspectionRequired: false,
    customInspection: false,
    trakheesInspection: false,
    dubaiMunicipalityInspection: false,
    isRcmApplicable: false,
    notes: '',
    pickupLocation: '',
    pickupContactName: '',
    pickupContactNumber: '',
    servicePaymentStatus: '',
  });

  const [wdsDialogOpen, setWdsDialogOpen] = useState(false);
  const [locationDialogOpen, setLocationDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [shareLoading, setShareLoading] = useState(false);
  const [shareError, setShareError] = useState('');
  const [shareCopied, setShareCopied] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [inspectionDialogOpen, setInspectionDialogOpen] = useState(false);

  const openInspectionDialog = useCallback(() => {
    setInspectionDetails((prev) => ({
      ...prev,
      requestedBy: prev.requestedBy ?? user?.id ?? null,
    }));
    setInspectionDialogOpen(true);
  }, [user?.id]);
  const [materialTypes, setMaterialTypes] = useState([]);
  const SAFETY_TOOL_OPTIONS = [
    { value: 'safety_jacket', label: 'Safety Jacket' },
    { value: 'safety_shoes', label: 'Safety Shoes' },
    { value: 'safety_coverall', label: 'Safety Coverall' },
    { value: 'safety_helmet', label: 'Safety Helmet' },
    { value: 'safety_tools_required', label: 'Safety Tools Required' },
    { value: 'safety_mask', label: 'Safety Mask' },
    { value: 'safety_goggles', label: 'Safety Goggles' },
    { value: 'safety_gloves', label: 'Safety Gloves' },
  ];
  const [inspectionDetails, setInspectionDetails] = useState({
    materialTypeId: null,
    location: '',
    locationType: '',
    gatePassRequirement: '',
    serviceType: '',
    quantity: '',
    quantityUom: '',
    lumpsumPrice: '',
    safetyTools: [],
    supportingDocuments: [],
    requestedBy: null,
    notes: '',
    priority: 'medium',
  });
  const [wdsDetails, setWdsDetails] = useState({
    refNo: '',
    date: new Date().toISOString().split('T')[0],
    companyName: '',
    licenseNo: '',
    wasteDescription: '',
    sourceProcess: '',
    packageType: '',
    quantityPerPackage: '',
    totalWeight: '',
    containerNo: '',
    purpose: '',
    blNo: '',
    borNo: '',
  });
  const [wdsAttachments, setWdsAttachments] = useState([]);
  const [inspectionDocUploading, setInspectionDocUploading] = useState(false);

  const isEdit = Boolean(id);

  useEffect(() => {
    if (!canEditDeals) {
      if (isEdit && id) navigate(`/erp/deals/view/${id}`, { replace: true });
      else navigate('/erp/deals', { replace: true });
    }
  }, [canEditDeals, isEdit, id, navigate]);

  useEffect(() => {
    apiService.getTenant().then((res) => {
      if (res.success) setPinConfigured(Boolean(res.data?.lead_approval_pin_configured));
    }).catch(() => {});
  }, []);

  const fetchAllData = useCallback(async () => {
    const results = await Promise.allSettled([
      apiService.getLeads({ pageSize: 500 }),
      apiService.getCompanies({ pageSize: 500 }),
      apiService.getContacts({ pageSize: 500 }),
      apiService.getSuppliers({ pageSize: 500 }),
      apiService.getProducts({ pageSize: 500, status: 'active' }),
      apiService.getAssignees(),
      apiService.getTermsAndConditions({ pageSize: 500, status: 'active' }),
      apiService.getMaterialTypes(),
    ]);
    const [leadsRes, companiesRes, contactsRes, suppliersRes, productsRes, usersRes, termsRes, materialTypesRes] = results.map((r) =>
      r.status === 'fulfilled' ? r.value : null
    );
    if (leadsRes?.success) setLeads(Array.isArray(leadsRes.data) ? leadsRes.data : []);
    if (companiesRes?.success) setCompanies(Array.isArray(companiesRes.data) ? companiesRes.data : companiesRes.data?.items || []);
    if (contactsRes?.success) setContacts(Array.isArray(contactsRes.data) ? contactsRes.data : contactsRes.data?.items || []);
    if (suppliersRes?.success) setSuppliers(Array.isArray(suppliersRes.data) ? suppliersRes.data : suppliersRes.data?.items || []);
    const productsList = productsRes?.success
      ? (Array.isArray(productsRes.data) ? productsRes.data : productsRes.data?.items || [])
      : [];
    if (productsRes?.success) setProducts(productsList);
    if (usersRes?.success) setUsers(Array.isArray(usersRes.data) ? usersRes.data : usersRes.data?.items || []);
    if (termsRes?.success) setTermsAndConditions(Array.isArray(termsRes.data) ? termsRes.data : termsRes.data?.items || []);
    if (materialTypesRes?.success) setMaterialTypes(Array.isArray(materialTypesRes.data) ? materialTypesRes.data : materialTypesRes.data?.items || []);
    return { products: productsList };
  }, []);

  const fetchDropdowns = useCallback(async () => {
    try {
      const response = await apiService.getAllDropdowns();
      if (response.success) {
        setDropdowns({
          dealStatus: response.data.deal_status || [],
          unitsOfMeasure: response.data.units_of_measure || [],
        });
      }
    } catch (err) {
      console.error('Failed to fetch dropdowns:', err);
    }
  }, []);

  const handleCreateTerms = async () => {
    const errors = {};
    if (!newTermsValues.title?.trim()) errors.title = 'Required';
    if (!newTermsValues.content?.trim()) errors.content = 'Required';
    setNewTermsErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setSavingTerms(true);
      const res = await apiService.createTermsAndConditions({
        title: newTermsValues.title.trim(),
        content: newTermsValues.content.trim(),
        category: newTermsValues.category?.trim() || undefined,
        isDefault: false,
        status: 'active',
      });
      const created = res.data;
      setTermsAndConditions((prev) => [...prev, created]);
      const currentIds = valuesRef.current?.termsAndConditionsIds || [];
      setFieldValueRef.current?.('termsAndConditionsIds', [...currentIds, created.id]);
      setNewTermsValues({ title: '', content: '', category: '' });
      setAddTermsDialogOpen(false);
      setNewTermsErrors({});
    } catch (err) {
      setNewTermsErrors({ submit: err.message || 'Failed to create terms and conditions' });
    } finally {
      setSavingTerms(false);
    }
  };

  const fetchDeal = useCallback(async (catalogProducts = []) => {
    try {
      setLoading(true);
      const response = await apiService.getDeal(id);
      if (response.success) {
        const d = response.data;
        setInitialValues({
          leadId: d.lead_id || null,
          companyId: d.company_id || null,
          contactId: d.contact_id || null,
          supplierId: d.supplier_id || null,
          hasDownstreamPartner: !!d.downstream_partner_supplier_id,
          downstreamPartnerSupplierId: d.downstream_partner_supplier_id || null,
          title: d.title || '',
          description: d.description || '',
          dealDate: d.deal_date ? new Date(d.deal_date).toISOString().split('T')[0] : '',
          vatPercentage: d.vat_percentage || 5,
          currency: d.currency || 'AED',
          status: d.status || 'new',
          lossReason: d.loss_reason || '',
          assignedTo: d.assigned_to || null,
          termsAndConditionsIds: (d.termsList && d.termsList.length > 0)
            ? d.termsList.map((t) => t.id)
            : (d.terms_and_conditions_id ? [d.terms_and_conditions_id] : []),
          dealType: d.deal_type || 'offer_to_purchase',
          logisticsKind: resolveLogisticsKind(d),
          containerType: d.container_type || null,
          locationType: d.location_type || null,
          wdsRequired: d.wds_required || false,
          inspectionRequired: d.inspection_required || false,
          customInspection: d.custom_inspection || false,
          trakheesInspection: d.trakhees_inspection || false,
          dubaiMunicipalityInspection: d.dubai_municipality_inspection || false,
          isRcmApplicable: d.is_rcm_applicable || false,
          notes: d.notes || '',
          pickupLocation: d.pickup_location || '',
          pickupContactName: d.pickup_contact_name || '',
          pickupContactNumber: d.pickup_contact_number || '',
          servicePaymentStatus: d.service_payment_status || '',
        });
        setFormDealType(d.deal_type || 'offer_to_purchase');
        
        const defaultWds = {
          refNo: '',
          date: new Date().toISOString().split('T')[0],
          companyName: '',
          licenseNo: '',
          wasteDescription: '',
          sourceProcess: '',
          packageType: '',
          quantityPerPackage: '',
          totalWeight: '',
          containerNo: '',
          purpose: '',
          blNo: '',
          borNo: '',
        };
        if (d.wdsDetails) {
          const w = d.wdsDetails;
          setWdsDetails({
            ...defaultWds,
            refNo: w.ref_no || '',
            date: w.date ? new Date(w.date).toISOString().split('T')[0] : defaultWds.date,
            companyName: w.company_name || '',
            licenseNo: w.license_no || '',
            wasteDescription: w.waste_description || '',
            sourceProcess: w.source_process || '',
            packageType: w.package_type || '',
            quantityPerPackage: w.quantity_per_package || '',
            totalWeight: w.total_weight || '',
            containerNo: w.container_no || '',
            purpose: w.purpose || '',
            blNo: w.bl_no || '',
            borNo: w.bor_no || '',
          });
          setWdsAttachments((w.attachments || []).map(a => ({
            path: a.file_path,
            fileName: a.file_name,
            url: apiService.getUploadUrl(a.file_path),
          })));
        } else {
          setWdsDetails(defaultWds);
          setWdsAttachments([]);
        }

        if (d.inspectionRequest) {
          const i = d.inspectionRequest;
          let safetyTools = [];
          if (i.safety_tools) {
            try {
              safetyTools = typeof i.safety_tools === 'string' ? JSON.parse(i.safety_tools) : (Array.isArray(i.safety_tools) ? i.safety_tools : []);
            } catch { safetyTools = []; }
          }
          setInspectionDetails({
            materialTypeId: i.material_type_id || null,
            location: i.location || '',
            locationType: i.location_type || '',
            gatePassRequirement: i.gate_pass_requirement || '',
            serviceType: i.service_type || '',
            quantity: i.quantity || '',
            quantityUom: i.quantity_uom || '',
            lumpsumPrice: i.lumpsum_price || '',
            safetyTools: safetyTools || [],
            supportingDocuments: parseSupportingDocuments(i.supporting_documents),
            requestedBy: i.requested_by || null,
            notes: i.notes || '',
            priority: i.priority || 'medium',
          });
        } else {
          setInspectionDetails({
            materialTypeId: null,
            location: '',
            locationType: '',
            gatePassRequirement: '',
            serviceType: '',
            quantity: '',
            quantityUom: '',
            safetyTools: [],
            supportingDocuments: [],
            requestedBy: null,
            notes: '',
            priority: 'medium',
          });
        }
        
        setDealImages((d.images || []).map(img => ({ path: img.file_path, url: apiService.getUploadUrl(img.file_path) })));

        // Load line items — refresh unit price from current product catalog
        const currentProducts = catalogProducts;
        const items = (d.items || []).map(item => {
          const catalogProduct = currentProducts.find(p => p.id === item.product_service_id);
          const unitPrice = catalogProduct?.price != null ? catalogProduct.price : item.unit_price;
          const qty = parseFloat(item.quantity || 0);
          return {
            id: item.id,
            productServiceId: item.product_service_id,
            productName: item.productService?.name || '',
            quantity: item.quantity,
            unitOfMeasure: item.unit_of_measure || item.productService?.unit_of_measure || '',
            unitPrice,
            lineTotal: (qty * parseFloat(unitPrice || 0)).toFixed(2),
            notes: item.notes || '',
          };
        });
        setLineItems(items);
      }
    } catch (err) {
      setError(err.message || 'Failed to load deal');
    } finally {
      setLoading(false);
    }
  }, [id]);

  const fetchLeadData = useCallback(async (leadId) => {
    try {
      const response = await apiService.getLead(leadId);
      if (response.success) {
        const lead = response.data;
        setInitialValues(prev => ({
          ...prev,
          leadId: lead.id,
          companyId: lead.company_id || null,
          contactId: lead.contact_id || null,
          assignedTo: lead.assigned_to || null,
          title: `Deal from Lead ${lead.lead_number}`,
          description: lead.notes || '',
        }));

        const ps = lead.productService;
        if (lead.product_service_id && ps) {
          const unitPrice = ps.price != null ? parseFloat(ps.price) : (lead.estimated_value ? parseFloat(lead.estimated_value) : 0);
          setLineItems([{
            productServiceId: lead.product_service_id,
            productName: ps.name || '',
            quantity: 1,
            unitOfMeasure: ps.unit_of_measure || '',
            unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
            lineTotal: (Number.isFinite(unitPrice) ? unitPrice : 0).toFixed(2),
            notes: '',
          }]);
        }
      }
    } catch (err) {
      console.error('Failed to load lead:', err);
    }
  }, []);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const leadId = urlParams.get('leadId');
    let cancelled = false;
    // fetchAllData must finish first so products are loaded before fetchLeadData
    // sets lineItems — otherwise the prefilled product shows as blank and the
    // user thinks the form is empty and adds a duplicate item.
    fetchAllData().then(({ products: catalogProducts }) => {
      if (cancelled) return;
      if (isEdit) fetchDeal(catalogProducts);
      else if (leadId) fetchLeadData(leadId);
    });
    fetchDropdowns();
    return () => {
      cancelled = true;
    };
  }, [isEdit, id, fetchAllData, fetchDropdowns, fetchDeal, fetchLeadData]);

  // Recalculate totals when line items, VAT, or deal type changes
  useEffect(() => {
    if (formDealType === 'free_of_charge') {
      setSubtotal(0);
      setVatAmount(0);
      setTotal(0);
      return;
    }
    const sub = lineItems.reduce((sum, item) => sum + parseFloat(item.lineTotal || 0), 0);
    setSubtotal(sub);
    
    const vat = (sub * parseFloat(initialValues.vatPercentage || 5)) / 100;
    setVatAmount(vat);
    
    setTotal(sub + vat);
  }, [lineItems, initialValues.vatPercentage, formDealType]);

  const handleAddLineItem = () => {
    setLineItems([...lineItems, {
      productServiceId: null,
      productName: '',
      quantity: 1,
      unitOfMeasure: '',
      unitPrice: 0,
      lineTotal: 0,
      notes: '',
    }]);
  };

  const handleRemoveLineItem = (index) => {
    setLineItems(lineItems.filter((_, i) => i !== index));
  };

  const handleLineItemChange = (index, field, value) => {
    const newItems = [...lineItems];
    newItems[index][field] = value;
    
    // Auto-calculate line total
    if (field === 'quantity' || field === 'unitPrice') {
      const qty = parseFloat(newItems[index].quantity || 0);
      const price = parseFloat(newItems[index].unitPrice || 0);
      newItems[index].lineTotal = (qty * price).toFixed(2);
    }
    
    // Auto-fill price and UOM when product is selected (same catalog as Product form / inspection UOM)
    if (field === 'productServiceId') {
      const product = products.find(p => p.id === value);
      if (product) {
        newItems[index].productName = product.name;
        newItems[index].unitPrice = product.price || 0;
        newItems[index].unitOfMeasure = product.unit_of_measure || '';
        const qty = parseFloat(newItems[index].quantity || 0);
        newItems[index].lineTotal = (qty * parseFloat(product.price || 0)).toFixed(2);
      } else {
        newItems[index].unitOfMeasure = '';
      }
    }
    
    setLineItems(newItems);
  };

  const handleSubmit = async (values, { setSubmitting }) => {
    try {
      setError('');
      
      if (lineItems.length === 0) {
        setError('At least one product/service is required');
        setSubmitting(false);
        return;
      }

      const invalidItems = lineItems.filter((item) => !item.productServiceId);
      if (invalidItems.length > 0) {
        setError('Please select a product/service for all line items');
        setSubmitting(false);
        return;
      }

      const zeroQtyIndex = lineItems.findIndex((item) => {
        const qty = parseFloat(item.quantity);
        return isNaN(qty) || qty <= 0;
      });
      if (zeroQtyIndex !== -1) {
        setError(`Line item ${zeroQtyIndex + 1}: Quantity must be greater than 0`);
        setSubmitting(false);
        return;
      }

      const missingUomIndex = lineItems.findIndex((item) => !item.unitOfMeasure?.toString().trim());
      if (missingUomIndex !== -1) {
        setError(`Line item ${missingUomIndex + 1}: Unit of measure (UOM) is required`);
        setSubmitting(false);
        return;
      }

      if (values.inspectionRequired) {
        if (!values.companyId) {
          setError('Company is required when inspection is required');
          setSubmitting(false);
          return;
        }
        if (!values.contactId) {
          setError('Contact is required when inspection is required');
          setSubmitting(false);
          return;
        }
        if (!inspectionDetails.location?.trim()) {
          setError('Location is required in inspection request details');
          setSubmitting(false);
          return;
        }
        if (!inspectionDetails.locationType?.trim()) {
          setError('Location Type is required in inspection request details');
          setSubmitting(false);
          return;
        }
        if (!inspectionDetails.serviceType?.trim()) {
          setError('Service Type is required in inspection request details');
          setSubmitting(false);
          return;
        }
        if (!inspectionDetails.materialTypeId) {
          setError('Material Type is required in inspection request details');
          setSubmitting(false);
          return;
        }
        if (inspectionDetails.quantityUom !== 'lumpsum' && !inspectionDetails.quantity?.toString().trim()) {
          setError('Quantity is required in inspection request details');
          setSubmitting(false);
          return;
        }
        if (!inspectionDetails.requestedBy) {
          setError('Requested By is required in inspection request details');
          setSubmitting(false);
          return;
        }
      }

      if (values.hasDownstreamPartner) {
        if (!values.downstreamPartnerSupplierId) {
          setError('Select a downstream partner supplier, or uncheck "Downstream partner supplier".');
          setSubmitting(false);
          return;
        }
        if (values.supplierId && values.downstreamPartnerSupplierId === values.supplierId) {
          setError('Downstream partner must be a different supplier than the primary supplier.');
          setSubmitting(false);
          return;
        }
      }

      const isOtc = values.dealType === 'offer_to_charge';
      const isOtcWds = isOtc && values.wdsRequired;
      const isOtcCargo = isOtcWds && values.logisticsKind === 'cargo';
      const hasOtcLogistics = isOtcWds
        && (values.logisticsKind === 'container' || values.logisticsKind === 'cargo');
      const { hasDownstreamPartner, downstreamPartnerSupplierId, paymentStatus, paidAmount, status, logisticsKind, ...restValues } = values;
      const payload = {
        ...restValues,
        ...(canChangeStatus && status !== initialValues.status ? { status } : {}),
        downstreamPartnerSupplierId: hasDownstreamPartner ? downstreamPartnerSupplierId : null,
        containerType: isOtcCargo ? values.containerType : null,
        locationType: hasOtcLogistics ? values.locationType : null,
        wdsRequired: isOtc ? values.wdsRequired : false,
        customInspection: hasOtcLogistics ? values.customInspection : false,
        trakheesInspection: hasOtcLogistics ? values.trakheesInspection : false,
        dubaiMunicipalityInspection: hasOtcLogistics ? values.dubaiMunicipalityInspection : false,
        items: lineItems.map(item => ({
          productServiceId: item.productServiceId,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
          unitOfMeasure: item.unitOfMeasure?.toString().trim() || null,
          notes: item.notes?.toString().trim() || null,
        })),
        wdsDetails: values.wdsRequired && hasWdsContent(wdsDetails, wdsAttachments)
          ? { ...wdsDetails, attachments: wdsAttachments.map(a => ({ path: a.path, fileName: a.fileName })) }
          : null,
        inspectionDetails: values.inspectionRequired ? inspectionDetails : null,
        images: dealImages.map(img => ({ path: img.path })),
      };

      let savedDeal;
      if (isEdit) {
        const res = await apiService.updateDeal(id, payload);
        savedDeal = res.data;
        setSuccess('Deal updated successfully!');
      } else {
        const res = await apiService.createDeal(payload);
        savedDeal = res.data;
        setSuccess('Deal created successfully!');
      }

      const dealId = savedDeal?.id || (isEdit ? Number(id) : null);
      const dealStatus = String(savedDeal?.status || 'new').toLowerCase();
      if (dealId && DEAL_APPROVAL_ELIGIBLE_STATUSES.includes(dealStatus)) {
        setSavedDealId(dealId);
        setApprovalDialogOpen(true);
      } else {
        setTimeout(() => navigate('/erp/deals'), 1000);
      }
    } catch (err) {
      let errorMessage = err.message || 'Failed to save deal';
      if (err.errors) {
        if (typeof err.errors === 'string') {
          errorMessage = err.errors;
        } else if (Array.isArray(err.errors)) {
          errorMessage = err.errors.map(e => e.msg || e.message || e).join(', ');
        }
      }
      setError(errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  const finishAndNavigate = () => {
    setApprovalDialogOpen(false);
    setSavedDealId(null);
    setApprovalError('');
    navigate('/erp/deals');
  };

  const handleRequestDealApproval = async () => {
    if (!savedDealId) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.requestDealApproval(savedDealId);
      setSuccess('Approval requested. Your manager has been notified.');
      setTimeout(finishAndNavigate, 1200);
    } catch (err) {
      setApprovalError(err.message || 'Failed to request approval');
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleApproveDealWithPin = async (pin) => {
    if (!savedDealId) return;
    try {
      setApprovalLoading(true);
      setApprovalError('');
      await apiService.approveDealWithPin(savedDealId, pin);
      setSuccess('Deal approved successfully!');
      setTimeout(finishAndNavigate, 1200);
    } catch (err) {
      setApprovalError(err.message || 'Invalid PIN or approval failed');
    } finally {
      setApprovalLoading(false);
    }
  };

  const dealIsQuotable = DEAL_QUOTABLE_STATUSES.includes(String(initialValues.status || '').toLowerCase());

  if (!canEditDeals) return null;

  if (loading && isEdit) {
    return (
      <PageContainer title="Loading...">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </PageContainer>
    );
  }

  return (
    <PageContainer title={isEdit ? 'Edit Deal' : 'Create Deal'} description="Manage deal details">
      <Box sx={{ maxWidth: 'min(5000px, 100%)', width: '100%', mx: 'auto', px: { xs: 1.5, sm: 2 } }}>
        <Stack direction="row" alignItems="center" spacing={2} mb={4} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={<IconArrowLeft size={20} />}
            onClick={() => navigate('/erp/deals')}
            sx={{ borderRadius: 2 }}
          >
            Back
          </Button>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h3" fontWeight={700}>
              {isEdit ? 'Edit Deal' : 'Create New Deal'}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {isEdit ? 'Update deal information' : 'Create a new business deal'}
            </Typography>
          </Box>
          {isEdit && dealIsQuotable && (
            <Stack direction="row" spacing={1}>
              {initialValues.dealType === 'offer_to_purchase' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<IconShoppingCart size={18} />}
                  onClick={() => navigate(`/erp/purchase-orders/create?dealId=${id}`)}
                  sx={{ borderRadius: 2 }}
                >
                  Create Purchase Quotation
                </Button>
              )}
              {initialValues.dealType !== 'offer_to_purchase' && (
                <Button
                  variant="outlined"
                  size="small"
                  startIcon={<IconReceipt size={18} />}
                  onClick={() => navigate(`/erp/quotations/create?dealId=${id}`)}
                  sx={{ borderRadius: 2 }}
                >
                  Create Service Quotation
                </Button>
              )}
            </Stack>
          )}
        </Stack>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>{success}</Alert>}

        <Formik
          initialValues={initialValues}
          validationSchema={validationSchema}
          enableReinitialize
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, handleBlur, handleSubmit: formikSubmit, isSubmitting, setFieldValue, setFieldTouched, submitCount }) => {
            setFieldValueRef.current = setFieldValue;
            valuesRef.current = values;
            return (
            <form onSubmit={(e) => {
              formikSubmit(e);
              // Surface Yup validation errors as a top-level alert after first submit attempt
              setTimeout(() => {
                const errs = Object.values(errors);
                if (errs.length > 0) {
                  setError(errs.filter(Boolean).join(' · '));
                }
              }, 50);
            }}>
              {/* Basic Information */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Deal Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Basic details about the deal
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
                      <TextField
                        fullWidth
                        label="Deal Title"
                        name="title"
                        value={values.title}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.title && Boolean(errors.title)}
                        helperText={touched.title ? errors.title : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                      <TextField
                        fullWidth
                        label="Deal Date"
                        name="dealDate"
                        type="date"
                        value={values.dealDate}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.dealDate && Boolean(errors.dealDate)}
                        helperText={touched.dealDate ? errors.dealDate : ' '}
                        required
                        InputLabelProps={{ shrink: true }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>
                    <TextField
                      fullWidth
                      multiline
                      rows={6}
                      label="Description"
                      name="description"
                      placeholder="Describe the deal in detail..."
                      value={values.description}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    />

                    <Box>
                      <Typography variant="subtitle2" fontWeight={600} sx={{ mb: 2 }}>
                        Images
                      </Typography>
                      <DealImageDropzone
                        onDrop={async (acceptedFiles) => {
                          for (const file of acceptedFiles) {
                            try {
                              const res = await apiService.uploadDealImage(file);
                              if (res.success && res.data?.path) {
                                setDealImages(prev => [...prev, { path: res.data.path, url: apiService.getUploadUrl(res.data.path) }]);
                              }
                            } catch (err) {
                              setError(err.message || 'Image upload failed');
                            }
                          }
                        }}
                      />
                      {dealImages.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mt: 2 }}>
                          {dealImages.map((img, idx) => (
                            <Box key={idx} sx={{ position: 'relative' }}>
                              <Box
                                component="img"
                                src={img.url}
                                alt=""
                                sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}
                              />
                              <IconButton
                                size="small"
                                onClick={() => setDealImages(prev => prev.filter((_, i) => i !== idx))}
                                sx={{ position: 'absolute', top: -8, right: -8, bgcolor: 'error.main', color: 'white', '&:hover': { bgcolor: 'error.dark' } }}
                              >
                                <IconTrash size={14} />
                              </IconButton>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Relationships */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Related Entities
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Link this deal to leads, companies, contacts, and suppliers
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={leads}
                          getOptionLabel={(opt) => `${opt.lead_number || ''} - ${opt.email || ''}`}
                          value={leads.find((l) => l.id === values.leadId) || null}
                          onChange={(_, val) => setFieldValue('leadId', val?.id || null)}
                          onBlur={() => setFieldTouched('leadId', true)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Lead"
                              placeholder="Required - Select lead..."
                              error={touched.leadId && Boolean(errors.leadId)}
                              helperText={touched.leadId ? errors.leadId : ' '}
                              required
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                      
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={companies}
                          getOptionLabel={(opt) => opt.company_name || ''}
                          value={companies.find((c) => c.id === values.companyId) || null}
                          onChange={(_, val) => setFieldValue('companyId', val?.id || null)}
                          onBlur={() => setFieldTouched('companyId', true)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Company"
                              placeholder="Required - Select company..."
                              error={touched.companyId && Boolean(errors.companyId)}
                              helperText={touched.companyId ? errors.companyId : ' '}
                              required
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={contacts}
                          getOptionLabel={(opt) => `${opt.first_name || ''} ${opt.last_name || ''}`.trim() + (opt.email ? ` (${opt.email})` : '')}
                          value={contacts.find((c) => c.id === values.contactId) || null}
                          onChange={(_, val) => setFieldValue('contactId', val?.id || null)}
                          onBlur={() => setFieldTouched('contactId', true)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Contact Person"
                              placeholder="Required - Select contact..."
                              error={touched.contactId && Boolean(errors.contactId)}
                              helperText={touched.contactId ? errors.contactId : ' '}
                              required
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                      </Box>
                      
                      <Box>
                        <Autocomplete
                          fullWidth
                          options={suppliers}
                          getOptionLabel={(opt) => opt.company_name || ''}
                          value={suppliers.find((s) => s.id === values.supplierId) || null}
                          onChange={(_, val) => setFieldValue('supplierId', val?.id || null)}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Supplier (Optional)"
                              placeholder="Primary supplier for purchase quotations..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.hasDownstreamPartner}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                setFieldValue('hasDownstreamPartner', checked);
                                if (!checked) setFieldValue('downstreamPartnerSupplierId', null);
                              }}
                            />
                          }
                          label="Is downstream partner? (link a second vendor for a separate purchase quotation)"
                          sx={{ alignItems: 'flex-start', mt: 1, mr: 0 }}
                        />
                        {values.hasDownstreamPartner && (
                          <Autocomplete
                            fullWidth
                            sx={{ mt: 1 }}
                            options={suppliers.filter((s) => s.id !== values.supplierId)}
                            getOptionLabel={(opt) => opt.company_name || ''}
                            value={suppliers.find((s) => s.id === values.downstreamPartnerSupplierId) || null}
                            onChange={(_, val) => setFieldValue('downstreamPartnerSupplierId', val?.id || null)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Downstream partner supplier"
                                placeholder="Select downstream vendor..."
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                              />
                            )}
                            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                            ListboxProps={{ style: { maxHeight: '300px' } }}
                          />
                        )}
                      </Box>
                    </Box>
                    
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: showAssignedTo ? '1fr 1fr' : '1fr' }, gap: 3 }}>
                      {showAssignedTo && (
                        <Box>
                          <Autocomplete
                            fullWidth
                            options={users}
                            getOptionLabel={(opt) => `${opt.first_name || ''} ${opt.last_name || ''}`.trim() || '-'}
                            value={users.find((u) => u.id === values.assignedTo) || null}
                            onChange={(_, val) => setFieldValue('assignedTo', val?.id || null)}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Assigned To"
                                placeholder="Select user..."
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                              />
                            )}
                            isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                            ListboxProps={{ style: { maxHeight: '300px' } }}
                          />
                        </Box>
                      )}
                      <Box position="relative">
                        <Autocomplete
                          multiple
                          fullWidth
                          options={termsAndConditions}
                          getOptionLabel={(opt) => opt.title || ''}
                          value={termsAndConditions.filter((t) => (values.termsAndConditionsIds || []).includes(t.id))}
                          onChange={(_, val) => setFieldValue('termsAndConditionsIds', val ? val.map((t) => t.id) : [])}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              label="Terms & Conditions"
                              placeholder="Select terms..."
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                            />
                          )}
                          isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                          ListboxProps={{ style: { maxHeight: '300px' } }}
                        />
                        <Box
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: 12,
                            backgroundColor: 'background.paper',
                            px: 1,
                            zIndex: 1,
                          }}
                        >
                          <Button
                            size="small"
                            onClick={() => {
                              setError('');
                              setAddTermsDialogOpen(true);
                            }}
                            sx={{
                              textTransform: 'none',
                              fontSize: '0.75rem',
                              fontWeight: 500,
                              minWidth: 'auto',
                              px: 0.5,
                              py: 0,
                              color: 'primary.main',
                              '&:hover': {
                                backgroundColor: 'transparent',
                                textDecoration: 'underline',
                              },
                            }}
                          >
                            + Add New
                          </Button>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Deal Type & Logistics */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Deal Type & Logistics
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Specify deal type and logistics requirements
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <TextField
                      fullWidth
                      select
                      label="Deal Type"
                      name="dealType"
                      value={values.dealType || ''}
                      onChange={(e) => {
                        const nextType = e.target.value;
                        handleChange(e);
                        setFormDealType(nextType);
                        if (nextType !== 'offer_to_purchase') {
                          setFieldValue('isRcmApplicable', false);
                        }
                        if (nextType !== 'offer_to_charge') {
                          setFieldValue('logisticsKind', '');
                          setFieldValue('containerType', null);
                          setFieldValue('locationType', null);
                          setFieldValue('wdsRequired', false);
                          setFieldValue('customInspection', false);
                          setFieldValue('trakheesInspection', false);
                          setFieldValue('dubaiMunicipalityInspection', false);
                        }
                        if (nextType === 'free_of_charge') {
                          setLineItems((prev) => prev.map((item) => ({
                            ...item,
                            unitPrice: 0,
                            lineTotal: '0.00',
                          })));
                        }
                      }}
                      onBlur={handleBlur}
                      error={touched.dealType && Boolean(errors.dealType)}
                      helperText={touched.dealType ? errors.dealType : ' '}
                      required
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                    >
                      <MenuItem value="offer_to_charge">Offer to Charge</MenuItem>
                      <MenuItem value="offer_to_purchase">Offer to Purchase</MenuItem>
                      <MenuItem value="free_of_charge">Free of Charge</MenuItem>
                    </TextField>

                    {values.dealType === 'offer_to_purchase' && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={values.isRcmApplicable || false}
                              onChange={(e) => setFieldValue('isRcmApplicable', e.target.checked)}
                              name="isRcmApplicable"
                            />
                          }
                          label="Is RCM (Reverse Charge Mechanism) applicable?"
                          sx={{ m: 0 }}
                        />
                        <Tooltip title="If RCM applies, VAT is paid directly to the government by the buyer. VAT will NOT be included in the purchase quotation, purchase bill, or any related documents." arrow>
                          <IconInfoCircle size={18} style={{ opacity: 0.6, cursor: 'help' }} />
                        </Tooltip>
                      </Box>
                    )}

                    {values.isRcmApplicable && values.dealType === 'offer_to_purchase' && (
                      <Box sx={{ bgcolor: 'warning.lighter', border: '1px solid', borderColor: 'warning.main', borderRadius: 2, p: 2 }}>
                        <Typography variant="body2" color="warning.dark" fontWeight={600}>
                          RCM Applicable: VAT will NOT be included in purchase quotations or bills. VAT is to be paid directly to the government.
                        </Typography>
                      </Box>
                    )}

                    {values.dealType === 'offer_to_charge' && (
                      <>
                        <Box>
                          <FormControlLabel
                            control={
                              <Checkbox
                                checked={values.wdsRequired}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  setFieldValue('wdsRequired', checked);
                                  if (!checked) {
                                    setFieldValue('logisticsKind', '');
                                    setFieldValue('containerType', null);
                                    setFieldValue('locationType', null);
                                    setFieldValue('customInspection', false);
                                    setFieldValue('trakheesInspection', false);
                                    setFieldValue('dubaiMunicipalityInspection', false);
                                  }
                                }}
                                name="wdsRequired"
                              />
                            }
                            label="WDS Required?"
                          />
                          {values.wdsRequired && (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() => setWdsDialogOpen(true)}
                              sx={{ ml: 2, borderRadius: 2 }}
                            >
                              Edit WDS Details
                            </Button>
                          )}
                        </Box>

                        {values.wdsRequired && (
                          <>
                            <FormControl component="fieldset" sx={{ mb: 1, mt: 1 }}>
                              <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                                Logistics type
                              </FormLabel>
                              <RadioGroup
                                row
                                value={values.logisticsKind || ''}
                                onChange={(e) => {
                                  const kind = e.target.value;
                                  setFieldValue('logisticsKind', kind);
                                  if (kind !== 'cargo') {
                                    setFieldValue('containerType', null);
                                  }
                                }}
                              >
                                <FormControlLabel value="container" control={<Radio size="small" />} label="Is container type?" />
                                <FormControlLabel value="cargo" control={<Radio size="small" />} label="Is cargo type?" />
                              </RadioGroup>
                              {touched.logisticsKind && errors.logisticsKind && (
                                <Typography variant="caption" color="error" display="block" mt={0.5}>
                                  {errors.logisticsKind}
                                </Typography>
                              )}
                            </FormControl>

                            {values.logisticsKind === 'cargo' && (
                              <FormControl component="fieldset" sx={{ mb: 2 }}>
                                <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600, color: 'text.primary', mb: 0.5 }}>
                                  Cargo type
                                </FormLabel>
                                <RadioGroup
                                  row
                                  name="containerType"
                                  value={values.containerType || ''}
                                  onChange={handleChange}
                                >
                                  <FormControlLabel value="LCL" control={<Radio size="small" />} label="LCL" />
                                  <FormControlLabel value="FCL" control={<Radio size="small" />} label="FCL" />
                                </RadioGroup>
                                {touched.containerType && errors.containerType && (
                                  <Typography variant="caption" color="error" display="block" mt={0.5}>
                                    {errors.containerType}
                                  </Typography>
                                )}
                              </FormControl>
                            )}

                            {(values.logisticsKind === 'container' || values.logisticsKind === 'cargo') && (
                            <>
                            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                              <TextField
                                fullWidth
                                select
                                label="Location Type"
                                name="locationType"
                                value={values.locationType || ''}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={touched.locationType && Boolean(errors.locationType)}
                                helperText={touched.locationType ? errors.locationType : ' '}
                                required
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                              >
                                <MenuItem value="Main Land">Main Land</MenuItem>
                                <MenuItem value="Free Zone">Free Zone</MenuItem>
                              </TextField>
                            </Box>

                            <Box sx={{ ml: 0, mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={values.customInspection}
                                    onChange={(e) => setFieldValue('customInspection', e.target.checked)}
                                    name="customInspection"
                                  />
                                }
                                label="Custom Inspection"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={values.trakheesInspection}
                                    onChange={(e) => setFieldValue('trakheesInspection', e.target.checked)}
                                    name="trakheesInspection"
                                  />
                                }
                                label="Trakhees Inspection"
                              />
                              <FormControlLabel
                                control={
                                  <Checkbox
                                    checked={values.dubaiMunicipalityInspection}
                                    onChange={(e) => setFieldValue('dubaiMunicipalityInspection', e.target.checked)}
                                    name="dubaiMunicipalityInspection"
                                  />
                                }
                                label="Dubai Municipality Inspection"
                              />
                            </Box>
                            </>
                            )}
                          </>
                        )}
                      </>
                    )}

                    {/* Collection details — always visible for all deal types */}
                    <Box
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'action.hover',
                      }}
                    >
                      <Typography variant="subtitle2" fontWeight={700} mb={1.5}>
                        Collection details (for driver pickup)
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                        {/* Location picker — opens map dialog */}
                        <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              p: 1.5,
                              border: '1px solid',
                              borderColor: values.pickupLocation ? 'primary.main' : 'divider',
                              borderRadius: 2,
                              bgcolor: 'background.paper',
                              cursor: 'pointer',
                              '&:hover': { borderColor: 'primary.main' },
                            }}
                            onClick={() => setLocationDialogOpen(true)}
                          >
                            <IconMapPin size={20} color={values.pickupLocation ? undefined : '#9e9e9e'} />
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              {values.pickupLocation ? (
                                <Typography variant="body2" noWrap>{values.pickupLocation}</Typography>
                              ) : (
                                <Typography variant="body2" color="text.disabled">
                                  Click to select pickup location on map
                                </Typography>
                              )}
                            </Box>
                            <Button
                              size="small"
                              variant={values.pickupLocation ? 'outlined' : 'contained'}
                              onClick={(e) => { e.stopPropagation(); setLocationDialogOpen(true); }}
                              sx={{ borderRadius: 2, whiteSpace: 'nowrap', flexShrink: 0 }}
                              startIcon={<IconMapPin size={15} />}
                            >
                              {values.pickupLocation ? 'Change' : 'Pick on Map'}
                            </Button>
                            {values.pickupLocation && (
                              <Tooltip title="Open in Google Maps">
                                <IconButton
                                  size="small"
                                  component="a"
                                  href={values.pickupLocation}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <IconExternalLink size={16} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                            Select the exact pin location on the map for the driver
                          </Typography>
                        </Box>

                        <LocationPickerDialog
                          open={locationDialogOpen}
                          onClose={() => setLocationDialogOpen(false)}
                          initialValue={values.pickupLocation}
                          onConfirm={(url) => {
                            setFieldValue('pickupLocation', url);
                            setLocationDialogOpen(false);
                          }}
                        />
                        <TextField
                          fullWidth
                          label="Contact name"
                          name="pickupContactName"
                          value={values.pickupContactName || ''}
                          onChange={handleChange}
                          placeholder="Name of the person at the site"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                        <TextField
                          fullWidth
                          label="Contact number"
                          name="pickupContactNumber"
                          value={values.pickupContactNumber || ''}
                          onChange={handleChange}
                          placeholder="+971 50 000 0000"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />

                        {/* Share link with client — only available after deal is saved */}
                        <Box sx={{ gridColumn: { sm: '1 / -1' } }}>
                          {id ? (
                            <Button
                              variant="outlined"
                              startIcon={<IconShare size={16} />}
                              onClick={async () => {
                                setShareError('');
                                setShareUrl('');
                                setShareDialogOpen(true);
                                setShareLoading(true);
                                try {
                                  const res = await apiService.generateLocationShareToken(id);
                                  setShareUrl(res.shareUrl);
                                } catch (e) {
                                  setShareError(e.message || 'Failed to generate link');
                                } finally {
                                  setShareLoading(false);
                                }
                              }}
                              sx={{ borderRadius: 2, fontWeight: 600 }}
                            >
                              Share location link with client
                            </Button>
                          ) : (
                            <Typography variant="caption" color="text.disabled">
                              Save the deal first to generate a shareable location link for the client
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>

                    {/* Share link dialog */}
                    <Dialog open={shareDialogOpen} onClose={() => { setShareDialogOpen(false); setShareCopied(false); }} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
                      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
                        <Typography variant="h6" fontWeight={700}>Client Location Link</Typography>
                      </DialogTitle>
                      <DialogContent sx={{ pb: 1 }}>
                        <Typography variant="body2" color="text.secondary" mb={2}>
                          Send this link to your client. They will open it, drop a pin on their location, and it will automatically update here.
                          The link expires in <strong>7 days</strong>.
                        </Typography>
                        {shareLoading && (
                          <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                            <CircularProgress size={28} />
                          </Box>
                        )}
                        {shareError && <Alert severity="error" sx={{ borderRadius: 2 }}>{shareError}</Alert>}
                        {shareUrl && (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', p: 1.5, bgcolor: 'action.hover', borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                            <Typography variant="body2" sx={{ flex: 1, wordBreak: 'break-all', fontSize: '0.78rem' }}>
                              {shareUrl}
                            </Typography>
                            <Tooltip title={shareCopied ? 'Copied!' : 'Copy link'}>
                              <IconButton
                                size="small"
                                onClick={() => {
                                  navigator.clipboard.writeText(shareUrl);
                                  setShareCopied(true);
                                  setTimeout(() => setShareCopied(false), 2500);
                                }}
                              >
                                {shareCopied ? <IconCheck size={16} color="green" /> : <IconCopy size={16} />}
                              </IconButton>
                            </Tooltip>
                          </Box>
                        )}
                      </DialogContent>
                      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
                        <Button onClick={() => { setShareDialogOpen(false); setShareCopied(false); }} sx={{ borderRadius: 2 }}>Close</Button>
                        {shareUrl && (
                          <Button
                            variant="contained"
                            startIcon={shareCopied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                            onClick={() => {
                              navigator.clipboard.writeText(shareUrl);
                              setShareCopied(true);
                              setTimeout(() => setShareCopied(false), 2500);
                            }}
                            sx={{ borderRadius: 2 }}
                          >
                            {shareCopied ? 'Copied!' : 'Copy Link'}
                          </Button>
                        )}
                      </DialogActions>
                    </Dialog>

                    <Box>
                      <FormControlLabel
                        control={
                          <Checkbox
                            checked={values.inspectionRequired}
                            onChange={(e) => {
                              setFieldValue('inspectionRequired', e.target.checked);
                              if (e.target.checked) {
                                openInspectionDialog();
                              }
                            }}
                            name="inspectionRequired"
                          />
                        }
                        label="Inspection Required?"
                      />
                      {values.inspectionRequired && (
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={openInspectionDialog}
                          sx={{ ml: 2, borderRadius: 2 }}
                        >
                          Edit Inspection Details
                        </Button>
                      )}
                    </Box>
                  </Box>
                </CardContent>
              </Card>

              {/* Products/Services Line Items */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
                    <Box>
                      <Typography variant="h4" fontWeight={700} color="primary.main">
                        Products & Services
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        At least one product/service is required
                      </Typography>
                    </Box>
                    <Button
                      variant="contained"
                      startIcon={<IconPlus size={20} />}
                      onClick={handleAddLineItem}
                      sx={{ borderRadius: 2, fontWeight: 600 }}
                    >
                      Add Item
                    </Button>
                  </Stack>

                  {lineItems.length === 0 ? (
                    <Box
                      sx={{
                        border: '2px dashed',
                        borderColor: 'divider',
                        borderRadius: 3,
                        p: 6,
                        textAlign: 'center',
                        backgroundColor: 'grey.50',
                      }}
                    >
                      <Typography variant="body1" fontWeight={500} color="text.secondary">
                        No items added yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary" mt={1}>
                        Click &quot;Add Item&quot; to add at least one product or service (required)
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {lineItems.map((item, index) => (
                        <Paper
                          key={index}
                          variant="outlined"
                          sx={{ borderRadius: 2, p: 2.5, position: 'relative' }}
                        >
                          {/* Item number + remove */}
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                            <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.8 }}>
                              Item #{index + 1}
                            </Typography>
                            <IconButton size="small" color="error" onClick={() => handleRemoveLineItem(index)}>
                              <IconTrash size={16} />
                            </IconButton>
                          </Stack>

                          {/* Row 1: Product selector (full width) */}
                          <Box mb={2}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Product / Service</Typography>
                            <Autocomplete
                              options={products}
                              getOptionLabel={(opt) => `${opt.name} (${opt.category})`}
                              value={products.find((p) => p.id === item.productServiceId) || null}
                              onChange={(_, val) => handleLineItemChange(index, 'productServiceId', val?.id || null)}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  size="small"
                                  placeholder="Select a product or service..."
                                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                                />
                              )}
                              isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                            />
                          </Box>

                          <Box mb={2}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>
                              Brief description (optional)
                            </Typography>
                            <TextField
                              size="small"
                              fullWidth
                              placeholder="Short note for this line — visible on the deal only"
                              value={item.notes || ''}
                              onChange={(e) => handleLineItemChange(index, 'notes', e.target.value)}
                              inputProps={{ maxLength: 500 }}
                              sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                            />
                          </Box>

                          {/* Row 2: Qty · UOM · Unit Price · Line Total */}
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} mb={2}>
                            <Box sx={{ flex: '0 0 100px' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Quantity</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={item.quantity}
                                onChange={(e) => handleLineItemChange(index, 'quantity', e.target.value)}
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                              />
                            </Box>
                            <Box sx={{ flex: '0 0 140px' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Unit of measure</Typography>
                              <UomSelectField
                                value={item.unitOfMeasure || ''}
                                onChange={(v) => handleLineItemChange(index, 'unitOfMeasure', v)}
                                unitsOfMeasure={dropdowns.unitsOfMeasure || []}
                                onUnitsChange={(next) => setDropdowns((d) => ({ ...d, unitsOfMeasure: next }))}
                                minWidth={140}
                              />
                            </Box>
                            <Box sx={{ flex: '0 0 140px' }}>
                              <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Unit price ({values.currency})</Typography>
                              <TextField
                                size="small"
                                fullWidth
                                type="number"
                                value={item.unitPrice}
                                onChange={(e) => handleLineItemChange(index, 'unitPrice', e.target.value)}
                                inputProps={{ min: 0, step: 0.01 }}
                                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                              />
                            </Box>
                            <Box sx={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
                              <Box sx={{ pb: 0.25 }}>
                                <Typography variant="caption" color="text.secondary" fontWeight={600} display="block" mb={0.5}>Line total</Typography>
                                <Typography variant="body1" fontWeight={700} color="primary.main">
                                  {values.currency} {parseFloat(item.lineTotal || 0).toFixed(2)}
                                </Typography>
                              </Box>
                            </Box>
                          </Stack>
                        </Paper>
                      ))}
                    </Stack>
                  )}

                  {/* Totals Summary */}
                  {lineItems.length > 0 && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Box sx={{ width: 380 }}>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="body1">Subtotal:</Typography>
                            <Typography variant="body1" fontWeight={600}>
                              {values.currency} {subtotal.toFixed(2)}
                            </Typography>
                          </Stack>
                          <Stack direction="row" justifyContent="space-between" alignItems="center">
                            <Typography variant="body1" color={values.isRcmApplicable ? 'text.disabled' : 'text.primary'}>
                              VAT {values.isRcmApplicable ? '(excluded — RCM)' : ''}:
                            </Typography>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <TextField
                                size="small"
                                name="vatPercentage"
                                type="number"
                                value={values.vatPercentage}
                                onChange={(e) => {
                                  handleChange(e);
                                  const newVat = (subtotal * parseFloat(e.target.value || 0)) / 100;
                                  setVatAmount(newVat);
                                  setTotal(subtotal + (values.isRcmApplicable ? 0 : newVat));
                                }}
                                disabled={values.isRcmApplicable}
                                inputProps={{ min: 0, max: 100, step: 0.1 }}
                                sx={{ width: 80, '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                              />
                              <Typography variant="body2">%</Typography>
                              <Typography variant="body1" fontWeight={600} color={values.isRcmApplicable ? 'text.disabled' : 'text.primary'}>
                                = {values.currency} {values.isRcmApplicable ? '0.00' : vatAmount.toFixed(2)}
                              </Typography>
                            </Stack>
                          </Stack>
                          {values.isRcmApplicable && (
                            <Typography variant="caption" color="warning.dark" sx={{ fontStyle: 'italic' }}>
                              VAT ({values.vatPercentage}% = {values.currency} {vatAmount.toFixed(2)}) is recorded for government payment — not included in purchase documents.
                            </Typography>
                          )}
                          <Divider />
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="h5" fontWeight={700}>Total:</Typography>
                            <Typography variant="h5" fontWeight={700} color="primary.main">
                              {values.currency} {values.isRcmApplicable ? subtotal.toFixed(2) : total.toFixed(2)}
                            </Typography>
                          </Stack>
                        </Stack>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>

              {/* Status */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Status
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Deal status and currency
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      {canChangeStatus ? (
                        <TextField
                          fullWidth
                          select
                          label="Status"
                          name="status"
                          value={values.status || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          error={touched.status && Boolean(errors.status)}
                          helperText={touched.status ? errors.status : ' '}
                          required
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        >
                          {dropdowns.dealStatus
                            .filter((s) => !['approved', 'pending_approval'].includes(s.value))
                            .map((s) => (
                              <MenuItem key={s.id} value={s.value}>{s.display_name}</MenuItem>
                            ))}
                          {values.status === 'pending_approval' && (
                            <MenuItem value="pending_approval" disabled>Pending Approval</MenuItem>
                          )}
                          {values.status === 'approved' && (
                            <MenuItem value="approved" disabled>Approved</MenuItem>
                          )}
                        </TextField>
                      ) : (
                        <TextField
                          fullWidth
                          label="Status"
                          value={formatStatusLabel(values.status || 'new')}
                          disabled
                          helperText="Status is managed through the approval workflow"
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      )}
                    </Grid>
                    {values.status === 'lost' && (
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          fullWidth
                          multiline
                          rows={2}
                          label="Reason for Loss"
                          name="lossReason"
                          value={values.lossReason || ''}
                          onChange={handleChange}
                          onBlur={handleBlur}
                          placeholder="Describe why this deal was lost..."
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                        />
                      </Grid>
                    )}
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        select
                        label="Service Payment Status"
                        name="servicePaymentStatus"
                        value={values.servicePaymentStatus || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <MenuItem value="">— None —</MenuItem>
                        <MenuItem value="advance_received">Advance Received</MenuItem>
                        <MenuItem value="partial_advance">Partial Advance</MenuItem>
                        <MenuItem value="fully_received">Fully Received</MenuItem>
                      </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <TextField
                        fullWidth
                        select
                        label="Currency"
                        name="currency"
                        value={values.currency || 'AED'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={touched.currency && Boolean(errors.currency)}
                        helperText={touched.currency ? errors.currency : ' '}
                        required
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      >
                        <MenuItem value="AED">AED</MenuItem>
                        <MenuItem value="USD">USD</MenuItem>
                        <MenuItem value="EUR">EUR</MenuItem>
                      </TextField>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>

              {/* Notes */}
              <Card elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 3, mb: 3 }}>
                <CardContent sx={{ p: { xs: 3, sm: 4, md: 5 } }}>
                  <Typography variant="h4" fontWeight={700} mb={1} color="primary.main">
                    Additional Notes
                  </Typography>
                  <Typography variant="body2" color="text.secondary" mb={4}>
                    Terms, conditions, and other important information
                  </Typography>
                  <Divider sx={{ mb: 4 }} />
                  
                  <TextField
                    fullWidth
                    multiline
                    rows={6}
                    label="Notes"
                    name="notes"
                    placeholder="Add any additional notes, terms, conditions, or special instructions..."
                    value={values.notes}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                </CardContent>
              </Card>

              <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                <Button
                  variant="outlined"
                  size="large"
                  onClick={() => navigate('/erp/deals')}
                  sx={{ minWidth: '140px', borderRadius: 2, fontWeight: 600 }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  disabled={isSubmitting}
                  sx={{ minWidth: '180px', borderRadius: 2, fontWeight: 600 }}
                >
                  {isSubmitting ? 'Saving...' : isEdit ? 'Update Deal' : 'Create Deal'}
                </Button>
              </Stack>
            </form>
          );}}
        </Formik>

        {/* Add Terms & Conditions Dialog */}
        <Dialog open={addTermsDialogOpen} onClose={() => setAddTermsDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
          <DialogTitle sx={{ pb: 2, pt: 4, px: 4 }}>
            <Typography variant="h4" fontWeight={700}>Add Terms & Conditions</Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>Create a template and attach it to this deal</Typography>
          </DialogTitle>
          <DialogContent sx={{ pt: 5, px: 4 }}>
            {newTermsErrors.submit && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{newTermsErrors.submit}</Alert>}
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 8 }}>
                <TextField
                  fullWidth
                  label="Title"
                  value={newTermsValues.title}
                  onChange={(e) => setNewTermsValues((v) => ({ ...v, title: e.target.value }))}
                  error={Boolean(newTermsErrors.title)}
                  helperText={newTermsErrors.title}
                  required
                  placeholder="e.g. Standard Sales Terms"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  fullWidth
                  label="Category"
                  value={newTermsValues.category}
                  onChange={(e) => setNewTermsValues((v) => ({ ...v, category: e.target.value }))}
                  placeholder="e.g. Sales, Service"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
              <Grid size={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={10}
                  label="Content"
                  value={newTermsValues.content}
                  onChange={(e) => setNewTermsValues((v) => ({ ...v, content: e.target.value }))}
                  error={Boolean(newTermsErrors.content)}
                  helperText={newTermsErrors.content}
                  required
                  placeholder="Enter the full terms and conditions text..."
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 4, pb: 4, pt: 3 }}>
            <Button onClick={() => { setAddTermsDialogOpen(false); setNewTermsErrors({}); }} sx={{ minWidth: 120, borderRadius: 2 }}>Cancel</Button>
            <Button variant="contained" disabled={savingTerms} onClick={handleCreateTerms} sx={{ minWidth: 150, borderRadius: 2 }}>
              {savingTerms ? 'Creating...' : 'Create & Select'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* WDS Details Dialog */}
        <Dialog
          open={wdsDialogOpen}
          onClose={() => setWdsDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            <Typography variant="h4" fontWeight={700}>
              WDS Details
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              All fields are optional. You can save the deal with WDS required checked and complete these details later.
            </Typography>
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 4 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="Ref No"
                  value={wdsDetails.refNo}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, refNo: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={wdsDetails.date}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, date: e.target.value })}
                  InputLabelProps={{ shrink: true }}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <Autocomplete
                fullWidth
                options={companies}
                getOptionLabel={(opt) => opt.company_name || ''}
                value={companies.find((c) => c.company_name === wdsDetails.companyName) || null}
                onChange={(_, val) => setWdsDetails({ ...wdsDetails, companyName: val?.company_name || '' })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Company Name"
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
                isOptionEqualToValue={(opt, val) => opt.company_name === val?.company_name}
                ListboxProps={{ style: { maxHeight: '300px' } }}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="License No"
                  value={wdsDetails.licenseNo}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, licenseNo: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Container No"
                  value={wdsDetails.containerNo}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, containerNo: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={3}
                label="Waste Description"
                value={wdsDetails.wasteDescription}
                onChange={(e) => setWdsDetails({ ...wdsDetails, wasteDescription: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Source/Process"
                value={wdsDetails.sourceProcess}
                onChange={(e) => setWdsDetails({ ...wdsDetails, sourceProcess: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="Package Type"
                  value={wdsDetails.packageType}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, packageType: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Quantity per Package"
                  value={wdsDetails.quantityPerPackage}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, quantityPerPackage: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="Total Weight"
                  value={wdsDetails.totalWeight}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, totalWeight: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>

              <TextField
                fullWidth
                multiline
                rows={2}
                label="Purpose"
                value={wdsDetails.purpose}
                onChange={(e) => setWdsDetails({ ...wdsDetails, purpose: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>Attachments</Typography>
                <WdsAttachmentDropzone
                  onDrop={async (files) => {
                    for (const file of files) {
                      try {
                        const res = await apiService.uploadWdsAttachment(file);
                        setWdsAttachments(prev => [...prev, { path: res.data.path, fileName: res.data.fileName || file.name, url: res.data.url }]);
                      } catch (err) {
                        console.error(err);
                      }
                    }
                  }}
                />
                {wdsAttachments.length > 0 && (
                  <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mt: 2 }}>
                    {wdsAttachments.map((a, idx) => (
                      <Box
                        key={idx}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 0.5,
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: 'action.selected',
                          fontSize: '0.875rem',
                        }}
                      >
                        <IconFileDescription size={16} />
                        <Typography
                          component="a"
                          href={a.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          sx={{ textDecoration: 'none', color: 'primary.main' }}
                        >
                          {a.fileName || a.path?.split('/').pop() || 'File'}
                        </Typography>
                        <IconButton size="small" onClick={() => setWdsAttachments(prev => prev.filter((_, i) => i !== idx))} sx={{ p: 0.25 }}>
                          <IconTrash size={14} />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
                <TextField
                  fullWidth
                  label="BL No"
                  value={wdsDetails.blNo}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, blNo: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <TextField
                  fullWidth
                  label="BOR No"
                  value={wdsDetails.borNo}
                  onChange={(e) => setWdsDetails({ ...wdsDetails, borNo: e.target.value })}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button
              onClick={() => setWdsDialogOpen(false)}
              variant="outlined"
              sx={{ borderRadius: 2 }}
            >
              Cancel
            </Button>
            <Button
              onClick={() => setWdsDialogOpen(false)}
              variant="contained"
              sx={{ borderRadius: 2 }}
            >
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <Dialog open={inspectionDialogOpen} onClose={() => setInspectionDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Inspection Request</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 4 }}>
              <TextField
                select
                label="Priority"
                value={inspectionDetails.priority || 'medium'}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, priority: e.target.value })}
                sx={{ width: 180, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="critical">Critical</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </TextField>
              <Autocomplete
                fullWidth
                options={materialTypes}
                getOptionLabel={(opt) => opt.display_name || opt.value || ''}
                value={materialTypes.find((m) => m.id === inspectionDetails.materialTypeId) || null}
                onChange={(_, val) => setInspectionDetails({ ...inspectionDetails, materialTypeId: val?.id || null })}
                renderInput={(params) => (
                  <TextField {...params} label="Material Type (Required)" required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                )}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
              />
              <TextField
                fullWidth
                label="Location"
                value={inspectionDetails.location}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, location: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                select
                label="Location Type"
                value={inspectionDetails.locationType || ''}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, locationType: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="mainland">Mainland</MenuItem>
                <MenuItem value="freezone">Freezone</MenuItem>
              </TextField>
              <TextField
                fullWidth
                select
                label="Gate Pass Requirement?"
                value={inspectionDetails.gatePassRequirement || ''}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, gatePassRequirement: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="yes">Yes</MenuItem>
                <MenuItem value="no">No</MenuItem>
              </TextField>
              <TextField
                fullWidth
                select
                label="Service Type (Required)"
                value={inspectionDetails.serviceType || ''}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, serviceType: e.target.value })}
                required
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              >
                <MenuItem value="">—</MenuItem>
                <MenuItem value="service">Service</MenuItem>
                <MenuItem value="purchase">Purchase</MenuItem>
                <MenuItem value="free_of_charge">Free of Charge</MenuItem>
                <MenuItem value="N/A">N/A</MenuItem>
              </TextField>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 2 }}>
                {inspectionDetails.quantityUom === 'lumpsum' ? (
                  <TextField
                    fullWidth
                    label="Lumpsum Price"
                    type="number"
                    value={inspectionDetails.lumpsumPrice || ''}
                    onChange={(e) => setInspectionDetails({ ...inspectionDetails, lumpsumPrice: e.target.value })}
                    inputProps={{ min: 0, step: 'any' }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                ) : (
                  <TextField
                    fullWidth
                    label="Quantity (Required)"
                    type="number"
                    value={inspectionDetails.quantity}
                    onChange={(e) => setInspectionDetails({ ...inspectionDetails, quantity: e.target.value })}
                    required
                    inputProps={{ min: 0, step: 'any' }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
                <UomSelectField
                  label="UOM"
                  value={inspectionDetails.quantityUom || ''}
                  onChange={(v) => setInspectionDetails({ ...inspectionDetails, quantityUom: v })}
                  unitsOfMeasure={dropdowns.unitsOfMeasure || []}
                  onUnitsChange={(next) => setDropdowns((d) => ({ ...d, unitsOfMeasure: next }))}
                  extraOptions={[{ value: 'lumpsum', label: 'Lumpsum' }]}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
              </Box>
              <Autocomplete
                multiple
                fullWidth
                options={SAFETY_TOOL_OPTIONS}
                getOptionLabel={(opt) => opt.label || ''}
                value={SAFETY_TOOL_OPTIONS.filter((o) => (inspectionDetails.safetyTools || []).includes(o.value))}
                onChange={(_, val) => setInspectionDetails({ ...inspectionDetails, safetyTools: val ? val.map((o) => o.value) : [] })}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Safety Tools"
                    placeholder="Select safety tools..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                  />
                )}
                isOptionEqualToValue={(opt, val) => opt.value === val?.value}
                ListboxProps={{ style: { maxHeight: '300px' } }}
              />
              <Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  Supporting documents
                </Typography>
                <InspectionDocumentDropzone
                  uploading={inspectionDocUploading}
                  onDrop={async (files) => {
                    setInspectionDocUploading(true);
                    try {
                      for (const file of files) {
                        const res = await apiService.uploadInspectionDocument(file);
                        if (res.success && res.data?.path) {
                          setInspectionDetails((prev) => ({
                            ...prev,
                            supportingDocuments: [
                              ...prev.supportingDocuments,
                              {
                                path: res.data.path,
                                fileName: res.data.fileName || file.name,
                              },
                            ],
                          }));
                        }
                      }
                    } catch (err) {
                      setError(err.message || 'Upload failed');
                    } finally {
                      setInspectionDocUploading(false);
                    }
                  }}
                />
                {inspectionDetails.supportingDocuments.length > 0 && (
                  <Stack spacing={1.5} sx={{ mt: 2 }}>
                    {inspectionDetails.supportingDocuments.map((doc, idx) => (
                      <Box
                        key={`${doc.path}-${idx}`}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          p: 1.25,
                          borderRadius: 2,
                          border: '1px solid',
                          borderColor: 'divider',
                          bgcolor: 'action.hover',
                        }}
                      >
                        <IconFileDescription size={18} style={{ flexShrink: 0, opacity: 0.7 }} />
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography
                            component="a"
                            href={apiService.getUploadUrl(doc.path)}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="body2"
                            fontWeight={600}
                            sx={{
                              display: 'block',
                              textDecoration: 'none',
                              color: 'primary.main',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {doc.fileName || doc.path.split('/').pop() || 'Document'}
                          </Typography>
                        </Box>
                        <Button
                          size="small"
                          color="error"
                          onClick={() => setInspectionDetails((prev) => ({
                            ...prev,
                            supportingDocuments: prev.supportingDocuments.filter((_, i) => i !== idx),
                          }))}
                          sx={{ borderRadius: 2, textTransform: 'none', flexShrink: 0 }}
                        >
                          Remove
                        </Button>
                      </Box>
                    ))}
                    {inspectionDetails.supportingDocuments.some((doc) => isImageDocumentPath(doc.path)) && (
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {inspectionDetails.supportingDocuments
                          .filter((doc) => isImageDocumentPath(doc.path))
                          .map((doc, idx) => (
                            <Box
                              key={`preview-${doc.path}-${idx}`}
                              component="img"
                              src={apiService.getUploadUrl(doc.path)}
                              alt={doc.fileName}
                              sx={{
                                width: 96,
                                height: 96,
                                objectFit: 'cover',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: 'divider',
                              }}
                            />
                          ))}
                      </Stack>
                    )}
                  </Stack>
                )}
              </Box>
              <Autocomplete
                fullWidth
                options={users}
                getOptionLabel={(opt) => `${opt.first_name || ''} ${opt.last_name || ''}`.trim() || opt.email || ''}
                value={users.find((u) => u.id === inspectionDetails.requestedBy) || null}
                onChange={(_, val) => setInspectionDetails({ ...inspectionDetails, requestedBy: val?.id || null })}
                renderInput={(params) => (
                  <TextField {...params} label="Requested by (Required)" placeholder="Select user..." required sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                )}
                isOptionEqualToValue={(opt, val) => opt.id === val?.id}
                noOptionsText="No users found"
                ListboxProps={{ style: { maxHeight: '300px' } }}
              />
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Extra notes"
                placeholder="Special instructions for the inspection team..."
                value={inspectionDetails.notes}
                onChange={(e) => setInspectionDetails({ ...inspectionDetails, notes: e.target.value })}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 3 }}>
            <Button onClick={() => setInspectionDialogOpen(false)} variant="outlined" sx={{ borderRadius: 2 }}>
              Cancel
            </Button>
            <Button onClick={() => setInspectionDialogOpen(false)} variant="contained" sx={{ borderRadius: 2 }}>
              Save
            </Button>
          </DialogActions>
        </Dialog>

        <ApprovalWorkflowDialogs
          open={approvalDialogOpen}
          entityLabel="deal"
          pinConfigured={pinConfigured}
          loading={approvalLoading}
          error={approvalError}
          onClose={() => !approvalLoading && finishAndNavigate()}
          onDecideLater={finishAndNavigate}
          onRequestApproval={handleRequestDealApproval}
          onApproveWithPin={handleApproveDealWithPin}
          approveButtonLabel="Approve deal"
        />
      </Box>
    </PageContainer>
  );
};

export default DealForm;
