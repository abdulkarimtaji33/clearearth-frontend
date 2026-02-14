import React from 'react';
import { Box, Card, CardContent, Typography, Grid, Button } from '@mui/material';
import { IconFileAnalytics } from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';

const ReportList = () => {
  const reports = [
    { title: 'Deal Report', description: 'View deals by stage, status, and value' },
    { title: 'Invoice Report', description: 'Track invoices, payments, and outstanding amounts' },
    { title: 'Inventory Report', description: 'Stock levels, valuation, and movements' },
    { title: 'Sales Report', description: 'Sales performance and trends' },
    { title: 'VAT Report', description: 'VAT breakdown and FTA compliance' },
    { title: 'Customer Ageing', description: 'Outstanding receivables by ageing buckets' },
    { title: 'Commission Report', description: 'Commission calculations and payouts' },
    { title: 'Expense Report', description: 'Operating expenses and cost analysis' },
  ];

  return (
    <PageContainer title="Reports" description="View reports">
      <Box>
        <Box mb={3}>
          <Typography variant="h4" fontWeight="600">
            Reports & Analytics
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={1}>
            Generate and view various business reports
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {reports.map((report, index) => (
            <Grid size={{ xs: 12, md: 6, lg: 4 }} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <IconFileAnalytics size={32} />
                    <Typography variant="h6">{report.title}</Typography>
                  </Box>
                  <Typography variant="body2" color="textSecondary" mb={2}>
                    {report.description}
                  </Typography>
                  <Button variant="outlined" size="small" fullWidth>
                    Generate Report
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default ReportList;
