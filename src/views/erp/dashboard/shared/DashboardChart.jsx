import React from 'react';
import { Paper, Typography, Box, Divider } from '@mui/material';
import Chart from 'react-apexcharts';
import { useTheme } from '@mui/material/styles';

const DashboardChart = ({ title, subtitle, data = {}, type = 'donut' }) => {
  const theme = useTheme();
  const labels = Object.keys(data);
  const series = labels.map((k) => data[k] || 0);

  if (!labels.length || series.every((v) => !v)) return null;

  const colors = [
    theme.palette.primary.main,
    theme.palette.success.main,
    theme.palette.warning.main,
    theme.palette.info.main,
    theme.palette.secondary.main,
    theme.palette.error.main,
  ];

  const options = {
    labels: labels.map((l) => l.replace(/_/g, ' ')),
    chart: {
      fontFamily: theme.typography.fontFamily,
      toolbar: { show: false },
      background: 'transparent',
    },
    legend: {
      position: 'bottom',
      fontSize: '13px',
      fontWeight: 600,
      markers: { size: 8, shape: 'circle' },
    },
    colors,
    stroke: { width: type === 'donut' ? 3 : 0, colors: [theme.palette.background.paper] },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            total: {
              show: true,
              label: 'Total',
              fontSize: '13px',
              fontWeight: 700,
              color: theme.palette.text.secondary,
              formatter: (w) => w.globals.seriesTotals.reduce((a, b) => a + b, 0).toLocaleString(),
            },
          },
        },
      },
    },
    dataLabels: { enabled: false },
    tooltip: {
      theme: theme.palette.mode,
      style: { fontFamily: theme.typography.fontFamily },
    },
  };

  return (
    <Paper
      elevation={0}
      sx={{
        borderRadius: 3,
        border: '1px solid',
        borderColor: 'divider',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Typography variant="subtitle2" fontWeight={800}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="caption" color="text.secondary">
            {subtitle}
          </Typography>
        )}
      </Box>
      <Box sx={{ p: 2 }}>
        <Chart options={options} series={series} type={type} height={260} />
      </Box>
    </Paper>
  );
};

export default DashboardChart;
