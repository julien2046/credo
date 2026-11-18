import { Box, Button, Stack, TextField, Typography } from '@mui/material';
import { useForm } from 'react-hook-form';
import { validateQuebecPostalCode } from './delivery-estimate';

const fields = [
  { name: 'email', label: 'Courriel', autoComplete: 'email', type: 'email' },
  { name: 'name', label: 'Nom complet', autoComplete: 'shipping name' },
  { name: 'address', label: 'Adresse', autoComplete: 'shipping address-line1' },
  {
    name: 'unit',
    label: 'Appartement (facultatif)',
    autoComplete: 'shipping address-line2',
  },
  { name: 'city', label: 'Ville', autoComplete: 'shipping address-level2' },
  {
    name: 'postalCode',
    label: 'Code postal',
    autoComplete: 'shipping postal-code',
  },
] as const;

type DeliveryField = (typeof fields)[number]['name'];

function validateField(name: DeliveryField, value: string): true | string {
  const input = value.trim();
  if (!input) return name === 'unit' || 'Ce champ est requis.';
  if (name === 'postalCode') return validateQuebecPostalCode(input);
  if (name === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input)) {
    return 'Entrez une adresse courriel valide.';
  }
  return true;
}

export function DeliveryForm({
  onEstimateChange,
}: {
  onEstimateChange: (estimated: boolean) => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Record<DeliveryField, string>>();

  return (
    <Stack
      component="form"
      noValidate
      spacing={2}
      onSubmit={handleSubmit(
        () => onEstimateChange(true),
        () => onEstimateChange(false)
      )}
    >
      <Typography component="h2" variant="h6">
        Coordonnées de livraison
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Québec, Canada
      </Typography>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: 'minmax(0, 1fr)',
            sm: 'repeat(2, minmax(0, 1fr))',
          },
          gap: 2,
        }}
      >
        {fields.map((field) => {
          const { ref, ...input } = register(field.name, {
            validate: (value) => validateField(field.name, value),
            onChange: () => onEstimateChange(false),
          });
          return (
            <TextField
              key={field.name}
              {...input}
              inputRef={ref}
              label={field.label}
              type={'type' in field ? field.type : 'text'}
              autoComplete={field.autoComplete}
              required={field.name !== 'unit'}
              error={Boolean(errors[field.name])}
              helperText={errors[field.name]?.message}
              sx={
                field.name === 'address' || field.name === 'unit'
                  ? { gridColumn: '1 / -1' }
                  : undefined
              }
            />
          );
        })}
      </Box>
      <Button
        type="submit"
        variant="contained"
        sx={{ alignSelf: 'flex-start' }}
      >
        Estimer les frais
      </Button>
    </Stack>
  );
}
