import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  Button, Box, Typography, IconButton, Paper, Stack, Chip, Divider,
} from '@mui/material';
import {
  IconX, IconRoute, IconGripVertical, IconMapPin,
  IconExternalLink, IconNavigation,
} from '@tabler/icons-react';
import { alpha, useTheme } from '@mui/material/styles';
import { isGoogleMapsConfigured, loadGoogleMapsLibrary } from '../../utils/googleMapsLoader';
import {
  DndContext, closestCenter, PointerSensor, TouchSensor,
  useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, verticalListSortingStrategy,
  useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Parse lat/lng from a stored Google Maps URL
function parseCoords(url) {
  if (!url) return null;
  let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

// Stop colours by order index (cycles after 9)
const STOP_COLORS = [
  '#1565C0', '#E65100', '#2E7D32', '#6A1B9A',
  '#AD1457', '#00838F', '#F57F17', '#4E342E', '#37474F',
];
const stopColor = (i) => STOP_COLORS[i % STOP_COLORS.length];

// ─── Draggable stop row ───────────────────────────────────────────────────────
const StopRow = ({ stop, index, total }) => {
  const theme = useTheme();
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: stop.taskId });

  const color = stopColor(index);

  return (
    <Paper
      ref={setNodeRef}
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
        px: 1.5,
        py: 1.25,
        borderRadius: 2,
        border: '1px solid',
        borderColor: isDragging ? color : 'divider',
        bgcolor: isDragging ? alpha(color, 0.06) : 'background.paper',
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: isDragging ? 'grabbing' : 'grab',
        boxShadow: isDragging ? `0 4px 20px ${alpha(color, 0.25)}` : 'none',
        zIndex: isDragging ? 999 : 'auto',
      }}
    >
      {/* Drag handle */}
      <Box {...attributes} {...listeners} sx={{ color: 'text.disabled', display: 'flex', alignItems: 'center' }}>
        <IconGripVertical size={18} />
      </Box>

      {/* Stop number badge */}
      <Box
        sx={{
          width: 28, height: 28, borderRadius: '50%',
          bgcolor: color, color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: 900, fontSize: '0.8rem', flexShrink: 0,
        }}
      >
        {index + 1}
      </Box>

      {/* Info */}
      <Box flex={1} minWidth={0}>
        <Typography variant="body2" fontWeight={700} noWrap>
          {stop.deal?.title || stop.workOrderTitle || `WO #${stop.workOrderId}`}
        </Typography>
        {stop.deal?.pickup_contact_name && (
          <Typography variant="caption" color="text.secondary" noWrap>
            {stop.deal.pickup_contact_name}
          </Typography>
        )}
      </Box>

      {/* Priority chip */}
      <Chip
        label={stop.priority?.toUpperCase()}
        size="small"
        sx={{
          height: 20, fontWeight: 800, fontSize: '0.62rem',
          bgcolor: stop.priority === 'overdue' ? '#D32F2F' : stop.priority === 'today' ? '#E65100' : '#1565C0',
          color: '#fff', flexShrink: 0,
        }}
      />
    </Paper>
  );
};

