import { Check, X } from 'lucide-react';

interface PasswordRequirementsProps {
  password: string;
}

const PasswordRequirements = ({ password = '' }: PasswordRequirementsProps) => {
  const requirements = [
    {
      text: "At least 16 characters long",
      test: (pwd: string) => pwd && pwd.length >= 16
    },
    {
      text: "At least one uppercase letter",
      test: (pwd: string) => pwd && /[A-Z]/.test(pwd)
    },
    {
      text: "At least one lowercase letter",
      test: (pwd: string) => pwd && /[a-z]/.test(pwd)
    },
    {
      text: "At least one number",
      test: (pwd: string) => pwd && /[0-9]/.test(pwd)
    },
    {
      text: "At least one special character",
      test: (pwd: string) => pwd && /[!@#$%^&*(),.?":{}|<>]/.test(pwd)
    }
  ];

  return (
    <div className="mt-4 text-sm">
      <p className="font-medium mb-2">Password Requirements:</p>
      <ul className="space-y-2">
        {requirements.map((req, index) => {
          const isMet = req.test(password);
          return (
            <li
              key={index}
              className={`flex items-center space-x-2 ${
                isMet ? 'text-green-600' : 'text-gray-600'
              }`}
            >
              {isMet ? (
                <Check className="w-4 h-4" />
              ) : (
                <X className="w-4 h-4" />
              )}
              <span>{req.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default PasswordRequirements;