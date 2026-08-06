import React from 'react';
import {
  Box, Autocomplete, TextField, Typography, IconButton, Paper, Stack, Tooltip,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import {
  DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors,
} from '@dnd-kit/core';
import {
  SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable, arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  IconGripVertical, IconX, IconChevronUp, IconChevronDown,
} from '@tabler/icons-react';

/**
 * A single draggable term row.
 *
 * Drag handles alone are not keyboard-accessible enough for this list, so the row also
 * carries explicit up/down buttons — dnd-kit's keyboard sensor covers the handle, and
 * the buttons give an obvious non-drag path on touch devices.
 */
const SortableTermRow = ({ term, index, total, onRemove, onMove, disabled }) => {
  const theme = useTheme();
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: term.id, disabled });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    // Only opacity/transform change while dragging, so the list never reflows.
    opacity: isDragging ? 0.85 : 1,
    zIndex: isDragging ? 1 : 0,
  };

  return (
    <Paper
      ref={setNodeRef}
      style={style}
      elevation={0}
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        px: 1,
        py: 0.75,
        mb: 1,
        border: '1px solid',
        borderColor: isDragging ? 'primary.main' : 'divider',
        borderRadius: 2,
        bgcolor: isDragging ? alpha(theme.palette.primary.main, 0.06) : 'background.paper',
        boxShadow: isDragging ? theme.shadows[3] : 'none',
      }}
    >
      <Box
        {...attributes}
        {...listeners}
        aria-label={`Reorder ${term.title}`}
        sx={{
          display: 'flex',
          alignItems: 'center',
          color: 'text.disabled',
          cursor: disabled ? 'not-allowed' : 'grab',
          touchAction: 'none',
          '&:active': { cursor: disabled ? 'not-allowed' : 'grabbing' },
          '&:focus-visible': { outline: `2px solid ${theme.palette.primary.main}`, outlineOffset: 2, borderRadius: 1 },
        }}
      >
        <IconGripVertical size={18} />
      </Box>

      <Typography
        variant="caption"
        sx={{
          minWidth: 22,
          height: 22,
          borderRadius: '50%',
          bgcolor: alpha(theme.palette.primary.main, 0.1),
          color: 'primary.main',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {index + 1}
      </Typography>

      <Typography variant="body2" sx={{ flex: 1, fontWeight: 500 }} noWrap title={term.title}>
        {term.title}
      </Typography>

      <Stack direction="row" spacing={0} sx={{ flexShrink: 0 }}>
        <Tooltip title="Move up">
          <span>
            <IconButton
              size="small"
              aria-label={`Move ${term.title} up`}
              disabled={disabled || index === 0}
              onClick={() => onMove(index, index - 1)}
            >
              <IconChevronUp size={16} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Move down">
          <span>
            <IconButton
              size="small"
              aria-label={`Move ${term.title} down`}
              disabled={disabled || index === total - 1}
              onClick={() => onMove(index, index + 1)}
            >
              <IconChevronDown size={16} />
            </IconButton>
          </span>
        </Tooltip>
        <Tooltip title="Remove">
          <span>
            <IconButton
              size="small"
              color="error"
              aria-label={`Remove ${term.title}`}
              disabled={disabled}
              onClick={() => onRemove(term.id)}
            >
              <IconX size={16} />
            </IconButton>
          </span>
        </Tooltip>
      </Stack>
    </Paper>
  );
};

/**
 * Terms & conditions picker whose selection order is meaningful — the order shown here
 * is the order printed on the quotation / purchase order PDF.
 *
 * `value` is an array of term ids; the parent stores exactly that and the backend
 * persists each item's array index as `sort_order`.
 */
const TermsOrderSelector = ({
  options = [],
  value = [],
  onChange,
  disabled = false,
  label = 'Add terms & conditions',
  placeholder = 'Search terms to add…',
}) => {
  const sensors = useSensors(
    // A small activation distance keeps click-to-remove from being read as a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Map ids -> term objects in the user's chosen order (never the options' order).
  const selected = value
    .map((id) => options.find((o) => o.id === id))
    .filter(Boolean);

  const available = options.filter((o) => !value.includes(o.id));

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = value.indexOf(active.id);
    const newIndex = value.indexOf(over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    onChange(arrayMove(value, oldIndex, newIndex));
  };

  const handleMove = (from, to) => {
    if (to < 0 || to >= value.length) return;
    onChange(arrayMove(value, from, to));
  };

  const handleRemove = (id) => onChange(value.filter((v) => v !== id));

  return (
    <Box>
      <Autocomplete
        fullWidth
        disabled={disabled}
        options={available}
        getOptionLabel={(opt) => opt.title || ''}
        // Single-select acting as an "add" control: the chosen term is appended to the
        // ordered list below and the input resets, so the list stays the only place
        // selection order is expressed.
        value={null}
        blurOnSelect
        clearOnBlur
        onChange={(_, opt) => {
          if (opt && !value.includes(opt.id)) onChange([...value, opt.id]);
        }}
        isOptionEqualToValue={(a, b) => a?.id === b?.id}
        renderInput={(params) => (
          <TextField
            {...params}
            label={label}
            placeholder={placeholder}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          />
        )}
      />

      {selected.length > 0 ? (
        <Box mt={2}>
          <Typography variant="caption" color="text.secondary" display="block" mb={1}>
            Drag to reorder — terms print on the PDF in this order.
          </Typography>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={value} strategy={verticalListSortingStrategy}>
              <Box>
                {selected.map((term, index) => (
                  <SortableTermRow
                    key={term.id}
                    term={term}
                    index={index}
                    total={selected.length}
                    onRemove={handleRemove}
                    onMove={handleMove}
                    disabled={disabled}
                  />
                ))}
              </Box>
            </SortableContext>
          </DndContext>
        </Box>
      ) : (
        <Typography variant="caption" color="text.secondary" display="block" mt={1.5}>
          No terms selected. Any you add will print on the PDF in the order you arrange them here.
        </Typography>
      )}
    </Box>
  );
};

export default TermsOrderSelector;
