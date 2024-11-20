import React from 'react';
import { Input } from "@material-tailwind/react";
import { createPortal } from 'react-dom';

interface Position {
    top: number;
    left: number;
    direction: 'up' | 'down';
}

type Direction = 'up' | 'down';

const DROPDOWN_HEIGHT = 240; // Maximum height of the dropdown content
const SPACING = 8;

const useDropdownPosition = (selectRef: React.RefObject<HTMLDivElement>, isOpen: boolean) => {
    const [position, setPosition] = React.useState<Position>({
        top: 0,
        left: 0,
        direction: 'down'
    });

    const calculatePosition = React.useCallback(() => {
        if (!selectRef.current) return;

        const inputRect = selectRef.current.getBoundingClientRect();

        // Find the closest parent dialog or overflow container
        let parent = selectRef.current.parentElement;
        let dialogBounds = null;
        while (parent) {
            if (parent.classList.contains('dialog') ||
                getComputedStyle(parent).overflow === 'auto' ||
                getComputedStyle(parent).overflow === 'hidden') {
                dialogBounds = parent.getBoundingClientRect();
                break;
            }
            parent = parent.parentElement;
        }

        // Calculate available space below and above
        const spaceBelow = dialogBounds
            ? dialogBounds.bottom - inputRect.bottom
            : window.innerHeight - inputRect.bottom;
        const spaceAbove = dialogBounds
            ? inputRect.top - dialogBounds.top
            : inputRect.top;

        // Determine direction
        const direction = spaceBelow >= DROPDOWN_HEIGHT || spaceBelow >= spaceAbove
            ? 'down'
            : 'up';

        // Calculate position
        let top = direction === 'down'
            ? inputRect.bottom + window.scrollY
            : inputRect.top + window.scrollY - DROPDOWN_HEIGHT;

        setPosition({
            top,
            left: inputRect.left + window.scrollX,
            direction
        });
    }, []);

    React.useEffect(() => {
        if (isOpen) {
            calculatePosition();
            window.addEventListener('scroll', calculatePosition, true);
            window.addEventListener('resize', calculatePosition);

            return () => {
                window.removeEventListener('scroll', calculatePosition, true);
                window.removeEventListener('resize', calculatePosition);
            };
        }
    }, [isOpen, calculatePosition]);

    return { position, updatePosition: calculatePosition };
};

// Gender Select Component stays the same
interface GenderSelectProps {
    value: string;
    onChange: (value: string) => void;
}

