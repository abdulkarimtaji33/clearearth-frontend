import React, { useMemo, useState } from 'react';
import { Box, IconButton, Stack, Typography } from '@mui/material';
import FsLightbox from 'fslightbox-react';
import { IconX } from '@tabler/icons-react';

const isPdfUrl = (url) => String(url || '').toLowerCase().endsWith('.pdf');
const isSpreadsheetUrl = (url) => /\.(xls|xlsx)$/i.test(String(url || ''));
const isDocUrl = (url) => /\.(doc|docx)$/i.test(String(url || ''));
const isNonImageUrl = (url) => isPdfUrl(url) || isDocUrl(url) || isSpreadsheetUrl(url);

const fileEmoji = (url) => {
  if (isPdfUrl(url)) return '📄';
  if (isSpreadsheetUrl(url)) return '📊';
  if (isDocUrl(url)) return '📝';
  return '📎';
};

export default function GrnEvidenceThumbs({
  images = [],
  size = 72,
  editable = false,
  onRemove,
}) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const imageSources = useMemo(
    () => images.filter((img) => !(img.isPdf || isNonImageUrl(img.imageUrl || img.image_url))).map((img) => img.imageUrl || img.image_url),
    [images]
  );

  const openLightbox = (imageOnlyIndex) => {
    if (!imageSources.length) return;
    setLightboxIndex(imageOnlyIndex);
    setLightboxOpen((p) => !p);
  };

  if (!images.length) return null;

  let imageOnlyIdx = 0;

  return (
    <>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
        {images.map((img, idx) => {
          const url = img.imageUrl || img.image_url;
          const isNonImage = img.isPdf || isNonImageUrl(url);
          const currentImageIdx = !isNonImage ? imageOnlyIdx++ : -1;

          if (isNonImage) {
            return (
              <Box key={img.id ?? idx} sx={{ position: 'relative' }}>
                <Box
                  component="a"
                  href={url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    width: size,
                    height: size,
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: 'action.hover',
                    textDecoration: 'none',
                  }}
                  title={img.originalName || img.original_name || 'File'}
                >
                  <Typography fontSize={size > 60 ? '1.2rem' : '1rem'}>{fileEmoji(url)}</Typography>
                  {size > 60 && (
                    <Typography variant="caption" color="text.secondary" noWrap sx={{ maxWidth: size - 8, fontSize: '0.55rem' }}>
                      {img.originalName || img.original_name || 'File'}
                    </Typography>
                  )}
                </Box>
                {editable && onRemove && (
                  <IconButton
                    size="small"
                    onClick={() => onRemove(idx)}
                    sx={{
                      position: 'absolute',
                      top: -6,
                      right: -6,
                      bgcolor: 'background.paper',
                      border: '1px solid',
                      borderColor: 'divider',
                      width: 20,
                      height: 20,
                    }}
                  >
                    <IconX size={11} />
                  </IconButton>
                )}
              </Box>
            );
          }

          return (
            <Box key={img.id ?? idx} sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={url}
                alt={img.originalName || img.original_name || 'Evidence'}
                onClick={() => openLightbox(currentImageIdx)}
                sx={{
                  width: size,
                  height: size,
                  objectFit: 'cover',
                  borderRadius: 1.5,
                  border: '1px solid',
                  borderColor: 'divider',
                  display: 'block',
                  cursor: 'pointer',
                  transition: 'transform 0.18s, box-shadow 0.18s',
                  '&:hover': { transform: 'scale(1.04)', boxShadow: 4 },
                }}
              />
              {editable && onRemove && (
                <IconButton
                  size="small"
                  onClick={(e) => { e.stopPropagation(); onRemove(idx); }}
                  sx={{
                    position: 'absolute',
                    top: -6,
                    right: -6,
                    bgcolor: 'background.paper',
                    border: '1px solid',
                    borderColor: 'divider',
                    width: 20,
                    height: 20,
                  }}
                >
                  <IconX size={11} />
                </IconButton>
              )}
            </Box>
          );
        })}
      </Stack>
      {imageSources.length > 0 && (
        <FsLightbox toggler={lightboxOpen} sources={imageSources} sourceIndex={lightboxIndex} />
      )}
    </>
  );
}
