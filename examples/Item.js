import React from 'react';
import PropTypes from 'prop-types';

const propTypes = {
    text: PropTypes.string.isRequired
};

const Item = ({ text, style, ...others }) =>
    <div
        {...others}
        style={{
            ...style,
            padding: 8,
            borderRadius: 4,
            boxShadow: '1px 1px 2px 1px rgba(0,0,0,0.4)',
            backgroundColor: '#ffffff',
            cursor: 'pointer'
        }}
    >
        {text}
    </div>;

Item.propTypes = propTypes;
export default Item;

