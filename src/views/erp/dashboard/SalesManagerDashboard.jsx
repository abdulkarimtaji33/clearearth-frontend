import React, { useState } from 'react';
import {
  Box, Grid, Typography, Paper, Stack, Chip, LinearProgress,
  Avatar, Button,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router';
import { useAuth } from '../../../context/AuthContext';
import {
  IconTrophy, IconMedal, IconArrowRight, IconUsers,
  IconClock, IconAlertTriangle, IconClipboardList,
  IconCurrencyDollar, IconBriefcase, IconFileText,
} from '@tabler/icons-react';
import KpiCard from './shared/KpiCard';
import apiService from '../../../services/api';

const MEDAL_COLORS = ['#FFD700', '#C0C0C0', '#CD7F32'];

const STAGE_META = {
  new:            { color: '#9E9E9E', label: 'New', chipColor: 'default' },
  approved:       { color: '#0288D1', label: 'Approved', chipColor: 'info' },
  quotation_sent: { color: '#1565C0', label: 'Quotation Sent', chipColor: 'primary' },
  negotiation:    { color: '#E65100', label: 'Negotiation', chipColor: 'warning' },
  won:            { color: '#2E7D32', label: 'Won', chipColor: 'success' },
};

const KPI_ICONS = {
  'Pipeline value': IconCurrencyDollar,
  'Won this month': IconTrophy,
  'Won deals': IconTrophy,
  'Stale deals (10d+)': IconAlertTriangle,
  'Active deals': IconClipboardList,
};

const daysSince = (dateStr) => {
  const d = new Date(dateStr);
  return Math.floor((Date.now() - d) / 86400000);
};

const repName = (row) => {
  if (row?.assignedUser) return `${row.assignedUser.first_name} ${row.assignedUser.last_name}`;
  if (row?.assigned_to) return `User #${row.assigned_to}`;
  return '—';
};

const SalesManagerDashboard = ({ data, onRefresh }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const { hasAdminDashboardAccess } = useAuth();
  const [approvingId, setApprovingId] = useState(null);

  const pendingDeals = data.pendingApprovals?.dealRows || [];
  const pendingQuotations = data.pendingApprovals?.quotationRows || [];
  const totalPending = (data.pendingApprovals?.total || 0);

  const maxWon = Math.max(...(data.leaderboard || []).map((r) => parseFloat(r.total || 0)), 1);
  const maxPipeline = Math.max(...(data.pipeline || []).map((p) => p.count), 1);

  const handleApproveDeal = async (dealId) => {
    try {
      setApprovingId(`deal-${dealId}`);
      await apiService.approveDeal(dealId);
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  const handleApproveQuotation = async (quotationId) => {
    try {
      setApprovingId(`quot-${quotationId}`);
      await apiService.approveQuotation(quotationId);
      onRefresh?.();
    } catch (e) {
      alert(e.message || 'Failed to approve');
    } finally {
      setApprovingId(null);
    }
  };

  return (
    <Box>
      <Box mb={3}>
        <Typography variant="h4" fontWeight={900} lineHeight={1.2}>Team performance</Typography>
        <Typography variant="body2" color="text.secondary" mt={0.25}>Pipeline, approvals, and team leaderboard</Typography>
      </Box>

      {/* KPIs */}
      <Grid container spacing={2.5} mb={3.5}>
        {(data.kpis || []).map((k) => (
          <Grid key={k.label} size={{ xs: 12, sm: 6, md: 3 }}>
            <KpiCard
              {...k}
              icon={KPI_ICONS[k.label]}
              color={k.label?.includes('Stale') && k.value > 0 ? 'warning' : 'primary'}
              highlight={k.label?.includes('Stale') && k.value > 0}
            />
          </Grid>
        ))}
      </Grid>

      {/* Pending Approvals */}
      {totalPending > 0 && (
        <Paper elevation={0} sx={{ mb: 3.5, borderRadius: 3, border: '1.5px solid', borderColor: 'warning.main', overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" spacing={1.5} sx={{ px: 2.5, py: 1.75, bgcolor: (t) => alpha(t.palette.warning.main, 0.07), borderBottom: '1px solid', borderColor: 'warning.light' }}>
            <IconClock size={18} color={theme.palette.warning.main} />
            <Typography variant="subtitle2" fontWeight={800} color="warning.dark">
              {totalPending} pending approval{totalPending !== 1 ? 's' : ''}
            </Typography>
            <Chip size="small" label={`${data.pendingApprovals?.deals || 0} deal${(data.pendingApprovals?.deals || 0) !== 1 ? 's' : ''}`} color="warning" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
            {(data.pendingApprovals?.quotations || 0) > 0 && (
              <Chip size="small" label={`${data.pendingApprovals.quotations} quotation${data.pendingApprovals.quotations !== 1 ? 's' : ''}`} color="primary" variant="outlined" sx={{ fontWeight: 700, height: 20, fontSize: '0.7rem' }} />
            )}
          </Stack>

          {/* Pending deals */}
          {pendingDeals.length > 0 && (
            <Box>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ px: 2.5, pt: 1.5, pb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Deals
              </Typography>
              <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
                {pendingDeals.map((deal) => (
                  <Stack key={deal.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.25 }}>
                    <Box minWidth={0} flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={700} noWrap>{deal.title || deal.deal_number}</Typography>
                        <Typography variant="caption" color="text.disabled">{deal.deal_number}</Typography>
                      </Stack>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <Typography variant="caption" color="text.secondary">{repName(deal)}</Typography>
                        {deal.total > 0 && <Typography variant="caption" color="text.disabled">· AED {Number(deal.total).toLocaleString()}</Typography>}
                        <Typography variant="caption" color="text.disabled">· {daysSince(deal.created_at)}d ago</Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" sx={{ borderRadius: 2, minWidth: 0, px: 1.5, fontSize: '0.75rem' }}
                        onClick={() => navigate(`/erp/deals/view/${deal.id}`)}>
                        View
                      </Button>
                      <Button size="small" variant="contained" color="success" sx={{ borderRadius: 2, minWidth: 0, px: 1.5, fontSize: '0.75rem' }}
                        disabled={approvingId === `deal-${deal.id}`}
                        onClick={() => handleApproveDeal(deal.id)}>
                        {approvingId === `deal-${deal.id}` ? '…' : 'Approve'}
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}

          {/* Pending quotations */}
          {pendingQuotations.length > 0 && (
            <Box sx={{ borderTop: pendingDeals.length > 0 ? '1px solid' : 'none', borderColor: 'divider' }}>
              <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ px: 2.5, pt: 1.5, pb: 0.5, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Quotations
              </Typography>
              <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
                {pendingQuotations.map((q) => (
                  <Stack key={q.id} direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.25 }}>
                    <Box minWidth={0} flex={1}>
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography variant="body2" fontWeight={700}>{q.quotation_number || `QT-${q.id}`}</Typography>
                        {q.deal && <Typography variant="caption" color="text.secondary">· {q.deal.deal_number} {q.deal.title}</Typography>}
                      </Stack>
                      <Stack direction="row" spacing={1}>
                        {q.total > 0 && <Typography variant="caption" color="text.disabled">AED {Number(q.total).toLocaleString()}</Typography>}
                        <Typography variant="caption" color="text.disabled">· {daysSince(q.created_at)}d ago</Typography>
                      </Stack>
                    </Box>
                    <Stack direction="row" spacing={1}>
                      <Button size="small" variant="outlined" sx={{ borderRadius: 2, minWidth: 0, px: 1.5, fontSize: '0.75rem' }}
                        onClick={() => navigate(`/erp/quotations`)}>
                        View
                      </Button>
                      <Button size="small" variant="contained" color="success" sx={{ borderRadius: 2, minWidth: 0, px: 1.5, fontSize: '0.75rem' }}
                        disabled={approvingId === `quot-${q.id}`}
                        onClick={() => handleApproveQuotation(q.id)}>
                        {approvingId === `quot-${q.id}` ? '…' : 'Approve'}
                      </Button>
                    </Stack>
                  </Stack>
                ))}
              </Stack>
            </Box>
          )}
        </Paper>
      )}

      <Grid container spacing={2.5} mb={3.5}>
        {/* Leaderboard */}
        <Grid size={{ xs: 12, md: 7 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <IconTrophy size={18} color={theme.palette.warning.main} />
                <Typography variant="subtitle2" fontWeight={800}>Won deals leaderboard</Typography>
              </Stack>
              {hasAdminDashboardAccess?.() && (
                <Button size="small" startIcon={<IconUsers size={14} />} onClick={() => navigate('/erp/users')} sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
                  Team
                </Button>
              )}
            </Stack>
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
              {(data.leaderboard || []).length === 0 ? (
                <Typography color="text.secondary" p={3} textAlign="center" variant="body2">No won deals yet this period</Typography>
              ) : (
                data.leaderboard.map((row, i) => {
                  const total = parseFloat(row.total || 0);
                  const pct = (total / maxWon) * 100;
                  const name = row.user ? `${row.user.first_name} ${row.user.last_name}` : 'Unassigned';
                  return (
                    <Box key={i} sx={{ px: 2.5, py: 1.5 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.75}>
                        <Stack direction="row" alignItems="center" spacing={1.5}>
                          <Avatar sx={{ width: 32, height: 32, bgcolor: i < 3 ? alpha(MEDAL_COLORS[i], 0.15) : 'action.hover', fontSize: '0.75rem', fontWeight: 800, color: i < 3 ? MEDAL_COLORS[i] : 'text.secondary' }}>
                            {i < 3 ? <IconMedal size={16} /> : `${i + 1}`}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" fontWeight={700}>{name}</Typography>
                            <Typography variant="caption" color="text.secondary">{row.count} deal{row.count !== 1 ? 's' : ''} won</Typography>
                          </Box>
                        </Stack>
                        <Typography variant="body2" fontWeight={900} color="success.main">
                          AED {total.toLocaleString()}
                        </Typography>
                      </Stack>
                      <LinearProgress variant="determinate" value={pct}
                        sx={{ height: 6, borderRadius: 3, bgcolor: alpha(theme.palette.success.main, 0.1), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: i === 0 ? '#FFD700' : 'success.main' } }}
                      />
                    </Box>
                  );
                })
              )}
            </Stack>
          </Paper>
        </Grid>

        {/* Pipeline */}
        <Grid size={{ xs: 12, md: 5 }}>
          <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', height: '100%' }}>
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
              <Typography variant="subtitle2" fontWeight={800}>Pipeline by stage</Typography>
              <Button size="small" endIcon={<IconArrowRight size={13} />} onClick={() => navigate('/erp/deals')} sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
                All deals
              </Button>
            </Stack>
            <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
              {(data.pipeline || []).length === 0 ? (
                <Typography color="text.secondary" p={3} textAlign="center" variant="body2">No pipeline data</Typography>
              ) : (
                (data.pipeline || []).map((p) => {
                  const meta = STAGE_META[p.status] || { color: '#9E9E9E', label: p.status };
                  const pct = maxPipeline > 0 ? (p.count / maxPipeline) * 100 : 0;
                  return (
                    <Box key={p.status} sx={{ px: 2.5, py: 1.25 }}>
                      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={0.5}>
                        <Typography variant="body2" fontWeight={700}>{meta.label}</Typography>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          {p.value > 0 && <Typography variant="caption" color="text.secondary">AED {Number(p.value).toLocaleString()}</Typography>}
                          <Typography variant="body2" fontWeight={900} color={p.count > 0 ? 'text.primary' : 'text.disabled'}>{p.count}</Typography>
                        </Stack>
                      </Stack>
                      <LinearProgress variant="determinate" value={pct}
                        sx={{ height: 5, borderRadius: 3, bgcolor: alpha(meta.color, 0.12), '& .MuiLinearProgress-bar': { borderRadius: 3, bgcolor: meta.color } }}
                      />
                    </Box>
                  );
                })
              )}
            </Stack>
          </Paper>
        </Grid>
      </Grid>

      {/* Recent deals */}
      <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden', mb: 3 }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <IconBriefcase size={16} />
            <Typography variant="subtitle2" fontWeight={800}>Active deals</Typography>
          </Stack>
          <Button size="small" endIcon={<IconArrowRight size={13} />} onClick={() => navigate('/erp/deals')} sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
            View all
          </Button>
        </Stack>
        <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
          {(data.recentDeals || []).length === 0 ? (
            <Typography color="text.secondary" p={3} textAlign="center" variant="body2">No active deals</Typography>
          ) : (
            (data.recentDeals || []).slice(0, 8).map((d) => {
              const meta = STAGE_META[d.status] || { chipColor: 'default', label: d.status };
              return (
                <Stack key={d.id} direction="row" alignItems="center" justifyContent="space-between"
                  sx={{ px: 2.5, py: 1.1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => navigate(`/erp/deals/view/${d.id}`)}>
                  <Box minWidth={0} flex={1}>
                    <Typography variant="body2" fontWeight={600} noWrap>{d.title || d.deal_number}</Typography>
                    <Stack direction="row" spacing={0.75} alignItems="center">
                      <Typography variant="caption" color="text.secondary">{d.deal_number}</Typography>
                      <Typography variant="caption" color="text.disabled">· {repName(d)}</Typography>
                      {d.total > 0 && <Typography variant="caption" color="text.disabled">· AED {Number(d.total).toLocaleString()}</Typography>}
                    </Stack>
                  </Box>
                  <Chip size="small" label={meta.label} color={meta.chipColor} sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20, ml: 1, flexShrink: 0 }} />
                </Stack>
              );
            })
          )}
        </Stack>
      </Paper>

      {/* Recent leads */}
      {(data.recentLeads || []).length > 0 && (
        <Paper elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ px: 2.5, py: 1.75, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <IconFileText size={16} />
              <Typography variant="subtitle2" fontWeight={800}>Recent leads</Typography>
            </Stack>
            <Button size="small" endIcon={<IconArrowRight size={13} />} onClick={() => navigate('/erp/leads')} sx={{ borderRadius: 2, fontSize: '0.78rem' }}>
              View all
            </Button>
          </Stack>
          <Stack divider={<Box sx={{ borderBottom: '1px solid', borderColor: 'divider' }} />}>
            {(data.recentLeads || []).slice(0, 8).map((l) => {
              const statusColor = { new: 'default', contacted: 'info', qualified: 'success', converted: 'success', disqualified: 'error', pending_approval: 'warning' }[l.status] || 'default';
              return (
                <Stack key={l.id} direction="row" alignItems="center" justifyContent="space-between"
                  sx={{ px: 2.5, py: 1.1, cursor: 'pointer', '&:hover': { bgcolor: 'action.hover' } }}
                  onClick={() => navigate(`/erp/leads/edit/${l.id}`)}>
                  <Box minWidth={0} flex={1}>
                    <Typography variant="body2" fontWeight={600} noWrap>{l.company?.company_name || l.lead_number}</Typography>
                    <Stack direction="row" spacing={0.75}>
                      <Typography variant="caption" color="text.secondary">{l.productService?.name || l.source}</Typography>
                      <Typography variant="caption" color="text.disabled">· {repName(l)}</Typography>
                    </Stack>
                  </Box>
                  <Chip size="small" label={(l.status || '').replace(/_/g, ' ')} color={statusColor} sx={{ fontWeight: 700, fontSize: '0.68rem', height: 20, ml: 1, flexShrink: 0, textTransform: 'capitalize' }} />
                </Stack>
              );
            })}
          </Stack>
        </Paper>
      )}
    </Box>
  );
};

export default SalesManagerDashboard;
