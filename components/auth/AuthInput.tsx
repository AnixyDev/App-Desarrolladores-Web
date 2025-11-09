import React, { useState } from 'react';
import { Eye, EyeOff } from '../icons/Icon';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon: React.ElementType;
}

const AuthInput: React.FC<AuthInputProps> = ({ id, name, type, placeholder, icon: Icon, value, onChange }) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === 'password';

  const toggleShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative mb-4">
      <span className="absolute inset-y-0 left-0 flex items-center pl-4">
        <Icon className="w-5 h-5 text-gray-400" />
      </span>
      <input
        id={id}
        name={name}
        type={isPassword ? (showPassword ? 'text' : 'password') : type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
        className="w-full pl-12 pr-4 py-3 bg-gray-800 text-white border border-gray-700 rounded-xl focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none transition duration-150"
      />
      {isPassword && (
        <button
          type="button"
          onClick={toggleShowPassword}
          className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-white"
        >
          {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
        </button>
      )}
    </div>
  );
};

export default AuthInput;