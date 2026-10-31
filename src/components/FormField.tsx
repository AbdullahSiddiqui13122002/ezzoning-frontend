"use client";

import React from "react";
import { UseFormRegisterReturn } from "react-hook-form";

interface FormFieldProps {
  label: string;
  error?: string;
  type?: string;
  placeholder?: string;
  registration?: UseFormRegisterReturn;
  icon?: React.ReactNode;
  variant?: "standard" | "dark";
  className?: string;
}

export const FormField: React.FC<FormFieldProps> = ({
  label,
  error,
  type = "text",
  placeholder,
  registration,
  icon,
  variant = "standard",
  className = "",
}) => {
  const inputClass = variant === "dark" ? "input-dark" : "input-standard";
  const labelClass = variant === "dark" ? "text-slate-500" : "text-slate-700";

  return (
    <div className={`space-y-2 ${className}`}>
      <label className={`text-[10px] font-black uppercase tracking-widest pl-1 flex items-center gap-2 ${labelClass}`}>
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          placeholder={placeholder}
          {...registration}
          style={icon ? { paddingLeft: '3rem' } : {}}
          className={`${inputClass} w-full ${error ? "border-rose-500 focus:ring-rose-500 focus:border-rose-500" : ""}`}
        />
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none">
            {React.cloneElement(icon as React.ReactElement<{ className?: string }>, { className: "w-4 h-4" })}
          </div>
        )}
      </div>
      {error && <p className="form-error">{error}</p>}
    </div>
  );
};