// ─── Main dialog ──────────────────────────────────────────────────────────────
export default function RoutePlannerDialog({ open, onClose, pickups }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const theme = useTheme();

  // Only pickups that have a parseable location
  const withCoords = pickups.filter((p) => parseCoords(p.deal?.pickup_location));
  const [stops, setStops] = useState([]);
  const [mapReady, setMapReady] = useState(false);

  // Initialise stop order from pickups — overdue first, then today, then upcoming
  useEffect(() => {
    if (open) setStops([...withCoords]);
  }, [open, pickups]);

  // DnD sensors — support both mouse and touch
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }),
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setStops((prev) => {
      const oldIdx = prev.findIndex((s) => s.taskId === active.id);
      const newIdx = prev.findIndex((s) => s.taskId === over.id);
      return arrayMove(prev, oldIdx, newIdx);
    });
  };

  // Clear old markers and draw new ones whenever stops order changes
  const drawMarkers = useCallback(() => {
    if (!mapInstanceRef.current || !window.google) return;

    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    const bounds = new window.google.maps.LatLngBounds();

    stops.forEach((stop, i) => {
      const coords = parseCoords(stop.deal?.pickup_location);
      if (!coords) return;
      const color = stopColor(i);
      const colorHex = color.replace('#', '');

      const marker = new window.google.maps.Marker({
        position: coords,
        map: mapInstanceRef.current,
        title: `Stop ${i + 1}: ${stop.deal?.title || ''}`,
        label: {
          text: String(i + 1),
          color: '#fff',
          fontWeight: 'bold',
          fontSize: '13px',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 2,
          scale: 18,
        },
      });

      markersRef.current.push(marker);
      bounds.extend(coords);
    });

    if (stops.length > 0) {
      mapInstanceRef.current.fitBounds(bounds, { top: 60, right: 40, bottom: 40, left: 40 });
      if (stops.length === 1) mapInstanceRef.current.setZoom(15);
    }
  }, [stops]);

  // Re-draw markers when stop order changes
  useEffect(() => {
    if (mapReady) drawMarkers();
  }, [stops, mapReady, drawMarkers]);

  // Load Google Maps
  useEffect(() => {
    if (!open || !mapRef.current) return;
    setMapReady(false);

    if (!isGoogleMapsConfigured) return;

    loadGoogleMapsLibrary('maps').then(() => {
      if (!mapRef.current) return;
      const map = new window.google.maps.Map(mapRef.current, {
        center: { lat: 25.2048, lng: 55.2708 },
        zoom: 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;
      setMapReady(true);
    });

    return () => {
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      mapInstanceRef.current = null;
      setMapReady(false);
    };
  }, [open]);

  // Build a Google Maps multi-stop directions URL
  const buildNavigationUrl = () => {
    const coords = stops
      .map((s) => parseCoords(s.deal?.pickup_location))
      .filter(Boolean);
    if (coords.length === 0) return null;
    if (coords.length === 1) {
      return `https://www.google.com/maps/dir/?api=1&destination=${coords[0].lat},${coords[0].lng}&travelmode=driving`;
    }
    const origin = coords[0];
    const destination = coords[coords.length - 1];
    const waypoints = coords.slice(1, -1).map((c) => `${c.lat},${c.lng}`).join('|');
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.lat},${destination.lng}${waypoints ? `&waypoints=${waypoints}` : ''}&travelmode=driving`;
  };

  const noLocations = withCoords.length === 0;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{ sx: { borderRadius: 3, height: '90vh', maxHeight: 750 } }}
    >
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1, flexShrink: 0 }}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <IconRoute size={22} />
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>Route Planner</Typography>
            <Typography variant="caption" color="text.secondary">
              Drag stops to reorder · {stops.length} location{stops.length !== 1 ? 's' : ''}
            </Typography>
          </Box>
        </Stack>
        <IconButton size="small" onClick={onClose}><IconX size={18} /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, overflow: 'hidden', flex: 1 }}>
        {noLocations ? (
          <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 4 }}>
            <Box textAlign="center">
              <IconMapPin size={48} color={theme.palette.text.disabled} />
              <Typography variant="h6" color="text.secondary" mt={2} fontWeight={700}>
                No locations set
              </Typography>
              <Typography variant="body2" color="text.disabled" mt={0.5}>
                Ask your manager to set pickup locations on the deals
              </Typography>
            </Box>
          </Box>
        ) : (
          <>
            {/* Map panel */}
            <Box sx={{ flex: 1, minHeight: { xs: 260, sm: 'auto' }, position: 'relative' }}>
              <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
              {!mapReady && (
                <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: alpha(theme.palette.background.default, 0.8) }}>
                  <Typography variant="body2" color="text.secondary">Loading map…</Typography>
                </Box>
              )}
            </Box>

            {/* Stop list panel */}
            <Box
              sx={{
                width: { xs: '100%', sm: 300 },
                flexShrink: 0,
                borderLeft: { sm: '1px solid' },
                borderTop: { xs: '1px solid', sm: 'none' },
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
              }}
            >
              <Box sx={{ px: 2, py: 1.5, borderBottom: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                <Typography variant="subtitle2" fontWeight={700} color="text.secondary">
                  Stop order
                </Typography>
                <Typography variant="caption" color="text.disabled">
                  Drag to change order
                </Typography>
              </Box>

              <Box sx={{ flex: 1, overflowY: 'auto', p: 1.5 }}>
                <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                  <SortableContext items={stops.map((s) => s.taskId)} strategy={verticalListSortingStrategy}>
                    <Stack spacing={1}>
                      {stops.map((stop, i) => (
                        <StopRow key={stop.taskId} stop={stop} index={i} total={stops.length} />
                      ))}
                    </Stack>
                  </SortableContext>
                </DndContext>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>

      {!noLocations && (
        <DialogActions sx={{ px: 2, pb: 2, pt: 1.5, gap: 1, flexShrink: 0, borderTop: '1px solid', borderColor: 'divider' }}>
          <Button onClick={onClose} sx={{ borderRadius: 2 }}>Close</Button>
          <Button
            variant="contained"
            size="large"
            component="a"
            href={buildNavigationUrl()}
            target="_blank"
            rel="noopener noreferrer"
            startIcon={<IconNavigation size={18} />}
            sx={{ borderRadius: 2, fontWeight: 700, flex: 1 }}
          >
            Navigate Route
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
