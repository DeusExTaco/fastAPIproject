// src/components/forms/AddressForm.tsx
import React from 'react';
import { Input, IconButton } from "@material-tailwind/react";
import { Trash2 } from 'lucide-react';
import { Address } from '../../types/profile';

interface AddressFormProps {
  address: Address;
  index: number;
  onRemove: (index: number) => void;
  onChange: (index: number, field: keyof Address, value: string) => void;
}

const AddressForm: React.FC<AddressFormProps> = ({
  address = {},
  index,
  onRemove,
  onChange,
}) => {
  return (
    <div className="p-4 border rounded-lg space-y-4 dark:border-gray-700">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium dark:text-white">Address {index + 1}</h3>
        <IconButton
          variant="text"
          color="red"
          size="sm"
          onClick={() => onRemove(index)}
          className="h-8 w-8"
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="col-span-full">
          <Input
            label="Street"
            color={"blue"}
            value={address?.street ?? ''}
            onChange={(e) => onChange(index, 'street', e.target.value)}
            className="w-full"
            crossOrigin={undefined}
            placeholder={""}
            onPointerEnterCapture={() => {}}
            onPointerLeaveCapture={() => {}}
          />
        </div>
        <Input
          label="City"
          color={"blue"}
          value={address?.city ?? ''}
          onChange={(e) => onChange(index, 'city', e.target.value)}
          className="w-full"
          crossOrigin={undefined}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <Input
          label="State"
          color={"blue"}
          value={address?.state ?? ''}
          onChange={(e) => onChange(index, 'state', e.target.value)}
          className="w-full"
          crossOrigin={undefined}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <Input
          label="Postal Code"
          color={"blue"}
          value={address?.postal_code ?? ''}
          onChange={(e) => onChange(index, 'postal_code', e.target.value)}
          className="w-full"
          crossOrigin={undefined}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <Input
          label="Country"
          color={"blue"}
          value={address?.country ?? ''}
          onChange={(e) => onChange(index, 'country', e.target.value)}
          className="w-full"
          crossOrigin={undefined}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
      </div>
    </div>
  );
};

export default AddressForm;