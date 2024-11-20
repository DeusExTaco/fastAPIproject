import React from 'react';
import {Input, IconButton} from "@material-tailwind/react";
import {Trash2} from 'lucide-react';
import {createPortal} from 'react-dom';
import { Address } from '../../types/profile';

type AddressField = Exclude<keyof Address, 'id' | 'user_id'>;

export interface AddressFormProps {
    readonly address: Address;
    readonly index: number;
    readonly onChange: (field: AddressField, value: string) => void;
    readonly onRemove: () => void;
    readonly isDeleted?: boolean;
}

interface Country {
    readonly name: string;
    readonly flags: {
        readonly svg: string;
        readonly png: string;
    };
}

interface CountriesSelectProps {
    readonly value: string,
    readonly onChange: (field: AddressField, value: string) => void,
}

// Custom hooks
const useCountries = () => {
    const [countries, setCountries] = React.useState<Country[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        let isMounted = true;

        const fetchCountries = async () => {
            try {
                const response = await fetch('https://restcountries.com/v3.1/all');
                const data = await response.json();

                if (isMounted) {
                    const formattedCountries: Country[] = data
                        .map((country: any) => ({
                            name: country.name.common,
                            flags: {
                                svg: country.flags.svg,
                                png: country.flags.png
                            }
                        }))
                        .sort((a: Country, b: Country) => a.name.localeCompare(b.name));

                    setCountries(formattedCountries);
                    setLoading(false);
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to load countries');
                    setLoading(false);
                }
            }
        };

        void fetchCountries();

        return () => {
            isMounted = false;
        };
    }, []);

    return {countries, loading, error};
};


