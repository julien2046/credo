import { Box, Typography } from '@mui/material';

export type SectionLeadProps = {
  title: string;
  description: string;
};

/**
 * Affiche un en-tête de section simple et lisible.
 */
export function SectionLead({ title, description }: SectionLeadProps) {
  return (
    <Box>
      <Typography variant="h6">{title}</Typography>
      <Typography sx={{ color: 'text.secondary' }}>{description}</Typography>
    </Box>
  );
}
