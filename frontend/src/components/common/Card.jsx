import React from "react";
import PropTypes from "prop-types";

const Card = ({ children, className, header, footer }) => {
  return (
    <div
      className={`bg-white shadow-md rounded-lg p-6 border border-gray-200 ${className}`}
    >
      {header && <div className="mb-4 border-b pb-2">{header}</div>}
      <div>{children}</div>
      {footer && <div className="mt-4 border-t pt-2">{footer}</div>}
    </div>
  );
};

Card.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  header: PropTypes.node,
  footer: PropTypes.node,
};

Card.defaultProps = {
  className: "",
  header: null,
  footer: null,
};

export default Card;
