import React from 'react';
import { Box, Stack } from '@mui/material';
import {
  IconUsers, IconUserHeart, IconSchool, IconCertificate, IconBulb, IconBuildingSkyscraper,
} from '@tabler/icons-react';
import EntityListEditor from './EntityListEditor';

const twoCol = { display: 'grid', gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, minmax(0, 1fr))' }, gap: 2.5, alignItems: 'start' };

/** Emergency contacts + dependents. `base` is an employee API base or a draft base. */
export const PersonalLists = ({ base }) => (
  <Box sx={twoCol}>
    <EntityListEditor
      title="Emergency contacts" base={base} entity="emergency-contacts"
      icon={IconUserHeart} emptyMessage="No emergency contacts added yet."
      highlightWhen={(row) => !!row.is_primary}
      maxItems={3}
      maxItemsMessage="Maximum of 3 emergency contacts."
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'relationship', label: 'Relationship' },
        { key: 'phone', label: 'Phone' },
        { key: 'email', label: 'Email' },
        { key: 'isPrimary', label: 'Primary contact', type: 'checkbox' },
      ]}
    />
    <EntityListEditor
      title="Dependents" base={base} entity="dependents"
      icon={IconUsers} emptyMessage="No dependents added yet."
      fields={[
        { key: 'name', label: 'Name', required: true },
        { key: 'relationship', label: 'Relationship' },
        { key: 'dateOfBirth', label: 'Date of birth', type: 'date' },
        { key: 'idNumber', label: 'ID number' },
        { key: 'notes', label: 'Notes', multiline: true },
      ]}
    />
  </Box>
);

/** Education, certifications, skills and previous employment. */
export const QualificationLists = ({ base }) => (
  <Stack spacing={2.5}>
    <Box sx={twoCol}>
      <EntityListEditor
        title="Education" base={base} entity="qualifications" fileUpload
        icon={IconSchool} emptyMessage="No qualifications added yet."
        addLabel="Add qualification"
        fields={[
          { key: 'degree', label: 'Degree', required: true },
          { key: 'institution', label: 'Institution' },
          { key: 'year', label: 'Year', type: 'number' },
          { key: 'grade', label: 'Grade' },
        ]}
      />
      <EntityListEditor
        title="Certifications" base={base} entity="certifications" fileUpload
        icon={IconCertificate} emptyMessage="No certifications added yet."
        addLabel="Add certification"
        fields={[
          { key: 'name', label: 'Certification name', required: true },
          { key: 'issuer', label: 'Issuer' },
          { key: 'certificateNumber', label: 'Certificate no.' },
          { key: 'issueDate', label: 'Issued', type: 'date' },
          { key: 'expiryDate', label: 'Expires', type: 'date' },
        ]}
      />
    </Box>
    <EntityListEditor
      title="Skills" base={base} entity="skills" variant="chips"
      icon={IconBulb} emptyMessage="No skills added yet."
      addLabel="Add skill"
      fields={[
        { key: 'skillName', label: 'Skill', required: true },
        {
          key: 'proficiencyLevel', label: 'Proficiency', type: 'select',
          options: ['beginner', 'intermediate', 'advanced', 'expert'].map((v) => ({ value: v, label: v })),
        },
      ]}
    />
    <EntityListEditor
      title="Previous employment" base={base} entity="previous-employment"
      icon={IconBuildingSkyscraper} emptyMessage="No previous employment added yet."
      addLabel="Add employer"
      fields={[
        { key: 'companyName', label: 'Company name', required: true },
        { key: 'jobTitle', label: 'Job title' },
        { key: 'startDate', label: 'From', type: 'date' },
        { key: 'endDate', label: 'To', type: 'date' },
        { key: 'reasonForLeaving', label: 'Reason for leaving', multiline: true },
      ]}
    />
  </Stack>
);