export function GenderSelect({ value, onChange }: Readonly<GenderSelectProps>) {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectRef = React.useRef<HTMLDivElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const { position, updatePosition } = useDropdownPosition(selectRef, isOpen);

    const options = [
        { value: 'male', label: 'Male' },
        { value: 'female', label: 'Female' },
        { value: 'other', label: 'Other' },
        { value: 'prefer_not_to_say', label: 'Prefer not to say' }
    ];

    const handleToggle = React.useCallback((event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        if (!isOpen) {
            updatePosition();
        }
        setIsOpen(!isOpen);
    }, [isOpen, updatePosition]);

    const handleSelect = React.useCallback((event: React.MouseEvent, optionValue: string) => {
        event.preventDefault();
        event.stopPropagation();
        onChange(optionValue);
        setIsOpen(false);
    }, [onChange]);

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

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const currentOption = options.find(option => option.value === value);

    return (
        <div ref={selectRef} className="relative">
            <button
                type="button"
                onClick={handleToggle}
                className="relative w-full cursor-pointer bg-transparent border-0 p-0 text-left"
            >
                <Input
                    label="Gender"
                    value={currentOption?.label ?? ""}
                    readOnly
                    color="blue"
                    className="cursor-pointer dark:text-white"
                    crossOrigin={undefined}
                    placeholder={""}
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
                />
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white rounded-lg shadow-lg border border-gray-200 z-[9999] overflow-hidden dark:bg-gray-800 dark:border-gray-700"
                    style={{
                        top: `${position.top}px`,
                        left: `${position.left}px`,
                        width: `${selectRef.current?.offsetWidth}px`,
                        maxHeight: `${DROPDOWN_HEIGHT}px`,
                        transform: position.direction === 'up'
                            ? `translateY(calc(-100% - ${SPACING}px))`
                            : `translateY(${SPACING}px)`
                    }}
                >
                    <div className="overflow-y-auto h-full p-2.5">
                        {options.map(({ value: optionValue, label }) => (
                            <button
                                key={optionValue}
                                type="button"
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm font-light text-blue-gray-700 hover:bg-blue-50 hover:rounded-md dark:hover:bg-gray-700 cursor-pointer dark:text-white text-left bg-transparent border-0"
                                onClick={(e) => handleSelect(e, optionValue)}
                            >
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}

const debug = (component: string, action: string, data: any) => {
    console.log(`[${component}] ${action}:`, data);
};

export function PrivacySelect({ value, onChange }: Readonly<{ value: string; onChange: (value: string) => void }>) {
    const [isOpen, setIsOpen] = React.useState(false);
    const selectRef = React.useRef<HTMLDivElement>(null);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    const [position, setPosition] = React.useState<Position>({
        top: 0,
        left: 0,
        direction: 'down'
    });

    const calculatePosition = React.useCallback(() => {
        const inputElement = selectRef.current?.querySelector('input');
        if (!inputElement) {
            debug('PrivacySelect', 'calculatePosition', 'No input element found');
            return;
        }

        const rect = inputElement.getBoundingClientRect();
        debug('PrivacySelect', 'input rectangle', {
            top: rect.top,
            bottom: rect.bottom,
            left: rect.left,
            height: rect.height
        });

        const viewportHeight = window.innerHeight;
        const scrollY = window.scrollY || document.documentElement.scrollTop;

        const spaceBelow = viewportHeight - rect.bottom;

        // Explicitly type the direction
        const direction: Direction = spaceBelow >= DROPDOWN_HEIGHT ? 'down' : 'up';
        debug('PrivacySelect', 'space calculations', {
            spaceBelow,
            viewportHeight,
            scrollY,
            direction
        });

        // Create position object with explicit typing
        const newPosition: Position = {
            top: direction === 'down'
                ? rect.bottom + scrollY
                : rect.top + scrollY,
            left: rect.left + window.scrollX,
            direction
        };

        debug('PrivacySelect', 'final position', newPosition);
        setPosition(newPosition);
    }, []);

    const handleToggle = (event: React.MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
        debug('PrivacySelect', 'toggle clicked', { wasOpen: isOpen });

        if (!isOpen) {
            calculatePosition();
        }
        setIsOpen(!isOpen);
    };

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

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const options = [
        { value: 'public', label: 'Public' },
        { value: 'private', label: 'Private' },
        { value: 'contacts', label: 'Contacts Only' }
    ];

    const currentOption = options.find(option => option.value === value);

    return (
        <div ref={selectRef} className="relative w-full">
            <button
                type="button"
                onClick={handleToggle}
                className="w-full cursor-pointer bg-transparent border-0 p-0 text-left"
            >
                <Input
                    ref={inputRef}
                    label="Profile Visibility"
                    value={currentOption?.label ?? ""}
                    readOnly
                    color="blue"
                    className="cursor-pointer dark:text-white"
                    crossOrigin={undefined}
                    placeholder={""}
                    onPointerEnterCapture={() => {}}
                    onPointerLeaveCapture={() => {}}
                />
            </button>

            {isOpen && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed bg-white rounded-lg shadow-lg border text-sm font-light text-blue-gray-700 border-gray-200 z-[9999] overflow-hidden dark:bg-gray-800 dark:border-gray-700"
                    style={{
                        position: 'fixed',
                        top: position.top,
                        left: position.left,
                        width: selectRef.current?.offsetWidth,
                        maxHeight: DROPDOWN_HEIGHT,
                        transform: position.direction === 'up'
                            ? `translateY(calc(-100% - ${SPACING}px))`
                            : `translateY(${SPACING}px)`
                    }}
                >
                    <div className="overflow-y-auto max-h-[240px] p-2.5">
                        {options.map(({ value: optionValue, label }) => (
                            <button
                                key={optionValue}
                                type="button"
                                className="w-full flex items-center gap-2 px-4 py-2 hover:bg-blue-50 hover:rounded-md dark:hover:bg-gray-700 cursor-pointer dark:text-white text-left bg-transparent border-0"
                                onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onChange(optionValue);
                                    setIsOpen(false);
                                }}
                            >
                                <span>{label}</span>
                            </button>
                        ))}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}