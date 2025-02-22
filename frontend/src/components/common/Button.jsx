import React from "react";
import PropTypes from "prop-types";
import { Loader } from "lucide-react";

const Button = ({ children, type, variant, isLoading, className, ...props }) => {
  const baseClasses =
    "inline-flex items-center justify-center px-4 py-2 rounded-lg font-medium transition-all duration-200";
  const variants = {
    primary: "bg-blue-500 text-white hover:bg-blue-600 focus:ring-blue-500",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300",
    danger: "bg-red-500 text-white hover:bg-red-600 focus:ring-red-500",
  };

  return (
    <button
      type={type}
      className={`${baseClasses} ${variants[variant]} ${className} ${
        isLoading ? "opacity-50 cursor-not-allowed" : ""
      }`}
      disabled={isLoading}
      {...props}
    >
      {isLoading ? <Loader className="w-5 h-5 animate-spin mr-2" /> : null}
      {children}
    </button>
  );
};

Button.propTypes = {
  children: PropTypes.node.isRequired,
  type: PropTypes.string,
  variant: PropTypes.oneOf(["primary", "secondary", "danger"]),
  isLoading: PropTypes.bool,
  className: PropTypes.string,
};

Button.defaultProps = {
  type: "button",
  variant: "primary",
  isLoading: false,
  className: "",
};

export default Button;
