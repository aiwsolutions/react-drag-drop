import React from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';

const propTypes = {
    hovered: PropTypes.bool.isRequired,
    color: PropTypes.string.isRequired,
    items: PropTypes.array,
    itemRenderer: PropTypes.func.isRequired
};

const Group = ({
    hovered = false, color, items, itemRenderer
}) =>
    <div
        style={{
            padding: 8,
            backgroundColor: color,
            boxShadow: hovered ? '1px 1px 2px 1px rgba(0,0,0,0.4)' : 'none',
            minWidth: 100,
            minHeight: 100
        }}
    >
        {
            _.map(items, itemRenderer)

        }
    </div>;

Group.propTypes = propTypes;
export default Group;