export function CountriesSelect({ value, onChange }: CountriesSelectProps) {
  const { countries, loading, error } = useCountries();
  const [searchQuery, setSearchQuery] = React.useState("");
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);
  const dropdownRef = React.useRef<HTMLDivElement>(null);
  const [dropdownPosition, setDropdownPosition] = React.useState({ top: 0, left: 0, direction: 'down' });

  const currentCountry = React.useMemo(() => {
    return countries.find(country => country.name === value);
  }, [countries, value]);

  const updatePosition = React.useCallback(() => {
    if (selectRef.current) {
      const rect = selectRef.current.getBoundingClientRect();
      const dropdownHeight = 300; // Approximate maximum height of dropdown
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Find the closest parent with overflow: hidden or auto
      let parent = selectRef.current.parentElement;
      let dialogBounds = null;

      while (parent) {
        const style = window.getComputedStyle(parent);
        if (style.overflow === 'hidden' || style.overflow === 'auto' || parent.classList.contains('dialog')) {
          dialogBounds = parent.getBoundingClientRect();
          break;
        }
        parent = parent.parentElement;
      }

      // Determine if we should show above or below based on available space
      // and dialog boundaries if they exist
      let direction: string;
      if (dialogBounds) {
        const spaceToDialogBottom = dialogBounds.bottom - rect.bottom;
        const spaceToDialogTop = rect.top - dialogBounds.top;
        direction = spaceToDialogBottom < dropdownHeight && spaceToDialogTop > dropdownHeight ? 'up' : 'down';
      } else {
        direction = spaceBelow < dropdownHeight && spaceAbove > dropdownHeight ? 'up' : 'down';
      }

      setDropdownPosition({
        top: direction === 'up'
          ? rect.top + window.scrollY - dropdownHeight
          : rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        direction
      });
    }
  }, []);

  const handleToggle = React.useCallback((event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();

    if (!isOpen) {
      updatePosition();
    }

    setIsOpen(!isOpen);
  }, [isOpen, updatePosition]);

  const handleSelect = React.useCallback((event: React.MouseEvent, countryName: string) => {
    event.preventDefault();
    event.stopPropagation();
    onChange('country', countryName);
    setIsOpen(false);
    setSearchQuery("");
  }, [onChange]);

  const filteredCountries = React.useMemo(() => {
    return countries.filter(country =>
      country.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [countries, searchQuery]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isOpen &&
          selectRef.current &&
          dropdownRef.current &&
          !selectRef.current.contains(event.target as Node) &&
          !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    const handleResize = () => {
      if (isOpen) {
        updatePosition();
      }
    };

    if (isOpen) {
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      window.removeEventListener('scroll', handleScroll, true);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, updatePosition]);

  if (loading) {
    return <Input label="Country" disabled value="Loading..." crossOrigin={undefined} {...commonInputProps} />;
  }

  if (error) {
    return (
      <Input
        label="Country"
        color="blue"
        value={value}
        onChange={(e) => onChange('country', e.target.value)}
        crossOrigin={undefined}
        {...commonInputProps}
      />
    );
  }

  return (
    <div
      ref={selectRef}
      className="relative"
    >
      <div
        onClick={handleToggle}
        className="relative w-full cursor-pointer"
      >
        <Input
          label="Country"
          value={value || ""}
          readOnly
          color="blue"
          className="cursor-pointer dark:text-white"
          crossOrigin={undefined}
          {...commonInputProps}
          icon={
            currentCountry?.flags.svg && (
              <img
                src={currentCountry.flags.svg}
                alt={currentCountry.name}
                className="h-5 w-5 rounded-full object-cover"
              />
            )
          }
        />
      </div>

      {isOpen && createPortal(
        <div
          ref={dropdownRef}
          className="fixed bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] overflow-hidden dark:bg-gray-800 dark:border-gray-700"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            width: `${selectRef.current?.offsetWidth}px`,
            maxHeight: '300px',
            transform: dropdownPosition.direction === 'up' ? 'translateY(-8px)' : 'translateY(8px)'
          }}
        >
          <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700 z-10">
            <Input
              label="Search countries"
              value={searchQuery}
              color="blue"
              onChange={(e) => setSearchQuery(e.target.value)}
              containerProps={{ className: "min-w-0" }}
              crossOrigin={undefined}
              className="dark:text-white"
              {...commonInputProps}
            />
          </div>
          <div className="overflow-y-auto max-h-[240px] p-2.5">
            {filteredCountries.map(({ name, flags }) => (
              <div
                key={name}
                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-blue-50 hover:rounded-md dark:hover:bg-gray-700 cursor-pointer dark:text-white"
                onClick={(e) => handleSelect(e, name)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSelect(e as unknown as React.MouseEvent, name);
                  }
                }}
              >
                {flags.svg && (
                  <img
                    src={flags.svg}
                    alt={name}
                    className="h-5 w-5 rounded-full object-cover"
                  />
                )}
                <span>{name}</span>
              </div>
            ))}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

const commonInputProps = {
    onPointerEnterCapture: () => {
    },
    onPointerLeaveCapture: () => {
    },
};

const AddressForm: React.FC<AddressFormProps> = ({
                                                     address = {},
                                                     index,
                                                     onChange,
                                                     onRemove,
                                                     isDeleted = false
                                                 }) => {
    return (
        <div className={`p-4 border rounded-lg space-y-4 dark:border-gray-700 ${isDeleted ? 'opacity-50' : ''}`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h3 className="text-sm font-medium dark:text-white">Address {index + 1}</h3>
                    {isDeleted && (
                        <span className="text-xs text-red-500">(Pending Deletion)</span>
                    )}
                </div>
                <IconButton
                    variant="text"
                    color="red"
                    size="sm"
                    onClick={onRemove}
                    className="h-8 w-8"
                    placeholder={""}
                    {...commonInputProps}
                >
                    <Trash2 className="h-4 w-4"/>
                </IconButton>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="col-span-full">
                    <Input
                        label="Street"
                        color="blue"
                        value={address?.street ?? ''}
                        onChange={(e) => onChange('street', e.target.value)}
                        crossOrigin={undefined}
                        className="dark:text-white"
                        {...commonInputProps}
                    />
                </div>
                <Input
                    label="City"
                    color="blue"
                    value={address?.city ?? ''}
                    onChange={(e) => onChange('city', e.target.value)}
                    crossOrigin={undefined}
                    className="dark:text-white"
                    {...commonInputProps}
                />
                <Input
                    label="State"
                    color="blue"
                    value={address?.state ?? ''}
                    onChange={(e) => onChange('state', e.target.value)}
                    crossOrigin={undefined}
                    className="dark:text-white"
                    {...commonInputProps}
                />
                <Input
                    label="Postal Code"
                    color="blue"
                    value={address?.postal_code ?? ''}
                    onChange={(e) => onChange('postal_code', e.target.value)}
                    crossOrigin={undefined}
                    className="dark:text-white"
                    {...commonInputProps}
                />
                <CountriesSelect
                    value={address?.country ?? ''}
                    onChange={onChange}
                />
            </div>
        </div>
    );
};

export default AddressForm;