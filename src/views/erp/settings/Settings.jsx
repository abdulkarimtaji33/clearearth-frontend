import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
} from '@mui/material';
import {
  IconBuilding,
  IconCurrencyDollar,
  IconClock,
  IconPalette,
  IconReceipt,
  IconCreditCard,
  IconCategory,
  IconPackage,
} from '@tabler/icons-react';
import PageContainer from '../../../components/container/PageContainer';

const Settings = () => {
  const settingSections = [
    {
      title: 'Company Settings',
      icon: IconBuilding,
      items: ['Company Information', 'Logo & Branding', 'Contact Details'],
    },
    {
      title: 'Financial Settings',
      icon: IconCurrencyDollar,
      items: ['Currency Configuration', 'Tax Settings', 'VAT Configuration'],
    },
    {
      title: 'Operational Settings',
      icon: IconClock,
      items: ['Timezone Settings', 'Working Hours', 'Fiscal Year'],
    },
    {
      title: 'Master Data',
      icon: IconCategory,
      items: ['Material Types', 'Payment Modes', 'Expense Categories', 'Deal Types'],
    },
  ];

  return (
    <PageContainer title="Settings" description="System settings">
      <Box>
        <Box mb={3}>
          <Typography variant="h4" fontWeight="600">
            Settings
          </Typography>
          <Typography variant="body2" color="textSecondary" mt={1}>
            Configure your ERP system settings
          </Typography>
        </Box>

        <Grid container spacing={3}>
          {settingSections.map((section, index) => (
            <Grid size={{ xs: 12, md: 6 }} key={index}>
              <Card>
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <section.icon size={32} />
                    <Typography variant="h6">{section.title}</Typography>
                  </Box>
                  <Divider sx={{ mb: 2 }} />
                  <List dense>
                    {section.items.map((item, idx) => (
                      <ListItem key={idx} button>
                        <ListItemText primary={item} />
                      </ListItem>
                    ))}
                  </List>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Box>
    </PageContainer>
  );
};

export default Settings;
