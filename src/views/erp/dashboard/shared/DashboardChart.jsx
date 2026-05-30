import React from 'react';
import { Paper, Typography, Box } from '@mui/material';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

const DashboardChart = ({ title, data = {}, type = 'donut' }) => {
  const theme = useTheme();
  const labels = Object.keys(data);
  const series = labels.map((k) => data[k] || 0);

  if (!labels.length || series.every((v) => !v)) return null;

  const options = {
    labels: labels.map((l) => l.replace(/_/g, ' ')),
    chart: { fontFamily: theme.typography.fontFamily },
    legend: { position: 'bottom' },
    colors: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main, theme.palette.info.main, theme.palette.secondary.main],
  };

  return (
    <Paper elevation={0} sx={{ p: 2.5, borderRadius: 3, border: '1px solid', borderColor: 'divider', height: '100%' }}>
      <Typography variant="subtitle2" fontWeight={800} mb={2}>{title}</Typography>
      <Chart options={options} series={series} type={type} height={280} />
    </Paper>
  );
};

export default DashboardChart;
