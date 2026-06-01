import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router';
import {
  Box, Typography, Button, Paper, CircularProgress, Alert,
  TextField, InputAdornment, Stack,
} from '@mui/material';
import { IconMapPin, IconSearch, IconCurrentLocation, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { setOptions, importLibrary } from '@googlemaps/js-api-loader';
import apiService from '../../services/api';

const API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

function parseCoords(url) {
  if (!url) return null;
  let m = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  m = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (m) return { lat: parseFloat(m[1]), lng: parseFloat(m[2]) };
  return null;
}

export default function ClientLocationPicker() {
  const { token } = useParams();

  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const searchInputRef = useRef(null);

  const [pageState, setPageState] = useState('loading'); // loading | ready | submitted | error | expired
  const [dealInfo, setDealInfo] = useState(null);
  const [pageError, setPageError] = useState('');

  const [mapReady, setMapReady] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Load deal info from token
  useEffect(() => {
    apiService.getLocationShareInfo(token)
      .then((data) => {
        if (!data.success) {
          setPageError(data.message || 'Invalid link');
          setPageState('error');
          return;
        }
        setDealInfo(data);
        setPageState('ready');
      })
      .catch((e) => {
        const msg = e.message || '';
        setPageError(msg.includes('expired') || e.status === 410 ? 'expired' : msg || 'Link not found');
        setPageState(msg.includes('expired') || e.status === 410 ? 'expired' : 'error');
      });
  }, [token]);

  const reverseGeocode = (coords) => {
    const geocoder = new window.google.maps.Geocoder();
    geocoder.geocode({ location: coords }, (results, status) => {
      if (status === 'OK' && results[0]) setSelectedAddress(results[0].formatted_address);
    });
  };

  const placeMarker = (coords) => {
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
    reverseGeocode(coords);
  };

  // Load map once page is ready
  useEffect(() => {
    if (pageState !== 'ready' || !mapRef.current) return;
    if (!API_KEY) return;

    setOptions({ apiKey: API_KEY, version: 'weekly' });

    Promise.all([importLibrary('maps'), importLibrary('places'), importLibrary('geocoding')]).then(() => {
      const existingCoords = dealInfo?.currentLocation ? parseCoords(dealInfo.currentLocation) : null;
      const center = existingCoords || { lat: 25.2048, lng: 55.2708 };

      const map = new window.google.maps.Map(mapRef.current, {
        center,
        zoom: existingCoords ? 15 : 11,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
      });
      mapInstanceRef.current = map;

      map.addListener('click', (e) => {
        placeMarker({ lat: e.latLng.lat(), lng: e.latLng.lng() });
      });

      if (existingCoords) placeMarker(existingCoords);

      // Autocomplete on search input
      if (searchInputRef.current) {
        const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
          fields: ['geometry', 'formatted_address'],
        });
        ac.addListener('place_changed', () => {
          const place = ac.getPlace();
          if (place.geometry?.location) {
            placeMarker({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
            if (place.formatted_address) setSelectedAddress(place.formatted_address);
            map.setZoom(16);
          }
        });
      }

      setMapReady(true);
    });
  }, [pageState]);

  const handleCurrentLocation = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        placeMarker({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        mapInstanceRef.current?.setZoom(17);
        setLocating(false);
      },
      () => setLocating(false),
    );
  };

  const handleSubmit = async () => {
    if (!selectedCoords) return;
    setSubmitting(true);
    setSubmitError('');
    const url = `https://www.google.com/maps?q=${selectedCoords.lat},${selectedCoords.lng}`;
    try {
      await apiService.submitClientLocation(token, url);
      setPageState('submitted');
    } catch (e) {
      setSubmitError(e.message || 'Failed to save location. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Render states ─────────────────────────────────────────────────────────────
  if (pageState === 'loading') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (pageState === 'expired') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 3 }}>
        <Paper elevation={0} sx={{ maxWidth: 400, width: '100%', p: 4, borderRadius: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}>
          <IconAlertCircle size={48} color="#E65100" />
          <Typography variant="h6" fontWeight={800} mt={2}>Link Expired</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            This location link has expired. Please ask for a new link to be sent.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (pageState === 'error') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 3 }}>
        <Paper elevation={0} sx={{ maxWidth: 400, width: '100%', p: 4, borderRadius: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}>
          <IconAlertCircle size={48} color="#D32F2F" />
          <Typography variant="h6" fontWeight={800} mt={2}>Link Not Found</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>{pageError}</Typography>
        </Paper>
      </Box>
    );
  }

  if (pageState === 'submitted') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f5f5f5', p: 3 }}>
        <Paper elevation={0} sx={{ maxWidth: 400, width: '100%', p: 4, borderRadius: 3, textAlign: 'center', border: '1px solid #e0e0e0' }}>
          <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto' }}>
            <IconCheck size={36} color="#2E7D32" />
          </Box>
          <Typography variant="h6" fontWeight={800} mt={2}>Location Saved!</Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Your pickup location has been sent. You can now close this page.
          </Typography>
          {selectedAddress && (
            <Typography variant="caption" color="text.disabled" mt={1} display="block">
              {selectedAddress}
            </Typography>
          )}
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f5f5', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box sx={{ bgcolor: '#fff', borderBottom: '1px solid #e0e0e0', px: 3, py: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ width: 36, height: 36, borderRadius: 2, bgcolor: '#E8F5E9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <IconMapPin size={20} color="#2E7D32" />
          </Box>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>Pin Your Pickup Location</Typography>
            {dealInfo?.dealNumber && (
              <Typography variant="caption" color="text.secondary">
                Deal #{dealInfo.dealNumber}{dealInfo.contactName ? ` · ${dealInfo.contactName}` : ''}
              </Typography>
            )}
          </Box>
        </Stack>
      </Box>

      {/* Search + locate bar */}
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', gap: 1 }}>
        <TextField
          inputRef={searchInputRef}
          fullWidth
          size="small"
          placeholder="Search for your address…"
          InputProps={{
            startAdornment: <InputAdornment position="start"><IconSearch size={16} /></InputAdornment>,
            sx: { borderRadius: 2, bgcolor: '#fff' },
          }}
        />
        <Button
          variant="outlined"
          onClick={handleCurrentLocation}
          disabled={!mapReady || locating}
          sx={{ minWidth: 44, px: 1.5, borderRadius: 2, whiteSpace: 'nowrap', bgcolor: '#fff' }}
          startIcon={locating ? <CircularProgress size={15} /> : <IconCurrentLocation size={17} />}
        >
          {locating ? '' : 'Me'}
        </Button>
      </Box>

      {/* Map */}
      <Box sx={{ flex: 1, position: 'relative', mx: 2, borderRadius: 2, overflow: 'hidden', border: '1px solid #e0e0e0', minHeight: 320 }}>
        {!mapReady && (
          <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fff' }}>
            <CircularProgress size={28} />
          </Box>
        )}
        <div ref={mapRef} style={{ width: '100%', height: '100%', minHeight: 320 }} />
      </Box>

      {/* Selected address */}
      <Box sx={{ px: 2, pt: 1.5, minHeight: 36 }}>
        {selectedCoords ? (
          <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <IconMapPin size={14} />
            {selectedAddress || `${selectedCoords.lat.toFixed(6)}, ${selectedCoords.lng.toFixed(6)}`}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.disabled">Tap the map to place a pin on your pickup location</Typography>
        )}
      </Box>

      {/* Submit */}
      <Box sx={{ p: 2, pt: 1 }}>
        {submitError && <Alert severity="error" sx={{ mb: 1.5, borderRadius: 2 }}>{submitError}</Alert>}
        <Button
          fullWidth
          variant="contained"
          size="large"
          disabled={!selectedCoords || submitting}
          onClick={handleSubmit}
          startIcon={submitting ? <CircularProgress size={18} color="inherit" /> : <IconCheck size={20} />}
          sx={{ borderRadius: 2.5, py: 1.75, fontWeight: 800, fontSize: '1rem', bgcolor: '#2E7D32', '&:hover': { bgcolor: '#1B5E20' } }}
        >
          {submitting ? 'Saving…' : 'Confirm My Location'}
        </Button>
        <Typography variant="caption" color="text.disabled" display="block" textAlign="center" mt={1}>
          This link expires {dealInfo?.expiresAt ? new Date(dealInfo.expiresAt).toLocaleDateString() : 'soon'}
        </Typography>
      </Box>
    </Box>
  );
}
