'use client'
import { Button, ButtonProps } from 'evergreen-ui';
import { useFormStatus } from 'react-dom';

export function FormButton({ label, loading = 'Submitting...', ...props }: { label: string | React.ReactNode; loading?: string | React.ReactNode } & ButtonProps) {
  const { pending } = useFormStatus()

  return (
    <Button type="submit" {...props}>
      {pending ? loading : label}
    </Button>
  )
}