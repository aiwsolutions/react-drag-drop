/**
 * Copyright by AIWSolutions.
 */
import React from 'react';
import PropTypes from 'prop-types';
import DragDropContext from './DragDropContext';
import { getComponentBoundary } from './utils';

class Droppable extends React.Component {
    static propTypes = {
        /**
          * Unique id for the component
          */
        uniqueId: PropTypes.any.isRequired,
        /**
         * Array of types (string) that this target will accept
         * If none is provided, it will accept all sources.
         */
        acceptTypes: PropTypes.array,

        /**
        *  When acceptable source is over this target, the function gets called.
        *  Return false means this droppable does not accept this dragged source
        */
        onDraggedSourceOverred: PropTypes.func,

        /**
         * When acceptable source is out of this target, the function gets called.
         */
        onDraggedSourceOuted: PropTypes.func,


        /**
         * Callback function for both componentDidUpdate & componentDidMount
         * with boundary client rect
         */
        onRendered: PropTypes.func,

        /**
         * Callback function for componentWillUnmount
         */
        onUnmount: PropTypes.func
    };

    state = {
        draggedSourceOverred: false
    }

    componentDidMount() {
        this.updateDroppable();
    }

    componentDidUpdate() {
        this.updateDroppable();
    }

    componentWillUnmount() {
        const { onUnmount } = this.props;
        if (onUnmount) {
            onUnmount();
        }
        DragDropContext.unmountDroppable(this);
    }

    updateDroppable = () => {
        const { onRendered } = this.props;
        const boundary = getComponentBoundary(this);
        DragDropContext.updateDroppable(
            this,
            boundary,
            this.handleDraggedSourceOverred,
            this.handleDraggedSourceOuted);
        if (onRendered) {
            onRendered(boundary);
        }
    }

    handleDraggedSourceOverred = (data) => {
        const { onDraggedSourceOverred } = this.props;
        if (onDraggedSourceOverred && !onDraggedSourceOverred(data)) {
            return false;
        }
        this.setState({ draggedSourceOverred: true });
        return true;
    };

    handleDraggedSourceOuted = () => {
        const { onDraggedSourceOuted } = this.props;
        if (onDraggedSourceOuted) {
            onDraggedSourceOuted();
        }
        this.setState({ draggedSourceOverred: false });
        return true;
    }

    render() {
        const { children } = this.props;

        const renderedChildren = children(this.state.draggedSourceOverred);

        return renderedChildren && React.Children.only(renderedChildren);
    }
}

export default Droppable;
