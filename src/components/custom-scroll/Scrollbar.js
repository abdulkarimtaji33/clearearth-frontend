import PropTypes from 'prop-types';
import SimpleBar from 'simplebar-react';
import 'simplebar/dist/simplebar.min.css';
import { Box, styled } from '@mui/material';

const SimpleBarStyle = styled(SimpleBar)(({ theme }) => ({
  maxHeight: '100%',
  '.simplebar-scrollbar': {
    '&:before': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.25)' : 'rgba(0, 0, 0, 0.2)',
      borderRadius: '8px',
      width: '6px',
      left: '2px',
      transition: 'background-color 0.2s ease',
    },
    '&.simplebar-visible:before': {
      opacity: 1,
    },
  },
  '.simplebar-track': {
    backgroundColor: 'transparent',
    borderRadius: '8px',
    width: '10px',
    right: '2px',
    '&.simplebar-vertical': {
      width: '10px',
    },
    '&:hover .simplebar-scrollbar:before': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.35)',
    },
  },
}));

const Scrollbar = (props) => {
  const { children, sx, ...other } = props;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );

  if (isMobile) {
    return <Box sx={{ overflowX: 'auto' }}>{children}</Box>;
  }

  return (
    <SimpleBarStyle sx={sx} {...other}>
      {children}
    </SimpleBarStyle>
  );
};

Scrollbar.propTypes = {
  children: PropTypes.node,
  sx: PropTypes.object,
  other: PropTypes.any,
};

export default Scrollbar;
