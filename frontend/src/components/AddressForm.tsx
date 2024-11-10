import React from 'react';
import { Input, IconButton } from "@material-tailwind/react";
import { Trash2 } from 'lucide-react';
import { Address } from '../types/profile';

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

  // Common props for all form elements
  const commonProps = {
    className: "w-full dark:text-white",
    labelProps: {
      className: "!text-gray-900 dark:!text-gray-200 peer-focus:!text-blue-500 dark:peer-focus:!text-white peer-disabled:!text-blue-gray-400",
    },
    containerProps: {
      className: "min-w-[100px]",
    },
  };


  return (
    <div className="p-4 border rounded-lg space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Address {index + 1}</h3>
        <IconButton
          variant="text"
          color="red"
          onClick={() => onRemove(index)}
          className="hover:bg-red-50"
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        >
          <Trash2 className="h-4 w-4" />
        </IconButton>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Street"
          value={address?.street ?? ''}
          onChange={(e) => onChange(index, 'street', e.target.value)}
          {...commonProps}
          crossOrigin={undefined}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <Input
          label="City"
          value={address?.city ?? ''}
          onChange={(e) => onChange(index, 'city', e.target.value)}
          {...commonProps}
          crossOrigin={undefined}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <Input
          label="State"
          value={address?.state ?? ''}
          onChange={(e) => onChange(index, 'state', e.target.value)}
          {...commonProps}
          crossOrigin={undefined}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <Input
          label="Country"
          value={address?.country ?? ''}
          onChange={(e) => onChange(index, 'country', e.target.value)}
          {...commonProps}
          crossOrigin={undefined}
          placeholder={""}
          onPointerEnterCapture={() => {}}
          onPointerLeaveCapture={() => {}}
        />
        <Input
          label="Postal Code"
          value={address?.postal_code ?? ''}
          onChange={(e) => onChange(index, 'postal_code', e.target.value)}
          {...commonProps}
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