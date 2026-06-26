import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  TextField,
  IconButton,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import { IconCurrentLocation, IconSearch, IconX, IconMapPin } from '@tabler/icons-react';
import {
  isGoogleMapsConfigured,
  MAPS_NOT_CONFIGURED_MSG,
  loadGoogleMapsLibraries,
} from '../../utils/googleMapsLoader';

export default function LocationPickerDialog({ open, onClose, onConfirm, initialValue }) {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [locatingUser, setLocatingUser] = useState(false);

  // Parse existing value to extract lat/lng if it's a maps URL
  const parseInitialCoords = useCallback(() => {
    if (!initialValue) return null;
    const match = initialValue.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    const qMatch = initialValue.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
    return null;
  }, [initialValue]);

  const buildMapsUrl = (lat, lng) =>
    `https://www.google.com/maps?q=${lat},${lng}`;

  const placeMarker = useCallback((coords, address) => {
    if (!mapInstanceRef.current) return;
    if (markerRef.current) {
      markerRef.current.setPosition(coords);
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: coords,
        map: mapInstanceRef.current,
        draggable: true,
        title: 'Pickup location',
      });
      markerRef.current.addListener('dragend', (e) => {
        const pos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        setSelectedCoords(pos);
        reverseGeocode(pos);
      });
    }
    mapInstanceRef.current.panTo(coords);
    setSelectedCoords(coords);
    if (address) setSelectedAddress(address);
  }, []);

  const reverseGeocode = useCallback((coords) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
      if (status === 'OK' && results[0]) {
        setSelectedAddress(results[0].formatted_address);
      }
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    setError('');
    setLoading(true);

    if (!isGoogleMapsConfigured) {
      setError(MAPS_NOT_CONFIGURED_MSG);
      setLoading(false);
      return;
    }

    loadGoogleMapsLibraries(['maps', 'places', 'geocoding']).then(() => {
      setLoading(false);

      const initial = parseInitialCoords() || { lat: 25.2048, lng: 55.2708 }; // Default: Dubai

      const map = new window.google.maps.Map(mapRef.current, {
        center: initial,
        zoom: parseInitialCoords() ? 15 : 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;

      map.addListener('click', (e) => {
        const coords = { lat: e.latLng.lat(), lng: e.latLng.lng() };
        placeMarker(coords, '');
        reverseGeocode(coords);
      });

      if (parseInitialCoords()) {
        placeMarker(initial, initialValue);
        reverseGeocode(initial);
      }

      // Attach Places Autocomplete to search input
      if (searchInputRef.current) {
        const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ['geometry', 'formatted_address'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (place.geometry?.location) {
            const coords = {
              lat: place.geometry.location.lat(),
              lng: place.geometry.location.lng(),
            };
            placeMarker(coords, place.formatted_address);
            mapInstanceRef.current.setZoom(16);
          }
        });
        autocompleteRef.current = ac;
      }
    }).catch(() => {
      setError('Failed to load Google Maps. Check your API key and network connection.');
      setLoading(false);
    });

    return () => {
      mapInstanceRef.current = null;
      markerRef.current = null;
      autocompleteRef.current = null;
    };
  }, [open]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        placeMarker(coords, '');
        reverseGeocode(coords);
        mapInstanceRef.current?.setZoom(17);
        setLocatingUser(false);
      },
      () => {
        setError('Could not get your current location. Please allow location access.');
        setLocatingUser(false);
      }
    );
  };

  const handleConfirm = () => {
    if (!selectedCoords) return;
    const url = buildMapsUrl(selectedCoords.lat, selectedCoords.lng);
    onConfirm(url, selectedAddress);
    onClose();
  };

  const handleClose = () => {
    setSelectedCoords(null);
    setSelectedAddress('');
    setError('');
    onClose();
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pb: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconMapPin size={20} />
          <Typography variant="h6" fontWeight={700}>Pick Pickup Location</Typography>
        </Box>
        <IconButton size="small" onClick={handleClose}>
          <IconX size={18} />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 2, pb: 1 }}>
        {error && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{error}</Alert>}

        {/* Search bar */}
        <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
          <TextField
            inputRef={searchInputRef}
            fullWidth
            size="small"
            placeholder="Search for an address..."
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <IconSearch size={16} />
                </InputAdornment>
              ),
              sx: { borderRadius: 2 },
            }}
          />
          <Tooltip title="Use my current location">
            <span>
              <Button
                variant="outlined"
                onClick={handleCurrentLocation}
                disabled={loading || locatingUser}
                sx={{ minWidth: 44, px: 1.5, borderRadius: 2, whiteSpace: 'nowrap' }}
                startIcon={locatingUser ? <CircularProgress size={16} /> : <IconCurrentLocation size={18} />}
              >
                {locatingUser ? 'Locating…' : 'My Location'}
              </Button>
            </span>
          </Tooltip>
        </Box>

        {/* Map container */}
        <Box sx={{ position: 'relative', width: '100%', height: 420, borderRadius: 2, overflow: 'hidden', border: '1px solid', borderColor: 'divider' }}>
          {loading && (
            <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'background.paper', zIndex: 1 }}>
              <CircularProgress />
            </Box>
          )}
          <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
        </Box>

        {/* Selected address display */}
        <Box sx={{ mt: 1.5, minHeight: 32 }}>
          {selectedCoords ? (
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <IconMapPin size={14} />
              {selectedAddress || `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}`}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.disabled">
              Click on the map or search to place a pin
            </Typography>
          )}
        </Box>
      </DialogContent>

      <DialogActions sx={{ px: 2, pb: 2, gap: 1 }}>
        <Button onClick={handleClose} sx={{ borderRadius: 2 }}>Cancel</Button>
        <Button
          variant="contained"
          onClick={handleConfirm}
          disabled={!selectedCoords}
          sx={{ borderRadius: 2 }}
        >
          Confirm Location
        </Button>
      </DialogActions>
    </Dialog>
  );
}
